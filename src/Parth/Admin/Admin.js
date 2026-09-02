import React, { useContext, useState, useEffect } from 'react';
import NapravTable from './NapravTable';
import TicketTable from './TicketTable';
import TeachersTable from './TeachersTable';
import Teacher_Types from './Teacher_Types';
import NewsTable from './NewsTable';
import ShowComments from './ShowComments';
import Send_notification from './Send_notification';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../../UserContext';
import './admin.css';
import ReservationsTable from './ReservationsTable';
import CancelRequests from './CancelRequests';
import AdminSurveys from './AdminSurveys';
import ThingsTable from './ThingsTable';
import { FaBars, FaTimes } from 'react-icons/fa';
import AdminOrdersPanel from './AdminOrdersPanel';
import AddStockForm from './AddStock';
import StockPage from './StocksPage'
import { Statistic } from 'antd';
import Statictic from './Statictic';

const Admin = () => {
    const { currentUser, setCurrentUser } = useContext(UserContext);
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('naprav');
    const [isMobile, setIsMobile] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
useEffect(() => {
    if (!currentUser || currentUser.role !== 'admin') {
        navigate('/');
    }
}, [currentUser]);


    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };

        handleResize(); // Проверяем при загрузке
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        if (isMobile) setMenuOpen(false); // Закрываем меню после выбора на мобильных
    };

    const exit = () => {
        fetch('http://localhost:5000/api/logout', {
            method: 'POST',
            credentials: 'include',
        })
        .then((res) => {
            if (!res.ok) throw new Error('Ошибка при выходе');
            setCurrentUser(null);
            localStorage.removeItem('user');
            navigate('/');
        })
        .catch((error) => {
            console.error('Ошибка при выходе:', error);
        });
    };

    return (
       <div className="admin-container">
        
            {/* Хедер для мобильных */}
            {isMobile && (
                <header className="mobile-header">
                    <button 
                        className="mobile-menu-button"
                        onClick={() => setMenuOpen(!menuOpen)}
                    >
                        {menuOpen ? <FaTimes /> : <FaBars />}
                    </button>
                    <h2>Админ-панель</h2>
                </header>
            )}

            {/* Боковое меню */}
            <aside className={`sidebar ${menuOpen ? 'open' : ''}`}>
                {!isMobile && <h2>Меню</h2>}
                <ul>
                    <li className={activeTab === 'naprav' ? 'active' : ''} onClick={() => handleTabChange('naprav')}>Направления</li>
                    <li className={activeTab === 'tickets' ? 'active' : ''} onClick={() => handleTabChange('tickets')}>Абонементы</li>
                    <li className={activeTab === 'teachers' ? 'active' : ''} onClick={() => handleTabChange('teachers')}>Преподаватели</li>
                    <li className={activeTab === 'teacher_types' ? 'active' : ''} onClick={() => handleTabChange('teacher_types')}>Направления преподавателя</li>
                    <li className={activeTab === 'stocks' ? 'active' : ''} onClick={() => handleTabChange('stocks')}>Акции</li>
                    <li className={activeTab === 'news' ? 'active' : ''} onClick={() => handleTabChange('news')}>Новости</li>
                    <li className={activeTab === 'notifications' ? 'active' : ''} onClick={() => handleTabChange('notifications')}>Уведомления</li>
                    <li className={activeTab === 'scores' ? 'active' : ''} onClick={() => handleTabChange('scores')}>Вещи за баллы</li>
                    <li className={activeTab === 'scores_admin' ? 'active' : ''} onClick={() => handleTabChange('scores_admin')}>Отслеживание вещей</li>
                    <li className={activeTab === 'comments' ? 'active' : ''} onClick={() => handleTabChange('comments')}>Комментарии</li>
                    <li className={activeTab === 'reservations' ? 'active' : ''} onClick={() => handleTabChange('reservations')}>Занятия</li>
                    <li className={activeTab === 'cancel' ? 'active' : ''} onClick={() => handleTabChange('cancel')}>Отмена занятий</li>
                    <li className={activeTab === 'surveys' ? 'active' : ''} onClick={() => handleTabChange('surveys')}>Анкетирование</li>
                    <li className={activeTab === 'statictic' ? 'active' : ''} onClick={() => handleTabChange('statictic')}>Статистика учителей</li>
                </ul>
                <button className="exit-button" onClick={exit}>Выйти</button>
            </aside>

            <main className="content">
                {activeTab === 'naprav' && <NapravTable />}
                {activeTab === 'tickets' && <TicketTable />}
                {activeTab === 'teachers' && <TeachersTable />}
                {activeTab === 'teacher_types' && <Teacher_Types />}
                {activeTab === 'stocks' && <StockPage />}                
                {activeTab === 'news' && <NewsTable />}
                {activeTab === 'notifications' && <Send_notification />}
                {activeTab === 'scores' && <ThingsTable/>}
                {activeTab === 'scores_admin' && <AdminOrdersPanel/>}
                {activeTab === 'comments' && <ShowComments />}
                {activeTab === 'reservations' && <ReservationsTable/>}
                {activeTab === 'cancel' && <CancelRequests/>}
                {activeTab === 'surveys' && <AdminSurveys/>}
                 {activeTab === 'statictic' && <Statictic/>}
            </main>
        </div>
    );
};

export default Admin;