import React, { useContext, useEffect, useState } from 'react'
import { UserContext } from '../../UserContext';
import axios from 'axios';

const Lessons = () => {
    const { currentUser } = useContext(UserContext);
    const [lessons, setLessons] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:5000/api/reservations')
      .then((response) => {
        setLessons(response.data);
      })
      .catch((error) => {
        console.error("Ошибка: ", error);
      });
  }, []); 

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', options); // Форматирование даты в российском формате
};  

return (
    <div className='MyLessons'>
          <h3>Мои занятия</h3>
          {lessons.length > 0 ? (
            <ul>
              {lessons.map(lesson => (
                <li key={`${lesson.id_teacher}-${lesson.id_type}`}>
                  <h2>{lesson.type_name} с {lesson.student_name}</h2> {/* Отображаем название билета */}
                  
                  <p>Дата занятия: {formatDate(lesson.date)}</p> {/* Даты действия */}
                </li>
              ))}
            </ul>
          ) : (
            <p>У вас нет занятий.</p>
          )}
        </div>
      )
}

export default Lessons
