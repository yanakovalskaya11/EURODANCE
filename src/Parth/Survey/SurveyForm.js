import React, { useContext, useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { UserContext } from '../../UserContext';
import useFetchCurrentUser from '../../hooks/useFetchCurrentUser';
import './surveys.css'
import Header from '../header/Header';
import Footer from '../Footer/Footer'
import { toast } from 'react-toastify';


const SurveyForm = () => {
  const { reservId } = useParams();
  const navigate = useNavigate();
  const [survey, setSurvey] = useState(null);
  const [answers, setAnswers] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const { currentUser, setCurrentUser } = useContext(UserContext);
  const fetchCurrentUser = useFetchCurrentUser(currentUser, setCurrentUser);


  // Получение анкеты с сервера
  useEffect(() => {
    if (!reservId) return;

    const fetchSurvey = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `http://localhost:5000/api/surveys/by-reservation/${reservId}`,
          { withCredentials: true }
        );

        const initialAnswers = {};
        response.data.questions.forEach((question) => {
          initialAnswers[question.id] = '';
        });

        setSurvey(response.data);
        setAnswers(initialAnswers);
} catch (error) {
  if (error.response?.status === 403) {
    toast.success('Вы уже заполнили эту анкету. Спасибо!');
    navigate('/personal');
  } else {
    console.error('Ошибка при получении анкеты:', error);
    toast.error('Не удалось загрузить анкету');
  }
}

      finally {
        setLoading(false);
      }
    };

    fetchSurvey();
  }, [reservId]); // Зависимость только от reservId

  // Оптимизированный обработчик изменения ответа
  const handleChange = useCallback((questionId, value) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value,
    }));
  }, []);

  // Обработчик отправки формы
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!survey || isSubmitting) return;

    // Валидация
    const unanswered = survey.questions.filter(
      q => !answers[q.id]?.trim()
    );

    if (unanswered.length > 0) {
      toast.warn(`Пожалуйста, ответьте на все вопросы!`);
      return;
    }

    setIsSubmitting(true);

    try {
      const { data } = await axios.post(
        'http://localhost:5000/api/surveys/submit',
        { reservId, answers },
        { withCredentials: true, headers: { 'Content-Type': 'application/json' } }
      );

      if (data.success) {
        // Обновляем данные пользователя
    await fetchCurrentUser();

        
        toast.success(`Спасибо! Вы получили 1 балл.`);
        
        navigate('/personal'); // Перенаправляем после успешного заполнения
      } else {
        toast.error(`Ошибка: ${data.error}`);
      }
    } catch (error) {
      console.error('Ошибка отправки:', error);
      toast.error(`Ошибка: ${error.response?.data?.error || error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div>Загрузка анкеты...</div>;
  if (!survey) return <div>Не удалось загрузить анкету</div>;
  if (!survey.questions?.length) return <div>Нет доступных вопросов</div>;

  return (
    <>
    <Header/>
    <div className="surveys main-content">

      <form onSubmit={handleSubmit}>
              <h1>{survey.title}</h1>
        {survey.questions.map((question) => (
          <div key={question.id} className="survey-creation">
            
            <label>{question.text}</label>
            <input
              type="text"
              value={answers[question.id] || ''}
              onChange={(e) => handleChange(question.id, e.target.value)}
              placeholder="Ваш ответ"
              disabled={isSubmitting}
            />
          </div>
        ))}
<div className='profile-actions'>
        <button 
          type="submit" 
          disabled={isSubmitting}
          className={isSubmitting ? 'submitting' : ''}
        >
          {isSubmitting ? 'Отправка...' : 'Отправить ответы'}
        </button>
        </div>
      </form>
    </div>
    <Footer/>
    </>
  );
};

export default SurveyForm;