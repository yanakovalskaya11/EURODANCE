import axios from 'axios';
import React, { useContext, useEffect, useState } from 'react';
import './ticket.css';
import { UserContext } from '../../UserContext';
import { NavLink } from 'react-router-dom';

const ShowTickets = () => {
    const [tickets, setTickets] = useState([]);
    const { currentUser } = useContext(UserContext);
    const [discounts, setDiscounts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [ticketsRes, discountsRes] = await Promise.all([
                    axios.get('http://localhost:5000/api/Tickets'),
                    axios.get('http://localhost:5000/api/active-discounts')
                ]);
                
                setTickets(ticketsRes.data);
                setDiscounts(discountsRes.data);
            } catch (error) {
                console.error("Ошибка при загрузке данных:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    const getDiscountedPrice = (ticket) => {
        const discount = discounts.find(d => +d.abonement_id === +ticket.id);
        if (!discount) return ticket.price;

        const newPrice = ticket.price * (1 - discount.discount_percent / 100);
        return Math.round(newPrice);
    };

    if (isLoading) {
        return <div className="loading">Загрузка...</div>;
    }

    return (
        <div className="ticket-page">
            <h1 className="ticket-title">Абонементы</h1>
            
            <div className="tickets">
                {tickets.map((ticket) => (
                    <div key={ticket.id} className="ticket">
                        <h3>{ticket.name_ticket}</h3>
                        <img 
                            src={`http://localhost:5000${ticket.photo}`} 
                            alt={ticket.name_ticket}
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = '/default-ticket.jpg';
                            }}
                        />
                        <div className="ticket-content">
                            <p>{ticket.descr}</p>
                            <p className="ticket-detail">Срок действия: <span>{ticket.time} дней</span></p>
                            <p className="ticket-detail">
                                Цена: <span className="price">
                                    {getDiscountedPrice(ticket)} BYN
                                    {getDiscountedPrice(ticket) !== ticket.price && (
                                        <span className="old-price"> {ticket.price} BYN</span>
                                    )}
                                </span>
                            </p>
                            <p className="ticket-notice">ВНИМАНИЕ: {ticket.limits}</p>
                        </div>
                        <NavLink to={`/tickets/${ticket.id}`} className="ticket-button">
                            Подробнее
                        </NavLink>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ShowTickets;