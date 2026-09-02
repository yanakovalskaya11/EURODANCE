import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import './Peyment.css';
import { toast } from 'react-toastify';
import Footer from '../Parth/Footer/Footer';

const Peyment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);

  const id_ticket = searchParams.get('id_ticket');
  const id_student = searchParams.get('id_student');
  const start_date = searchParams.get('start_date');
  const end_date = searchParams.get('end_date');
  const price = searchParams.get('price');
  const date = searchParams.get('date'); // для разовой оплаты
  const id_teacher = searchParams.get('teacher_id'); 

  const [ticketInfo, setTicketInfo] = useState(null);
  const [loading, setLoading] = useState(!!id_ticket); // загружаем только если есть id_ticket

  useEffect(() => {
    const fetchTicketInfo = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/tickets`);
        const ticket = res.data.find(t => String(t.id) === String(id_ticket));
        if (ticket) {
          setTicketInfo(ticket);
        } else {
          console.warn("Абонемент не найден по ID:", id_ticket);
        }
      } catch (error) {
        console.error('Ошибка при загрузке данных абонемента:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id_ticket) {
      fetchTicketInfo();
    } else {
      setLoading(false);
    }
  }, [id_ticket]);

const handleFakePayment = async () => {
  try {
    const id_type = searchParams.get('id_type');
    const is_single = !id_ticket || ['null', 'undefined', ''].includes(id_ticket);
    const is_group = !is_single;

    if (is_single) {
      if (!id_student || !id_teacher || !id_type) {
        toast.error('Недостаточно данных для разовой оплаты');
        return;
      }

      const date = searchParams.get('date');
      if (!date) {
        toast.err('Дата занятия не указана');
        return;
      }

      const payload = {
        id_student,
        id_teacher,
        id_type,
        date,
        is_single,
        is_group,
      };

      await axios.post('http://localhost:5000/api/reservations', payload);
    } else {
      if (!id_student || !id_ticket || !start_date || !end_date) {
        toast.error('Недостаточно данных для оформления абонемента');
        return;
      }

      await axios.post(
        'http://localhost:5000/api/student_ticket',
        {
          id_student,
          id_ticket,
          start_date,
          end_date,
        },
        {
          headers: {
            'Content-Type': 'application/json', // на всякий случай
          },
        }
      );
    }

    navigate('/payment/success');
  } catch (err) {
    console.error('Ошибка при оплате:', err.response?.data || err.message);
    toast.error('Ошибка при обработке оплаты');
  }
};



  if (loading) {
    return <div className="payment-loading">Загрузка информации об абонементе...</div>;
  }

  return (
    <>
    <div className="payment-page">
      <div className="payment-card">
        <h2>Подтверждение оплаты</h2>
        <div className="payment-details">
          {id_ticket && ticketInfo ? (
            <>
              <p><strong>Название:</strong> {ticketInfo.name_ticket}</p>
              <p><strong>Срок действия:</strong> {ticketInfo.time} дней</p>
              <p><strong>Дата начала:</strong> {start_date}</p>
              <p><strong>Дата окончания:</strong> {end_date}</p>
            </>
          ) : (
            <>
              <p><strong>Оплата разового занятия</strong></p>
              <p><strong>Дата занятия:</strong> {date}</p>
            </>
          )}
          <p><strong>Стоимость:</strong> {price} BYN</p>
        </div>
        <button className="payment-button" onClick={handleFakePayment}>
          Оплатить
        </button>
      </div>

    </div>
          </>
  );
};

export default Peyment;
