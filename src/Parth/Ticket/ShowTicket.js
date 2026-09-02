import axios from 'axios';
import React, { useContext, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../header/Header';
import Footer from '../Footer/Footer';
import { UserContext } from '../../UserContext';
import './TicketStyles.css';
import ScrollButton from '../ScrollButton';
import { toast } from 'react-toastify';

const ShowTicket = () => {
    const [ticket, setTicket] = useState([]);
    const [tickets, setTickets] = useState([]);
    const { currentUser } = useContext(UserContext);
    const [buyTicket, setBuyTicket] = useState([]);
    const navigate = useNavigate();

    const [id_student, setId_Student] = useState('');
    const [id_ticket, setId_Ticket] = useState('');
    const [start_date, setStart_date] = useState('');
    const [end_date, setEnd_date] = useState('');
    
    const params = useParams();
    const ticketID = params.id;
    const type = ticket.find(p => p.id == ticketID);
    
    const [isBuy, setBuy] = useState(false);
    const [paymentSuccess, setPaymentSuccess] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    
    const [cardNumber, setCardNumber] = useState('');
    const [cardName, setCardName] = useState('');
    const [cardExpiry, setCardExpiry] = useState('');
    const [cardCvv, setCardCvv] = useState('');

    const [discounts, setDiscounts] = useState([]);
    const [existingTickets, setExistingTickets] = useState([]);
    const [dateConflict, setDateConflict] = useState(false);
    const [dateError, setDateError] = useState('');

    useEffect(() => {
        if (currentUser) {
            axios.get(`http://localhost:5000/api/user-tickets?userId=${currentUser.id}`)
                .then(response => {
                    setExistingTickets(response.data);
                })
                .catch(error => {
                    console.error('Ошибка при загрузке абонементов:', error);
                });
        }
    }, [currentUser]);

    useEffect(() => {
        axios.get('http://localhost:5000/api/active-discounts')
            .then((res) => {
                setDiscounts(res.data);
            })
            .catch((err) => console.error('Ошибка получения скидок:', err));
    }, []);

    const getDiscountedPrice = (ticket) => {
        const discount = discounts.find(d => +d.abonement_id === +ticket.id);
        if (!discount) return ticket.price;
        const newPrice = ticket.price * (1 - discount.discount_percent / 100);
        return Math.round(newPrice);
    };

    useEffect(() => {
        axios.get('http://localhost:5000/api/Tickets')
            .then((response) => {
                setTickets(response.data);
            })
            .catch((error) => {
                console.error("Ошибка: ", error);
            });

        axios.get('http://localhost:5000/api/student_ticket')
            .then((response) => setBuyTicket(response.data))
            .catch((error) => console.error('Ошибка при получении данных:', error));

        axios.get('http://localhost:5000/api/tickets')
            .then((response) => {
                setTicket(response.data);
            })
            .catch((error) => {
                console.error('Ошибка при получении данных:', error);
            });
    }, []);

    const getMinskDate = () => {
        const minskOffset = 3 * 60;
        const date = new Date();
        const utcDate = date.getTime() + date.getTimezoneOffset() * 60000;
        const minskDate = new Date(utcDate + minskOffset * 60000);
        minskDate.setHours(0, 0, 0, 0);
        return minskDate.toISOString().split("T")[0];
    };

    const getYesterdayMinskDate = () => {
        const today = getMinskDate();
        const date = new Date(today);
        date.setDate(date.getDate() + 1);
        return date.toISOString().split("T")[0];
    };

    const handleStartDateChange = (e) => {
        const selectedDate = e.target.value;
        const today = getMinskDate();
        
        if (selectedDate < today) {
            setDateError('Нельзя выбрать прошедшую дату');
            setStart_date('');
            setEnd_date('');
            setDateConflict(false);
        } else {
            setDateError('');
            setStart_date(selectedDate);
            
            if (type) {
                const start = new Date(selectedDate);
                const end = new Date(start);
                end.setDate(start.getDate() + type.time);
                const endDateStr = end.toISOString().split('T')[0];
                setEnd_date(endDateStr);
                setDateConflict(checkDateOverlap(selectedDate, endDateStr));
            }
        }
    };

    const checkDateOverlap = (newStart, newEnd) => {
        if (!existingTickets.length) return false;
        
        const newStartDate = new Date(newStart);
        const newEndDate = new Date(newEnd);
        
        return existingTickets.some(ticket => {
            const existingStart = new Date(ticket.start_date);
            const existingEnd = new Date(ticket.end_date);
            
            return (
                (newStartDate >= existingStart && newStartDate <= existingEnd) ||
                (newEndDate >= existingStart && newEndDate <= existingEnd) ||
                (newStartDate <= existingStart && newEndDate >= existingEnd)
            );
        });
    };

    const handlePaymentSubmit = () => {
        setShowPaymentModal(false);
        const query = new URLSearchParams({
            id_ticket: type.id,
            id_student: currentUser.id,
            start_date,
            end_date,
            price: getDiscountedPrice(type)
        }).toString();

        navigate(`/payment?${query}`);
    };

    const processTicketPurchase = () => {
        fetch('http://localhost:5000/api/student_ticket', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                id_student: currentUser.id, 
                id_ticket: type.id, 
                start_date,
                end_date
            }),
        })
        .then((response) => {
            if (!response.ok) {
                throw new Error(`Ошибка HTTP! Статус: ${response.status}`);
            }
            return response.json();
        })
        .then(() => {
            setPaymentSuccess(true);
            setTimeout(() => {
                navigate('/personal');
            }, 2000);
        })
        .catch((error) => {
            console.error('Ошибка при покупке абонемента:', error);
            toast.error("Произошла ошибка при покупке абонемента");
        });
    };

    const BuyTicket = () => {
        if (!currentUser) {
            toast.warn("Сначала войдите в аккаунт!");
        } else {
            setId_Student(currentUser.id);
            setId_Ticket(type.id);
            setBuy(true);
        }
    };

    const isPaymentFormValid = () => {
        return cardNumber.length === 19 &&
               cardName.trim() !== '' &&
               /^\d{2}\/\d{2}$/.test(cardExpiry) &&
               /^\d{3}$/.test(cardCvv);
    };

    if (type === undefined) {
        return <h2>Абонемент не найден</h2>;
    }
if (!currentUser || currentUser.role === 'admin' || currentUser.role==='teacher') {
    return(
  <>
            <Header />
            <div className='main-content'>
                <div className="ticket-container">
                    <div className="ticket-card">
                        <div className="ticket-image">
                            <img src={`http://localhost:5000${type.photo}`} alt={type.name_ticket} />
                        </div>
                        
                        <div className="ticket-info">
                            <h2>{type.name_ticket}</h2>
                            
                            <div className="ticket-details">
                                <div className="detail-item">
                                    <span className="detail-label">Цена:</span>
                                    <span className="detail-value">
                                        {getDiscountedPrice(type)} BYN 
                                        {getDiscountedPrice(type) !== type.price && (
                                            <span className="old-price"> ({type.price} BYN)</span>
                                        )}
                                    </span>
                                </div>
                                
                                <div className="detail-item">
                                    <span className="detail-label">Срок действия:</span>
                                    <span className="detail-value">{type.time} дней</span>
                                </div>
                                
                                <div className="detail-item">
                                    <span className="detail-label">Лимиты:</span>
                                    <span className="detail-value">{type.limits}</span>
                                </div>
                                
                                <div className="detail-item full-width">
                                    <span className="detail-label">Описание:</span>
                                    <p className="detail-value">{type.descr}</p>
                                </div>
                            </div>
                            </div>
                            </div>
                            </div>
                            </div>
                            </>
    )
}
    return (
        <>
            <Header />
            <div className='main-content'>
                <div className="ticket-container">
                    <div className="ticket-card">
                        <div className="ticket-image">
                            <img src={`http://localhost:5000${type.photo}`} alt={type.name_ticket} />
                        </div>
                        
                        <div className="ticket-info">
                            <h2>{type.name_ticket}</h2>
                            
                            <div className="ticket-details">
                                <div className="detail-item">
                                    <span className="detail-label">Цена:</span>
                                    <span className="detail-value">
                                        {getDiscountedPrice(type)} BYN 
                                        {getDiscountedPrice(type) !== type.price && (
                                            <span className="old-price"> ({type.price} BYN)</span>
                                        )}
                                    </span>
                                </div>
                                
                                <div className="detail-item">
                                    <span className="detail-label">Срок действия:</span>
                                    <span className="detail-value">{type.time} дней</span>
                                </div>
                                
                                <div className="detail-item">
                                    <span className="detail-label">Лимиты:</span>
                                    <span className="detail-value">{type.limits}</span>
                                </div>
                                
                                <div className="detail-item full-width">
                                    <span className="detail-label">Описание:</span>
                                    <p className="detail-value">{type.descr}</p>
                                </div>
                            </div>
                            
                            {!isBuy ? (
                                <button className="buy-button" onClick={BuyTicket}>
                                    Оформить абонемент
                                </button>
                            ) : (
                                <div className="purchase-form">
                                    <h3>Оформление абонемента</h3>
                                    
                                    <div className="form-group">
                                        <label>Дата начала:</label>
                                        <input
                                            type="date"
                                            value={start_date}
                                            onChange={handleStartDateChange}
                                            min={getYesterdayMinskDate()}
                                        />
                                        {dateError && <div className="error-message">{dateError}</div>}
                                    </div>
                                    
                                    <div className="form-group">
                                        <label>Дата окончания:</label>
                                        <input
                                            type="date"
                                            value={end_date}
                                            readOnly
                                        />
                                    </div>
                                    
                                    {dateConflict && (
                                        <div className="error-message">
                                            Внимание! Выбранные даты пересекаются с существующим абонементом.
                                        </div>
                                    )}
                                    
                                    <div className="form-actions">
                                        <button 
                                            className="confirm-button" 
                                            onClick={() => setShowPaymentModal(true)}
                                            disabled={!start_date || dateConflict || dateError}
                                        >
                                            Перейти к оплате
                                        </button>
                                        {paymentSuccess && (
                                            <div className="success-message">
                                                Покупка успешно оформлена! Перенаправляем в личный кабинет...
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Модальное окно оплаты */}
                {showPaymentModal && (
                    <div className="payment-modal-overlay">
                        <div className="payment-modal">
                            <h3>Оплата абонемента</h3>
                            <p className="payment-amount">К оплате: {getDiscountedPrice(type)} BYN</p>
                            
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
                                    <span className="visa-icon"></span>
                                    <span className="mastercard-icon"></span>
                                    <span className="secure-icon"></span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                <ScrollButton/>
                <Footer />
            </div>
        </>
    );
};

export default ShowTicket;