import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './admin.css';

const ReservationsTable = () => {
    const [reservations, setReservations] = useState([]);
    const [sortOrder, setSortOrder] = useState('asc');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    useEffect(() => {
        fetchReservations();
    }, []);

    const fetchReservations = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/reservations');
            
            setReservations(response.data);
        } catch (error) {
            console.error('Ошибка при загрузке бронирований:', error);
        }
    };

    // Фильтрация и сортировка одновременно
   const getFilteredAndSortedReservations = () => {
    // Сначала фильтруем
    const filtered = [...reservations].filter((res) => {
        const resDate = new Date(res.date).getTime();
        const start = startDate ? new Date(startDate).getTime() : null;
        const end = endDate ? new Date(endDate).getTime() : null;

        return (!start || resDate >= start) && (!end || resDate <= end);
    });

    // Затем сортируем
    return filtered.sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });
};

    const filteredReservations = getFilteredAndSortedReservations();

    return (
        <div className="Naprav">
            <h2>Бронирования</h2>

            <p>
                Сортировать по дате:&nbsp;
                <select onChange={(e) => setSortOrder(e.target.value)} value={sortOrder}>
                    <option value="asc">По возрастанию</option>
                    <option value="desc">По убыванию</option>
                </select>
            </p>

            <p>
                Фильтр по диапазону дат:&nbsp;
                <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                />
                &nbsp;
                <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                />
            </p>

            <table>
                <thead>
                    <tr>
                        <th>ID записи</th>
                        <th>Посетитель (ID, Email, Имя)</th>
                        <th>Преподаватель (ID, Email, Имя)</th>
                        <th>Тип направления</th>
                        <th>Дата</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredReservations.map((res) => (
                        <tr key={res.id_student + '-' + res.id_teacher + '-' + res.date}>
                            <td>{res.id}</td>
                            <td>{res.id_student}, {res.student_email}, {res.student_name}</td>
                            <td>{res.id_teacher}, {res.teacher_email}, {res.teacher_name}</td>
                            <td>{res.type_name}</td>
                            <td>{new Date(res.date).toLocaleString()}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default ReservationsTable;
