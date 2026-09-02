import React, { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { UserContext } from '../../UserContext';
import './TeacherStats.css';

const TeacherStats = () => {
  const { currentUser } = useContext(UserContext);
  const [stats, setStats] = useState([]);
  const [cancelStats, setCancelStats] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      if (!currentUser?.id) return;
      setIsLoading(true);
      setError(null);

      try {
        const [reservationsRes, cancelRes] = await Promise.all([
          axios.get(`http://localhost:5000/teacher_stats?teacher_id=${currentUser.id}`),
          axios.get(`http://localhost:5000/teacher_cancel_stats?teacher_id=${currentUser.id}`)
        ]);

        setStats(reservationsRes.data);
        setCancelStats(cancelRes.data);
      } catch (error) {
        console.error('Ошибка при получении статистики:', error);
        setError('Не удалось загрузить статистику. Попробуйте позже.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [currentUser]);

  // Сортируем статистику по месяцам (от новых к старым)
  const sortedStats = [...stats].sort((a, b) => 
    new Date(b.month) - new Date(a.month)
  );

  return (
    <div className="teacher-stats-container">
      <h2>Статистика занятий</h2>
      
      {isLoading ? (
        <div className="stats-loading">
          <div className="loading-spinner"></div>
          <p>Загрузка статистики...</p>
        </div>
      ) : error ? (
        <div className="stats-error">
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="retry-button"
          >
            Попробовать снова
          </button>
        </div>
      ) : (
        <div className="stats-content">
          <table className="stats-table">
            <thead>
              <tr>
                <th>Месяц</th>
                <th>Записалось на занятие</th>
                <th>Отменено дней</th>
              </tr>
            </thead>
            <tbody>
              {sortedStats.map((stat, i) => {
                const cancel = cancelStats.find(c => c.month === stat.month) || { cancelled_days: 0 };
                const monthLabel = new Date(stat.month).toLocaleString('ru-RU', { 
                  year: 'numeric', 
                  month: 'long'
                }).replace(' г.', '');

                return (
                  <tr key={i}>
                    <td data-label="Месяц">{monthLabel}</td>
                    <td data-label="Занятий">{stat.total_reservations}</td>
                    <td data-label="Отмены">
                      <span className={cancel.cancelled_days > 0 ? "cancelled-highlight" : ""}>
                        {cancel.cancelled_days}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {sortedStats.length === 0 && (
            <div className="no-stats">
              <p>Нет данных для отображения</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TeacherStats;