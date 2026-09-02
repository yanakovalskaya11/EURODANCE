import axios from 'axios';
import React, { useContext, useEffect, useState, useMemo } from 'react';
import { UserContext } from '../../UserContext';
import './MyTimetable.css';
import { toast } from 'react-toastify';

// Соответствие между названиями дней и номерами (как в БД: ПН=1, ВТ=2, ..., ВС=0)
const dayNameToNumber = {
    'ПН': 1,
    'ВТ': 2,
    'СР': 3,
    'ЧТ': 4,
    'ПТ': 5,
    'СБ': 6,
    'ВС': 0,
};

// Преобразуем номер дня из БД в JS формат (0=ВС, 1=ПН, ..., 6=СБ)
const dbDayToJsDay = (dbDay) => dbDay === 0 ? 6 : dbDay - 1;

const My_timetable = () => {
    const { currentUser } = useContext(UserContext);
    const [lessons, setLessons] = useState([]);
    const [workingDaysData, setWorkingDaysData] = useState([]);
    const [error, setError] = useState('');
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [notice, setNotice] = useState('');
    const [reservationsCount, setReservationsCount] = useState({});
    const [loading, setLoading] = useState(false);
    const [daysOff, setDaysOff] = useState([]);
    const [cancelledLessons, setCancelledLessons] = useState([]);

    const teacherID = currentUser?.id;

    useEffect(() => {
        if (!teacherID) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                // Загрузка расписания
                const res1 = await axios.get(`http://localhost:5000/api/teacher_schedule?teacherid=${teacherID}`);
                const lessonsRaw = res1.data;

                const year = currentMonth.getFullYear();
                const month = currentMonth.getMonth();
                const daysInMonth = new Date(year, month + 1, 0).getDate();
                const scheduleWithDates = [];

                for (let day = 1; day <= daysInMonth; day++) {
                    const date = new Date(year, month, day);
                    const jsDayOfWeek = date.getDay(); // 0=ВС, 1=ПН, ..., 6=СБ

                    lessonsRaw.forEach(lesson => {
                        let lessonDayNumber;
                        if (typeof lesson.day === 'string') {
                            // Получаем номер дня из названия (как в БД: ПН=1, ..., ВС=0)
                            lessonDayNumber = dayNameToNumber[lesson.day.toUpperCase()];
                        } else {
                            // Предполагаем, что lesson.day уже в формате БД (ПН=1, ..., ВС=0)
                            lessonDayNumber = lesson.day;
                        }

                        // Преобразуем номер дня из БД в JS формат для сравнения
                        const lessonJsDay = dbDayToJsDay(lessonDayNumber);
                        
                        if (lessonJsDay === jsDayOfWeek) {
                            scheduleWithDates.push({
                                ...lesson,
                                date: `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                            });
                        }
                    });
                }

                setLessons(scheduleWithDates);

                // Загрузка рабочих дней
                const res2 = await axios.get(`http://localhost:5000/api/reservations_t?id_teacher=${teacherID}`);
                setWorkingDaysData(res2.data);

                // Загрузка выходных дней
                const res3 = await axios.get(`http://localhost:5000/api/teachers_days_off?id_teacher=${teacherID}`);
                setDaysOff(res3.data);

                // Загрузка количества записей
                const countRes = await axios.get(`http://localhost:5000/api/reservations_count?teacher_id=${teacherID}&month=${month + 1}&year=${year}`);
                setReservationsCount(countRes.data);
             

                // Загрузка отмененных занятий
                const cancelledRes = await axios.get(`http://localhost:5000/api/cancelled_lessons?teacher_id=${teacherID}`);
                setCancelledLessons(cancelledRes.data);

                setError('');
            } catch (error) {
                console.error('Ошибка при загрузке данных:', error);
                setError('Не удалось загрузить данные.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [teacherID, currentMonth]);

    // Проверка, отменено ли занятие
const isLessonCancelled = (date, subject) => {
        return cancelledLessons.some(lesson => 
            lesson.date === date && lesson.subject_name === subject
        );
    };

    // Проверка, является ли день выходным (суббота или воскресенье)
    const isWeekend = (year, month, day) => {
        const date = new Date(year, month, day);
        const dayOfWeek = date.getDay(); // 0 - воскресенье, 6 - суббота
        return dayOfWeek === 0 || dayOfWeek === 6;
    };  

const isDayOff = (dateStr) => {
    return daysOff.some(offDay => {
        const offDate = offDay.date.split('T')[0];
        return offDate === dateStr && offDay.status === 'approved';
    });
};

    // Группировка уроков
    const groupedLessons = useMemo(() => {
        return lessons.reduce((acc, lesson) => {
            if (lesson.teacher_id !== teacherID) return acc;
            const key = `${lesson.day}-${lesson.teacher_name}-${lesson.subject_name}-${lesson.date}`;
            if (!acc[key]) {
                acc[key] = {
                    dayOfWeek: lesson.day,
                    teacherName: lesson.teacher_name,
                    subject: lesson.subject_name,
                    times: [],
                    date: lesson.date,
                };
            }
            acc[key].times.push(lesson.time);
            return acc;
        }, {});
    }, [lessons, teacherID]);

    const groupedLessonsArray = Object.values(groupedLessons);

    // Формирование календаря (неделя начинается с понедельника)
    const getCalendarDays = (year, month) => {
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDay = new Date(year, month, 1).getDay(); // 0=ВС, 1=ПН...
        
        // Сдвиг для календаря (первый день недели - понедельник)
        const shift = firstDay === 0 ? 6 : firstDay - 1;
        
        const daysArray = [];
        for (let i = 0; i < shift; i++) daysArray.push(null);
        for (let day = 1; day <= daysInMonth; day++) daysArray.push(day);
        return daysArray;
    };

    const calendarDays = useMemo(() => {
        return getCalendarDays(currentMonth.getFullYear(), currentMonth.getMonth());
    }, [currentMonth]);

    
        const isRequestedDayOff = (dateStr) => {
        return daysOff.some(offDay => {
            const offDate = offDay.date.split('T')[0];
            return offDate === dateStr && offDay.status !== 'approved';
        });
    };

    // Проверка рабочего дня
const isWorkingDay = (year, month, day) => {
    const date = new Date(year, month, day);
    const jsDayOfWeek = date.getDay();
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    if (isDayOff(dateStr)) return false;

    return workingDaysData.some(item => {
        let itemDay = typeof item.day === 'string'
            ? dayNameToNumber[item.day.toUpperCase()]
            : item.day;

        return dbDayToJsDay(itemDay) === jsDayOfWeek && item.is_working === 1;
        
    });
};

// Проверка наличия занятий в день
const hasLessons = (dateStr) => {
    return lessons.some(lesson => lesson.date === dateStr);
};


    // Получение количества записей на день
    const getReservationsCountForDay = (date) => {
        const dateStr = new Date(date).toISOString().split('T')[0];
        return reservationsCount[dateStr] || 0;
    };

    // Отмена занятия
    const cancelLesson = async (year, month, day) => {
        const date = new Date(year, month, day);
        const today = new Date();
        const diffDays = Math.floor((date - today) / (1000 * 60 * 60 * 24));

        const localDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const lessonsToCancel = lessons.filter(lesson => lesson.date === localDateStr);

        if (lessonsToCancel.length === 0) {
            toast.warn("Нет занятий на эту дату.");
            return;
        }

        if (diffDays < 3) {
            toast.warn("Занятия можно отменять только более чем за 3 дня.");
            return;
        }

        const reason = prompt("Укажите причину отмены занятий:");
        if (!reason) return;
        const transferDate = prompt("Укажите дату переноса (в формате ГГГГ-ММ-ДД) или оставьте пустым:");

        try {
            const response = await axios.post('http://localhost:5000/api/teachers_days_off', {
            id_teacher: currentUser.id,
            date: localDateStr,
            reason: reason,
            transferred_date: transferDate || null
        });
        


            if (response.status >= 200 && response.status < 300) {
                toast.success("Заявка на отмену отправлена!");
                const res = await axios.get(`http://localhost:5000/api/teachers_days_off?id_teacher=${teacherID}`);
                setDaysOff(res.data);
            } else {
                throw new Error(`Ошибка HTTP: ${response.status}`);
            }
        } catch (error) {
            console.error('Ошибка при отмене занятий:', error);
            toast.error(`Не удалось отменить занятия: ${error.message}`);
        }
    };

    // Рендер занятий для дня
const renderLessonsForDay = (day) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const dateStr = date.toISOString().split('T')[0];

    // Проверка на перенос
    const transferred = daysOff.find(off => {
        if (!off.transferred_date) return false;
        // Приводим обе даты к одинаковому формату для сравнения
        const transferredDate = new Date(off.transferred_date);
        const transferredDateStr = transferredDate.toISOString().split('T')[0];
        return transferredDateStr === dateStr && off.status==='approved';
    });

    if (transferred) {
        // Форматируем оригинальную дату для отображения
        const originalDate = new Date(transferred.date);
        const formattedOriginalDate = originalDate.toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit'
        }).replace('.', '-');

        // Форматируем текущую дату (дату переноса) для отображения
        const formattedTransferredDate = date.toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit'
        }).replace('.', '-');

        return (
            <div className="transferred-lesson">
                <strong>Перенесено на {formattedTransferredDate}</strong><br />
                с {formattedOriginalDate}<br />
                по причине: {transferred.reason}
            </div>
        );
    }

    return groupedLessonsArray
        .filter(lesson => lesson.date === dateStr)
        .map((lesson, i) => {
            const cancelled = isLessonCancelled(dateStr, lesson.subject);
            return (
                <div key={i} className={cancelled ? 'cancelled-lesson' : ''}>
                    <strong>{lesson.subject}</strong><br />
                    {lesson.teacherName}<br />
                    <small>{lesson.times.join(', ')}</small>
                    {cancelled && <div className="cancelled-label">Отменено</div>}
                </div>
            );
        });
};

    const goToPrevMonth = () => {
        setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    };

    const goToNextMonth = () => {
        setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    };

return (
        <div className="my-timetable-container">
            <div className="month-navigation">
                <button className="nav-button_2" onClick={goToPrevMonth}>&laquo;</button>
                <h3 className="month-title">{currentMonth.toLocaleString('ru-RU', { year: 'numeric', month: 'long' })}</h3>
                <button className="nav-button_2" onClick={goToNextMonth}>&raquo;</button>
            </div>

            {loading && <p className="loading-message">Загрузка данных...</p>}
            {notice && <p className="notice-message">{notice}</p>}
            {error && <p className="error-message">{error}</p>}

            <div className="calendar-wrapper">
                <table className="responsive-calendar">
                    <thead>
                        <tr>
                            {["ПН", "ВТ", "СР", "ЧТ", "ПТ", "СБ", "ВС"].map((day, idx) => 
                                <th key={idx} >{day}</th>
                            )}
                        </tr>
                    </thead>
<tbody>
    {Array.from({ length: Math.ceil(calendarDays.length / 7) }, (_, row) => (
        <tr key={row}>
            {calendarDays.slice(row * 7, (row + 1) * 7).map((day, idx) => {
                if (!day) return <td key={idx} className="empty-day"></td>;

                const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                const dateStr = date.toISOString().split('T')[0];
                const count = getReservationsCountForDay(dateStr);
                const isCancelled = isDayOff(dateStr);
                const isWorking = isWorkingDay(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                const hasLessonsToday = hasLessons(dateStr);

                return (
                    <td
                        key={idx}
                        className={`calendar-day 
                            ${isCancelled ? 'cancelled-day' : ''} 
                            ${isWorking && hasLessonsToday ? 'working-day' : ''}
                        `}
                        onClick={() => cancelLesson(currentMonth.getFullYear(), currentMonth.getMonth(), day)}
                    >
                        <div className="day-number">{day}</div>
                        {hasLessonsToday && !isCancelled && (
    <div className="reservations-count">
        {count > 0 ? `${count} запис${count === 1 ? 'ь' : 'и'}` : '     '}
    </div>
)}

                        <div className="day-lessons">
                            {renderLessonsForDay(day)}
                        </div>
                    </td>
                );
            })}
        </tr>
    ))}
</tbody>
                </table>
            </div>
        </div>
    );
};

export default My_timetable;