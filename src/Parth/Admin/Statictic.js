import React, { useState, useEffect } from 'react';
import './Statistic.css';

const Statistic = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedTeachers, setExpandedTeachers] = useState({});
  const [sortConfig, setSortConfig] = useState({ key: 'totalLessons', direction: 'desc' });

useEffect(() => {
  fetch('http://localhost:5000/api/teachers/statistics')
    .then(res => res.json())
    .then(data => {
      const processedData = data.map(teacher => {
        // Обрабатываем статистику
        const processedStats = teacher.stats.map(entry => ({
          ...entry,
          lesson_count: Number(entry.lesson_count) || 0,
          avg_rating: entry.avg_rating !== null ? parseFloat(entry.avg_rating) : null
        }));

        // Вычисляем общее количество занятий
        const totalLessons = processedStats.reduce((sum, entry) => sum + entry.lesson_count, 0);

        // Фильтруем только записи с валидными оценками
        const validRatings = processedStats
          .map(entry => entry.avg_rating)
          .filter(rating => rating !== null && !isNaN(rating));

        // Вычисляем средний рейтинг
        let avgRating = null;
        if (validRatings.length > 0) {
          const sum = validRatings.reduce((a, b) => a + b, 0);
          avgRating = sum / validRatings.length;
        }

        return {
          ...teacher,
          stats: processedStats,
          totalLessons,
          avgRating
        };
      });
      setData(processedData);
    })
    .catch(error => {
      console.error('Error fetching statistics:', error);
      setData([]);
    })
    .finally(() => setLoading(false));
}, []);

  const toggleTeacher = (id) => {
    setExpandedTeachers(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const requestSort = (key) => {
    let direction = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  const sortedData = [...data].sort((a, b) => {
    if (a[sortConfig.key] < b[sortConfig.key]) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (a[sortConfig.key] > b[sortConfig.key]) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  const maxLessons = data.length > 0 
    ? Math.max(...data.map(teacher => teacher.totalLessons))
    : 0;

  const maxMonthlyLessons = data.length > 0
    ? Math.max(...data.flatMap(teacher => teacher.stats.map(entry => entry.lesson_count)))
    : 0;

  if (loading) return (
    <div className="statistic-loading">
      <div className="loading-spinner"></div>
    </div>
  );

  return (
    <div className="statistic-container">
      <div className="statistic-content">
        <h1 className="statistic-title">Статистика преподавателей</h1>
        
        <div className="sort-controls mb-4">
          <span className="sort-label">Сортировка:</span>
          <button 
            className={`sort-button ${sortConfig.key === 'totalLessons' ? 'active' : ''}`}
            onClick={() => requestSort('totalLessons')}
          >
            По количеству занятий {sortConfig.key === 'totalLessons' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
          </button>
          <button 
            className={`sort-button ${sortConfig.key === 'avgRating' ? 'active' : ''}`}
            onClick={() => requestSort('avgRating')}
          >
            По рейтингу {sortConfig.key === 'avgRating' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
          </button>
        </div>

        <div className="teachers-list">
          {sortedData.map(teacher => (
            <div key={teacher.id_teacher} className="teacher-card">
              <div 
                className="teacher-header"
                onClick={() => toggleTeacher(teacher.id_teacher)}
              >
                <div className="teacher-info">
                  <h3 className="teacher-name">
                    {teacher.name} {teacher.last_name}
                  </h3>
                  <div className="teacher-meta">
                    <span className="meta-item">
                      Занятий: <strong>{teacher.totalLessons}</strong> ({maxLessons > 0 ? Math.round((teacher.totalLessons / maxLessons) * 100) : 0}%)
                    </span>
                    {teacher.avgRating !== null ? (
      <span className="meta-item">
        Средний рейтинг: <strong>{teacher.avgRating.toFixed(1)}</strong>
      </span>
    ) : (
      <span className="meta-item">
        Нет оценок
      </span>
    )}
                  </div>
                </div>
                <div className={`teacher-arrow ${expandedTeachers[teacher.id_teacher] ? 'expanded' : ''}`}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              
              {expandedTeachers[teacher.id_teacher] && (
                <div className="teacher-details">
                  <div className="stats-table-container">
                    <table className="stats-table">
                      <thead>
                        <tr>
                          <th>Месяц</th>
                          <th>Занятий</th>
                          <th>Прогресс</th>
                          <th>Средняя оценка</th>
                        </tr>
                      </thead>
                      <tbody>
                        {teacher.stats.map((entry, idx) => (
                          <tr key={idx}>
                            <td>{entry.month}</td>
                            <td>{entry.lesson_count}</td>
                            <td>
                              <div className="progress-container">
                                <div className="progress-bar">
                                  <div 
                                    className="progress-fill"
                                    style={{ width: `${maxMonthlyLessons > 0 ? (entry.lesson_count / maxMonthlyLessons) * 100 : 0}%` }}
                                  ></div>
                                </div>
                                <span className="progress-text">
                                  {maxMonthlyLessons > 0 ? Math.round((entry.lesson_count / maxMonthlyLessons) * 100) : 0}%
                                </span>
                              </div>
                            </td>
                            <td>
                              {entry.avg_rating ? (
                                <span className={`rating-badge ${
                                  entry.avg_rating >= 4.5 ? 'excellent' :
                                  entry.avg_rating >= 3.5 ? 'good' : 'average'
                                }`}>
                                  {entry.avg_rating.toFixed(1)}
                                </span>
                              ) : '–'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Statistic;