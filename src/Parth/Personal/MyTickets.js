import React, { useContext, useEffect, useState } from 'react';
import { UserContext } from '../../UserContext';
import axios from 'axios';


const MyTickets = () => {
  const { currentUser } = useContext(UserContext); 
  const [tickets, setTickets] = useState([]);
  const [activeTab, setActiveTab] = useState('current');
  const [upcomingExpirations, setUpcomingExpirations] = useState([]);
  const [reminderMessage, setReminderMessage] = useState('');  // Состояние для уведомлений
  const userId = currentUser.id;

  useEffect(() => {
    axios.get(`http://localhost:5000/api/student_ticket?id_user=${userId}`)
      .then((response) => {
        setTickets(response.data);
        checkUpcomingExpirations(response.data);
      })
      .catch((error) => {
        console.error("Ошибка: ", error);
      });
  }, [userId]);
  useEffect(() => {
    axios.get(`http://localhost:5000/api/checkTicket`)
      .then((response) => {
        setReminderMessage(response.data.message);
      })
      .catch((error) => {
        console.error("Ошибка: ", error);
      });
  }, []); // Запрос будет отправлен при монтировании компонента
  
  // Функция для проверки приближающихся окончаний абонементов
  const checkUpcomingExpirations = (tickets) => {
    const today = new Date();
    const upcoming = tickets.filter(ticket => {
      const endDate = new Date(ticket.end_date);
      const diffTime = endDate - today;
      const diffDays = diffTime / (1000 * 60 * 60 * 24); // Разница в днях
      return diffDays <= 3 && diffDays >= 0; // Если осталось 3 дня
    });
    setUpcomingExpirations(upcoming);

    if (upcoming.length > 0) {
      setReminderMessage('Напоминания о предстоящем истечении срока абонемента были отправлены.');
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', options);
  };

  const today = new Date();
  const currentTickets = tickets.filter(ticket => new Date(ticket.end_date) >= today);
  const expiredTickets = tickets.filter(ticket => new Date(ticket.end_date) < today);

  return (
    <div className='MyTickets'>
      <h3>Мои Абонементы</h3>

      {/* Вкладки */}
      <div className='tabs'>
        <button 
          className={`tab ${activeTab === 'current' ? 'active' : ''}`} 
          onClick={() => setActiveTab('current')}
        >
          Текущие Абонементы
        </button>
        <button 
          className={`tab ${activeTab === 'expired' ? 'active' : ''}`} 
          onClick={() => setActiveTab('expired')}
        >
          Прошедшие Абонементы
        </button>
      </div>

      {/* Уведомление о предстоящем истечении срока */}
      {reminderMessage && (
        <div className='reminder-message'>
          <p>{reminderMessage}</p>
        </div>
      )}

      {/* Контент в зависимости от активной вкладки */}
      {activeTab === 'current' ? (
        <div className='tickets_my'>
          {currentTickets.length > 0 ? (
            currentTickets.map(ticket => (
              <div className='ticket_my' key={ticket.id}>
                <h2>{ticket.name_ticket}</h2>
                <img src={`http://localhost:5000${ticket.photo}`} alt={ticket.name_ticket} />
                <p>Срок действия: {formatDate(ticket.start_date)} - {formatDate(ticket.end_date)}</p>
              </div>
            ))
          ) : (
            <p>У вас нет текущих абонементов.</p>
          )}
        </div>
      ) : (
        <div className='tickets_my'>
          {expiredTickets.length > 0 ? (
            expiredTickets.map(ticket => (
              <div className='ticket_my' key={ticket.id}>
                <h2>{ticket.name_ticket}</h2>
                <img src={`http://localhost:5000${ticket.photo}`} alt={ticket.name_ticket} />
                <p>Срок действия: {formatDate(ticket.start_date)} - {formatDate(ticket.end_date)}</p>
              </div>
            ))
          ) : (
            <p>У вас нет прошедших абонементов.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default MyTickets;
