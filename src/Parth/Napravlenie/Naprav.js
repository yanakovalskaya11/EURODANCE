import React, { useContext, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../header/Header';
import Footer from '../Footer/Footer';
import DatePicker, { registerLocale } from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { UserContext } from '../../UserContext';
import './nap.css';
import ru from 'date-fns/locale/ru';
import { toast } from 'react-toastify';


registerLocale('ru', ru);
const Naprav = () => {
    const videoRef = useRef(null);
    const [napravleniya, setNapravleniya] = useState([]);
    const { currentUser } = useContext(UserContext);
    const [date, setDate] = useState('');
    const [names, setNames] = useState([]);
    const [selectedName, setSelectedName] = useState('');
    const [selectedID, setID] = useState('');
    const [teacherDays, setTeacherDays] = useState([]);
    const [availableDates, setAvailableDates] = useState([]);
    const [hasActiveTicket, setHasActiveTicket] = useState(false);
    const [availableSpots, setAvailableSpots] = useState(0);
    const [showTicketModal, setShowTicketModal] = useState(false);
    const [lessonType, setLessonType] = useState('subscription');
    const [activeTicket, setActiveTicket] = useState(null);
    const [dateOutsideTicket, setDateOutsideTicket] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [reservationLock, setReservationLock] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [cardNumber, setCardNumber] = useState('');
    const [cardName, setCardName] = useState('');
    const [cardExpiry, setCardExpiry] = useState('');
    const [cardCvv, setCardCvv] = useState('');
    const [cancelledDays, setCancelledDays] = useState([]);

    const navigate = useNavigate();
    const params = useParams();
    const napravID = params.id;
    const type = napravleniya.find(p => p.id == napravID);
    

    useEffect(() => {
        axios.get('http://localhost:5000/api/napravleniya')
            .then((response) => setNapravleniya(response.data))
            .catch((error) => console.error('Ошибка при получении направлений:', error));
    }, []);

    useEffect(() => {
  const video = videoRef.current;
  if (!video) return;
  

  const handleTimeUpdate = () => {
    // Проверяем, не пытается ли видео "прыгнуть" назад
    if (video.currentTime < video.duration && video.currentTime > video.previousTime + 1) {
      video.currentTime = video.previousTime;
    }
    video.previousTime = video.currentTime;
  };

  video.addEventListener('timeupdate', handleTimeUpdate);
  
  return () => {
    video.removeEventListener('timeupdate', handleTimeUpdate);
  };
}, []);

useEffect(() => {
    if (selectedID) {
        axios.get(`http://localhost:5000/api/teachers_days_off_to_user?id_teacher=${selectedID}`)
            .then(response => {
                setCancelledDays(Array.isArray(response.data) ? response.data : []);
            })
            .catch(error => {
                console.error('Ошибка при загрузке отмененных дней:', error);
                setCancelledDays([]);
                setError('Не удалось загрузить информацию об отмененных днях');
            });
    }
}, [selectedID]);



const isDayCancelled = (dateStr) => {
    if (!dateStr || !Array.isArray(cancelledDays)) return false;
    
    try {
        const normalizedDate = new Date(dateStr).toISOString().split('T')[0];
        return cancelledDays.some(day => {
            if (!day || !day.date) return false;
            const dayDate = new Date(day.date).toISOString().split('T')[0];
            return dayDate === normalizedDate;
        });
    } catch (e) {
        console.error('Ошибка при проверке отмененных дней:', e);
        return false;
    }
};

useEffect(() => {
    if (currentUser) {
        axios.get(`http://localhost:5000/api/user-tickets?userId=${currentUser.id}`)
            .then((response) => {
                const today = new Date();
                today.setHours(0, 0, 0, 0); 
                
                const ticket = response.data.find(ticket => {
                    const startDate = new Date(ticket.start_date);
                    startDate.setHours(0, 0, 0, 0);
                    const endDate = new Date(ticket.end_date);
                    endDate.setHours(0, 0, 0, 0);
                    
                    return startDate <= endDate && 
                           (today <= endDate); 
                });
                
                setHasActiveTicket(!!ticket);
                setActiveTicket(ticket || null);
            })
            .catch((error) => console.error('Ошибка при проверке абонемента:', error));
    }
}, [currentUser]);

    useEffect(() => {
        axios.get(`http://localhost:5000/api/teachers?napravID=${napravID}`)
            .then((response) => {
                setNames(response.data);
                if (response.data.length > 0) {
                    setSelectedName(response.data[0].name);
                    setID(response.data[0].id);
                }
            })
            .catch((error) => console.error('Ошибка при загрузке преподавателей:', error));
    }, [napravID]);

    useEffect(() => {
        if (selectedID && date) {
            axios.get(`http://localhost:5000/api/available-spots?teacherId=${selectedID}&date=${date}&typeId=${napravID}`)
                .then((response) => setAvailableSpots(response.data.availableSpots))
                .catch((error) => console.error('Ошибка при проверке мест:', error));
        }
    }, [selectedID, date, napravID]);

useEffect(() => {
    if (selectedID && type) {
        axios.get('http://localhost:5000/api/teacher_schedule')
            .then((response) => {
                const filtered = response.data.filter(entry =>
                    entry.teacher_id == selectedID && entry.subject_name === type.name
                );
                setTeacherDays(filtered);

                const available = [];
                const now = new Date();
                
                // Генерируем даты на 6 месяцев вперед
                for (let m = 0; m < 6; m++) {
                    const month = now.getMonth() + m;
                    const year = now.getFullYear() + Math.floor(month / 12);
                    const adjustedMonth = month % 12;
                    
                    const daysInMonth = new Date(year, adjustedMonth + 1, 0).getDate();
                    
                    filtered.forEach(({ day }) => {
                        for (let d = 1; d <= daysInMonth; d++) {
                            const currentDate = new Date(year, adjustedMonth, d);
                            if (currentDate.getDay() === day && currentDate >= now) {
                                available.push(new Date(currentDate));
                            }
                        }
                    });
                }

                setAvailableDates(available.filter((v, i, self) =>
                    i === self.findIndex((t) =>
                        t.toISOString().split("T")[0] === v.toISOString().split("T")[0]
                    )
                ));
            })
            .catch((error) => console.error('Ошибка при получении расписания:', error));
    }
}, [selectedID, type]);

    const isPaymentFormValid = () => {
        return cardNumber.length === 19 &&
               cardName.trim() !== '' &&
               /^\d{2}\/\d{2}$/.test(cardExpiry) &&
               /^\d{3}$/.test(cardCvv);
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}.${month}.${year}`;
    };

const handleDateChange = (selectedDate) => {
    if (!selectedDate) {
        setDate('');
        setError('');
        return;
    }
    
    // Форматируем дату в строку YYYY-MM-DD
    const dateStr = [
        selectedDate.getFullYear(),
        String(selectedDate.getMonth() + 1).padStart(2, '0'),
        String(selectedDate.getDate()).padStart(2, '0')
    ].join('-');
    
    setDate(dateStr);

    // Проверяем, отменен ли день
    if (isDayCancelled(dateStr)) {
        setError('Этот день отменен преподавателем, запись невозможна');
    } else {
        setError(''); // Очищаем ошибку, если день доступен
        // Дополнительно проверяем доступные места
        if (selectedID && dateStr) {
            axios.get(`http://localhost:5000/api/available-spots?teacherId=${selectedID}&date=${dateStr}&typeId=${napravID}`)
                .then((response) => setAvailableSpots(response.data.availableSpots))
                .catch((error) => console.error('Ошибка при проверке мест:', error));
        }
    }
};

const checkExistingReservation = async () => {
    try {
        const response = await axios.get(
            `http://localhost:5000/api/user-reservations?userId=${currentUser.id}&date=${date}`
        );

        // Строгое сравнение: не допускать повтор по ТОМУ ЖЕ преподавателю и направлению
        return response.data.some(res =>
            res.id_type == napravID &&
            res.id_teacher == selectedID &&
            res.status !== 'cancelled'
        );
    } catch (error) {
        console.error('Ошибка при проверке записей:', error);
        return false;
    }
};


    const proceedWithReservation = async () => {
        if (reservationLock) return;
        setReservationLock(true);
        
        try {
            const idType = parseInt(napravID, 10);
            const isSingle = lessonType === 'single';
            
            const response = await axios.post('http://localhost:5000/api/reservations', {
                id_student: currentUser.id,
                id_teacher: selectedID,
                id_type: idType,
                date: date,
                is_group: !isSingle,
                is_single: isSingle
            }, {
                headers: {
                    'X-Request-ID': Date.now()
                }
            });

            if (response.data) {
                toast.success("Ваша запись оформлена");
                setAvailableSpots(prev => prev - 1);
            }
        } catch (error) {
            console.error('Ошибка при добавлении бронирования:', error);
            setError(error.response?.data?.error || 'Произошла ошибка при записи');
        } finally {
            setReservationLock(false);
        }
    };

    const handlePaymentSubmit = () => {
        setShowPaymentModal(false);
        const query = new URLSearchParams({
            id_type: napravID,
            id_student: currentUser.id,
            date,
            teacher_id: selectedID,
            lesson_type: 'single',
            price: 16
        }).toString();

        navigate(`/payment?${query}`);
    };

  const addReservation = async () => {
    if (isSubmitting || reservationLock) return;
    
    if (!currentUser || !selectedID || !napravID || !date) {
        setError('Пожалуйста, заполните все поля.');
        return;
    }

    // Дополнительная проверка на отмененный день
    if (isDayCancelled(date)) {
        setError('Этот день отменен преподавателем');
        return;
    }

    setIsSubmitting(true);
    setError('');

    try {
        const selectedDate = new Date(date);
        selectedDate.setHours(0, 0, 0, 0);
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Проверяем, есть ли у пользователя абонемент, который покроет выбранную дату
        const hasValidTicket = activeTicket && 
                              new Date(activeTicket.start_date) <= selectedDate && 
                              new Date(activeTicket.end_date) >= selectedDate;

        if (lessonType === 'subscription' && !hasValidTicket) {
            setShowTicketModal(true);
            return;
        }

        if (availableSpots <= 0) {
            setError('На выбранную дату нет свободных мест.');
            return;
        }

        const alreadyBooked = await checkExistingReservation();
        if (alreadyBooked) {
            setError('Вы уже записаны на этот день.');
            return;
        }

        if (lessonType === 'single') {
            setShowPaymentModal(true);
            return;
        }

        await proceedWithReservation();
    } catch (error) {
        console.error('Ошибка:', error);
        setError('Произошла ошибка при записи');
    } finally {
        setIsSubmitting(false);
    }
};


    useEffect(() => {
    if (lessonType === 'subscription' && activeTicket && date) {
        const selected = new Date(date);
        const start = new Date(activeTicket.start_date);
        // Убираем проверку на "раньше начала абонемента"
        setDateOutsideTicket(selected > new Date(activeTicket.end_date));
    } else {
        setDateOutsideTicket(false);
    }
}, [date, activeTicket, lessonType]);

    const getTomorrowDate = () => {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow;
    };

    const dayNames = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
    const teacherAvailableDays = Array.from(new Set(teacherDays.map(item => item.day))).map(day => dayNames[day]);

    if (!type) return (<h2>Направление не найдено</h2>);

    if (!currentUser || currentUser.role === 'admin' || currentUser.role==='teacher') {
        return (
            <>
                <Header />
               <div className='type'>
                <h2>{type.name}</h2>
                  <div className="video-container">
                 <video 
      ref={videoRef}
      controls 
      width="100%"
      poster={`http://localhost:5000${type.photo}`} // Добавьте постер из фото направления
    >
      <source src={`http://localhost:5000${type.video}`} type="video/mp4" />
      Ваш браузер не поддерживает видео
    </video>
    </div>
                    <p>{type.destriction}</p>
                    <form>
                        <div>
                            <label>Имя преподавателя:</label>
                            <select
                                value={selectedName}
                                onChange={(e) => {
                                    const name = e.target.value;
                                    const teacher = names.find(t => t.name === name);
                                    setID(teacher?.id || '');
                                    setSelectedName(name);
                                    setDate('');
                                }}
                            >
                                {names.map(name => (
                                    <option key={name.id} value={name.name}>{name.name}</option>
                                ))}
                            </select>
                            {selectedName && (
                                <input type='text' value={`Вы выбрали: ${selectedName}`} readOnly />
                            )}
                             <div className="teacher-schedule-info">
        <h4>Расписание преподавателя:</h4>
        <ul>
            {teacherDays.map((item, index) => (
                <p key={index}>
                    {dayNames[item.day]} — уровень: <strong>{item.level}</strong>
                </p>
            ))}
        </ul>
    </div>
                        </div>
                    </form>
                </div>
                <Footer />
            </>
        );
    }

    return (
        <>
            <Header />
            <div className='type'>
                <h2>{type.name}</h2>
                  <div className="video-container">
                 <video 
      ref={videoRef}
      controls 
      width="100%"
      poster={`http://localhost:5000${type.photo}`} // Добавьте постер из фото направления
    >
      <source src={`http://localhost:5000${type.video}`} type="video/mp4" />
      Ваш браузер не поддерживает видео
    </video>
    </div>
                <p>{type.destriction}</p>

                <form>
                    <div>
                        <label>Тип записи:</label>
                        <select
                            value={lessonType}
                            onChange={(e) => setLessonType(e.target.value)}
                        >
                            <option value="subscription">Абонемент</option>
                            <option value="single">Разовое занятие</option>
                        </select>
                    </div>

                    <div>
                        <label>Имя преподавателя:</label>
                        <select
                            value={selectedName}
                            onChange={(e) => {
                                const name = e.target.value;
                                const teacher = names.find(t => t.name === name);
                                setID(teacher?.id || '');
                                setSelectedName(name);
                                setDate('');
                            }}
                        >
                            {names.map(name => (
                                <option key={name.id} value={name.name}>{name.name}</option>
                            ))}
                        </select>

                        {selectedName && (
                            <input type='text' value={`Вы выбрали: ${selectedName}`} readOnly />
                        )}
                        {teacherDays.length > 0 && (
    <div className="teacher-schedule-info">
        <h4>Расписание преподавателя:</h4>
        <ul>
            {teacherDays.map((item, index) => (
                <p key={index}>
                    {dayNames[item.day]} — уровень: <strong>{item.level}</strong>
                </p>
            ))}
        </ul>
    </div>
)}

<div className='type_d'>
                        <DatePicker
                    selected={date ? new Date(date) : null}
                    onChange={handleDateChange}
                    placeholderText="Выберите дату"
                    minDate={getTomorrowDate()}
                    filterDate={(date) => {
                        const dateStr = [
                            date.getFullYear(),
                            String(date.getMonth() + 1).padStart(2, '0'),
                            String(date.getDate()).padStart(2, '0')
                        ].join('-');
                        
                        return availableDates.some(av => {
                            const avStr = [
                                av.getFullYear(),
                                String(av.getMonth() + 1).padStart(2, '0'),
                                String(av.getDate()).padStart(2, '0')
                            ].join('-');
                            return avStr === dateStr && !isDayCancelled(dateStr);
                        });
                    }}
                    dateFormat="dd.MM.yyyy"
                    showMonthDropdown
                    showYearDropdown
                    dropdownMode="select"
                    adjustDateOnChange
                    locale="ru"
                    weekStartsOn={1} // 1 - понедельник, 0 - воскресенье
                    className="dark-theme-datepicker"
                    calendarClassName="dark-theme-calendar"
                    dayClassName={(date) => {
                        const dateStr = [
                            date.getFullYear(),
                            String(date.getMonth() + 1).padStart(2, '0'),
                            String(date.getDate()).padStart(2, '0')
                        ].join('-');
                        return isDayCancelled(dateStr) ? 'disabled-day' : '';
                    }}
                />

{error && <p className="error">{error}</p>}

{date && !isDayCancelled(date) && availableSpots > 0 && (
    <p>Доступно мест: {availableSpots}</p>
)}

{date && !isDayCancelled(date) && availableSpots <= 0 && (
    <p className="error">На выбранную дату нет свободных мест</p>
)}

{date && isDayCancelled(date) && (
    <p className="error">Этот день отменен преподавателем, запись невозможна</p>
)}
                    </div>
                    </div>
                </form>

                {error && <p className="error">{error}</p>}

<button
  onClick={addReservation}
  disabled={
    isSubmitting ||
    !date ||
    availableSpots <= 0 ||
    isDayCancelled(date) ||
    (lessonType === 'subscription' && 
     activeTicket && 
     new Date(date) > new Date(activeTicket.end_date))
  }
>
  {isSubmitting ? 'Записываем...' : 'Записаться'}
</button>
{date && isDayCancelled(date) && (
  <p className="error">Этот день отменен преподавателем, запись невозможна</p>
)}

                {dateOutsideTicket && (
    <p className="error">
        Выбранная дата после окончания вашего абонемента (
        {formatDate(activeTicket?.start_date)} - {formatDate(activeTicket?.end_date)})
    </p>
)}
{activeTicket && (
    <div className="ticket-info">
        <p>
            Ваш абонемент действует с {formatDate(activeTicket.start_date)} по {formatDate(activeTicket.end_date)}
        </p>
        {new Date() < new Date(activeTicket.start_date) && (
            <p className="info-notice">
                Вы можете записываться на занятия, начиная с {formatDate(activeTicket.start_date)}
            </p>
        )}
    </div>
)}
            </div>
            <Footer />

            {showTicketModal && (
                <div className="modal-overlay">
                    <div className="modal">
                        <h3>Требуется абонемент</h3>
                        <p>Для записи необходимо приобрести абонемент или выбрать "разовое занятие".</p>
                        <div className="modal-buttons">
                            <button onClick={() => {
                                setShowTicketModal(false);
                                window.location.href = '/tickets';
                            }}>
                                Купить абонемент
                            </button>
                            <button onClick={() => {
                                setLessonType('single');
                                setShowTicketModal(false);
                            }}>
                                Выбрать разовое занятие
                            </button>
                            <button onClick={() => setShowTicketModal(false)}>Закрыть</button>
                        </div>
                    </div>
                </div>
            )}

            {showPaymentModal && (
                <div className="payment-modal-overlay">
                    <div className="payment-modal">
                        <h3>Оплата разового занятия</h3>
                        <p className="payment-amount">К оплате: 16 BYN</p>
                        
                        <div className="payment-form">
                            <div className="form-group">
                                <label>Номер карты</label>
                                <input
                                    type="text"
                                    value={cardNumber}
                                    onChange={(e) => {
                                        const value = e.target.value.replace(/\D/g, '');
                                        let formatted = value.replace(/(\d{4})/g, '$1 ').trim();
                                        if (formatted.length > 19) formatted = formatted.substring(0, 19);
                                        setCardNumber(formatted);
                                    }}
                                    placeholder="1234 5678 9012 3456"
                                    maxLength="19"
                                />
                            </div>
                            
                            <div className="form-group">
                                <label>Имя владельца</label>
                                <input
                                    type="text"
                                    value={cardName}
                                    onChange={(e) => setCardName(e.target.value.toUpperCase())}
                                    placeholder="IVAN IVANOV"
                                />
                            </div>
                            
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Срок действия</label>
                                    <input
                                        type="text"
                                        value={cardExpiry}
                                        onChange={(e) => {
                                            const value = e.target.value.replace(/\D/g, '');
                                            let formatted = value;
                                            if (value.length > 2) {
                                                formatted = `${value.substring(0, 2)}/${value.substring(2, 4)}`;
                                            }
                                            if (formatted.length > 5) formatted = formatted.substring(0, 5);
                                            setCardExpiry(formatted);
                                        }}
                                        placeholder="MM/YY"
                                        maxLength="5"
                                    />
                                </div>
                                
                                <div className="form-group">
                                    <label>CVV</label>
                                    <input
                                        type="text"
                                        value={cardCvv}
                                        onChange={(e) => {
                                            const value = e.target.value.replace(/\D/g, '');
                                            if (value.length <= 3) setCardCvv(value);
                                        }}
                                        placeholder="123"
                                        maxLength="3"
                                    />
                                </div>
                            </div>
                        </div>
                        
                        <div className="payment-actions">
                            <button 
                                className="pay-button" 
                                onClick={handlePaymentSubmit}
                                disabled={!isPaymentFormValid()}
                            >
                                Оплатить
                            </button>
                            <button 
                                className="cancel-button"
                                onClick={() => setShowPaymentModal(false)}
                            >
                                Отмена
                            </button>
                        </div>
                        
                        <div className="payment-security">
                            <p>Ваши данные защищены</p>
                            <div className="payment-icons">
                                <span className="visa-icon">VISA</span>
                                <span className="mastercard-icon">Mastercard</span>
                                <span className="secure-icon">Secure</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Naprav;