import axios from 'axios';
import React, { useContext, useEffect, useState } from 'react'
import { UserContext } from '../../UserContext';

const My_Lessons_Calendar = () => {
    const { currentUser } = useContext(UserContext);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [lessons, setLessons] = useState([]);
    const teacherID = currentUser?.id;
    const [error, setError] = useState('');
    useEffect(() => {
        if (teacherID) {
            axios.get(`http://localhost:5000/api/reservations?id_teacher=${teacherID}`)
                .then((response) => {
                    setLessons(response.data);
                    setError('');
                })
                .catch((error) => {
                    console.error("Ошибка: ", error);
                    setError('Не удалось загрузить занятия.');
                });
        } else {
            setError('ID учителя не найден.');
        }
    }, [teacherID]);


    const nextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
      };
    
      const prevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
      };


  return (
    <div>
       <div>
      <button onClick={prevMonth}>←</button>
      <span>{currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
      <button onClick={nextMonth}>→</button>

      <div className="calendar-grid">
        {lessons}
      </div>
    </div>
    </div>
  )
}

export default My_Lessons_Calendar
