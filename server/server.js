const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const authMiddleware = require('./middleware/auth.js'); //
const nodemailer = require('nodemailer'); //для отправки на имейл
const bodyParser=require('body-parser'); //для отправки на имейл
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const path = require('path'); 
const app = express();
const cookieParser = require('cookie-parser');

app.use(cookieParser()); 
app.use(authMiddleware);

const fs = require('fs');
const emailTemplate = fs.readFileSync(
  path.join(__dirname, 'booking-confirmation.html'),
  'utf8'
);
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'postgres',
  password: '123456789',
  port: 5432,
});

const multer = require('multer');
const { redirect } = require('react-router-dom');
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'photo/'); // Папка для сохранения изображений
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname); 
  }
});
 const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: 'eurodanceminsk@gmail.com',
        pass: 'swgp jqwo cdkm nscm', 
      }
    });

const sendEmail = async (to, subject, text) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: 'eurodanceminsk@gmail.com',
        pass: 'swgp jqwo cdkm nscm', 
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      text,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Письмо отправлено на ${to}`);
  } catch (error) {
    console.error('Ошибка при отправке email:', error);
  }
};

app.use(cors({
  origin: 'http://localhost:3000', 
  credentials: true,
}));

app.use(express.json());
app.use(bodyParser.json());
 // Импорт модуля path
app.use('/images', express.static(path.join(__dirname, 'photo')));

app.use('/users', express.static(path.join(__dirname, 'users')));
app.get('/api/users', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM user');
        const data = result.rows.map(row => ({
            ...row,
            photo: `/users/${path.basename(row.photo)}`
        }));
        res.json(data);  // Отправляем данные в формате JSON
    } catch (err) {
        console.error('Ошибка на сервере:', err);
        res.status(500).send('Ошибка на сервере');
    }
});
// app.get('/api/users', async (req, res) => {
//   try {
//     const result = await pool.query('SELECT * FROM users');
//     res.json(result.rows);
//   } catch (err) {
//     console.error(err);
//     res.status(500).send('Server error');
//   }
// });


//добавление пользователей
// app.post('/api/users', async (req, res) => {
//   const { name, surname, father_name, email, phone, birthday, password } = req.body;

//   console.log('Получены данные:', req.body);

//   // Валидация входных данных
//   if (!name || !surname || !email || !password) {
//     return res.status(400).send('Недостаточно данных для создания пользователя');
//   }

//   try {
//     const result = await pool.query(
//       `INSERT INTO users (name, surname, father_name, email, phone, birthday, password)
//        VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
//       [name, surname, father_name, email, phone, birthday, password]
//     );

//     console.log('Пользователь добавлен в БД:', result.rows[0]);
//     res.status(201).json(result.rows[0]);
//   } catch (error) {
//     console.error('Ошибка при добавлении пользователя в БД:', error);
//     res.status(500).send('Ошибка добавления пользователя');
//   }
// });
const emailVerificationCodes = {};
app.post('/api/users/send-verification', async (req, res) => {
  const { email } = req.body;
  
  // Генерируем 6-значный код
  const code = crypto.randomInt(100000, 999999).toString();
  emailVerificationCodes[email] = code;

  try {
    await transporter.sendMail({
      from: 'eurodanceminsk@gmail.com',
      to: email,
      subject: 'Код подтверждения регистрации',
      html: `<p>Ваш код подтверждения: ${code}</p>`
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Ошибка отправки email:', error);
    res.status(500).json({ error: 'Не удалось отправить код подтверждения' });
  }
});

app.post('/api/users', async (req, res) => {
  const { name, surname, father_name, email, phone, birthday, password, verificationCode } = req.body;

  // Проверка кода подтверждения
  if (emailVerificationCodes[email] !== verificationCode) {
    return res.status(400).send('Неверный код подтверждения');
  }

  // Удаляем использованный код
  delete emailVerificationCodes[email];

  // Валидация телефона
  if (phone && !/^\+375-\d{2}-\d{3}-\d{2}-\d{2}$/.test(phone)) {
    return res.status(400).json({ error: 'Телефон должен быть в формате +375-XX-XXX-XX-XX' });
  }

  const defaultPhotoPath = '/users/image1.png';

  try {
    const hashedPassword = await bcrypt.hash(password, 10); // ✅ исправлено

    const result = await pool.query(
      `INSERT INTO users (name, surname, father_name, email, phone, birthday, password, photo, score)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [
        name,
        surname,
        father_name,
        email,
        phone,
        birthday,
        hashedPassword, // ✅ сохраняем хэш
        defaultPhotoPath,
        0
      ]
    );

    res.status(201).json(result.rows[0]);

  } catch (error) {
    console.error('Ошибка при добавлении пользователя в БД:', error);
    res.status(500).send('Ошибка добавления пользователя');
  }
});


// app.put('/api/users/:id', async (req, res) => {
//   const { name, surname, birthday, email, password, photo } = req.body;
//   const userId = req.params.id;

//   try {
//     const result = await pool.query(
//       `UPDATE users SET 
//         name = $1,
//         surname = $2,
//         birthday = $3,
//         email = $4,
//         password = $5,
//         photo = $6
//       WHERE id = $7
//       RETURNING *`,
//       [name, surname, birthday, email, password, photo, userId]
//     );

//     if (result.rows.length === 0) {
//       return res.status(404).json({ error: 'Пользователь не найден' });
//     }

//     res.json(result.rows[0]);
//   } catch (error) {
//     console.error('Ошибка при обновлении пользователя:', error);
//     res.status(500).json({ error: 'Ошибка обновления профиля' }); // <-- JSON, не строка!
//   }
// });



//фотографии


// Отдача изображений через HTTP
app.use('/images', express.static(path.join(__dirname, 'photo')));
app.get('/api/napravleniya', async (req, res) => {
    try {
        const result = await pool.query(`
 SELECT 
  n.*, 
  json_agg(DISTINCT tt.level) AS levels
FROM napravleniya n
LEFT JOIN teacher_types tt ON tt.napravleniya_id = n.id AND tt.is_active = true
WHERE n.is_active = true
GROUP BY n.id;

`);
        const data = result.rows.map(row => ({
            ...row,
            photo: `/images/${path.basename(row.photo)}`,
            video: row.video ? `/images/${path.basename(row.video)}` : null,
            levels: row.levels.filter(l => l !== null)
        }));
        res.json(data);  // Отправляем данные в формате JSON
    } catch (err) {
        console.error('Ошибка на сервере:', err);
        res.status(500).send('Ошибка на сервере');
    }
});

const storage_7 = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'users/'); // Папка для сохранения изображений
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname); // Сохранить с оригинальным именем файла
  }
});

const upload_7 = multer({ storage: storage_7 });

app.patch('/api/users/:id', upload_7.single('photo'), async (req, res) => {
  const { id } = req.params;
  const fields = [];
  const values = [];
  let index = 1;

  const { name, surname, birthday, email, password } = req.body;

  if (name) {
    fields.push(`name = $${index++}`);
    values.push(name);
  }
  if (surname) {
    fields.push(`surname = $${index++}`);
    values.push(surname);
  }
  if (birthday) {
    fields.push(`birthday = $${index++}`);
    values.push(birthday);
  }
  if (email) {
    fields.push(`email = $${index++}`);
    values.push(email);
  }
if (password) {
  if (password.length < 8) {
    return res.status(400).json({ message: 'Пароль должен быть не менее 8 символов' });
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  fields.push(`password = $${index++}`);
  values.push(hashedPassword);
}


  if (req.file) {
    const imagePath = `/users/${req.file.filename}`;
    fields.push(`photo = $${index++}`);
    values.push(imagePath);
  }

  if (fields.length === 0) {
    return res.status(400).json({ error: 'Нет данных для обновления' });
  }

  try {
    const result = await pool.query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${index} RETURNING *`,
      [...values, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка при обновлении пользователя:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.get('/api/users/:id', async (req, res) => {
  const userId = req.params.id;
  try {
    const user = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);

    if (user.rows.length === 0) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    const userData = user.rows[0];

    res.json({
      id: userData.id,
      name: userData.name,
      surname: userData.surname,
      birthday: userData.birthday,
      email: userData.email,
      photo: userData.photo,
      score: userData.score,  // Здесь передаем `score`
    });
  } catch (error) {
    console.error('Ошибка при получении пользователя:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});
// app.post('/api/login', async (req, res) => {
//   const { email, password } = req.body;

//   try {
//     // Запрос к базе данных для проверки пользователя
//     const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

//     if (result.rows.length > 0) {
//       const user = result.rows[0];

//       // Проверка пароля
//       if (user.password === password) {
//         if (email === "admin" && password === "admin123") {
//           res.json({ redirectTo: '/admin', user: user });
         
//         //ДОБАВИТЬ СЮДА ПРОПЕРКУ ИЗ БАЗЫ ДАННЫХ  
//         }
//         else {
//           res.json({redirectTo: '/', user: user });  // Обычный ответ с данными пользователя
//         }
//           // Если пароль верный, возвращаем данные пользователя
//       } else {
//         res.status(401).json({ message: 'Неверный логин или пароль' });
//       }
//     } else {
//       res.status(401).json({ message: 'Неверный логин или пароль' });
//     }
//   } catch (error) {
//     console.error('Ошибка при работе с базой данных:', error);
//     res.status(500).json({ message: 'Ошибка на сервере' });
//   }
// });

const jwt = require('jsonwebtoken');
const JWT_SECRET = 'yanaDIPLOM'; // замени на секретный ключ

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

    if (userResult.rows.length > 0) {
      const user = userResult.rows[0];
      const isMatch = await bcrypt.compare(password, user.password);

      if (isMatch) {
        const payload = {
          id: user.id,
          email: user.email,
          name: user.name, 
          surname: user.surname,
          father_name: user.father_name, 
          phone: user.phone,
          birthday: user.birthday,
          password: user.password,
          photo: user.photo,
          score: user.score,
          role: email === 'admin@gmail.com' ? 'admin' : 'user'
        };
      
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

        res.cookie('token', token, {
          httpOnly: true,
          secure: false,
          sameSite: 'strict',
        });

        return res.json({ redirectTo: payload.role === 'admin' ? '/admin' : '/', user: payload });
      } else {
        return res.status(401).json({ message: 'Неверный логин или пароль' });
      }
    }
    const teacherResult = await pool.query(`
     SELECT 
  t.*, 
  array_agg(n.name) AS subjects
FROM teachers t
LEFT JOIN teacher_types tn ON t.id = tn.teacher_id AND tn.is_active = true
LEFT JOIN napravleniya n ON tn.napravleniya_id = n.id
WHERE t.email = $1
GROUP BY t.id;

    `, [email]);

    if (teacherResult.rows.length > 0) {
      const teacher = teacherResult.rows[0];

      const isMatch = await bcrypt.compare(password, teacher.password);
      if (isMatch) {
        const user = {
          id: teacher.id,
          email: teacher.email,
          role: 'teacher',
          name: teacher.name,
          photo: `/photoes/${path.basename(teacher.photo)}`,
          subjects: teacher.subjects || []
        };

        const token = jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });

        res.cookie('token', token, {
          httpOnly: true,
          secure: false,
          sameSite: 'strict',
        });

        return res.json({ redirectTo: '/teacher', user });
      } else {
        return res.status(401).json({ message: 'Неверный логин или пароль' });
      }
    }

    return res.status(401).json({ message: 'Неверный логин или пароль' });

  } catch (error) {
    console.error('Ошибка при логине:', error);
    return res.status(500).json({ message: 'Ошибка на сервере' });
  }
});


app.get('/api/check-auth', (req, res) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ user: null });
  }

  try {
    const user = jwt.verify(token, JWT_SECRET);
    res.json({ user });
  } catch (error) {
    res.status(401).json({ user: null });
  }
});



app.post('/api/logout', (req, res) => {
  res.clearCookie('token');
  res.sendStatus(200);
});

// app.post('/api/login', async (req, res) => {
//   const { email, password } = req.body;

//   try {
//     // Проверяем таблицу users
//     const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

//     if (userResult.rows.length > 0) {
//       const user = userResult.rows[0];

//       // Проверяем пароль
//       if (user.password === password) {
//         // Проверяем, если это администратор
//         if (email === "admin" && password === "admin123") {
//           return res.json({ redirectTo: '/admin',user: { ...user, role: 'admin' }});
//         }
//         // Если это обычный пользователь
//         return res.json({ redirectTo: '/', user:{ ...user, role: 'user' } });
//       } else {
//         return res.status(401).json({ message: 'Неверный логин или пароль' });
//       }
//     }

//     // Если пользователь не найден в таблице users, проверяем таблицу teachers
//     const teacherResult = await pool.query(`SELECT t.*, 
//       array_agg(n.name) AS subjects
// FROM teachers t
// LEFT JOIN teacher_types tn ON t.id = tn.teacher_id
// LEFT JOIN napravleniya n ON tn.napravleniya_id = n.id
// WHERE t.email = $1
// GROUP BY t.id`, [email]);

// if (teacherResult.rows.length > 0) {
// const teacher = teacherResult.rows[0];

// // Проверяем пароль
// if (teacher.password === password) {
//    // Формируем корректный путь к фотографии
//    const user = {
//        ...teacher,
//        photo: `/photoes/${path.basename(teacher.photo)}`, // Исправляем путь
//        subjects: teacher.subjects || [], // Убедитесь, что есть массив направлений
//        role: 'teacher'
//    };

//    console.log(user);
//    return res.json({ redirectTo: '/teacher', user });
// } else {
//    return res.status(401).json({ message: 'Неверный логин или пароль' });
// }
// }

//     // Если пользователь не найден ни в одной из таблиц
//     return res.status(401).json({ message: 'Неверный логин или пароль' });
//   } catch (error) {
//     console.error('Ошибка при работе с базой данных:', error);
//     return res.status(500).json({ message: 'Ошибка на сервере' });
//   }
// });



const upload = multer({ storage: storage });
app.post(
  '/api/napravleniya',
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'video', maxCount: 1 }
  ]),
  async (req, res) => {
    if (!req.files || !req.files.image || !req.files.video) {
      return res.status(400).send('Необходимо загрузить и изображение, и видео');
    }

    const imagePath = `/images/${req.files.image[0].filename}`;
    const videoPath = `/uploads/videos/${req.files.video[0].filename}`;
    const { name, destriction, short_descr } = req.body;

    try {
      const result = await pool.query(
        `INSERT INTO napravleniya (name, destriction, short_descr, photo, video, is_active)
VALUES ($1, $2, $3, $4, $5, true)
RETURNING *;`,
        [name, destriction, short_descr, imagePath, videoPath]
      );

      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Ошибка при записи в БД:', error);
      res.status(500).send('Ошибка при записи в БД');
    }
  }
);
app.delete('/api/napravleniya/:id', async(req, res) => {
  const {id} = req.params;
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM types_day WHERE teacher_type_id IN (SELECT id FROM teacher_types WHERE napravleniya_id = $1)', [id]);
    await client.query('DELETE FROM teacher_types WHERE napravleniya_id = $1', [id]);
    const result = await client.query('UPDATE napravleniya set is_active = false WHERE id=$1', [id]);
    
    if (result.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Направление не найдено' });
    }

    await client.query('COMMIT');
    res.status(200).json({ 
      success: true,
      message: 'Направление и все связанные данные успешно удалены',
      deleted: result.rows[0] 
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Ошибка при удалении:', error);
    
    const errorInfo = {
      code: error.code,
      detail: error.detail,
      table: error.table,
      constraint: error.constraint
    };
    
    res.status(500).json({
      error: 'Ошибка при удалении направления',
      details: errorInfo,
      solution: 'Попробуйте удалить все связанные данные вручную или используйте мягкое удаление'
    });
  } finally {
    client.release();
  }
});


//прочтение АБОНЕМЕНТОВ

app.use('/photos', express.static(path.join(__dirname, 'tickets')));
app.get('/api/tickets', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM tickets');
        const data = result.rows.map(row => ({
            ...row,
            photo: `/photos/${path.basename(row.photo)}`
        }));
        res.json(data);  // Отправляем данные в формате JSON
    } catch (err) {
        console.error('Ошибка на сервере:', err);
        res.status(500).send('Ошибка на сервере');
    }
});




//добавление АБОНЕМЕНТА


const storage_2 = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'tickets/'); // Папка для сохранения изображений
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname); // Сохранить с оригинальным именем файла
  }
});

const upload_2 = multer({ storage: storage_2 });
app.post('/api/tickets', upload_2.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).send('Файл не был загружен');
  }

  const imagePath = `/tickets/${req.file.filename}`;
  const { name_ticket, price, time, descr, limits } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO tickets (name_ticket, price, time, descr, limits, photo) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [name_ticket, price, time, descr, limits, imagePath]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка при записи в БД:', error);
    res.status(500).send('Ошибка при записи в БД');
  }
});
app.put('/api/napravleniya/:id', 
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'video', maxCount: 1 }
  ]), 
  async (req, res) => {
    const { id } = req.params;
    const client = await pool.connect();

    try {
      await client.query('BEGIN');
      const currentData = await client.query('SELECT * FROM napravleniya WHERE id = $1 AND is_active = true', [id]);
      if (currentData.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Направление не найдено' });
      }

      let photoPath = currentData.rows[0].photo;
      let videoPath = currentData.rows[0].video;
      if (req.files && req.files.image) {
        const imageFile = req.files.image[0];
        photoPath = '/uploads/' + imageFile.filename;
        if (currentData.rows[0].photo) {
          const oldImagePath = path.join(__dirname, '..', 'public', currentData.rows[0].photo);
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
          }
        }
      }
      if (req.files && req.files.video) {
        const videoFile = req.files.video[0];
        videoPath = '/uploads/' + videoFile.filename;
        if (currentData.rows[0].video) {
          const oldVideoPath = path.join(__dirname, '..', 'public', currentData.rows[0].video);
          if (fs.existsSync(oldVideoPath)) {
            fs.unlinkSync(oldVideoPath);
          }
        }
      }
      const { name, short_descr, destriction } = req.body;
      if (!name || !short_descr || !destriction) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Все текстовые поля обязательны для заполнения' });
      }
      const result = await client.query(
        `UPDATE napravleniya 
SET name = $1, short_descr = $2, destriction = $3, photo = $4, video = $5 
WHERE id = $6 
RETURNING *;`,
        [name, short_descr, destriction, photoPath, videoPath, id]
      );

      await client.query('COMMIT');
      res.status(200).json(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Ошибка при обновлении направления:', error);
      res.status(500).json({ 
        error: 'Ошибка при обновлении направления',
        details: error.message 
      });
    } finally {
      client.release();
    }
  }
);
const storageNews = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'news/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname),
});
const uploadNews = multer({ storage: storageNews });


const ticketDir = path.join(__dirname, 'tickets');
if (!fs.existsSync(ticketDir)) {
  fs.mkdirSync(ticketDir, { recursive: true });
}

const storage_ticket = multer.diskStorage({
  destination: (req, file, cb) => cb(null, ticketDir),
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  }
});

const upload_ticket = multer({ storage: storage_ticket }); // <== ВАЖНО: ключ `storage`


app.use('/tickets', express.static(path.join(__dirname, 'tickets')));
app.put('/api/tickets/:id', upload_ticket.single('image'), async (req, res) => {
  const id = req.params.id;
  const { name_ticket, descr, price, time, limits } = req.body;
  const photoPath = req.file ? `/tickets/${req.file.filename}` : null;

  try {
    if (photoPath) {
      const old = await pool.query('SELECT photo FROM tickets WHERE id = $1', [id]);
      if (old.rows.length > 0 && old.rows[0].photo) {
        const oldPath = path.join(__dirname, old.rows[0].photo);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
    }
    const query = `
      UPDATE tickets
      SET name_ticket = $1,
          descr = $2,
          price = $3,
          time = $4,
          limits = $5
          ${photoPath ? ', photo = $6' : ''}
      WHERE id = $7
      RETURNING *
    `;

    const params = photoPath
      ? [name_ticket, descr, price, time, limits, photoPath, id]
      : [name_ticket, descr, price, time, limits, id];

    const result = await pool.query(query, params);
    const updated = result.rows[0];
    res.status(200).json({
      ...updated,
      photo: `/photos/${path.basename(updated.photo || '')}`
    });
  } catch (err) {
    console.error('Ошибка при обновлении:', err);
    if (req.file) {
      fs.unlinkSync(path.join(ticketDir, req.file.filename));
    }
    res.status(500).json({ message: 'Ошибка обновления' });
  }
});


app.put('/api/news/:id', uploadNews.single('photo'), async (req, res) => {
  const { id } = req.params;
  const { name, descr } = req.body;
  const photoPath = req.file ? `/news/${req.file.filename}` : null;

  try {
    const fields = ['name', 'descr'];
    const values = [name, descr];
    let setString = `name = $1, descr = $2`;

    if (photoPath) {
      fields.push(photoPath);
      values.push(photoPath);
      setString += `, photo = $3`;
    }

    values.push(id);
    await pool.query(`UPDATE news SET ${setString} WHERE id = $${values.length}`, values);

    res.json({ message: 'Новость обновлена' });
  } catch (err) {
    console.error('Ошибка при обновлении новости:', err);
    res.status(500).send('Ошибка при обновлении новости');
  }
});
//Удаление АБОНЕМЕНТА

app.delete('/api/tickets/:id', async(req, res) =>{
  const {id} = req.params;
  try{
    const result = await pool.query('DELETE FROM tickets WHERE id = $1 RETURNING *', [id]);
    if (result.rowCount === 0) {
      return res.status(404).send('Запись не найдена');
    }
  
    res.status(200).json({ message: 'Запись успешно удалена', deleted: result.rows[0] });
  } catch (error) {
    console.error('Ошибка при удалении записи:', error);
    res.status(500).send('Ошибка при удалении записи');
  }
  })


  //удаление видео учителя
  app.delete('/api/posts/:postId', async(req, res) =>{
  const {postId} = req.params;
  try{
    const result = await pool.query('DELETE FROM posts WHERE id = $1 RETURNING *', [postId]);
    if (result.rowCount === 0) {
      return res.status(404).send('Запись не найдена');
    }
  
    res.status(200).json({ message: 'Запись успешно удалена', deleted: result.rows[0] });
  } catch (error) {
    console.error('Ошибка при удалении записи:', error);
    res.status(500).send('Ошибка при удалении записи');
  }
  })

  //удаление совета
    app.delete('/api/advice/:adviceId', async(req, res) =>{
  const {adviceId} = req.params;
  try{
    const result = await pool.query('DELETE FROM advices WHERE id = $1 RETURNING *', [adviceId]);
    if (result.rowCount === 0) {
      return res.status(404).send('Запись не найдена');
    }
  
    res.status(200).json({ message: 'Запись успешно удалена', deleted: result.rows[0] });
  } catch (error) {
    console.error('Ошибка при удалении записи:', error);
    res.status(500).send('Ошибка при удалении записи');
  }
  })

      app.delete('/api/questions/:questionId', async(req, res) =>{
  const {questionId} = req.params;
  try{
    const result = await pool.query('DELETE FROM questions WHERE id = $1 RETURNING *', [questionId]);
    if (result.rowCount === 0) {
      return res.status(404).send('Запись не найдена');
    }
  
    res.status(200).json({ message: 'Запись успешно удалена', deleted: result.rows[0] });
  } catch (error) {
    console.error('Ошибка при удалении записи:', error);
    res.status(500).send('Ошибка при удалении записи');
  }
  })




//ПРОЧТЕНИЕ УЧИТЕЛЕЙ

app.use ('/photoes', express.static(path.join(__dirname, 'teachers')) )
app.get('/api/teachers', async (req, res) => {
  const { napravID } = req.query; // Извлечение параметра из запроса

  try {
    const query = `
   SELECT 
  t.*, 
  json_agg(
    json_build_object('id', n.id, 'name', n.name)
  ) FILTER (WHERE n.id IS NOT NULL) AS subjects
FROM teachers t
LEFT JOIN teacher_types tn ON t.id = tn.teacher_id AND tn.is_active = true
LEFT JOIN napravleniya n ON tn.napravleniya_id = n.id AND n.is_active = true
WHERE t.is_active = true
${napravID ? 'AND tn.napravleniya_id = $1' : ''}
GROUP BY t.id;


    `;

    const values = napravID ? [napravID] : [];
    const result = await pool.query(query, values);

    const data = result.rows.map(row => ({
      ...row,
      photo: `/photoes/${path.basename(row.photo)}`,
      subjects: row.subjects || []
    }));

    res.json(data);
  } catch (error) {
    console.error('Ошибка при получении учителей:', error);
    res.status(500).send('Ошибка сервера');
  }
});


//добавление учителя

const storage_3 = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'teachers/'); // Папка для сохранения изображений
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname); // Сохранить с оригинальным именем файла
  }
});

const upload_3 = multer({ storage: storage_3 });
app.post('/api/teachers', upload_3.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).send('Файл не был загружен');
  }

  const imagePath = `/teachers/${req.file.filename}`;
  const { name, last_name, father_name, email, login, password, info, experience } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO teachers (name, last_name, father_name, email, login, password, photo, info, experience) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [name, last_name, father_name, email, login, password, imagePath, info, experience]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка при записи в БД:', error);
    res.status(500).send('Ошибка при записи в БД');
  }
});


//редактирование учителя 

app.patch('/api/teachers/:id', upload_3.single('image'), async (req, res) => {
  const { id } = req.params;
  const fields = [];
  const values = [];
  let index = 1;

  if (req.body.name) {
    fields.push(`name = $${index++}`);
    values.push(req.body.name);
  }
  if (req.body.last_name) {
    fields.push(`last_name = $${index++}`);
    values.push(req.body.last_name);
  }
  if (req.body.father_name) {
    fields.push(`father_name = $${index++}`);
    values.push(req.body.father_name);
  }
  if (req.body.email) {
    fields.push(`email = $${index++}`);
    values.push(req.body.email);
  }
  if (req.body.login) {
    fields.push(`login = $${index++}`);
    values.push(req.body.login);
  }
if (req.body.password) {
  if (req.body.password.length < 8) {
    return res.status(400).json({ message: 'Пароль должен быть не менее 8 символов' });
  }

  const hashed = bcrypt.hashSync(req.body.password, 10);
  fields.push(`password = $${index++}`);
  values.push(hashed);
}

  if (req.body.info) {
    fields.push(`info = $${index++}`);
    values.push(req.body.info);
  }
  if (req.body.experience) {
    fields.push(`experience = $${index++}`);
    values.push(req.body.experience);
  }
  if (req.file) {
    const imagePath = `/teachers/${req.file.filename}`;
    fields.push(`photo = $${index++}`);
    values.push(imagePath);
  }

  if (fields.length === 0) {
    return res.status(400).json({ message: 'Нет данных для обновления' });
  }

  try {
    const result = await pool.query(
      `UPDATE teachers SET ${fields.join(', ')} WHERE id = $${index} RETURNING *`,
      [...values, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Учитель не найден' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка при обновлении учителя:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

//удаление учителя

app.delete('/api/teachers/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query(`
      DELETE FROM types_day
      WHERE teacher_type_id IN (
        SELECT id FROM teacher_types WHERE teacher_id = $1
      )
    `, [id]);
    await pool.query('DELETE FROM teacher_types WHERE teacher_id = $1', [id]);
    const result = await pool.query(`UPDATE teachers
SET is_active = false
WHERE id = $1 RETURNING *;
`, [id]);

    if (result.rowCount === 0) {
      return res.status(404).send('Запись не найдена');
    }

    res.status(200).json({ message: 'Запись успешно удалена', deleted: result.rows[0] });
  } catch (error) {
    console.error('Ошибка при удалении записи:', error);
    res.status(500).send('Ошибка при удалении записи');
  }
});

// app.post('/api/teacher_types', async(req, res)=>{
//   const {teacher_id, napravleniya_id} = req.body;
//   console.log('Received data:', req.body); 
  
//   try{
//     const result=await pool.query(`INSERT INTO teacher_types (teacher_id, napravleniya_id) VALUES ($1, $2) RETURNING *`,
//       [teacher_id, napravleniya_id]
//     );
//     res.status(201).json(result.rows[0]);
//   }catch(error){
//     console.error('Ошибка при записи в БД:', error);
//     res.status(500).send('Ошибка при записи в БД');
//   }
// })
app.get('/api/teacher_types/pending', async (req, res) => {
  try {
    const requests = await pool.query(`
      SELECT 
  tt.id AS teacher_type_id, 
  tt.*, 
  t.name AS teacher_name, 
  t.last_name AS teacher_last_name,
  n.name AS direction_name,
  COALESCE(
    array_agg(
      json_build_object('day', td.day, 'time', td.time)
    ) FILTER (WHERE td.id IS NOT NULL),
    '{}'
  ) AS schedule
FROM teacher_types tt
JOIN teachers t ON tt.teacher_id = t.id
JOIN napravleniya n ON tt.napravleniya_id = n.id
LEFT JOIN types_day td ON tt.id = td.teacher_type_id
WHERE tt.is_active = false AND n.is_active = true
GROUP BY tt.id, t.name, t.last_name, n.name;

    `);
    res.json(requests.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});
app.get('/api/teacher_types/deletion_requests', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT tt.*, 
       t.name AS teacher_name, 
       t.last_name AS teacher_last_name,
       n.name AS direction_name,
       (
         SELECT json_agg(
           json_build_object('day', td.day, 'time', td.time)
         )
         FROM types_day td 
         WHERE td.teacher_type_id = tt.id
       ) AS schedule
FROM teacher_types tt
JOIN teachers t ON tt.teacher_id = t.id
JOIN napravleniya n ON tt.napravleniya_id = n.id
WHERE tt.is_active IS NULL;
;
`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});
// GET /api/teacher_types/:teacher_id
app.get('/api/teacher_types/:teacher_id', async (req, res) => {
  const { teacher_id } = req.params;
  try {
    const result = await pool.query(`
      SELECT tt.*, n.name as direction_name, 
       (SELECT json_agg(json_build_object('day', td.day, 'time', td.time))
        FROM types_day td WHERE td.teacher_type_id = tt.id) as schedule
FROM teacher_types tt
JOIN napravleniya n ON tt.napravleniya_id = n.id
WHERE tt.teacher_id = $1 AND (tt.is_active = true OR tt.is_active IS NULL) AND n.is_active = true;
    `, [teacher_id]);

    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка при получении направлений преподавателя:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.delete('/api/teacher_types/:id', async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM types_day WHERE teacher_type_id = $1', [id]);
    await client.query('DELETE FROM teacher_types WHERE id = $1', [id]);
    await client.query('COMMIT');
    res.status(200).json({ success: true });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error("Ошибка удаления teacher_type", err);
    res.status(500).json({ error: 'Ошибка сервера' });
  } finally {
    client.release();
  }
});


app.post('/api/teacher_types', upload.none(), async (req, res) => {
  const { teacher_id, napravleniya_id, level, is_active } = req.body;

  if (!teacher_id || !napravleniya_id) {
    return res.status(400).json({ error: 'Необходимо указать teacher_id и napravleniya_id' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO teacher_types (teacher_id, napravleniya_id, level, is_active) 
VALUES ($1, $2, $3, $4)
RETURNING *;`,
      [teacher_id, napravleniya_id, level, is_active]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка при создании teacher_type:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.post('/api/teacher_types/days', async (req, res) => {
  const { teacher_type_id, day, time } = req.body;

  if (
    typeof teacher_type_id !== 'number' ||
    typeof day !== 'number' ||
    !time
  ) {
    return res.status(400).json({ error: 'Неверные данные' });
  }

  try {
    const typeInfoResult = await pool.query(`
     SELECT tt.id, tt.is_active, u.name as teacher_name, n.name as napravlenie_name
FROM teacher_types tt
JOIN teachers u ON tt.teacher_id = u.id
JOIN napravleniya n ON tt.napravleniya_id = n.id
WHERE tt.id = $1 AND n.is_active = true;
    `, [teacher_type_id]);
    
    const typeInfo = typeInfoResult.rows[0];
    if (!typeInfo) {
      return res.status(404).json({ error: 'Teacher type не найден' });
    }
    const result = await pool.query(
      `INSERT INTO types_day (teacher_type_id, day, time)
       VALUES ($1, $2, $3) RETURNING *`,
      [teacher_type_id, day, time]
    );

    const dayRecord = result.rows[0];
    res.status(201).json(dayRecord);
    if (!typeInfo.is_active) {
      return;
    }
    const daysResult = await pool.query(
      `SELECT day, time FROM types_day 
       WHERE teacher_type_id = $1 
       ORDER BY day, time`,
      [teacher_type_id]
    );
    
    const days = daysResult.rows;
    const daysOfWeek = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
    const formattedDays = days.map(d => `${daysOfWeek[d.day]}: ${d.time}`).join('<br>');
    const studentsResult = await pool.query(
      `SELECT name, email FROM users WHERE email IS NOT NULL`
    );
    const students = studentsResult.rows;
    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: 'eurodanceminsk@gmail.com',
        pass: 'swgp jqwo cdkm nscm',
      },
    });
    const message = `
      Обновлено расписание!<br><br>
      <strong>${typeInfo.teacher_name}</strong> преподает <strong>${typeInfo.napravlenie_name}</strong> 
      в следующие дни:<br><br>
      ${formattedDays}
    `;
    for (const student of students) {
      const html = emailTemplate
        .replace('{{username}}', student.name || 'ученик')
        .replace('{{message}}', message);

      try {
        await transporter.sendMail({
          from: 'eurodanceminsk@gmail.com',
          to: student.email,
          subject: 'Обновление расписания преподавателя!',
          html,
        });
        console.log(`Письмо отправлено на ${student.email}`);
      } catch (mailError) {
        console.error(`Ошибка отправки на ${student.email}:`, mailError);
      }
    }
  } catch (err) {
    console.error('Ошибка при добавлении дня:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  }
});

//ПОКУПКА АБОНИМЕНТА
app.post('/api/student_ticket', async (req, res) => {
  const { id_student, id_ticket, start_date, end_date } = req.body;

  console.log('Получены данные:', req.body);

  if (!id_student || !id_ticket || !start_date || !end_date) {
    return res.status(400).send('Недостаточно данных для создания пользователя');
  }

  try {
    const result = await pool.query(
      `INSERT INTO student_ticket (id_student, id_ticket, start_date, end_date)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [id_student, id_ticket, start_date, end_date]
    );
    const userQuery = await pool.query('SELECT email, name FROM users WHERE id = $1', [id_student]);
    const user = userQuery.rows[0];
    const ticketQuery = await pool.query('SELECT name_ticket FROM tickets WHERE id = $1', [id_ticket]);
    const ticket = ticketQuery.rows[0];
    const ticket_name = ticket?.name_ticket || 'абонемент';
    if (user && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email)) {
      const transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
          user: 'eurodanceminsk@gmail.com',
          pass: 'swgp jqwo cdkm nscm', 
        },
      });
const html = emailTemplate
        .replace('{{username}}', user.name || 'ученик')
        .replace(
          '{{message}}',
          `Ваш абонемент <strong>"${ticket_name}"</strong> успешно оформлен.<br>Он действителен с <strong>${start_date}</strong> по <strong>${end_date}</strong>.`
        )
        .replace('{{cta_link}}', 'https://example.com/student-panel')
        .replace('{{cta_text}}', 'Перейти в личный кабинет');

      const info = await transporter.sendMail({
        from: 'eurodanceminsk@gmail.com',
        to: user.email,
        subject: 'Подтверждение покупки абонемента',
        html,
      });

      console.log('Подтверждение отправлено:', info.response);
    }

    console.log('Пользователь добавлен в БД:', result.rows[0]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка при добавлении пользователя в БД:', error);
    res.status(500).send('Ошибка добавления пользователя');
  }
});





//АБОНИМЕНТЫ В ЛИЧНОМ КАБИНЕТЕ
app.use('/photos', express.static(path.join(__dirname, 'tickets')));
app.get('/api/student_ticket', async (req, res) => {
  const userId = req.query.id_user;
  try {
    const result = await pool.query(`
      SELECT 
          t.id_student, 
          t.id_ticket, 
          t.start_date, 
          t.end_date, 
          tn.name_ticket, 
          tn.photo, 
          array_agg(n.name) AS subjects
      FROM 
          student_ticket t 
      LEFT JOIN 
          tickets tn ON t.id_ticket = tn.id
      LEFT JOIN 
          users n ON t.id_student = n.id
            WHERE 
          t.id_student = $1
      GROUP BY 
          t.id_student, t.id_ticket, t.start_date, t.end_date, tn.name_ticket, tn.photo
    `, [userId]);

    const data = result.rows.map(row => ({
      ...row,
      photo: row.photo ? `/photos/${path.basename(row.photo)}` : null, // Добавляем ссылку на фото, если есть
      subjects: row.subjects || []
    }));

    res.json(data);
  } catch (err) {
    console.error("Ошибка на сервере: ", err);
    res.status(500).send('Ошибка на сервере');
  }
});

//ЧТЕНИЕ ЗАПИСИ

  app.get('/api/reservations', async (req, res) => {
    try {
      const userId = req.query.id_user ? parseInt(req.query.id_user) : null;

      const query = `
       SELECT 
  t.id_student, 
  t.id_teacher, 
  t.id,
  th.name AS teacher_name,
  th.email AS teacher_email,
  n.name AS student_name,
  n.email AS student_email,
  tn.name AS type_name,
  t.id_type, 
  t.date, 
  COALESCE(array_agg(tn.name), '{}') AS subjects
FROM reservations t 
LEFT JOIN napravleniya tn ON t.id_type = tn.id AND tn.is_active = true
LEFT JOIN users n ON t.id_student = n.id
LEFT JOIN teachers th ON t.id_teacher = th.id
${userId ? `WHERE t.id_student = $1` : ''}
GROUP BY t.id_student, t.id_teacher, th.name, th.email, tn.name, n.name, n.email, t.id_type, t.date, t.id;

      `;

      const params = userId ? [userId] : [];
      const result = await pool.query(query, params);

      const data = result.rows ? result.rows.map(row => ({
        ...row,
        subjects: row.subjects || []
      })) : [];

      res.json(data);
    } catch (err) {
      console.error("Ошибка на сервере: ", err.stack);  
      res.status(500).send('Ошибка на сервере');
    }
  });
  app.get('/api/reservations/student', async (req, res) => {
    const { id_student } = req.query;

    if (!id_student) {
      return res.status(400).json({ error: 'Student ID is required' });
    }

    try {
      const query = `
    SELECT 
  r.id,
  r.id_type, 
  r.date,
  r.status,
  r.id_teacher, 
  CONCAT(t.name, ' ', t.last_name) AS teacher_full_name,
  n.name AS type_name,
  n.id AS direction_id, 
  tk.name_ticket AS ticket_name,
  st.start_date AS ticket_start,
  st.end_date AS ticket_end,
  tdo.transferred_date,
  CASE 
    WHEN r.date < NOW() THEN 'прошло'
    WHEN r.status = 'cancelled' THEN 'отменено'
    ELSE 'предстоит'
  END AS lesson_status
FROM reservations r
JOIN teachers t ON r.id_teacher = t.id
JOIN napravleniya n ON r.id_type = n.id AND n.is_active = true
LEFT JOIN LATERAL (
  SELECT * 
  FROM student_ticket st
  WHERE st.id_student = r.id_student
    AND st.start_date <= r.date 
    AND st.end_date >= r.date
  ORDER BY st.start_date DESC
  LIMIT 1
) st ON true
LEFT JOIN tickets tk ON st.id_ticket = tk.id
LEFT JOIN teachers_days_off tdo ON tdo.id_teacher = r.id_teacher AND (tdo.date = r.date OR tdo.transferred_date = r.date)
WHERE r.id_student = $1
ORDER BY r.date DESC;


  `;

      const result = await pool.query(query, [id_student]);

      const formattedResults = result.rows.map(row => ({
        ...row,
        id_type: row.id_type || row.direction_id, // Обеспечиваем наличие ID направления
        date: new Date(row.date).toISOString().split('T')[0],
        ticket_info: row.ticket_name 
          ? `${row.ticket_name} (${new Date(row.ticket_start).toLocaleDateString()} - ${new Date(row.ticket_end).toLocaleDateString()})`
          : 'Без абонемента'
      }));

      res.json(formattedResults);
    } catch (err) {
      console.error('Database error:', err);
      res.status(500).json({ 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  });

//ДОБАВЛЕНИЕ ЗАПИСИ

// app.post('/api/reservations', async (req, res) => {
//   const { id_student, id_teacher, id_type, date, is_single, is_group } = req.body;

//   try {
//     // 1. Проверка абонемента
//     if (!is_single) {
//       const ticketCheck = await pool.query(
//         `SELECT * FROM student_ticket 
//          WHERE id_student = $1 
//          AND start_date <= $2::date 
//          AND end_date >= $2::date`,
//         [id_student, date]
//       );

//       if (ticketCheck.rows.length === 0) {
//         return res.status(400).json({ error: 'У вас нет активного абонемента на выбранную дату' });
//       }
//     }

//     // 2. Проверка: студент уже записан на это направление в эту дату?
//     const existingReservation = await pool.query(
//       `SELECT * FROM reservations 
//        WHERE id_student = $1 AND date = $2 AND id_type = $3`,
//       [id_student, date, id_type]
//     );

//     if (existingReservation.rows.length > 0) {
//       return res.status(400).json({ error: 'Вы уже записаны на это направление в этот день' });
//     }

//     // 3. Проверка количества мест
//     const maxSpots = is_single ? 1 : 15;

//     const spotsCheck = await pool.query(
//       `SELECT COUNT(*) FROM reservations 
//        WHERE id_teacher = $1 AND id_type = $2 AND date = $3`,
//       [id_teacher, id_type, date]
//     );

//     const bookedSpots = parseInt(spotsCheck.rows[0].count, 10);
//     if (bookedSpots >= maxSpots) {
//       return res.status(400).json({ error: 'На выбранную дату нет свободных мест' });
//     }

//     // 4. Сохраняем бронь
//     const result = await pool.query(
//       `INSERT INTO reservations 
//        (id_student, id_teacher, id_type, date, is_single, is_group) 
//        VALUES ($1, $2, $3, $4, $5, $6) 
//        RETURNING *`,
//       [id_student, id_teacher, id_type, date, is_single, is_group]
//     );

//     // 5. Получаем email пользователя
//     const userQuery = await pool.query('SELECT email, name FROM users WHERE id = $1', [id_student]);
//     const user = userQuery.rows[0];

//     if (user && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email)) {
//       // 6. Отправляем письмо
//       const transporter = nodemailer.createTransport({
//         service: 'Gmail',
//         auth: {
//           user: 'eurodanceminsk@gmail.com',
//           pass: 'swgp jqwo cdkm nscm', // Храните в переменных окружения
//         },
//       });

//       const info = await transporter.sendMail({
//         from: 'eurodanceminsk@gmail.com',
//         to: user.email,
//         subject: 'Подтверждение бронирования',
//         text: `Здравствуйте, ${user.name || 'ученик'}!\n\nВы успешно записались на занятие по направлению №${id_type} на ${date}.\n\nДо встречи на занятии!`,
//       });

//       console.log('Подтверждение отправлено:', info.response);
//     }

//     return res.status(201).json(result.rows[0]);

//   } catch (error) {
//     console.error('Ошибка при записи в БД:', error);
//     res.status(500).json({ error: 'Ошибка при записи в БД', details: error.message });
//   }
// });
// В вашем server.js или routes файле
const processedRequests = {};

app.post('/api/reservations', async (req, res) => {
    const requestId = req.headers['x-request-id'];
    if (requestId && processedRequests[requestId]) {
        return res.status(409).json({ error: 'Этот запрос уже обрабатывается' });
    }
    
    if (requestId) {
        processedRequests[requestId] = true;
    }

    try {
        const { id_student, id_teacher, id_type, date, is_single, is_group } = req.body;
       const existingSameDirectionSameTeacher = await pool.query(
  `SELECT * FROM reservations 
   WHERE id_student = $1 AND date = $2 AND id_type = $3 AND id_teacher = $4`,
  [id_student, date, id_type, id_teacher]
);

if (existingSameDirectionSameTeacher.rows.length > 0) {
  return res.status(400).json({ error: 'Вы уже записаны на это направление у этого преподавателя в этот день' });
}
        if (!is_single) {
            const ticketCheck = await pool.query(
                `SELECT * FROM student_ticket 
                 WHERE id_student = $1 
                 AND start_date <= $2::date 
                 AND end_date >= $2::date`,
                [id_student, date]
            );

            if (ticketCheck.rows.length === 0) {
                return res.status(400).json({ error: 'У вас нет активного абонемента на выбранную дату' });
            }
        }
       let maxSpots, spotsQuery, spotsParams;

if (is_single) {
  maxSpots = 1;
  spotsQuery = `
    SELECT COUNT(*) FROM reservations 
    WHERE id_teacher = $1 AND id_type = $2 AND date = $3 AND is_single = true
  `;
  spotsParams = [id_teacher, id_type, date];
} else {
  maxSpots = 15;
  spotsQuery = `
    SELECT COUNT(*) FROM reservations 
    WHERE id_teacher = $1 AND id_type = $2 AND date = $3 AND is_group = true
  `;
  spotsParams = [id_teacher, id_type, date];
}

const spotsCheck = await pool.query(spotsQuery, spotsParams);
const bookedSpots = parseInt(spotsCheck.rows[0].count, 10);

if (bookedSpots >= maxSpots) {
  return res.status(400).json({ error: 'На выбранную дату нет свободных мест' });
}
       const result = await pool.query(
  `INSERT INTO reservations 
   (id_student, id_teacher, id_type, date, is_single, is_group) 
   VALUES ($1, $2, $3, $4, $5, $6) 
   RETURNING *`,
  [id_student, id_teacher, id_type, date, is_single, is_group]
);
const directionQuery = await pool.query(
  `SELECT napravleniya.name 
   FROM napravleniya 
   WHERE napravleniya.id = $1`, 
  [id_type]
);
const directionName = directionQuery.rows[0]?.name || 'выбранному направлению';
const userQuery = await pool.query('SELECT email, name FROM users WHERE id = $1', [id_student]);
const user = userQuery.rows[0];

if (user && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email)) {
  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: 'eurodanceminsk@gmail.com',
      pass: 'swgp jqwo cdkm nscm', 
    },
  });

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
      <h2 style="color: #d200a3;">Здравствуйте, ${user.name || 'ученик'}!</h2>
      <p>Вы успешно записались на занятие по направлению <strong>${directionName}</strong> на <strong>${date}</strong>.</p>
      <p>До встречи на занятии!</p>
      <hr />
      <p style="font-size: 0.9em; color: #666;">С уважением, команда <strong>EuroDance Minsk</strong></p>
    </div>
  `;

  const info = await transporter.sendMail({
    from: 'eurodanceminsk@gmail.com',
    to: user.email,
    subject: 'Подтверждение бронирования',
    html: emailHtml,
  });

  console.log('Подтверждение отправлено:', info.response);
}

    return res.status(201).json(result.rows[0]);
        return res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Ошибка при записи в БД:', error);
        res.status(500).json({ error: 'Ошибка при записи в БД', details: error.message });
    } finally {
        if (requestId) {
            setTimeout(() => delete processedRequests[requestId], 300000);
        }
    }
});
app.use('/image', express.static(path.join(__dirname, 'news')));
app.get('/api/news', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM news');
        const data = result.rows.map(row => ({
            ...row,
            photo: `/image/${path.basename(row.photo)}`
        }));
        res.json(data);  // Отправляем данные в формате JSON
    } catch (err) {
        console.error('Ошибка на сервере:', err);
        res.status(500).send('Ошибка на сервере');
    }
});

const storage_4 = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'news/'); // Папка для сохранения изображений
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname); // Сохранить с оригинальным именем файла
  }
});

const upload_4 = multer({ storage: storage_4 });
app.post('/api/news', upload_4.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).send('Файл не был загружен');
  }

  const imagePath = `/news/${req.file.filename}`;
  const { name, descr } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO news (name, descr, photo) VALUES ($1, $2, $3) RETURNING *`,
      [name, descr, imagePath]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка при записи в БД:', error);
    res.status(500).send('Ошибка при записи в БД');
  }
});

app.get('/api/napravleniya', async (req, res) => {
  const { teacherid } = req.query;

  if (!teacherid) {
      return res.status(400).json({ error: 'teacherid не указан' });
  }

  try {
      const query = `
         SELECT n.* 
FROM napravleniya n
INNER JOIN teacher_types tt ON n.id = tt.napravleniya_id
WHERE tt.teacher_id = $1 AND tt.is_active = true and n.is_active = true;

      `;
      const result = await pool.query(query, [teacherid]);
      res.json(result.rows);
  } catch (error) {
      console.error('Ошибка при выполнении запроса:', error);
      res.status(500).json({ error: 'Ошибка при выполнении запроса' });
  }
});

//ОТЗЫВЫ

app.get('/api/comments_start', async(req, res)=>{
  try{
const result = await pool.query('SELECT * from comments_start') 
res.json(result.rows);
}catch (err) {
  console.error(err);
  res.status(500).send('Server error');
}
})

app.get('/api/comments', async(req, res)=>{
  try{
const result = await pool.query('SELECT * from comments') 
res.json(result.rows);
}catch (err) {
  console.error(err);
  res.status(500).send('Server error');
}
})

app.post('/api/comments_start', async(req, res)=>{
  const {id, stars, text} = req.body;

  if(!id || !stars|| !text){
    return res.status(400).send('Недостаточно данных для оставления отзыва');
  }
  try{
    const result = await pool.query(
      `INSERT INTO comments_start (id, stars, text) VALUES ($1, $2, $3) RETURNING *`,
      [id, stars, text]
    );
    console.log('Отзыв добавлен в БД:', result.rows[0]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка при добавлении отзыва в БД:', error);
    res.status(500).send('Ошибка добавления отзыва');
  }
})


app.delete('/api/comments_start/:id_of_comm', async(req, res) =>{
  const {id_of_comm} = req.params;
  try{
    const result = await pool.query('DELETE FROM comments_start WHERE id_of_comm = $1 RETURNING *', [id_of_comm]);
    if (result.rowCount === 0) {
      return res.status(404).send('Запись не найдена');
    }
  
    res.status(200).json({ message: 'Запись успешно удалена', deleted: result.rows[0] });
  } catch (error) {
    console.error('Ошибка при удалении записи:', error);
    res.status(500).send('Ошибка при удалении записи');
  }
  })

//ПРИНЯТИЕ ОТЗЫВА
app.post('/api/comments', async (req, res) => {
  const { id_of_comm } = req.body;

  if (!id_of_comm) {
      return res.status(400).send('Недостаточно данных для принятия отзыва');
  }

  try {
      const commentResult = await pool.query(
          'SELECT * FROM comments_start WHERE id_of_comm = $1',
          [id_of_comm]
      );

      if (commentResult.rows.length === 0) {
          return res.status(404).send('Комментарий не найден');
      }

      const { id, stars, text } = commentResult.rows[0];
      await pool.query(
          'INSERT INTO comments (id, stars, text) VALUES ($1, $2, $3)',
          [id, stars, text]
      );
      await pool.query(
          'DELETE FROM comments_start WHERE id_of_comm = $1',
          [id_of_comm]
      );

      console.log('Комментарий принят и перенесен в БД:', commentResult.rows[0]);
      res.status(200).json({ message: 'Комментарий принят и перенесен' });
      
  } catch (error) {
      console.error('Ошибка при принятии отзыва:', error);
      res.status(500).send('Ошибка при принятии отзыва');
  }
});


//ДНИ НЕДЕЛИ
app.get('/api/types_day', async (req, res) => {
  const { teacherid, napravID } = req.query;

  if (!teacherid && !napravID) {
      return res.status(400).send('Не указан идентификатор учителя или направления');
  }

  try {
      let result;

      if (teacherid) {
          result = await pool.query(`
              SELECT 
  td.days AS days,
  t.id AS teacher_id,
  t.last_name AS teacher_last_name,
  t.name AS teacher_name,
  t.father_name AS teacher_father_name,
  t.photo AS teacher_photo,
  t.experience AS teacher_experience,
  n.id AS napravleniya_id,
  n.name AS napravleniya_name
FROM types_day td
JOIN teacher_types tt ON td.id = tt.id AND tt.is_active = true
JOIN teachers t ON tt.teacher_id = t.id
JOIN napravleniya n ON tt.napravleniya_id = n.id
WHERE t.id = $1;

          `, [teacherid]);
      } else if (napravID) {
          result = await pool.query(`
             SELECT 
  t.id AS teacher_id,
  t.name AS teacher_name,
  t.last_name AS teacher_last_name,
  t.photo AS teacher_photo,
  td.days AS days
FROM teachers t
JOIN teacher_types tt ON t.id = tt.teacher_id AND tt.is_active = true
JOIN types_day td ON tt.id = td.id
WHERE tt.napravleniya_id = $1;

          `, [napravID]);
      }

      res.json(result.rows); // Возвращаем массив данных
  } catch (error) {
      console.error('Ошибка при выполнении запроса:', error);
      res.status(500).send('Ошибка сервера');
  }
});



const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
app.post('/send-email', async (req, res) => {
  const { subject, message } = req.body;

  try {
    const users = await pool.query('SELECT email FROM users');
    console.log('Список email:', users.rows);
    const emailList = users.rows
      .map(user => user.email)
      .filter(email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));

    if (emailList.length === 0) {
      return res.status(400).send('Нет валидных email для отправки');
    }

    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: 'eurodanceminsk@gmail.com',
        pass: 'swgp jqwo cdkm nscm',
      },
    });
    let sendResults = [];
    let successCount = 0;
    let failCount = 0;
    
    for (const email of emailList) {
      try {
        const info = await transporter.sendMail({
          from: 'eurodanceminsk@gmail.com',
          to: email,
          subject,
          text: message,
        });
        successCount++;
        sendResults.push({ email, status: 'sent', response: info.response });
        console.log(`Email sent to ${email} (${successCount}/${emailList.length})`);
      } catch (error) {
        failCount++;
        sendResults.push({ email, status: 'failed', error: error.toString() });
        console.error(`Ошибка при отправке на ${email} (${failCount} ошибок):`, error);
      }
    }

    res.status(200).send({ 
      message: `Письма отправлены: ${successCount} успешно, ${failCount} с ошибками`, 
      results: sendResults 
    });
  } catch (error) {
    console.error('Ошибка при обработке запроса:', error);
    res.status(500).send({ message: 'Произошла ошибка при отправке писем', error: error.toString() });
  }
});
app.get('/api/reservations', async (req, res) => {
  const teacherID = req.query.id_teacher;
  const dateFilter = req.query.date; // Добавляем возможность фильтрации по дате

  try {
    let query = `
      SELECT 
        t.id_student, 
        t.id_teacher, 
        th.name AS teacher_name,
        th.last_name AS teacher_last_name,
        u.name AS student_name,
        u.last_name AS student_last_name,
        u.phone AS student_phone,
        n.name AS type_name,
        t.id_type, 
        t.date,
        st.start_date AS ticket_start,
        st.end_date AS ticket_end,
        tk.name_ticket AS ticket_name
      FROM 
        reservations t 
      LEFT JOIN 
        napravleniya n ON t.id_type = n.id
      LEFT JOIN 
        users u ON t.id_student = u.id
      LEFT JOIN
        teachers th ON t.id_teacher = th.id
      LEFT JOIN
        student_ticket st ON t.id_student = st.id_student 
        AND st.start_date <= t.date 
        AND st.end_date >= t.date
      LEFT JOIN
        tickets tk ON st.id_ticket = tk.id
      WHERE 
        t.id_teacher = $1
    `;

    const params = [teacherID];
    if (dateFilter) {
      query += ` AND t.date = $2`;
      params.push(dateFilter);
    }

    query += ` ORDER BY t.date DESC, u.name ASC`;

    const result = await pool.query(query, params);
    const data = result.rows.map(row => ({
      id_student: row.id_student,
      id_teacher: row.id_teacher,
      teacher_name: `${row.teacher_name} ${row.teacher_last_name}`,
      student_name: `${row.student_name} ${row.student_last_name}`,
      student_phone: row.student_phone,
      type_name: row.type_name,
      id_type: row.id_type,
      date: row.date,
      ticket_info: row.ticket_name 
        ? `${row.ticket_name} (${new Date(row.ticket_start).toLocaleDateString()} - ${new Date(row.ticket_end).toLocaleDateString()})` 
        : 'Без абонемента'
    }));

    res.json(data);
  } catch (err) {
    console.error("Ошибка на сервере: ", err);
    res.status(500).send('Ошибка на сервере');
  }
});
app.patch('/api/reservations/:id/cancel', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('UPDATE reservations SET status = $1 WHERE id = $2', ['cancelled', id]);
        res.sendStatus(200);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Не удалось отменить занятие' });
    }
});
app.get('/api/reservations/available-spots', async (req, res) => {
  const { teacherId, typeId, date } = req.query;

  try {
    const result = await pool.query(
      `SELECT COUNT(*) FROM reservations 
WHERE teacher_id = $1 AND date = $2 AND id_type = $3 AND status != 'cancelled'
`,
      [teacherId, typeId, date]
    );

    const availableSpots = 15 - parseInt(result.rows[0].count, 10);
    res.json({ availableSpots });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Получение всех бронирований студента
app.get('/api/reservations/student', async (req, res) => {
  const { studentId } = req.query;

  try {
    const result = await pool.query(
      `SELECT 
        r.date,
        t.name AS teacher_name,
        t.last_name AS teacher_last_name,
        n.name AS type_name,
        tk.name_ticket AS ticket_name
       FROM reservations r
       JOIN teachers t ON r.id_teacher = t.id
       JOIN napravleniya n ON r.id_type = n.id
       LEFT JOIN student_ticket st ON r.id_student = st.id_student 
         AND st.start_date <= r.date 
         AND st.end_date >= r.date
       LEFT JOIN tickets tk ON st.id_ticket = tk.id
       WHERE r.id_student = $1
       ORDER BY r.date DESC`,
      [studentId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
app.get('/api/reservations_count', async (req, res) => {
  const { teacher_id, month, year } = req.query;

  try {
      const result = await pool.query(`
          SELECT 
              date,
              COUNT(*) as count
          FROM 
              reservations
          WHERE 
              id_teacher = $1
              AND EXTRACT(MONTH FROM date) = $2
              AND EXTRACT(YEAR FROM date) = $3
          GROUP BY 
              date
      `, [teacher_id, month, year]);
      const counts = {};
      result.rows.forEach(row => {
          counts[row.date.toISOString().split('T')[0]] = parseInt(row.count, 10);
      });

      res.json(counts);
  } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
  }
});


// const transporter = nodemailer.createTransport({
//   service: 'gmail', // или другой почтовый сервис
//   auth: {
//     user: 'eurodanceminsk@gmail.com',
//     pass: 'Eurodanceminsk1.', // рекомендуется использовать OAuth2
//   },
// });

// app.post('/send-email', async (req, res) => {
//   const { subject, message } = req.body;

//   const mailOptions = {
//     from: 'eurodanceminsk@gmail.com',
//     to: email,
//     subject: subject,
//     text: message,
//   };

//   transporter.sendMail(mailOptions, (error, info) => {
//     if (error) {
//       return res.status(500).send(error.toString());
//     }
//     res.status(200).send('Email sent: ' + info.response);
//   });
// });



// // Маршрут для проверки абонементов
app.get('/api/checkTicket', async (req, res) => {
  const today = new Date();
  const threeDaysLater = new Date(today);
  threeDaysLater.setDate(today.getDate() + 3);

  try {
    const result = await pool.query(`
      SELECT * FROM student_ticket 
      WHERE end_date BETWEEN $1 AND $2
      AND reminder_sent IS NOT TRUE
    `, [today, threeDaysLater]);

    if (result.rows.length > 0) {
      for (const ticket of result.rows) {
        const userId = ticket.id_student;
        const ticketId = ticket.id_ticket;

        if (!userId) {
          console.log(`Ошибка: абонемент с id ${ticket.id} не содержит id_user`);
          continue;
        }

        const userQuery = await pool.query('SELECT email FROM users WHERE id = $1', [userId]);
        if (userQuery.rows.length === 0) {
          console.log('Пользователь с таким ID не найден для абонемента', userId);
          continue;
        }
        const email = userQuery.rows[0].email;

        const ticketQuery = await pool.query('SELECT name_ticket FROM tickets WHERE id = $1', [ticketId]);
        if (ticketQuery.rows.length === 0) {
          console.log(`Ошибка: абонемент с id_ticket ${ticketId} не найден в таблице tickets`);
          continue;
        }
        const ticketName = ticketQuery.rows[0].name_ticket;
        const dateObj = new Date(ticket.end_date);
        const day = String(dateObj.getDate()).padStart(2, '0');
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const year = dateObj.getFullYear();
        const simpleDate = `${day}.${month}.${year}`;

        const subject = 'Напоминание: скоро заканчивается ваш абонемент';
        const text = `Ваш абонемент "${ticketName}" истекает ${simpleDate}. Пожалуйста, продлите его, чтобы продолжить пользоваться услугой.`;

        await sendEmail(email, subject, text);
        await pool.query('UPDATE student_ticket SET reminder_sent = TRUE WHERE id = $1', [ticket.id]);
      }
      res.status(200).send({ message: 'Уведомления отправлены' });
    } else {
      res.status(200).send({ message: 'Нет абонементов, которые нужно напомнить' });
    }
  } catch (error) {
    console.error('Ошибка при проверке абонементов:', error);
    res.status(500).send({ message: 'Произошла ошибка на сервере' });
  }
});


app.use('/stocks', express.static(path.join(__dirname, 'stocks')));
app.get('/api/stocks', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM stocks WHERE date_end >= CURRENT_DATE OR date_end is null');
        const data = result.rows.map(row => ({
            ...row,
            photo: `/stocks/${path.basename(row.photo)}`
        }));
        res.json(data);  // Отправляем данные в формате JSON
    } catch (err) {
        console.error('Ошибка на сервере:', err);
        res.status(500).send('Ошибка на сервере');
    }
});

app.get('/api/reservations_t', async (req, res) => {
  const { id_teacher } = req.query;

  try {
    const result = await pool.query(
      'SELECT * FROM reservations WHERE id_teacher = $1',
      [id_teacher]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка при получении занятий:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});
app.get('/api/teachers_days_off', async (req, res) => {
  const teacherId = req.query.id_teacher;

  if (!teacherId) {
      return res.status(400).json({ error: 'Не передан id_teacher' });
  }

  try {
      const result = await pool.query(
          'SELECT * FROM teachers_days_off WHERE id_teacher = $1',
          [teacherId]
      );
      res.json(result.rows);
  } catch (err) {
      console.error('Ошибка при получении days_off:', err);
      res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});


app.get('/api/teachers_days_off_to_user', (req, res) => {
    const { id_teacher } = req.query;
    
    if (!id_teacher) {
        return res.status(400).json({ error: 'Не указан ID преподавателя' });
    }

    pool.query(
        `SELECT date::text, status FROM teachers_days_off 
         WHERE id_teacher = $1 AND status = 'approved'`,
        [id_teacher],
        (error, results) => {
            if (error) {
                console.error('Database error:', error);
                return res.status(500).json({ error: 'Ошибка базы данных' });
            }
            res.json(results.rows);
        }
    );
});


app.get('/api/types_day_t', async (req, res) => {
  const { teacherid } = req.query;

  try {
    const result = await pool.query(
      'SELECT * FROM types_day WHERE id = $1',
      [teacherid]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка при получении рабочих дней:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// app.post('/api/teachers_days_off', async (req, res) => {
//   const { id_teacher, reservation_ids, date, reason } = req.body;

//   const client = await pool.connect();
//   try {
//     await client.query('BEGIN');

//     const result = await client.query(
//       `INSERT INTO teachers_days_off (id_teacher, date, reason, confirm)
//        VALUES ($1, $2, $3, $4)
//        RETURNING id`,
//       [id_teacher, date, reason, false]
//     );
//     console.log({ id_teacher, reservation_ids, date, reason });

//     const dayOffId = result.rows[0].id;

//     for (const reservationId of reservation_ids) {
//       await client.query(
//         `INSERT INTO teachers_days_off_reservations (teachers_day_off_id, reservation_id)
//          VALUES ($1, $2)`,
//         [dayOffId, reservationId]
//       );
//     }

//     // Получаем email и имена учеников по ID бронирований
//     const emailsQuery = await client.query(`
//       SELECT u.email, u.name AS student_name, t.name AS teacher_name, r.date
//       FROM reservations r
//       JOIN users u ON r.id_student = u.id
//       JOIN users t ON r.id_teacher = t.id
//       WHERE r.id = ANY($1::int[])
//     `, [reservation_ids]);

//     // Отправка писем каждому ученику
//     for (const row of emailsQuery.rows) {
//       const { email, student_name, teacher_name, date: lessonDate } = row;
//       const subject = `Отмена занятия ${formatDate(lessonDate)}`;
//       const text = `Здравствуйте, ${student_name}!\n\n` +
//                    `Ваше занятие с преподавателем ${teacher_name}, назначенное на ${formatDate(lessonDate)}, было отменено по причине: "${reason}".\n\n` +
//                    `Пожалуйста, свяжитесь с преподавателем или администрацией для получения дополнительной информации.`;

//       await sendEmail(email, subject, text);
//     }

//     await client.query('COMMIT');
//     res.status(201).json({ message: 'Отмена успешно создана и уведомления отправлены!' });
//   } catch (error) {
//     await client.query('ROLLBACK');
//     console.error('Ошибка при записи отмены:', error);
//     res.status(500).send('Ошибка при записи отмены');
//   } finally {
//     client.release();
//   }

//   // Вспомогательная функция форматирования даты
//   function formatDate(date) {
//     return new Date(date).toLocaleDateString('ru-RU', {
//       year: 'numeric', month: 'long', day: 'numeric',
//       hour: '2-digit', minute: '2-digit',
//     });
//   }
// });


//ЗАМЕТКИ

app.post('/api/teachers_days_off', async (req, res) => {
  const client = await pool.connect();
  try {
   const { id_teacher, date, reason, transferred_date } = req.body;


    if (!id_teacher || !date || !reason) {
      return res.status(400).json({ error: 'Отсутствуют обязательные параметры' });
    }

    await client.query('BEGIN');

    await client.query(
  'INSERT INTO teachers_days_off (id_teacher, date, reason, transferred_date) VALUES ($1, $2, $3, $4)',
  [id_teacher, date, reason, transferred_date]
);
    const reservationsRes = await client.query(`
      SELECT r.id
      FROM reservations r
      WHERE r.id_teacher = $1 AND DATE(r.date) = $2
    `, [id_teacher, date]);

    const reservation_ids = reservationsRes.rows.map(r => r.id);

    if (reservation_ids.length === 0) {
      console.log('Нет бронирований для отмены.');
    } else {
      const emailsQuery = await client.query(`
        SELECT u.email, u.name AS student_name, t.name AS teacher_name, r.date
        FROM reservations r
        JOIN users u ON r.id_student = u.id
        JOIN users t ON r.id_teacher = t.id
        WHERE r.id = ANY($1::int[])
      `, [reservation_ids]);
function formatDate(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
    }

    await client.query('COMMIT');
    res.status(201).json({ message: 'Отмена успешно создана и уведомления отправлены!' });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Ошибка при отмене занятий:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  } finally {
    client.release();
  }
});



app.get('/api/notes', async (req, res) => {
  const { id } = req.query;

  try {
    const result = await pool.query(
      'SELECT * FROM notes WHERE id = $1', [id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка при получении заметок:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

app.patch('/api/notes/:id', async (req, res) => {
  const { id } = req.params; // это noteID заметки, а не id учителя
  const { note } = req.body;

  try {
    const result = await pool.query(
      'UPDATE notes SET note = $1 WHERE "noteID" = $2 RETURNING *',
      [note, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Заметка не найдена' });
    }

    console.log('Обновленная заметка:', result.rows[0]); // Для отладки
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка при обновлении заметки:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});


app.post('/api/notes', async (req, res) => {
  const { id, note } = req.body;

  try {
    const result = await pool.query(
      'INSERT INTO notes (id, note) VALUES ($1, $2) RETURNING *',
      [id, note]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка при создании заметки:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});



app.delete('/api/notes/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query('DELETE FROM notes WHERE "noteID" = $1', [id]);
    res.status(204).send(); // Нет содержимого
  } catch (error) {
    console.error('Ошибка при удалении заметки:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

app.get('/api/teacher_schedule', async (req, res) => {
  try {
    const result = await pool.query(`
   SELECT 
  t.id AS teacher_type_id,
  t.napravleniya_id,          
  te.id AS teacher_id,
  te.name || ' ' || te.last_name AS teacher_name,
  n.name AS subject_name,
  td.day, t.level,
  td."time"
FROM types_day td
JOIN teacher_types t ON td.teacher_type_id = t.id
JOIN teachers te ON t.teacher_id = te.id
JOIN napravleniya n ON t.napravleniya_id = n.id
WHERE t.is_active = true OR t.is_active IS NULL
ORDER BY te.id, n.name, td.day, td."time", t.level;


    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка при получении расписания:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

app.get('/api/teacher_schedule', async (req, res) => {
  try {
    const { teacherid } = req.query;  // Получаем id преподавателя из query параметра
    const result = await pool.query(`
      SELECT 
        t.id AS teacher_type_id,
        te.id AS teacher_id,
        te.name || ' ' || te.last_name AS teacher_name,
        n.name AS subject_name,
        td.day,
        td."time"
      FROM types_day td
      JOIN teacher_types t ON td.teacher_type_id = t.id
      JOIN teachers te ON t.teacher_id = te.id
      JOIN napravleniya n ON t.napravleniya_id = n.id
      WHERE te.id = $1  -- Добавляем фильтрацию по id преподавателя
      ORDER BY te.id, n.name, td.day, td."time";
    `, [teacherid]);

   

    res.json(result.rows);  // Отправляем данные на клиент
  } catch (error) {
    console.error('Ошибка при получении расписания:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});


app.use('/videos', express.static(path.join(__dirname, 'videos')));

app.get('/api/posts', async (req, res) => {
  try {
    const result = await pool.query(`
     SELECT
  p.id,
  p.description, 
  p.video,
  t.id AS teacher_id,
  t.name AS teacher_name,
  t.last_name AS teacher_last_name,
  t.photo AS teacher_photo,
  (
    SELECT json_agg(
      json_build_object(
        'id', nap.id,
        'name', nap.name
      )
    )
    FROM napravleniya nap
    JOIN teacher_types tt ON nap.id = tt.napravleniya_id
    WHERE tt.teacher_id = t.id AND tt.is_active = true
  ) AS napravleniya
FROM posts p
JOIN teachers t ON p.id_teacher = t.id
WHERE p.video IS NOT NULL;

    `);

    const data = result.rows.map(row => ({
      ...row,
      video: `/videos/${path.basename(row.video)}`,
      teacher_photo: row.teacher_photo ? `/photoes/${path.basename(row.teacher_photo)}` : null,
      napravleniya: row.napravleniya || [],
      tag: typeof row.tag === 'string' ? row.tag.split(',').map(t => t.trim()) : []
    }));

    res.json(data);
  } catch (err) {
    console.error('Ошибка на сервере:', err);
    res.status(500).send('Ошибка на сервере');
  }
});

const storage_5 = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'videos'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload_5 = multer({ 
  storage: storage_5,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
  fileFilter: (req, file, cb) => {
    const filetypes = /mp4|webm|ogg/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Разрешены только видеофайлы (mp4, webm, ogg)'));
  }
});

app.post('/api/posts', upload_5.single('video'), async (req, res) => {
  try {
    const { description, teacher_id, tags } = req.body;
    const videoPath = req.file ? `/videos/${req.file.filename}` : null;

    
    const result = await pool.query(
      `INSERT INTO posts (description, video, id_teacher)
   VALUES ($1, $2, $3)
   RETURNING *`,
  [description, videoPath, teacher_id]
    );
    const teacherResult = await pool.query(
      'SELECT name, last_name, photo FROM teachers WHERE id = $1',
      [teacher_id]
    );

    const responseData = {
      ...result.rows[0],
      teacher_name: teacherResult.rows[0]?.name,
      teacher_last_name: teacherResult.rows[0]?.last_name,
      teacher_photo: teacherResult.rows[0]?.photo ? `/photoes/${path.basename(teacherResult.rows[0].photo)}` : null
    };

    res.status(201).json(responseData);
  } catch (err) {
    console.error('Ошибка при сохранении видео:', err);
    res.status(500).json({ error: 'Ошибка при сохранении видео' });
  }
});


app.put('/api/posts/:id', upload_5.single('video'), async (req, res) => {
  const postId = req.params.id;
  const { description } = req.body;
  const videoFile = req.file;

  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const postRes = await client.query('SELECT * FROM posts WHERE id = $1', [postId]);
    if (postRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Пост не найден' });
    }

    let videoPath = postRes.rows[0].video;

    if (videoFile) {
      const oldVideoPath = path.join(__dirname, '..', 'public', videoPath);
      if (fs.existsSync(oldVideoPath)) {
        fs.unlinkSync(oldVideoPath);
      }

      videoPath = `/uploads/videos/${videoFile.filename}`;
    }
    const updateRes = await client.query(
      'UPDATE posts SET description = $1, video = $2 WHERE id = $3 RETURNING *',
      [description, videoPath, postId]
    );

    await client.query('COMMIT');

    res.json(updateRes.rows[0]);

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Ошибка при обновлении поста:', err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  } finally {
    client.release();
  }
});


app.get('/api/user-tickets', async (req, res) => {
  const { userId } = req.query;
  try {
      const result = await pool.query(
          'SELECT * FROM student_ticket WHERE id_student = $1',
          [userId]
      );
      res.json(result.rows);
  } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
  }
});
app.get('/api/available-spots', async (req, res) => {
  const { teacherId, date, typeId } = req.query;
  const maxSpots = 15; 
  
  try {
      const result = await pool.query(
          `SELECT COUNT(*) FROM reservations WHERE id_teacher = $1 AND date = $2 AND id_type = $3 AND status != 'cancelled'
`,
          [teacherId, date, typeId]
      );
      
      const bookedSpots = parseInt(result.rows[0].count, 10);
      const availableSpots = maxSpots - bookedSpots;
      
      res.json({ availableSpots });
  } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/user-reservations', async (req, res) => {
  const { userId, date } = req.query;
  
  try {
      const result = await pool.query(
          `SELECT * FROM reservations WHERE id_student = $1 AND date = $2 AND status != 'cancelled'`,
          [userId, date]
      );
      
      res.json(result.rows);
  } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
  }
});


app.get('/api/users/:userId/lessons-need-survey', async (req, res) => {
  const userId = parseInt(req.params.userId, 10);

  if (isNaN(userId)) {
    return res.status(400).json({ error: 'Invalid user ID' }); // Ошибка при неверном ID
  }

  try {
    const result = await pool.query(
      `SELECT r.id AS reserv_id, s.id AS survey_id
FROM reservations r
JOIN surveys s ON s.reserv_id = r.id
WHERE r.id_student = $1
  AND NOT EXISTS (
    SELECT 1
    FROM user_surveys sa
    WHERE sa.survey_id = s.id
      AND sa.user_id = r.id_student
  );
`, 
      [userId] // Параметр userId передается как числовое значение
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Ошибка при выполнении запроса:', err);
    res.status(500).json({ error: 'Database error' });
  }
});


app.delete('/api/teachers_days_off/:id', async (req, res) => {
  const { id } = req.params;

  try {
      await pool.query('BEGIN');

      await pool.query(
          'DELETE FROM teachers_days_off_reservations WHERE teachers_day_off_id = $1',
          [id]
      );

      await pool.query(
          'DELETE FROM teachers_days_off WHERE id = $1',
          [id]
      );
      await pool.query('COMMIT');
      
      res.status(200).send('Заявка успешно отклонена и удалена');
  } catch (err) {
      await pool.query('ROLLBACK');
      console.error('Ошибка при отклонении заявки:', err);
      res.status(500).json({ 
          error: 'Не удалось отклонить заявку',
          details: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
  }
});

app.get('/api/teachers_days_off/pending', async (req, res) => {
  try {
    const query = `
      SELECT tdo.*, t.name, t.last_name
      FROM teachers_days_off tdo
      JOIN teachers t ON tdo.id_teacher = t.id
      WHERE tdo.confirm IS NULL AND tdo.status = 'pending'
      ORDER BY tdo.date ASC
    `;
    
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});
app.put('/api/teachers_days_off/:id', async (req, res) => {
  const { id } = req.params;
  const { confirm } = req.body;

  try {
      await pool.query(
          'UPDATE teachers_days_off SET confirm = $1 WHERE id = $2',
          [confirm, id]
      );
      res.status(200).send('Status updated');
  } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
  }
});
app.post('/api/cancel_reservations', async (req, res) => {
  const { day_off_id } = req.body;

  try {
      const dayOff = await pool.query(
          'SELECT id_teacher, date FROM teachers_days_off WHERE id = $1',
          [day_off_id]
      );

      if (dayOff.rows.length === 0) {
          return res.status(404).json({ error: 'Day off not found' });
      }

      const { id_teacher, date } = dayOff.rows[0];
      const reservations = await pool.query(
          'SELECT id FROM reservations WHERE id_teacher = $1 AND date = $2',
          [id_teacher, date]
      );
      for (const reservation of reservations.rows) {
          await pool.query(
              'INSERT INTO teachers_days_off_reservations (teachers_day_off_id, reservation_id) VALUES ($1, $2)',
              [day_off_id, reservation.id]
          );
      }
      await pool.query(
        'UPDATE reservations SET status = $1 WHERE id_teacher = $2 AND date = $3',
        ['cancelled', id_teacher, date]
    );
    
      res.status(200).send('Reservations cancelled');
  } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/teachers_days_off/:id/approve', async (req, res) => {
  const id = parseInt(req.params.id, 10);

  try {
 
    await pool.query(
      'UPDATE teachers_days_off SET status = $1 WHERE id = $2',
      ['approved', id]
    );

    const { rows: requests } = await pool.query(
      'SELECT id_teacher, date, reason FROM teachers_days_off WHERE id = $1',
      [id]
    );

    if (requests.length === 0) {
      return res.status(404).json({ error: 'Заявка не найдена' });
    }

    const { id_teacher, date, reason } = requests[0];

    const { rows: teacherRows } = await pool.query(
      'SELECT name, last_name FROM teachers WHERE id = $1',
      [id_teacher]
    );

    if (teacherRows.length === 0) {
      return res.status(404).json({ error: 'Преподаватель не найден' });
    }

    const teacherName = `${teacherRows[0].name} ${teacherRows[0].last_name}`;

    await pool.query(
      'UPDATE reservations SET status = $1 WHERE id_teacher = $2 AND date = $3 AND status != $4',
      ['cancelled', id_teacher, date, 'cancelled']
    );

    const { rows: students } = await pool.query(
      `SELECT s.name AS student_name, s.email FROM users s
       JOIN reservations r ON s.id = r.id_student
       WHERE r.id_teacher = $1 AND r.date = $2 AND r.status = $3`,
      [id_teacher, date, 'cancelled']
    );

    
    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: 'eurodanceminsk@gmail.com',
        pass: 'swgp jqwo cdkm nscm', 
      },
    });

    
for (const student of students) {
  const html = emailTemplate
  .replace('{{username}}', student.student_name || 'ученик')
  .replace('{{message}}', `Ваше занятие с преподавателем <strong>${teacherName}</strong> на <strong>${new Date(date).toLocaleDateString()}</strong> отменено.<br>Причина: "${reason}".`)


  await transporter.sendMail({
    from: 'eurodanceminsk@gmail.com',
    to: student.email,
    subject: 'Отмена занятия',
    html,
  });
}


    res.status(200).json({ message: 'Заявка подтверждена, брони отменены, письма отправлены' });

  } catch (error) {
    console.error('Ошибка подтверждения заявки:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});
app.delete('/api/teachers_days_off/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);

  try {
    await pool.query(
      'UPDATE teachers_days_off SET status = $1 WHERE id = $2',
      ['rejected', id]
    );
    res.status(200).json({ message: 'Заявка отклонена' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});


// app.put('/api/teachers_days_off/:id/approve', async (req, res) => {
//   const { id } = req.params;

//   try {
//       await pool.query('BEGIN');

//       // 1. Помечаем заявку как подтвержденную
//       await pool.query(
//           'UPDATE teachers_days_off SET confirm = true WHERE id = $1',
//           [id]
//       );

//       // 2. Получаем информацию о заявке
//       const dayOff = await pool.query(
//           'SELECT id_teacher, date FROM teachers_days_off WHERE id = $1',
//           [id]
//       );

//       if (dayOff.rows.length === 0) {
//           throw new Error('Заявка не найдена');
//       }

//       const { id_teacher, date } = dayOff.rows[0];

//       // 3. Находим все записи на эту дату
//       const reservations = await pool.query(
//           'SELECT id FROM reservations WHERE id_teacher = $1 AND date = $2',
//           [id_teacher, date]
//       );

//       // 4. Создаем записи об отмене
//       for (const reservation of reservations.rows) {
//           await pool.query(
//               'INSERT INTO teachers_days_off_reservations (teachers_day_off_id, reservation_id) VALUES ($1, $2)',
//               [id, reservation.id]
//           );
//       }

//       // 5. Обновляем статус записей
//       await pool.query(
//           'UPDATE reservations SET status = $1 WHERE id_teacher = $2 AND date = $3',
//           ['cancelled', id_teacher, date]
//       );

//       await pool.query('COMMIT');
//       res.status(200).send('Заявка подтверждена и записи отменены');
//   } catch (err) {
//       await pool.query('ROLLBACK');
//       console.error('Ошибка при подтверждении заявки:', err);
//       res.status(500).json({ 
//           error: 'Не удалось подтвердить заявку',
//           details: process.env.NODE_ENV === 'development' ? err.message : undefined
//       });
//   }
// });
app.get('/api/cancelled_lessons', async (req, res) => {
  const { teacher_id } = req.query;
  
  try {
      const result = await pool.query(`
          SELECT 
              r.date, 
              n.name as subject_name,
              tdo.reason
          FROM reservations r
          JOIN teachers_days_off tdo ON r.date = tdo.date AND r.id_teacher = tdo.id_teacher
          JOIN napravleniya n ON r.id_type = n.id
          WHERE r.id_teacher = $1 AND r.status = 'cancelled'
          ORDER BY r.date DESC
      `, [teacher_id]);
      
      res.json(result.rows);
  } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
  }
});

app.use('/teachers', express.static(path.join(__dirname, 'teachers')));

app.get('/api/advices', async (req, res) => {
  try {
    const result = await pool.query(`
     SELECT
  a.id AS advice_id,
  a.text AS advice_text,
  a.title as advice_title,
  t.id AS teacher_id,
  t.name AS teacher_name,
  t.last_name AS teacher_last_name,
  t.father_name AS teacher_father_name,
  t.photo AS teacher_photo,
  t.info AS teacher_info,
  t.experience AS teacher_experience,
  json_agg(
    json_build_object(
      'id', nap.id,
      'name', nap.name,
      'description', nap.destriction
    )
  ) FILTER (WHERE nap.id IS NOT NULL) AS napravleniya
FROM advices a
JOIN teachers t ON a.id_teacher = t.id
LEFT JOIN teacher_types tt ON t.id = tt.teacher_id AND tt.is_active = true
LEFT JOIN napravleniya nap ON tt.napravleniya_id = nap.id
GROUP BY a.id, t.id;

    `);
    
    const data = result.rows.map(row => ({
      id: row.advice_id,
      text: row.advice_text,
      title: row.advice_title,
      teacher: {
        id: row.teacher_id,
        name: row.teacher_name,
        last_name: row.teacher_last_name,
        father_name: row.teacher_father_name,
        photo: row.teacher_photo ? `/photoes/${path.basename(row.teacher_photo)}` : null,
        info: row.teacher_info,
        experience: row.teacher_experience
      },
      napravleniya: row.napravleniya || []
    }));
    
    res.json(data); // Важно: отправляем данные клиенту
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
 const sanitizeHtml = require('sanitize-html');
app.post('/api/advices', async (req, res) => {
  try {
     const { title, text, teacher_id } = req.body;
     if (!title || !text || !teacher_id) {
      return res.status(400).json({ error: 'Все поля обязательны' });
    }
     const cleanHtml = sanitizeHtml(text, {
      allowedTags: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'ul', 'ol', 'li', 
                  'strong', 'em', 'u', 'div', 'span', 'br', 'hr', 'img'],
      allowedAttributes: {
        '*': ['class', 'style'],
        'img': ['src', 'alt', 'width', 'height']
      }
    });
     const result = await pool.query(
      'INSERT INTO advices (id_teacher, title, text) VALUES ($1, $2, $3) RETURNING *',
      [teacher_id, title, cleanHtml]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});


app.use('/images', express.static(path.join(__dirname, 'scores')));
//получение вещей за баллы
app.get('/api/things', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM things');
        const data = result.rows.map(row => ({
            ...row,
            photo: `/images/${path.basename(row.photo)}`
        }));
        res.json(data);  // Отправляем данные в формате JSON
    } catch (err) {
        console.error('Ошибка на сервере:', err);
        res.status(500).send('Ошибка на сервере');
    }
});


//покупка
app.post('/api/buy', async (req, res) => {
  const { userId, itemId, price } = req.body;

  try {
    // Проверка, хватает ли баллов
    const userQuery = await pool.query('SELECT score FROM users WHERE id = $1', [userId]);
    const user = userQuery.rows[0];

    if (!user || user.score < price) {
      return res.status(400).json({ error: 'Недостаточно баллов' });
    }
    await pool.query('UPDATE users SET score = score - $1 WHERE id = $2', [price, userId]);
    await pool.query(
      'INSERT INTO user_things (id_user, id_thing, status) VALUES ($1, $2, $3)',
      [userId, itemId, 'Доставляется']
    );

    res.status(200).json({ message: 'Покупка успешно завершена' });
  } catch (error) {
    console.error('Ошибка при покупке вещи:', error);
    res.status(500).json({ error: 'Ошибка при покупке' });
  }
});


app.use('/images', express.static(path.join(__dirname, 'scores')));
app.get('/api/user/:userId/things', async (req, res) => {
  const userId = req.params.userId;

  try {
    const userExists = await pool.query(
      'SELECT id FROM users WHERE id = $1', 
      [userId]
    );

    if (userExists.rows.length === 0) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    const userThings = await pool.query(`
      SELECT
  ut.id,
  t.name,
  t.photo,
  t.descr,
  t.price,
  ut.status
FROM user_things ut
JOIN things t ON t.id = ut.id_thing
WHERE ut.id_user = $1

    `, [userId]);
 const data = userThings.rows.map(row => ({
            ...row,
            photo: `/images/${path.basename(row.photo)}`
        }));
    res.json(data);
  } catch (err) {
    console.error('Ошибка при получении покупок:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});
app.patch('/api/update-thing-status', async (req, res) => {
  const { userThingId, newStatus } = req.body;

  try {
    await pool.query(
      `UPDATE user_things SET status = $1 WHERE id = $2`,
      [newStatus, userThingId]
    );
    res.json({ message: 'Статус обновлён' });
  } catch (error) {
    console.error('Ошибка при обновлении статуса:', error);
    res.status(500).json({ error: 'Ошибка при обновлении статуса' });
  }
});


app.get('/api/admin/orders', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        ut.id AS user_thing_id,
        ut.status,
        u.name AS user_name,
        U.surname AS user_surname,
        u.id AS user_id,
        t.name AS thing_name,
        t.photo
      FROM user_things ut
      JOIN users u ON ut.id_user = u.id
      JOIN things t ON ut.id_thing = t.id
      ORDER BY ut.id DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка при получении заказов:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});


app.patch('/api/admin/order-status', async (req, res) => {
  const { userThingId, newStatus } = req.body;

  try {
    await pool.query(
      `UPDATE user_things SET status = $1 WHERE id = $2`,
      [newStatus, userThingId]
    );
    res.json({ message: 'Статус обновлён' });
  } catch (error) {
    console.error('Ошибка при обновлении статуса:', error);
    res.status(500).json({ error: 'Ошибка при обновлении' });
  }
});

app.use('/image', express.static(path.join(__dirname, 'scores')));

//ДОБАВЛЕНИЕ НОВОСТЕЙ

const storage_6 = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'scores/'); // Папка для сохранения изображений
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname); // Сохранить с оригинальным именем файла
  }
});

const upload_6 = multer({ storage: storage_6 });
app.post('/api/things', upload_6.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).send('Файл не был загружен');
  }

  const imagePath = `/scores/${req.file.filename}`;
  const { name, descr, price } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO things (name, descr, photo, price) VALUES ($1, $2, $3, $4) RETURNING *`,
      [name, descr, imagePath, price]
    );

    res.status(201).json(result.rows[0]);

    const studentsResult = await pool.query(`SELECT name, email FROM users WHERE email IS NOT NULL`);
    const students = studentsResult.rows;

    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: 'eurodanceminsk@gmail.com',
        pass: 'swgp jqwo cdkm nscm',
      },
    });
    const emailTemplate = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0;">
        <h2 style="color: #2c3e50;">Здравствуйте, {{username}}!</h2>
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
          {{message}}
        </div>
        <p style="margin-top: 20px; font-size: 12px; color: #7f8c8d;">
          Это письмо отправлено автоматически, пожалуйста, не отвечайте на него.
        </p>
      </div>
    `;

    const message = `
      В нашем магазине за баллы появилось новое предложение: <strong>${name}</strong>!<br><br>
      ${descr}<br><br>
      Цена: <strong>${price} BYN</strong>.
    `;

    for (const student of students) {
      const html = emailTemplate
        .replace('{{username}}', student.name || 'ученик')
        .replace('{{message}}', message)

      try {
        await transporter.sendMail({
          from: 'eurodanceminsk@gmail.com',
          to: student.email,
          subject: `Новинка в магазине за баллы: ${name}`,
          html,
        });
        console.log(`Письмо отправлено на ${student.email}`);
      } catch (mailError) {
        console.error(`Ошибка отправки на ${student.email}:`, mailError);
      }
    }

  } catch (error) {
    console.error('Ошибка при записи в БД:', error);
    if (!res.headersSent) {
      res.status(500).send('Ошибка при записи в БД');
    }
  }
});


app.delete('/api/things/:id', async(req, res) =>{
  const {id} = req.params;
  try{
    const result = await pool.query('DELETE FROM things WHERE id = $1 RETURNING *', [id]);
    if (result.rowCount === 0) {
      return res.status(404).send('Запись не найдена');
    }
  
    res.status(200).json({ message: 'Запись успешно удалена', deleted: result.rows[0] });
  } catch (error) {
    console.error('Ошибка при удалении записи:', error);
    res.status(500).send('Ошибка при удалении записи');
  }
  })

  app.delete('/api/news/:id', async(req, res) =>{
  const {id} = req.params;
  try{
    const result = await pool.query('DELETE FROM news WHERE id = $1 RETURNING *', [id]);
    if (result.rowCount === 0) {
      return res.status(404).send('Запись не найдена');
    }
  
    res.status(200).json({ message: 'Запись успешно удалена', deleted: result.rows[0] });
  } catch (error) {
    console.error('Ошибка при удалении записи:', error);
    res.status(500).send('Ошибка при удалении записи');
  }
  })
app.get('/api/ratings', async (req, res) => {
    try {
        const { studentId } = req.query;
        const ratings = await pool.query(
            'SELECT * FROM ratings WHERE student_id = $1',
            [studentId]
        );
        res.json(ratings.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});
app.post('/api/ratings', async (req, res) => {
    try {
        const { reservation_id, student_id, teacher_id, direction_id, rating } = req.body;
        const existingRating = await pool.query(
            'SELECT * FROM ratings WHERE reservation_id = $1 AND student_id = $2',
            [reservation_id, student_id]
        );
        
        if (existingRating.rows.length > 0) {
            return res.status(400).json({ error: 'Вы уже оценили это занятие' });
        }
        
        const newRating = await pool.query(
            'INSERT INTO ratings (reservation_id, student_id, teacher_id, direction_id, rating) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [reservation_id, student_id, teacher_id, direction_id, rating]
        );
        
        res.json(newRating.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.use('/images', express.static(path.join(__dirname, 'teachers')));

app.get('/api/teachers/top-rated', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const minRatings = parseInt(req.query.min_ratings) || 3;
    
    const query = `
      WITH teacher_stats AS (
        SELECT 
          t.id,
          t.name,
          t.last_name,
          t.photo,
          AVG(r.rating) AS avg_rating,
          COUNT(r.id) AS rating_count,
          ARRAY_AGG(DISTINCT n.name) AS directions_array
        FROM teachers t
        JOIN ratings r ON t.id = r.teacher_id
        JOIN napravleniya n ON r.direction_id = n.id
        GROUP BY t.id
        HAVING COUNT(r.id) >= $2
      )
      SELECT 
        id,
        CONCAT(name, ' ', last_name) AS full_name,
        photo,
        avg_rating AS average_rating,
        rating_count AS total_ratings,
        array_to_string(directions_array, ', ') AS directions
      FROM teacher_stats
      ORDER BY avg_rating DESC, rating_count DESC
      LIMIT $1`;
    
    const { rows } = await pool.query(query, [limit, minRatings]);
    
    const formattedTeachers = rows.map(teacher => {
      let photoUrl = teacher.photo 
        ? `/images/${path.basename(teacher.photo)}`
        : '/images/default-teacher.jpg';
      
      return {
        id: teacher.id,
        name: teacher.full_name,
        photo: photoUrl,
        rating: Number(teacher.average_rating).toFixed(1),
        totalRatings: teacher.total_ratings,
        directions: teacher.directions ? teacher.directions.split(', ') : []
      };
    });
    res.json({
      success: true,
      data: formattedTeachers, // Это должен быть массив
      meta: {
        count: formattedTeachers.length,
        min_ratings: minRatings
      }
    });
    
  } catch (err) {
    console.error('Error fetching top teachers:', err);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch top rated teachers',
      data: [], // Всегда возвращаем массив в data
      ...(process.env.NODE_ENV === 'development' && { details: err.message })
    });
  }
});
app.delete('/api/reservations/:id', async (req, res) => {
  const reservationId = parseInt(req.params.id, 10);
  const studentId = req.body.studentId; // передаём studentId из тела запроса или, например, из токена аутентификации

  if (!studentId) {
    return res.status(400).json({ error: 'studentId обязателен' });
  }

  try {
    const reservation = await pool.query(
      'SELECT * FROM reservations WHERE id = $1 AND id_student = $2',
      [reservationId, studentId]
    );

    if (reservation.rowCount === 0) {
      return res.status(404).json({ error: 'Резервация не найдена или не принадлежит студенту' });
    }
    await pool.query('DELETE FROM reservations WHERE id = $1', [reservationId]);

    res.status(200).json({ message: 'Резервация успешно удалена' });
  } catch (error) {
    console.error('Ошибка при удалении резервации:', error);
    res.status(500).json({ error: 'Ошибка сервера при удалении резервации' });
  }
});
app.use('/achievements', express.static(path.join(__dirname, 'achievements')));
app.get('/api/achievements', async (req, res) => {
    try {
        const result = await pool.query(`SELECT * from achievements`);
        const data = result.rows.map(row => ({
            ...row,
            photo: `/achievements/${path.basename(row.photo)}`
        }));
        res.json(data);  // Отправляем данные в формате JSON
    } catch (err) {
        console.error('Ошибка на сервере:', err);
        res.status(500).send('Ошибка на сервере');
    }
});

app.get("/api/user-stats/:id", async (req, res) => {
  const userId = req.params.id;

  try {
    const visitsRes = await pool.query(`
      SELECT COUNT(*) AS total_visits
      FROM reservations
      WHERE id_student = $1 AND status = 'booked' AND date < NOW()
    `, [userId]);

    const subsRes = await pool.query(`
      SELECT COUNT(*) AS total_subs
      FROM student_ticket
      WHERE id_student = $1
    `, [userId]);

    const directionsRes = await pool.query(`
      SELECT COUNT(DISTINCT id_type) AS unique_directions
      FROM reservations
      WHERE id_student = $1 AND status = 'booked' AND date < NOW()
    `, [userId]);

    res.json({
      totalVisits: parseInt(visitsRes.rows[0].total_visits),
      totalSubscriptions: parseInt(subsRes.rows[0].total_subs),
      uniqueDirections: parseInt(directionsRes.rows[0].unique_directions),
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка при получении статистики пользователя' });
  }
});

app.post('/api/achievements/unlock', async (req, res) => {
  const { userId, achievementId } = req.body;

  try {
    const checkAlready = await pool.query(
      `SELECT 1 FROM user_achievements WHERE user_id = $1 AND achievement_id = $2`,
      [userId, achievementId]
    );
    if (checkAlready.rowCount > 0) {
      return res.status(400).json({ message: 'Достижение уже получено' });
    }

    const achievementRes = await pool.query(
      `SELECT * FROM achievements WHERE id = $1`,
      [achievementId]
    );
    if (achievementRes.rowCount === 0) {
      return res.status(404).json({ message: 'Достижение не найдено' });
    }

    const achievement = achievementRes.rows[0];
    const condition = typeof achievement.condition_json === 'string'
      ? JSON.parse(achievement.condition_json)
      : achievement.condition_json;

    let meetsCondition = false;

    if (condition.type === 'visit_count') {
      const statsRes = await pool.query(`
        SELECT COUNT(*) AS total_visits
        FROM reservations
        WHERE id_student = $1 AND status = 'booked' AND date < NOW()
      `, [userId]);
      const totalVisits = parseInt(statsRes.rows[0].total_visits);
      meetsCondition = totalVisits >= condition.count;

    } else if (condition.type === 'subscription_purchase') {
      const subRes = await pool.query(`
        SELECT COUNT(*) AS total_subs
        FROM student_ticket
        WHERE id_student = $1
      `, [userId]);
      const totalSubs = parseInt(subRes.rows[0].total_subs);
      meetsCondition = totalSubs >= condition.count;

    } else if (condition.type === 'direction_visited') {
      const dirRes = await pool.query(`
        SELECT COUNT(DISTINCT id_type) AS unique_directions
        FROM reservations
        WHERE id_student = $1 AND status = 'booked' AND date < NOW()
      `, [userId]);
      const totalDirections = parseInt(dirRes.rows[0].unique_directions);
      meetsCondition = totalDirections >= condition.count;
    }

    if (!meetsCondition) {
      return res.status(400).json({ message: 'Условие достижения не выполнено' });
    }

    await pool.query(`
      UPDATE users SET score = score + $1 WHERE id = $2
    `, [achievement.scores, userId]);

    await pool.query(`
      INSERT INTO user_achievements(user_id, achievement_id)
      VALUES ($1, $2)
    `, [userId, achievementId]);

    res.json({ message: 'Баллы обновлены и достижение записано' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

app.get('/api/questions', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
  q.id, 
  q.question, 
  q.is_anonym,
  q.created_at, 
  u.name AS user_name,
  a.answer,
  a.created_at AS answer_date,
  t.name AS teacher_name,
  t.last_name AS teacher_last_name,
  t.photo AS teacher_photo,
  t.id AS teacher_id,
  json_agg(DISTINCT jsonb_build_object('id', n.id, 'name', n.name)) FILTER (WHERE n.id IS NOT NULL) AS napravleniya
FROM questions q
JOIN users u ON q.user_id = u.id
LEFT JOIN answers a ON a.id_quest = q.id
LEFT JOIN teachers t ON a.id_teacher = t.id
LEFT JOIN napravleniya n ON q.type_id = n.id
WHERE q.is_deleted = false
GROUP BY q.id, u.name, a.answer, a.created_at, t.name, t.last_name, t.photo, t.id
ORDER BY q.created_at DESC;

    `);
const data = result.rows.map(row => ({
  ...row,
  created_at: row.created_at.toISOString().split('T')[0], // Тоже самое, но может быть сдвиг
  created_at: row.created_at.toLocaleDateString('sv-SE'),
  answer_date: row.answer_date ? row.answer_date.toLocaleDateString('sv-SE') : null,
}));

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});



app.post('/api/questions', async (req, res) => {
    const {
        type_id = null,
        user_id,
        question,
        is_anonym = false,
        is_read_by_teacher = false,
        is_deleted = false,
       
    } = req.body;

    if (!user_id || !question) {
        return res.status(400).json({ error: 'Необходимо указать user_id и вопрос' });
    }

    try {
        const result = await pool.query(
            `INSERT INTO questions (
                type_id, user_id, question, is_anonym, is_read_by_teacher, is_deleted, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_DATE) RETURNING *`,
            [type_id, user_id, question, is_anonym, is_read_by_teacher, is_deleted]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Ошибка при создании questions:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

//ответы на вопросы??

app.get('/api/teacher/questions/:teacherId', async (req, res) => {
  const { teacherId } = req.params;

  try {
    const result = await pool.query(`
      SELECT 
  q.*, 
  u.name AS user_name,
  u.surname AS user_last_name,
  a.answer,
  a.created_at AS answer_date,
  t.name AS teacher_name,
  t.last_name AS teacher_last_name,
  t.photo AS teacher_photo,
  jsonb_build_object('id', n.id, 'name', n.name) AS napravleniya
FROM questions q
LEFT JOIN users u ON q.user_id = u.id
LEFT JOIN answers a ON a.id_quest = q.id AND a.id_teacher = $1
LEFT JOIN teachers t ON a.id_teacher = t.id
LEFT JOIN napravleniya n ON q.type_id = n.id
WHERE (
  q.type_id IN (
    SELECT napravleniya_id FROM teacher_types 
    WHERE teacher_id = $1 AND is_active = true
  )
  OR q.type_id IS NULL
)
AND q.is_deleted = false
AND NOT EXISTS (
  SELECT 1 FROM answers 
  WHERE answers.id_quest = q.id 
    AND answers.id_teacher = $1
)
ORDER BY q.created_at DESC;

      
    `, [teacherId]);

    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка при получении вопросов для учителя:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});


app.post('/api/answers', async (req, res) => {
  const { id_quest, id_teacher, answer } = req.body;

  if (!id_quest || !id_teacher || !answer) {
    return res.status(400).json({ error: 'Заполните все поля' });
  }

  try {
    const result = await pool.query(`
      INSERT INTO answers (id_quest, id_teacher, answer, is_read_by_student, created_at)
      VALUES ($1, $2, $3, false, CURRENT_DATE)
      RETURNING *
    `, [id_quest, id_teacher, answer]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка при добавлении ответа:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});
app.get('/api/users/:id/questions/unread-answers', async (req, res) => {
  const studentId = req.params.id;

  try {
    const result = await pool.query(`
      SELECT COUNT(*) AS unread_count
      FROM answers a
      JOIN questions q ON a.id_quest = q.id
      WHERE q.user_id = $1
        AND a.is_read_by_student = false
    `, [studentId]);

    const unreadCount = parseInt(result.rows[0].unread_count, 10) || 0;

    res.json({ unreadCount });
  } catch (error) {
    console.error('Ошибка при получении непрочитанных ответов:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.get('/api/users/:id/questions/unread-answers/list', async (req, res) => {
  const studentId = req.params.id;

  try {
    const result = await pool.query(`
      SELECT a.id, a.answer, a.created_at, q.question
      FROM answers a
      JOIN questions q ON a.id_quest = q.id
      WHERE q.user_id = $1
        AND a.is_read_by_student = false
      ORDER BY a.created_at DESC
    `, [studentId]);

    res.json({ unreadAnswers: result.rows });
  } catch (error) {
    console.error('Ошибка при получении списка непрочитанных ответов:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});


app.patch('/api/answers/:id/mark-read', async (req, res) => {
  const answerId = req.params.id;

  try {
    await pool.query(`
      UPDATE answers SET is_read_by_student = true WHERE id = $1
    `, [answerId]);

    res.json({ success: true });
  } catch (error) {
    console.error('Ошибка при отметке ответа как прочитанного:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});
app.get('/api/questions/all', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT 
        q.*, 
        COUNT(a.id) AS answers_count,
        MAX(a.created_at) AS last_answer_date
      FROM questions q
      LEFT JOIN answers a ON q.id = a.id_quest
      WHERE q.is_deleted = false
      GROUP BY q.id
      ORDER BY q.created_at DESC
    `);
    const result = rows.map(row => ({
      ...row,
      answers_count: Number(row.answers_count),
      last_answer_date: row.last_answer_date ? new Date(row.last_answer_date).toISOString() : null,
    }));

    res.json(result);
  } catch (error) {
    console.error('Ошибка при загрузке всех вопросов:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});


app.get('/api/questions/:answerId', async (req, res) => {
  const answerId = req.params.answerId;

  try {
    const answerRes = await pool.query(
      'SELECT id_quest FROM answers WHERE id = $1',
      [answerId]
    );
    if (answerRes.rows.length === 0) {
      return res.status(404).json({ error: 'Ответ не найден' });
    }
    const questionId = answerRes.rows[0].id_quest;
    const questionRes = await pool.query(
      'SELECT * FROM questions WHERE id = $1',
      [questionId]
    );
    if (questionRes.rows.length === 0) {
      return res.status(404).json({ error: 'Вопрос не найден' });
    }
    const question = questionRes.rows[0];
    const answersRes = await pool.query(
      `SELECT a.*, t.name AS teacher_name, t.last_name AS teacher_surname
       FROM answers a
       JOIN teachers t ON a.id_teacher = t.id
       WHERE a.id_quest = $1`,
      [questionId]
    );

    res.json({ question, answers: answersRes.rows });
  } catch (error) {
    console.error('Ошибка при загрузке вопроса:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});
app.get('/api/question-with-answers/:questionId', async (req, res) => {
  const questionId = req.params.questionId;
  if (!questionId || isNaN(questionId)) {
    return res.status(400).json({ error: 'Неверный ID вопроса' });
  }

  try {
    const questionRes = await pool.query(
      'SELECT * FROM questions WHERE id = $1',
      [questionId]
    );
    
    if (questionRes.rows.length === 0) {
      return res.status(404).json({ error: 'Вопрос не найден' });
    }
    
    const question = questionRes.rows[0];
    const answersRes = await pool.query(
      `SELECT a.*, t.name AS teacher_name, t.last_name AS teacher_surname
       FROM answers a
       JOIN teachers t ON a.id_teacher = t.id
       WHERE a.id_quest = $1`,
      [questionId]
    );

    res.json({ 
      ...question, 
      answers: answersRes.rows,
      napravleniya: question.type_id ? [{ id: question.type_id }] : [] 
    });
  } catch (error) {
    console.error('Ошибка при загрузке вопроса:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.patch('/api/users/:id/questions/mark-answers-read', async (req, res) => {
  const studentId = req.params.id;

  try {
    await pool.query(`
      UPDATE answers
      SET is_read_by_student = true
      WHERE id_quest IN (
        SELECT id FROM questions WHERE user_id = $1
      )
    `, [studentId]);

    res.json({ success: true });
  } catch (error) {
    console.error('Ошибка при обновлении статуса:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.get('/api/napravleniya/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ error: 'Неверный параметр id' });
  }

  try {
    const result = await pool.query('SELECT * FROM napravleniya WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Направление не найдено' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка при получении направления:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});
app.get('/teacher_stats', async (req, res) => {
  const { teacher_id } = req.query;
  const result = await pool.query(`
    SELECT 
      TO_CHAR(DATE_TRUNC('month', date), 'YYYY-MM') as month,
      COUNT(*) AS total_reservations
    FROM reservations
    WHERE id_teacher = $1
    GROUP BY month
    ORDER BY month
  `, [teacher_id]);

  res.json(result.rows);
});
app.get('/teacher_cancel_stats', async (req, res) => {
  const { teacher_id } = req.query;
  const result = await pool.query(`
    SELECT 
      TO_CHAR(DATE_TRUNC('month', date), 'YYYY-MM') as month,
      COUNT(*) AS cancelled_days
    FROM teachers_days_off
    WHERE id_teacher = $1 AND status = 'approved'
    GROUP BY month
    ORDER BY month
  `, [teacher_id]);

  res.json(result.rows);
});

//скидки?

app.get('/api/active-discounts', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const result = await pool.query(`
      SELECT sa.abonement_id, sa.discount_percent
      FROM stock_abonements sa
      JOIN stocks s ON sa.stock_id = s.id
      WHERE $1 BETWEEN s.date_begin AND COALESCE(s.date_end, '2099-12-31')
    `, [today]);

    res.json(result.rows);
  } catch (err) {
    console.error('Ошибка получения скидок:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});



const storage_1 = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'stocks'); // Папка для сохранения
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload_1 = multer({ storage: storage_1 });
app.post('/api/stocks', upload_1.single('photo'), async (req, res) => {
  const { name, descr, date_begin, date_end } = req.body;
  const photo = req.file ? `/stocks/${req.file.filename}` : null;

  try {
    const result = await pool.query(
      `INSERT INTO stocks (name, descr, date_begin, date_end, photo)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [name, descr, date_begin, date_end || null, photo]
    );

  res.status(201).json(result.rows[0]);

    const studentsResult = await pool.query(`SELECT name, email FROM users WHERE email IS NOT NULL`);
    const students = studentsResult.rows;

    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: 'eurodanceminsk@gmail.com',
        pass: 'swgp jqwo cdkm nscm', 
      },
    });

    const formattedStart = new Date(date_begin).toLocaleDateString();
    const formattedEnd = date_end ? new Date(date_end).toLocaleDateString() : null;

    const message = `
      Мы рады сообщить о новой акции: <strong>${name}</strong>!<br>
      ${descr}<br><br>
      Срок действия: с <strong>${formattedStart}</strong>
      ${formattedEnd ? ` по <strong>${formattedEnd}</strong>` : ''}.
    `;

    for (const student of students) {
      const html = emailTemplate
        .replace('{{username}}', student.name || 'ученик')
        .replace('{{message}}', message)

      try {
        await transporter.sendMail({
          from: 'eurodanceminsk@gmail.com',
          to: student.email,
          subject: 'Новая акция в студии!',
          html,
        });
        console.log(`Письмо отправлено на ${student.email}`);
      } catch (mailError) {
        console.error(`Ошибка отправки на ${student.email}:`, mailError);
      }
    }
  } catch (err) {
    console.error('Ошибка при добавлении акции:', err);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Ошибка сервера при сохранении акции' });
    }
  }
});

app.post('/api/stock-abonements', async (req, res) => {
  const { stock_id, abonement_id, discount_percent } = req.body;

  try {
    await pool.query(
      `INSERT INTO stock_abonements (stock_id, abonement_id, discount_percent)
       VALUES ($1, $2, $3)`,
      [stock_id, abonement_id, discount_percent]
    );

    res.status(201).json({ success: true });
  } catch (error) {
    console.error('Error adding stock-abonement:', error);
    res.status(500).json({ error: 'Failed to add stock-abonement' });
  }
});

app.delete('/api/stocks/:id', async (req, res) => {
  const stockId = req.params.id;

  try {
    await pool.query(
      `DELETE FROM stock_abonements WHERE stock_id = $1`,
      [stockId]
    );
    const result = await pool.query(
      `DELETE FROM stocks WHERE id = $1 RETURNING *`,
      [stockId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Акция не найдена' });
    }

    res.json({ success: true, deleted: result.rows[0] });
  } catch (err) {
    console.error('Ошибка при удалении акции:', err);
    res.status(500).json({ error: 'Ошибка сервера при удалении акции' });
  }
});



const resetCodes = {};
const generateCode = () => Math.floor(100000 + Math.random() * 900000).toString();
app.post('/api/forgot-password', async (req, res) => {
  const { email } = req.body;

  const userRes = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  if (!userRes.rows.length) {
    return res.status(404).json({ message: 'Пользователь не найден' });
  }

  const code = generateCode();
  const expires = Date.now() + 10 * 60 * 1000; // 10 минут

  resetCodes[email] = { code, expires };

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'eurodanceminsk@gmail.com',
      pass: 'swgp jqwo cdkm nscm', 
    },
  });

const html = emailTemplate
  .replace('{{username}}', email)
  .replace('{{message}}', `Ваш код для сброса пароля: <strong>${code}</strong>`)
  .replace('{{cta_link}}', 'https://example.com/student-panel')
  .replace('{{cta_text}}', 'Перейти в личный кабинет');

await transporter.sendMail({
  from: 'eurodanceminsk@gmail.com',
  to: email,
  subject: 'Код сброса пароля',
  html,
});
res.json({ 
  message: 'Код подтверждения отправлен на вашу почту',
  code: code // Для тестирования можно временно возвращать код
});
})
app.post('/api/verify-reset-code', (req, res) => {
  const { email, code } = req.body;
  const entry = resetCodes[email];

  if (!entry || entry.code !== code) {
    return res.status(400).json({ message: 'Неверный код' });
  }

  if (Date.now() > entry.expires) {
    return res.status(400).json({ message: 'Код истёк' });
  }

  res.json({ message: 'Код подтверждён' });
});
app.post('/api/reset-password', async (req, res) => {
  const { email, code, newPassword } = req.body;
  const entry = resetCodes[email];
if (!newPassword || newPassword.length < 8) {
    return res.status(400).json({ message: 'Пароль должен быть не менее 8 символов' });
  }
  if (!entry || entry.code !== code || Date.now() > entry.expires) {
    return res.status(400).json({ message: 'Недействительный или просроченный код' });
  }

  const hashedPassword = bcrypt.hashSync(newPassword, 10);
  await pool.query('UPDATE users SET password = $1 WHERE email = $2', [hashedPassword, email]);

  delete resetCodes[email];

  res.json({ message: 'Пароль обновлён' });
});

// app.delete('/api/admin/questions/:questionId', async (req, res) => {
//   const { questionId } = req.params;

//   try {
//     // Проверяем, есть ли ответ на этот вопрос
//     const answerCheck = await pool.query(
//       'SELECT 1 FROM answers WHERE id_quest = $1 LIMIT 1',
//       [questionId]
//     );

//     if (answerCheck.rows.length > 0) {
//       return res.status(400).json({ error: 'Нельзя удалить вопрос с ответом' });
//     }

//     // Проверяем, существует ли вопрос
//     const questionResult = await pool.query(
//       'SELECT 1 FROM questions WHERE id = $1 AND is_deleted = false',
//       [questionId]
//     );

//     if (questionResult.rows.length === 0) {
//       return res.status(404).json({ error: 'Вопрос не найден или уже удалён' });
//     }

//     // Удаляем вопрос (soft delete)
//     await pool.query(
//       'UPDATE questions SET is_deleted = true WHERE id = $1',
//       [questionId]
//     );

//     res.json({ message: 'Вопрос успешно удалён' });
//   } catch (error) {
//     console.error('Ошибка при удалении вопроса:', error);
//     res.status(500).json({ error: 'Ошибка сервера' });
//   }
// });



// Получение списка вопросов с пагинацией
app.get('/api/admin/questions', async (req, res) => {
  const { page = 1, pageSize = 10 } = req.query;
  const offset = (page - 1) * pageSize;
  
  try {
    const { rows } = await pool.query(`
      SELECT *, COUNT(*) OVER() as total_count 
      FROM questions 
      WHERE is_deleted = false
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `, [pageSize, offset]);
    
    res.json({
      questions: rows,
      totalCount: rows.length > 0 ? Number(rows[0].total_count) : 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Получение ответов для вопроса
app.get('/api/admin/answers', async (req, res) => {
  const { questionId } = req.query;
  
  try {
    const { rows } = await pool.query(
      'SELECT * FROM answers WHERE id_quest = $1 ORDER BY created_at',
      [questionId]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/admin/answers/:id', async (req, res) => {
  const answerId = Number(req.params.id);

  if (isNaN(answerId)) {
    return res.status(400).json({ error: 'Некорректный ID ответа' });
  }

  try {
    const result = await pool.query(
      'DELETE FROM answers WHERE id = $1',
      [answerId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Ответ не найден' });
    }

    return res.json({ message: 'Ответ успешно удалён' });
  } catch (error) {
    console.error('Ошибка при удалении ответа:', error);
    return res.status(500).json({ error: 'Ошибка при удалении ответа', details: error.message });
  }
});


app.get('/api/questions/all', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT q.*, 
        COUNT(a.id) as answers_count,
        MAX(a.created_at) as last_answer_date
      FROM questions q
      LEFT JOIN answers a ON q.id = a.id_quest
      WHERE q.is_deleted = false
      GROUP BY q.id
      ORDER BY q.created_at DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error('Ошибка при загрузке всех вопросов:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});
app.get('/api/questions/:id/answers', async (req, res) => {
  const questionId = req.params.id;
  try {
    const { rows } = await pool.query(
      `SELECT a.*, t.name as teacher_name, t.surname as teacher_surname
       FROM answers a
       LEFT JOIN teachers t ON a.id_teacher = t.id
       WHERE a.id_quest = $1
       ORDER BY a.created_at DESC`,
      [questionId]
    );

    res.json({ answers: rows });
  } catch (error) {
    console.error('Ошибка при загрузке ответов:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});
app.get('/api/answers/all', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT a.*, t.name as teacher_name, t.last_name as teacher_surname
       FROM answers a
       LEFT JOIN teachers t ON a.id_teacher = t.id
       ORDER BY a.created_at DESC`
    );
    res.json(rows);
  } catch (error) {
    console.error('Ошибка при загрузке всех ответов:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});



// Удаление ответа
// app.delete('/api/admin/answers/:id', async (req, res) => {
//   const answerId = req.params.id;
//   try {
//     const result = await pool.query('DELETE FROM answers WHERE id = $1', [answerId]);
//     if (result.rowCount === 0) {
//       return res.status(404).json({ error: 'Ответ не найден' });
//     }
//     res.json({ message: 'Ответ успешно удалён' });
//   } catch (error) {
//     console.error('Ошибка при удалении ответа:', error);
//     res.status(500).json({ error: 'Ошибка сервера' });
//   }
// });
app.delete('/api/admin/questions/:questionId', async (req, res) => {
  const { questionId } = req.params;

  try {
    console.log('>>> Удаление вопроса с ID:', questionId);

    await pool.query('BEGIN');
    await pool.query('DELETE FROM answers WHERE id_quest = $1', [questionId]);
    console.log('>>> Связанные ответы удалены');
    const { rowCount } = await pool.query(
      'DELETE FROM questions WHERE id = $1',
      [questionId]
    );

    await pool.query('COMMIT');
    console.log('>>> Вопрос удален, завершена транзакция');

    if (rowCount === 0) {
      return res.status(404).json({ error: 'Вопрос не найден' });
    }

    res.json({ message: 'Вопрос и ответы успешно удалены' });
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Ошибка при удалении вопроса:', error.stack || error);
    res.status(500).json({
      error: 'Ошибка при удалении вопроса',
      details: error.message
    });
  }
});
app.delete('/api/answers/by-question/:questionId', async (req, res) => {
  try {
    await pool.query('DELETE FROM answers WHERE id_quest = $1', [req.params.questionId]);
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// app.delete('/api/admin/questions/:questionId', async (req, res) => {
//   const { questionId } = req.params;

//   try {
//     // Начинаем транзакцию
//     await pool.query('BEGIN');

//     // Удаляем все ответы на этот вопрос
//     await pool.query('DELETE FROM answers WHERE id_quest = $1', [questionId]);
    
//     // Удаляем сам вопрос
//     const { rowCount } = await pool.query(
//       'DELETE FROM questions WHERE id = $1',
//       [questionId]
//     );

//     // Завершаем транзакцию
//     await pool.query('COMMIT');

//     if (rowCount === 0) {
//       return res.status(404).json({ error: 'Вопрос не найден' });
//     }

//     res.json({ message: 'Вопрос и связанные ответы успешно удалены' });
//   } catch (error) {
//     // Откатываем транзакцию в случае ошибки
//     await pool.query('ROLLBACK');
//     console.error('Ошибка при удалении вопроса:', error);
//     res.status(500).json({ error: 'Ошибка сервера' });
//   }
// });

app.delete('/api/users/:id', async (req, res) => {
  try {
    const userId = req.params.id;

   await pool.query('BEGIN');

await pool.query('DELETE FROM survey_invitations WHERE user_id = $1', [userId]);
await pool.query('DELETE FROM questions WHERE user_id = $1', [userId]);
await pool.query('DELETE FROM user_achievements WHERE user_id = $1', [userId]);
await pool.query('DELETE FROM ratings WHERE student_id = $1', [userId]);
await pool.query('DELETE FROM user_things WHERE id_user = $1', [userId]);
await pool.query('DELETE FROM user_surveys WHERE user_id = $1', [userId]);
await pool.query('DELETE FROM comments WHERE id = $1', [userId]);
await pool.query('DELETE FROM comments_start WHERE id = $1', [userId]);
await pool.query('DELETE FROM reservations WHERE id_student = $1', [userId]);
await pool.query('DELETE FROM student_ticket WHERE id_student = $1', [userId]);

await pool.query('DELETE FROM users WHERE id = $1', [userId]);

await pool.query('COMMIT');


    res.clearCookie('token'); // Если используешь cookie
    res.status(200).json({ message: 'Пользователь удалён' });
  } catch (error) {
    console.error('Ошибка удаления пользователя:', error);
    res.status(500).json({ message: 'Ошибка при удалении пользователя' });
  }
});

app.get('/api/teachers/statistics', async (req, res) => {
  try {
    const result = await pool.query(`
  SELECT
    r.id_teacher,
    t.name,
    t.last_name,
    TO_CHAR(r.date, 'YYYY-MM') AS month,
    COUNT(*) AS lesson_count,
    ROUND(AVG(rt.rating), 2) AS avg_rating
  FROM public.reservations r
  JOIN public.teachers t ON t.id = r.id_teacher
  LEFT JOIN public.ratings rt ON rt.reservation_id = r.id
  WHERE r.status = 'booked' AND t.is_active=true
  GROUP BY r.id_teacher, t.name, t.last_name, month
  ORDER BY r.id_teacher, month;
`);

const grouped = {};

for (const row of result.rows) {
  const { id_teacher, name, last_name, month, lesson_count, avg_rating } = row;
  if (!grouped[id_teacher]) {
    grouped[id_teacher] = {
      id_teacher,
      name,
      last_name,
      stats: [],
    };
  }

  grouped[id_teacher].stats.push({ month, lesson_count, avg_rating });
}

res.json(Object.values(grouped));

  } catch (error) {
    console.error('Ошибка при загрузке статистики:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.put('/api/teacher_types/approve/:id', async (req, res) => {
  const { id } = req.params;
  const { is_active } = req.body;

  if (!id || isNaN(Number(id)) || typeof is_active !== 'boolean') {
    return res.status(400).json({ error: 'Неверные данные' });
  }

  try {
    const result = await pool.query(
      'UPDATE teacher_types SET is_active = $1 WHERE id = $2 RETURNING *',
      [is_active, id]
    );

    const updated = result.rows[0];
    if (!updated) return res.status(404).json({ error: 'Заявка не найдена' });

    res.json(updated);
    const infoResult = await pool.query(`
      SELECT u.name AS teacher_name, n.name AS napravlenie_name
      FROM teacher_types tt
      JOIN teachers u ON tt.teacher_id = u.id
      JOIN napravleniya n ON tt.napravleniya_id = n.id
      WHERE tt.id = $1
    `, [id]);

    const typeInfo = infoResult.rows[0];
    if (!typeInfo) return;

    let message = '';
    let subject = '';

    if (is_active) {
      const daysResult = await pool.query(`
        SELECT day, time FROM types_day 
        WHERE teacher_type_id = $1 
        ORDER BY day, time
      `, [id]);

      const days = daysResult.rows;
      if (!days.length) return;

      const daysOfWeek = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
      const formattedDays = days.map(d => `${daysOfWeek[d.day]}: ${d.time}`).join('<br>');

      message = `
        Направление <strong>${typeInfo.napravlenie_name}</strong> с преподавателем <strong>${typeInfo.teacher_name}</strong> снова активно!<br><br>
        Актуальное расписание:<br>${formattedDays}
      `;
      subject = 'Новое активное направление!';
    } else {
      message = `
        К сожалению, преподаватель <strong>${typeInfo.teacher_name}</strong><br>
        больше не ведет направление <strong>${typeInfo.napravlenie_name}</strong>.
      `;
      subject = 'Изменение в расписании студии';
    }
    const studentsResult = await pool.query(`SELECT name, email FROM users WHERE email IS NOT NULL`);
    const students = studentsResult.rows;
    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: 'eurodanceminsk@gmail.com',
        pass: 'swgp jqwo cdkm nscm',
      },
    });

    const emailTemplate = `
      <p>Здравствуйте, {{username}}!</p>
      <p>{{message}}</p>
      <p><a href="https://example.com/student-panel">Перейти в личный кабинет</a></p>
    `;
    for (const student of students) {
      const html = emailTemplate
        .replace('{{username}}', student.name || 'ученик')
        .replace('{{message}}', message);

      try {
        await transporter.sendMail({
          from: 'eurodanceminsk@gmail.com',
          to: student.email,
          subject,
          html,
        });
        console.log(`Письмо отправлено на ${student.email}`);
      } catch (mailError) {
        console.error(`Ошибка отправки на ${student.email}:`, mailError);
      }
    }
  } catch (err) {
    console.error(err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  }
});



app.delete('/api/teacher/teacher_types/:id', async (req, res) => {
  const id = req.params.id;

  try {
    const result = await pool.query(
      `UPDATE teacher_types SET is_active = NULL WHERE id = $1 RETURNING *`,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Запись не найдена' });
    }

    res.status(200).json({ message: 'Направление помечено как удалённое', data: result.rows[0] });
  } catch (err) {
    console.error('Ошибка при обновлении teacher_types:', err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});



app.delete('/api/teacher_types/:id/confirm_deletion', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const infoResult = await client.query(`
      SELECT tt.id, u.name as teacher_name, n.name as napravlenie_name
      FROM teacher_types tt
      JOIN teachers u ON tt.teacher_id = u.id
      JOIN napravleniya n ON tt.napravleniya_id = n.id
      WHERE tt.id = $1
    `, [req.params.id]);
    
    const typeInfo = infoResult.rows[0];
    await client.query('DELETE FROM types_day WHERE teacher_type_id = $1', [req.params.id]);
    const result = await client.query('DELETE FROM teacher_types WHERE id = $1 RETURNING *', [req.params.id]);

    if (result.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Направление не найдено' });
    }

    await client.query('COMMIT');
    res.json({ message: 'Направление и связанные записи удалены', deleted: result.rows[0] });

    if (typeInfo) {
      const students = await pool.query(`SELECT name, email FROM users WHERE email IS NOT NULL`);
      const transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
          user: 'eurodanceminsk@gmail.com',
          pass: 'swgp jqwo cdkm nscm',
        },
      });

      const message = `
        К сожалению, преподаватель <strong>${typeInfo.teacher_name}</strong><br>
        больше не ведет направление <strong>${typeInfo.napravlenie_name}</strong>.
      `;

      const emailTemplate = `
        <p>Здравствуйте, {{username}}!</p>
        <p>{{message}}</p>
        <p><a href="https://example.com/student-panel">Перейти в личный кабинет</a></p>
      `;

      for (const student of students.rows) {
        const html = emailTemplate
          .replace('{{username}}', student.name || 'ученик')
          .replace('{{message}}', message);

        try {
          await transporter.sendMail({
            from: 'eurodanceminsk@gmail.com',
            to: student.email,
            subject: 'Изменение в расписании студии',
            html,
          });
        } catch (mailError) {
          console.error(`Ошибка отправки на ${student.email}:`, mailError);
        }
      }
    }
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ message: 'Ошибка сервера при удалении' });
  } finally {
    client.release();
  }
});
app.put('/api/teacher_types/:id/reject_deletion', async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE teacher_types 
       SET is_active = TRUE
       WHERE id = $1
       RETURNING *`,
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Запись не найдена' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

const surveyRoutes = require('./routes/surveyRoutes')
app.use('/api', surveyRoutes); // Все маршруты из surveyRoutes будут доступны через /api

const surveysAdminRouter = require('./routes/surveyAdmin');
app.use('/api/admin', surveysAdminRouter);
