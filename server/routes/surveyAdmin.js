const express = require('express');
const router = express.Router();
const pool = require('../db');
router.post('/surveys/create', async (req, res) => {
  const { reservId } = req.body;
  
  try {
    const reservCheck = await pool.query(
      'SELECT id FROM reservations WHERE id = $1',
      [reservId]
    );
    
    if (reservCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Бронирование не найдено' });
    }
    const existingSurvey = await pool.query(
      'SELECT id FROM surveys WHERE reserv_id = $1',
      [reservId]
    );
    
    if (existingSurvey.rows.length > 0) {
      return res.status(400).json({ error: 'Анкета для этого бронирования уже существует' });
    }
    const newSurvey = await pool.query(
      'INSERT INTO surveys (reserv_id) VALUES ($1) RETURNING *',
      [reservId]
    );
    
    res.status(201).json(newSurvey.rows[0]);
  } catch (err) {
    console.error('Ошибка создания анкеты:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});
router.post('/surveys/:surveyId/questions', async (req, res) => {
  const { surveyId } = req.params;
  const { questionText } = req.body;
  
  try {
    const surveyCheck = await pool.query(
      'SELECT id FROM surveys WHERE id = $1',
      [surveyId]
    );
    
    if (surveyCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Анкета не найдена' });
    }
    const newQuestion = await pool.query(
      'INSERT INTO survey_questions (survey_id, question_text) VALUES ($1, $2) RETURNING *',
      [surveyId, questionText]
    );
    
    res.status(201).json(newQuestion.rows[0]);
  } catch (err) {
    console.error('Ошибка добавления вопроса:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});
router.get('/surveys', async (req, res) => {
  try {
    const surveys = await pool.query(`
      SELECT s.*, r.id as reservation_id, r.id as reservation_name 
      FROM surveys s
      JOIN reservations r ON s.reserv_id = r.id
    `);
    
    res.json(surveys.rows);
  } catch (err) {
    console.error('Ошибка получения анкет:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});
router.get('/surveys/:surveyId/questions', async (req, res) => {
  const { surveyId } = req.params;
  
  try {
    const questions = await pool.query(
      'SELECT id, question_text as text FROM survey_questions WHERE survey_id = $1',
      [surveyId]
    );
    
    res.json(questions.rows);
  } catch (err) {
    console.error('Ошибка получения вопросов:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});
router.delete('/surveys/questions/:questionId', async (req, res) => {
  const { questionId } = req.params;
  
  try {
    await pool.query(
      'DELETE FROM survey_questions WHERE id = $1',
      [questionId]
    );
    
    res.json({ success: true });
  } catch (err) {
    console.error('Ошибка удаления вопроса:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});


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
    
    res.json(responses.rows);
  } catch (err) {
    console.error('Ошибка получения ответов:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});


module.exports = router;