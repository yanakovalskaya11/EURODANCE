import React, { useContext, useEffect, useState } from 'react';
import { UserContext } from '../../UserContext';
import './achiv.css'

const Achievements = () => {
 const { currentUser, setCurrentUser } = useContext(UserContext);
  const [achievements, setAchievements] = useState([]);
  const [userStats, setUserStats] = useState(null);
const [expandedTabs, setExpandedTabs] = useState({});
 useEffect(() => {
  fetch('http://localhost:5000/api/achievements')
    .then(res => {
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return res.json();
    })
    .then(data => {
      setAchievements(data);
    })
    .catch(err => console.error('Fetch achievements error:', err));
}, []);


useEffect(() => {
  if (!currentUser?.id) return;

  fetch(`http://localhost:5000/api/user-stats/${currentUser.id}`)
    .then(res => {
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return res.json();
    })
    .then(data => {
      setUserStats(data);
    })
    .catch(err => console.error('Fetch user-stats error:', err));
}, [currentUser]);

useEffect(() => {
  if (!userStats || !achievements.length) return;

  achievements.forEach(item => {
    let condition = null;
    try {
      condition = typeof item.condition_json === 'string'
        ? JSON.parse(item.condition_json)
        : item.condition_json;
    } catch {
      return;
    }

    const unlocked = checkAchievementCondition(userStats, condition);

    if (unlocked) {
     fetch('http://localhost:5000/api/achievements/unlock', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ userId: currentUser.id, achievementId: item.id }),
})
  .then(async res => {
    const text = await res.text(); 
    try {
      return JSON.parse(text);     } catch (e) {
      console.error('Ошибка JSON.parse:', e.message);
      throw e;
    }
  })
.then(data => {
  if (data.message === 'Баллы обновлены и достижение записано') {

    // Повторно получаем обновленного пользователя
    fetch(`http://localhost:5000/api/user/${currentUser.id}`)
      .then(res => res.json())
      .then(updatedUser => {
        setCurrentUser(updatedUser); // 🔁 обновим контекст
      })
      .catch(console.error);
  }
})
  .catch(console.error);

    }
  });
}, [userStats, achievements, currentUser]);


  // Проверка условия достижения
function checkAchievementCondition(userData, condition) {
   switch (condition.type) {
    case 'visit_count':
      const visits = userData.totalVisits ?? 0;
      return visits >= condition.count;

    case 'subscription_purchase':
      const subs = userData.totalSubscriptions ?? 0;
      return subs >= condition.count;

    case 'direction_visited':
      const directions = userData.uniqueDirections ?? 0;
      return directions >= condition.count;

    default:
      return false;
  }
}


  
 const renderLessons = (lessonsList, tabKey) => {
  const expanded = expandedTabs[tabKey];
  const visibleLessons = expanded ? lessonsList : lessonsList.slice(0, 4);

  return (
    <div className="achievements">
      {lessonsList.length === 0 && (
        <p className="loading-message">Загрузка достижений...</p>
      )}

      <div className="achievement-grid">
        {userStats &&
          visibleLessons.map(item => {
            let condition = null;
            try {
              condition =
                typeof item.condition_json === 'string'
                  ? JSON.parse(item.condition_json)
                  : item.condition_json;
            } catch (e) {
              console.warn('Неверный формат condition_json для достижения', item.id, e.message);
            }

            const unlocked = checkAchievementCondition(userStats, condition);

            return (
              <div
                key={item.id}
                className={`achievement-item ${unlocked ? '' : 'locked'}`}
              >
                <h2>{item.name}</h2>
                <p>{item.descr}</p>
                <img
                  src={`http://localhost:5000${item.photo}`}
                  alt={item.name}
                  className="achievement-image"
                />
                <p>Бонус: {item.bonus}</p>
                {unlocked ? (
                  <span className="unlocked-badge">🏆 Получено!</span>
                ) : (
                  <span className="locked-badge">🔒 Не получено</span>
                )}
              </div>
            );
          })}
      </div>

      {lessonsList.length > 4 && (
        <button
          className="toggle-expand"
          onClick={() =>
            setExpandedTabs(prev => ({
              ...prev,
              [tabKey]: !prev[tabKey],
            }))
          }
        >
          {expanded ? '▲ Свернуть' : '▼ Показать все'}
        </button>
      )}
    </div>
  );
};

 return renderLessons(achievements, 'all');
};
export default Achievements;
