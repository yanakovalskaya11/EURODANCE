import axios from 'axios';
import React, { useState } from 'react'
import { toast } from 'react-toastify';

const Send_notification = () => {
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false); // Состояние для индикатора загрузки

  const sendEmail = async () => {
    if (!subject || !message) {
      toast.warning("Пожалуйста, заполните тему и сообщение");
      return;
    }
    
    setIsSending(true); // Включаем индикатор загрузки
    try {
      const response = await axios.post('http://localhost:5000/send-email', {
        subject,
        message,
      });
      toast.success("Уведомление отправлено!");
      setSubject('');
      setMessage('');
    } catch (error) {
      console.error('Ошибка при отправке email:', error);
      toast.error("Произошла ошибка при отправке уведомлений");
    } finally {
      setIsSending(false); // Выключаем индикатор загрузки в любом случае
    }
  };

  return (
    <div className='send'>
      <div className='add-teacher-form'>
        <h2>Отправить уведомление</h2>
        <div>
          <input
            type="text"
            placeholder="Тема"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            disabled={isSending} // Блокируем поле во время отправки
          />
        </div>
        <div>
          <textarea
            placeholder="Сообщение"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={isSending} // Блокируем поле во время отправки
          />
        </div>
        <button 
          onClick={sendEmail} 
          className='exit-button'
          disabled={isSending} // Блокируем кнопку во время отправки
        >
          {isSending ? (
            <>
              <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
              <span className="ms-2">Отправка...</span>
            </>
          ) : (
            'Отправить'
          )}
        </button>
      </div>
    </div>
  )
}

export default Send_notification;