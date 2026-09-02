import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './CancelRequests.css';
import { toast } from 'react-toastify';

const CancelRequests = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchRequests = async () => {
            try {
                const response = await axios.get('http://localhost:5000/api/teachers_days_off/pending');
                
                
                if (!Array.isArray(response.data)) {
                    throw new Error('Invalid data format received');
                }
                
                setRequests(response.data);
                setError('');
            } catch (err) {
                console.error('Error fetching requests:', err);
                setError('Failed to load requests');
                setRequests([]);
            } finally {
                setLoading(false);
            }
        };

        fetchRequests();
    }, []);

    const handleDecision = async (id, decision) => {
        try {
            if (decision) {
                await axios.put(`http://localhost:5000/api/teachers_days_off/${id}/approve`);
            } else {
                await axios.delete(`http://localhost:5000/api/teachers_days_off/${id}`);
            }
            
            setRequests(prev => prev.filter(request => request.id !== id));
            toast.success(`Заявка ${decision ? 'подтверждена' : 'отклонена'}`);
        } catch (err) {
            console.error('Ошибка при обработке заявки:', err);
            toast.error(`Не удалось ${decision ? 'подтвердить' : 'отклонить'} заявку: ${err.response?.data?.error || err.message}`);
        }
    };

    if (loading) return <div>Loading...</div>;
    if (error) return <div className="error">{error}</div>;

    return (
        <div className="cancel-requests-container">
            
            {requests.length === 0 ? (
                <p>Нет занятий для отмены</p>
            ) : (
                <table className='Naprav'>
                    <thead>
                        <tr>
                            <th>Дата</th>
                            <th>Учитель</th>
                            <th>Причина</th>
                            <th>Действие</th>
                        </tr>
                    </thead>
                    <tbody>
                        {requests.map(request => (
                            <tr key={request.id}>
                                <td>{new Date(request.date).toLocaleDateString('ru-RU')}</td>
                                <td>{request.name}</td>
                                <td>{request.reason}</td>
                                <td>
                                    <div className="requests-table">
                                    <button 
                                        onClick={() => handleDecision(request.id, true)}
                                        className="confirm-btn"
                                    >
                                        Подтвердить
                                        
                                    </button>
                                    <button 
                                        onClick={() => handleDecision(request.id, false)}
                                        className="reject-btn"
                                    >
                                        Отклонить
                                    </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default CancelRequests;