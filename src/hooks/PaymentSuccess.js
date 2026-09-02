import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './PaymentSuccess.css';

const PaymentSuccess = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const finalizeSingleReservation = async () => {
      const pending = localStorage.getItem('pendingReservation');
      if (!pending) return;

      const data = JSON.parse(pending);

      try {
        await axios.post('http://localhost:5000/api/reservations', {
          ...data,
          is_single: true,
          is_group: false,
        });

        console.log('Разовая бронь успешно создана после оплаты');
      } catch (err) {
        console.error('Ошибка при создании брони после оплаты:', err);
      } finally {
        localStorage.removeItem('pendingReservation'); // чтобы не дублировалось
      }
    };

    finalizeSingleReservation();
  }, []);

  const handleGoHome = () => {
    navigate('/personal'); // или другой маршрут
  };

  return (
    <div className="payment-success-container">
      <div className="payment-card">
        <div className="success-icon">✔️</div>
        <h2 className="success-title">Оплата прошла успешно</h2>
        <p className="success-message_pay">Спасибо за покупку абонемента или разового занятия!</p>
        <p className="success-subtext">Квитанция отправлена на вашу почту.</p>
        <button className="success-button" onClick={handleGoHome}>
          Перейти в личный кабинет
        </button>
      </div>
    </div>
  );
};

export default PaymentSuccess;
