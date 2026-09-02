import React, { useContext, useEffect, useState } from 'react';
import { UserContext } from '../../UserContext';
import axios from 'axios';
import { toast } from 'react-toastify';

const StarRating = ({ rating, setRating, isSubmitted }) => {
  return (
    <div className="star-rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`star ${star <= rating ? 'filled' : ''} ${isSubmitted ? 'disabled' : ''}`}
          onClick={() => !isSubmitted && setRating(star)}
        >
          {star <= rating ? '★' : '☆'}
        </span>
      ))}
    </div>
  );
};

const MyLessons = () => {
  const { currentUser } = useContext(UserContext);
  const [lessons, setLessons] = useState([]);
  const [activeTab, setActiveTab] = useState('current');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ratings, setRatings] = useState({});
  const [expandedTabs, setExpandedTabs] = useState({ current: false, expired: false, cancelled: false });

  const userId = currentUser.id;

  useEffect(() => {
    setLoading(true);
   axios
  .get(`http://localhost:5000/api/reservations/student?id_student=${userId}`)
  .then((response) => {
    setLessons(response.data);
    setError(null);
    loadExistingRatings(response.data);
  })

      .catch((error) => {
        console.error('Ошибка: ', error);
        setError('Не удалось загрузить занятия');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [userId]);

  const loadExistingRatings = async (lessonsData) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/ratings?studentId=${userId}`);
      const ratingsMap = {};

      response.data.forEach((rating) => {
        const lesson = lessonsData.find((l) => l.id === rating.reservation_id);
        if (lesson) {
          ratingsMap[lesson.id] = {
            rating: rating.rating,
            isSubmitted: true,
          };
        }
      });

      setRatings(ratingsMap);
    } catch (err) {
      console.error('Ошибка при загрузке оценок:', err);
    }
  };

const formatEffectiveDate = (lesson) => {
  const rawDate = lesson.transferred_date || lesson.date;
  return formatDate(rawDate);
};

// Прибавляем 1 день — используется для логики
const getEffectiveDate = (lesson) => {
  const rawDate = lesson.transferred_date || lesson.date;
  const date = new Date(rawDate);
  date.setDate(date.getDate() + 1); // всегда +1 для логики
  return date;
};

// Используется для отображения основной даты занятия — +1 день
const formatDate = (dateString) => {
  const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
  const date = new Date(dateString);
  date.setDate(date.getDate() + 1); // визуально тоже +1
  return date.toLocaleDateString('ru-RU', options);
};

// Используется для отображения переноса — -1 день от transferred_date
const formatTransferredDate = (dateString) => {
  const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
  const date = new Date(dateString);
  date.setDate(date.getDate()); // без +1
  return date.toLocaleDateString('ru-RU', options);
};


  const today = new Date();
  today.setHours(0, 0, 0, 0);

const currentLessons = lessons.filter((lesson) => {
  const effectiveDate = getEffectiveDate(lesson);
  return effectiveDate >= today;
});

const expiredLessons = lessons.filter((lesson) => {
  const effectiveDate = getEffectiveDate(lesson);
  return effectiveDate < today;
});


const cancelledLessons = lessons.filter((lesson) => {
  return lesson.status === 'cancelled' && !lesson.transferred_date;
});


  const handleRatingChange = (lessonId, rating) => {
    setRatings((prev) => ({
      ...prev,
      [lessonId]: { ...prev[lessonId], rating, isSubmitted: false },
    }));
  };

  const submitRating = async (lesson) => {
    try {
      await axios.post('http://localhost:5000/api/ratings', {
        reservation_id: lesson.id,
        student_id: userId,
        teacher_id: lesson.id_teacher,
        direction_id: lesson.id_type,
        rating: ratings[lesson.id]?.rating || 0,
      });

      setRatings((prev) => ({
        ...prev,
        [lesson.id]: { ...prev[lesson.id], isSubmitted: true },
      }));
    } catch (err) {
      console.error('Ошибка при сохранении оценки:', err);
      toast.error('Не удалось сохранить оценку. Попробуйте позже.');
    }
  };

  const handleCancelLesson = async (lessonId) => {
    try {
      await axios.delete(`http://localhost:5000/api/reservations/${lessonId}`, {
        data: { studentId: userId },
      });
      setLessons((prevLessons) => prevLessons.filter((lesson) => lesson.id !== lessonId));
    } catch (err) {
      console.error('Ошибка при отмене занятия:', err);
      toast.error('Не удалось отменить занятие. Попробуйте позже.');
    }
  };

  const renderLessons = (lessonsList, tabKey, withRating = false) => {
    const expanded = expandedTabs[tabKey];
    const visibleLessons = expanded ? lessonsList : lessonsList.slice(0, 3);

    return (
      <>
        <ul>
          {visibleLessons.map((lesson) => (
            <li key={lesson.id}>
              <h2>
                {lesson.type_name} у {lesson.teacher_full_name}
              </h2>
              
              {lesson.transferred_date ? (
  <>
    <p>Первоначальная дата: {formatDate(lesson.date)}</p>
    <p style={{ color: 'purple', fontWeight: 'bold' }}>
      Перенесено на: {formatTransferredDate(lesson.transferred_date)}
    </p>
  </>
) : (
  <p>Дата занятия: {formatDate(lesson.date)}</p>
)}



              <p>Статус: {lesson.lesson_status}</p>
              {lesson.ticket_info && <p>Абонемент: {lesson.ticket_info}</p>}

              {tabKey === 'current' && (
                <button className="tab" onClick={() => handleCancelLesson(lesson.id)}>
                  Отменить занятие
                </button>
              )}

              {withRating && (
                <div className="rating-section">
                  <p>Оценка занятия:</p>
                  <StarRating
                    rating={ratings[lesson.id]?.rating || 0}
                    setRating={(rating) => handleRatingChange(lesson.id, rating)}
                    isSubmitted={ratings[lesson.id]?.isSubmitted || false}
                  />
                  {!ratings[lesson.id]?.isSubmitted && ratings[lesson.id]?.rating && (
                    <button className="submit-rating" onClick={() => submitRating(lesson)}>
                      Оценить занятие
                    </button>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
        {lessonsList.length > 1 && (
          <button
            className="toggle-expand"
            onClick={() =>
              setExpandedTabs((prev) => ({
                ...prev,
                [tabKey]: !prev[tabKey],
              }))
            }
          >
            {expanded ? '▲ Свернуть' : '▼ Показать все'}
          </button>
        )}
      </>
    );
  };

  if (loading) return <div>Загрузка...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="MyLessons">
      <h3>Мои занятия</h3>

      <div className="tabs">
        <button className={`tab ${activeTab === 'current' ? 'active' : ''}`} onClick={() => setActiveTab('current')}>
          Предстоящие занятия
        </button>
        <button className={`tab ${activeTab === 'expired' ? 'active' : ''}`} onClick={() => setActiveTab('expired')}>
          Прошедшие занятия
        </button>
        <button className={`tab ${activeTab === 'cancelled' ? 'active' : ''}`} onClick={() => setActiveTab('cancelled')}>
          Отмененные занятия
        </button>
      </div>

      {activeTab === 'current' && (
        <div>{currentLessons.length > 0 ? renderLessons(currentLessons, 'current') : <p>У вас нет предстоящих занятий.</p>}</div>
      )}
      {activeTab === 'expired' && (
        <div>{expiredLessons.length > 0 ? renderLessons(expiredLessons, 'expired', true) : <p>У вас нет прошедших занятий.</p>}</div>
      )}
      {activeTab === 'cancelled' && (
        <div>{cancelledLessons.length > 0 ? renderLessons(cancelledLessons, 'cancelled') : <p>У вас нет отмененных занятий.</p>}</div>
      )}
    </div>
  );
};

export default MyLessons;