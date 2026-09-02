const express = require('express');
const router = express.Router();
const pool = require('../db'); // Подключение к базе данных

// Получение анкеты по reservation ID
// router.get('/surveys/by-reservation/:reservId', async (req, res) => {
//   try {
//     const reservId = parseInt(req.params.reservId);

//     if (isNaN(reservId)) {
//       return res.status(400).json({ error: 'Invalid reservation ID' });
//     }

//     // 1. Получаем основную информацию об анкете
//     const surveyQuery = await pool.query(
//       'SELECT * FROM surveys WHERE reserv_id = $1',
//       [reservId]
//     );

//     if (surveyQuery.rows.length === 0) {
//       return res.status(404).json({ error: 'Survey not found for this reservation' });
//     }

//     const surveyId = surveyQuery.rows[0].id;

//     // 2. Получаем вопросы для этой анкеты
//     const questionsQuery = await pool.query(
//       'SELECT id, question_text as text FROM survey_questions WHERE survey_id = $1',
//       [surveyId]
//     );

//     // 3. Формируем ответ
//     const response = {
//       ...surveyQuery.rows[0],
//       questions: questionsQuery.rows
//     };

//     res.json(response);
//   } catch (err) {
//     console.error('Database error:', err);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// });
router.post('/surveys/submit', async (req, res) => {
  const { reservId, answers } = req.body;
  const client = await pool.connect();

  try {
    if (!reservId || !answers || typeof answers !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Необходимо указать reservId и answers'
      });
    }

    await client.query('BEGIN');
    const reservCheck = await client.query(
      'SELECT id, id_student FROM reservations WHERE id = $1',
      [reservId]
    );

    if (reservCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, error: 'Бронирование не найдено' });
    }

    const id_student = reservCheck.rows[0].id_student;
    const surveyCheck = await client.query(
      'SELECT id FROM surveys WHERE reserv_id = $1',
      [reservId]
    );

    if (surveyCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, error: 'Анкета не найдена' });
    }

    const surveyId = surveyCheck.rows[0].id;
    const questionIds = Object.keys(answers);
    const questionsCheck = await client.query(
      'SELECT id FROM survey_questions WHERE id = ANY($1::int[]) AND survey_id = $2',
      [questionIds, surveyId]
    );

    if (questionsCheck.rows.length !== questionIds.length) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, error: 'Некоторые вопросы не принадлежат анкете' });
    }
    const fullQuestions = await client.query(
      `SELECT id, question_text FROM survey_questions WHERE id = ANY($1::int[])`,
      [questionIds]
    );
    const detailedAnswers = fullQuestions.rows.map(q => {
      const rawAnswer = answers[q.id.toString()];
      const normalizedAnswer = typeof rawAnswer === 'object'
        ? rawAnswer
        : String(rawAnswer); // если строка или число — приводим к строке

      return {
        questionId: q.id,
        questionText: q.question_text,
        answer: normalizedAnswer
      };
    });
await client.query(
  `INSERT INTO user_surveys (user_id, reserv_id, survey_id, answers)
   VALUES ($1, $2, $3, $4)`,
  [id_student, reservId, surveyId, JSON.stringify(detailedAnswers)]
);
    await client.query(
      `UPDATE users SET score = score + 1 WHERE id = $1`,
      [id_student]
    );

    const updatedUser = await client.query(
      'SELECT * FROM users WHERE id = $1',
      [id_student]
    );

//     // Удаление анкеты и её вопросов
// await client.query('DELETE FROM survey_questions WHERE survey_id = $1', [surveyId]);
// await client.query('DELETE FROM surveys WHERE id = $1', [surveyId]);



    await client.query('COMMIT');

    res.status(200).json({
      success: true,
      message: 'Ответы успешно сохранены',
      savedAnswers: Object.keys(answers).length,
      updatedUser: updatedUser.rows[0]
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Ошибка сохранения:', {
      message: error.message,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      error: 'Ошибка сервера',
      details: process.env.NODE_ENV === 'development' ? {
        message: error.message,
        stack: error.stack
      } : undefined
    });
  } finally {
    client.release();
  }
});


// Получение всех ответов пользователей
router.get('/surveys/responses', async (req, res) => {
  try {
    const responses = await pool.query(`
      SELECT 
        us.id, 
        us.user_id, 
        us.reserv_id, 
        us.survey_id, 
        us.answers, 
        us.completed_at,
        u.email as user_email,
        r.id as reservation_number
      FROM user_surveys us
      LEFT JOIN users u ON us.user_id = u.id
      LEFT JOIN reservations r ON us.reserv_id = r.id
      ORDER BY us.completed_at DESC
    `);
    
    // Исправленная обработка ответов
    const formattedResponses = responses.rows.map(response => {
      try {
        // Проверяем, является ли answers строкой
        let answersData = response.answers;
        if (typeof response.answers === 'string') {
          answersData = JSON.parse(response.answers);
        }
        
        // Проверяем структуру answersData
        if (Array.isArray(answersData)) {
          return {
            ...response,
            answers: answersData.map(item => ({
              questionId: item.questionId,
              questionText: item.questionText,
              answer: item.answer
            }))
          };
        } else if (typeof answersData === 'object' && answersData !== null) {
          return {
            ...response,
            answers: Object.entries(answersData).map(([key, value]) => ({
              questionId: key,
              answer: value
            }))
          };
        } else {
          return {
            ...response,
            answers: []
          };
        }
      } catch (e) {
        console.error('Error parsing answers:', e);
        return {
          ...response,
          answers: []
        };
      }
    });
    
    res.json(formattedResponses);
  } catch (err) {
    console.error('Ошибка получения ответов:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});





const createSurvey = async (client, reservId, templateSurveyId) => {
  // Получаем шаблон анкеты
  const { rows } = await client.query(
    'SELECT title, description FROM surveys WHERE id = $1',
    [templateSurveyId]
  );

  const template = rows[0];
  if (!template) return;

  // Создаём новую анкету и получаем её id
  const insertSurvey = await client.query(`
    INSERT INTO surveys (reserv_id, title, description)
    VALUES ($1, $2, $3)
    RETURNING id
  `, [reservId, template.title, template.description]);

  const newSurveyId = insertSurvey.rows[0].id;

  // Копируем вопросы из шаблона
  const questionRows = await client.query(
    'SELECT question_text FROM survey_questions WHERE survey_id = $1',
    [templateSurveyId]
  );

  for (const q of questionRows.rows) {
    await client.query(`
      INSERT INTO survey_questions (survey_id, question_text)
      VALUES ($1, $2)
    `, [newSurveyId, q.question_text]);
  }

  console.log(`Создана анкета ${newSurveyId} с ${questionRows.rows.length} вопросами по шаблону ${templateSurveyId} для брони ${reservId}`);
};


router.get('/surveys/by-reservation/:reservId', async (req, res) => {
  const { reservId } = req.params;
  const userId = req.user?.id;

  if (!userId) return res.status(401).json({ error: 'Не авторизован' });

  try {
    const existing = await pool.query(
      `SELECT 1 FROM user_surveys WHERE user_id = $1 AND reserv_id = $2 LIMIT 1`,
      [userId, reservId]
    );

    if (existing.rows.length > 0) {
      return res.status(403).json({ error: 'Анкета уже заполнена' });
    }

    const surveyQuery = await pool.query(
      'SELECT id, title FROM surveys WHERE reserv_id = $1',
      [reservId]
    );

    if (surveyQuery.rows.length === 0) {
      return res.status(404).json({ error: 'Анкета не найдена' });
    }

    const survey = surveyQuery.rows[0];

    const questionsQuery = await pool.query(
      'SELECT id, question_text FROM survey_questions WHERE survey_id = $1',
      [survey.id]
    );

    res.json({
      id: survey.id,
      title: survey.title,
      questions: questionsQuery.rows.map(q => ({
        id: q.id,
        text: q.question_text
      })),
    });

  } catch (err) {
    console.error('Ошибка при получении анкеты:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});




const generateMissingSurveys = async () => {
  const client = await pool.connect();
  try {
    const { rows } = await client.query(`
      WITH visits AS (
        SELECT 
          r.id AS reserv_id,
          r.id_student,
          ROW_NUMBER() OVER (PARTITION BY r.id_student ORDER BY r.date) AS visit_number
        FROM reservations r
        WHERE r.status = 'booked' AND r.date < CURRENT_DATE
      )
      SELECT 
        v.reserv_id,
        v.id_student,
        st.survey_id AS template_survey_id
      FROM visits v
      JOIN survey_triggers st ON st.trigger_count = v.visit_number
      LEFT JOIN surveys s ON s.reserv_id = v.reserv_id
      WHERE s.id IS NULL;
    `);

    for (const row of rows) {
      await createSurvey(client, row.reserv_id, row.template_survey_id);
    }
  } catch (err) {
    console.error('Ошибка при создании анкет:', err);
  } finally {
    client.release();
  }
};
generateMissingSurveys();



module.exports = router;


module.exports = router;
