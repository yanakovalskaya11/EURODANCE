import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './time.css';
import { useNavigate } from 'react-router-dom';

const TimeTable = () => {
  const [data, setData] = useState([]);
  const daysOfWeek = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВСК'];
  const navigate = useNavigate();

  useEffect(() => {
    axios.get('http://localhost:5000/api/teacher_schedule')
      .then(res => setData(res.data))
      .catch(err => console.error('Ошибка загрузки расписания:', err));
  }, []);

  const getDaySchedule = (dayIndex) => {
    const filtered = data.filter(item => ((item.day + 6) % 7) === dayIndex);
    return filtered.sort((a, b) => a.time.localeCompare(b.time));
  };

  const goToDirection = (napravleniya_id) => {
    if (napravleniya_id) {
      navigate(`/napravleniya/${napravleniya_id}`);
    } else {
      console.warn('napravleniya_id не определён для этого элемента');
    }
  };

  return (
    <div className="table_main">
      <div className="desktop-view">
        <table>
          <thead>
            <tr>
              <th>Время</th>
              {daysOfWeek.map((day, i) => (
                <th key={i}>{day.slice(0, 2).toUpperCase()}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 13 }, (_, i) => i + 10).map(hour => (
              <tr key={hour}>
                <td>{`${hour}:00`}</td>
                {daysOfWeek.map((_, dayIndex) => (
                  <td key={dayIndex}>
                    {data
                      .filter(item => ((item.day + 6) % 7) === dayIndex)
                      .filter(item => new Date(`1970-01-01T${item.time}`).getHours() === hour)
                      .map((item, i) => (
                        <div
                          key={i}
                          className={item.napravleniya_id ? 'clickable-lesson' : ''}
                          onClick={() => item.napravleniya_id && goToDirection(item.napravleniya_id)}
                          style={{ cursor: item.napravleniya_id ? 'pointer' : 'default' }}
                          title={item.napravleniya_id ? `Перейти к направлению: ${item.subject_name}` : ''}
                        >
                          <strong>{item.subject_name}</strong> <em>{item.teacher_name}</em> <br />
                          <strong>{item.level}</strong>
                        </div>
                      ))}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mobile-view">
        {daysOfWeek.map((day, dayIndex) => (
          <div className="day-block" key={dayIndex}>
            <h3>{day}</h3>
            {getDaySchedule(dayIndex).length ? (
              getDaySchedule(dayIndex).map((item, i) => (
                <div
                  key={i}
                  className={item.napravleniya_id ? 'clickable-lesson lesson-card' : 'lesson-card'}
                  onClick={() => item.napravleniya_id && goToDirection(item.napravleniya_id)}
                  style={{ cursor: item.napravleniya_id ? 'pointer' : 'default' }}
                  title={item.napravleniya_id ? `Перейти к направлению: ${item.subject_name}` : ''}
                >
                  <div className="time">{item.time.slice(0, 5)}</div>
                  <div className="subject">{item.subject_name}</div>
                  <div className="teacher_time">{item.teacher_name}</div>
                </div>
              ))
            ) : (
              <p className="no-lessons">Нет занятий</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TimeTable;
