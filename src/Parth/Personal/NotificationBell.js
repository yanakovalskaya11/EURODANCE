import React, { useEffect, useState } from 'react';
import './NotificationBell.css';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Bell } from 'lucide-react';

const NotificationBell = ({ userId }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadAnswers, setUnreadAnswers] = useState([]);
  const [pendingSurveys, setPendingSurveys] = useState([]);
  const [showList, setShowList] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const [answersRes, surveysRes] = await Promise.all([
  axios.get(`http://localhost:5000/api/users/${userId}/questions/unread-answers`),
  axios.get(`http://localhost:5000/api/users/${userId}/lessons-need-survey`, { withCredentials: true })
]);



        const totalCount = (answersRes.data.unreadCount || 0) + (surveysRes.data?.length || 0);
        setUnreadCount(totalCount);
        setPendingSurveys(surveysRes.data || []);
      } catch (err) {
        console.error('Ошибка при загрузке уведомлений:', err);
      }
    };

    if (userId) fetchNotifications();
  }, [userId]);

  const handleClick = async () => {
    if (!showList) {
      try {
        const [answersRes, surveysRes] = await Promise.all([
          axios.get(`http://localhost:5000/api/users/${userId}/questions/unread-answers/list`),
          axios.get(`http://localhost:5000/api/users/${userId}/lessons-need-survey`, { withCredentials: true })
        ]);

        setUnreadAnswers(answersRes.data.unreadAnswers || []);
        setPendingSurveys(surveysRes.data || []);
        setShowList(true);
      } catch (err) {
        console.error('Ошибка при загрузке данных уведомлений:', err);
      }
    } else {
      setShowList(false);
    }
  };

  const handleMarkReadAndNavigate = async (answerId) => {
    try {
      await axios.patch(`http://localhost:5000/api/answers/${answerId}/mark-read`);
      setUnreadAnswers(prev => prev.filter(a => a.id !== answerId));
      setUnreadCount(count => count - 1);
      navigate(`/question/${answerId}`);
    } catch (err) {
      console.error('Ошибка при отметке как прочитано:', err);
    }
  };

  const handleSurveyClick = (reservId) => {
    setUnreadCount(count => count - 1);
    navigate(`/survey/${reservId}`);
  };

  return (
    <div className="notification-bell">
      <div onClick={handleClick} style={{ cursor: 'pointer', position: 'relative' }}>
        <Bell className="bell-icon" />
        {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
      </div>

      {showList && (
        <div className="notification-list">
          {unreadAnswers.length === 0 && pendingSurveys.length === 0 && (
            <p>Нет новых уведомлений</p>
          )}

          {unreadAnswers.map(answer => (
            <div key={`answer-${answer.id}`} className="notification-item">
              <p><strong>Вопрос:</strong> {answer.question}</p>
              <p><strong>Ответ:</strong> {answer.answer}</p>
              <button onClick={() => handleMarkReadAndNavigate(answer.id)}>Прочитать</button>
            </div>
          ))}

          {pendingSurveys.map(survey => (
            <div key={`survey-${survey.reserv_id}`} className="notification-item">
              <p><strong>Доступен опрос</strong></p>
              <button onClick={() => handleSurveyClick(survey.reserv_id)}>Пройти опрос</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
