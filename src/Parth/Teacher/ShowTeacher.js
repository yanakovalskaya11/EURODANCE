import React, { useContext, useEffect, useState } from 'react';
import { UserContext } from '../../UserContext';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import Header from '../header/Header';
import Footer from '../Footer/Footer';
import './teacher.css';

const ShowTeacher = () => {
    const [teacher, setTeacher] = useState(null);
    const [schedule, setSchedule] = useState([]);
    const [loading, setLoading] = useState(true);
    const { currentUser } = useContext(UserContext);
    const params = useParams();
    const teacherid = params.id;

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Загрузка всех учителей и поиск нужного
                const teachersResponse = await axios.get('http://localhost:5000/api/teachers');
                const foundTeacher = teachersResponse.data.find(t => t.id == teacherid);
                
                if (!foundTeacher) {
                    setLoading(false);
                    return;
                }
                
                setTeacher(foundTeacher);
                
                // Загрузка расписания
                const scheduleResponse = await axios.get('http://localhost:5000/api/teacher_schedule');
                const filtered = scheduleResponse.data.filter(item => item.teacher_id == teacherid);
                setSchedule(filtered);
                
                setLoading(false);
            } catch (error) {
                console.error('Ошибка при загрузке данных:', error);
                setLoading(false);
            }
        };
        
        fetchData();
    }, [teacherid]);
const formatTime = (timeString) => {
  const date = new Date(`1970-01-01T${timeString}`);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

    const renderSchedule = () => {
        if (!schedule || schedule.length === 0) return <p className="no-schedule">Расписание пока не добавлено</p>;
        
        const scheduleBySubject = {};
        schedule.forEach(item => {
            const subject = item.subject_name;
            if (!scheduleBySubject[subject]) {
                scheduleBySubject[subject] = [];
            }
            scheduleBySubject[subject].push({
                day: ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'][item.day],
                time: formatTime(item.time)
            });
        });


        return Object.entries(scheduleBySubject).map(([subject, entries], index) => (
            <div key={index} className="subject-schedule">
                <h3 className="subject-name">{subject}</h3>
                <ul className="schedule-list">
                    {entries.map((entry, i) => (
                        <li key={i} className="schedule-item">
                            {entry.day} в {entry.time}
                        </li>
                    ))}
                </ul>
            </div>
        ));
    };

    if (loading) return <div className="loading">Загрузка...</div>;
    if (!teacher) return <h2 className="not-found">Преподаватель не найден</h2>;

    return (
        <div className="teacher-profile">
            <Header />
            <div className='main-content'>
            
            <div className="teacher-hero">
                <div className="teacher-photo-container">
                    <img 
                        src={`http://localhost:5000${teacher.photo}`} 
                        alt={`${teacher.last_name} ${teacher.name}`} 
                        className="teacher-main-photo"
                    />
                    <div className="teacher-badge">
                        Стаж: {teacher.experience} <br></br> 
                          Рейтинг: {teacher.average_rating}
                    </div>
                </div>
                
                <div className="teacher-header">
                    <h1 className="teacher-name">
                        {teacher.last_name} {teacher.name} {teacher.father_name}
                    </h1>
                    <div className="teacher-specialties">
                        {teacher.subjects && teacher.subjects.length > 0 ? (
                            teacher.subjects.map((subject, index) => (
                                  <Link 
    key={index}
    to={`/napravleniya/${subject.id}`}
    className="specialty-tag"
  >
    {subject.name}
  </Link>
                            ))
                        ) : (
                            <span className="specialty-tag">Нет направлений</span>
                        )}
                    </div>
                </div>
            </div>
            
            <div className="teacher-content">
                <div className="teacher-about">
                    <h2 classNamыe="section-title">О преподавателе</h2>
                    <p className="teacher-bio">{teacher.info}</p>
                    

                </div>
                
                <div className="teacher-schedule">
                    <h2 className="section-title">Расписание занятий</h2>
                    {renderSchedule()}
                </div>
            </div>
            
            <Footer />
        </div>
        </div>
    );
};

export default ShowTeacher;