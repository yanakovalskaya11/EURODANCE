import axios from 'axios';
import React, { useEffect, useState } from 'react';
import "./teach.css";
import { NavLink } from 'react-router-dom';

const ShowTeachers = () => {

    const [teachers, setTeachers] = useState([]);
    

    useEffect(() => {
        axios.get('http://localhost:5000/api/teachers')
            .then((response) => {
                setTeachers(response.data);
            })
            .catch((error) => {
                console.error('Ошибка при получении данных:', error);
            });
    }, []);

    return (
        <div className='naprav_'>
            <h2 className='nap'>ПРЕПОДАВАТЕЛИ</h2>

            <div className='teachers'>
                {teachers.map((teacher) => (
                    <div key={teacher.id}>
                        <NavLink to={`/teachers/${teacher.id}`}>
                            <img className="teacher" src={`http://localhost:5000${teacher.photo}`} alt={teacher.name} />
                        </NavLink>
                        <p className="teacher-name">{teacher.name}</p>
                        <p className="subjects"><strong>Направления:</strong>  {teacher.subjects && teacher.subjects.length > 0
    ? teacher.subjects.map(s => s.name).join(', ')
    : 'Нет направлений'}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default ShowTeachers;
