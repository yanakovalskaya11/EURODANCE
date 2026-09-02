import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { NavLink } from 'react-router-dom';
import './teacher_rating.css';

const TeachersGrid = () => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedTeacher, setExpandedTeacher] = useState(null);

  useEffect(() => {
    axios.get('http://localhost:5000/api/teachers/top-rated')
      .then((response) => {
        const teachersWithNumericRating = (response.data.data || []).map(teacher => ({
          ...teacher,
          rating: Number(teacher.rating) || 0
        }));
        setTeachers(teachersWithNumericRating);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching teachers:', error);
        setLoading(false);
      });
  }, []);

  const toggleExpand = (id) => {
    setExpandedTeacher(expandedTeacher === id ? null : id);
  };
  const renderRating = (rating) => {
    const numericRating = Number(rating);
    if (isNaN(numericRating)) return '0.0';
    return numericRating.toFixed(1);
  };

  if (loading) {
    return (
      <div className="teachers-loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (teachers.length === 0) {
    return <div className="no-teachers">Нет данных о преподавателях</div>;
  }

  return (
    <section className="teachers-section_r">
      <motion.h1 
        className="nap"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        Лучшие преподаватели
      </motion.h1>

      <div className="teachers-grid">
        {teachers.map((teacher, index) => (
          <motion.div
            key={teacher.id}
            className={`teacher-card ${expandedTeacher === teacher.id ? 'expanded' : ''}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            whileHover={{ y: -5 }}
          >
            <div className="card-header" onClick={() => toggleExpand(teacher.id)}>
              <div className="teacher-photo-container_r">
                <img
                  src={teacher.photo?.includes('http') 
                    ? teacher.photo 
                    : `http://localhost:5000${teacher.photo}`}
                  alt={teacher.name}
                  className="teacher-photo_r"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/default-teacher.jpg';
                  }}
                />
              </div>
              
              <div className="teacher-info_r">
                <h2 className="teacher-name_r">{teacher.name}</h2>
                <div className="directions-tags_r">
                  {teacher.directions?.slice(0, 2).map((dir, i) => (
                    <span key={i} className="direction-tag">{dir}</span>
                  ))}
                  {teacher.directions?.length > 2 && (
                    <span className="direction-tag">+{teacher.directions.length - 2}</span>
                  )}
                </div>
              </div>
            </div>

            <motion.div
              className="card-details"
              initial={{ height: 0, opacity: 0 }}
              animate={{ 
                height: expandedTeacher === teacher.id ? 'auto' : 0,
                opacity: expandedTeacher === teacher.id ? 1 : 0
              }}
              transition={{ duration: 0.3 }}
            >
              <div className="rating-container">
                <div className="stars-rating">
                  <div className="stars">
                    {'★'.repeat(Math.round(teacher.rating || 0))}
                    {'☆'.repeat(5 - Math.round(teacher.rating || 0))}
                  </div>
                  <div className="rating-value">
                    {renderRating(teacher.rating)} ({teacher.totalRatings || 0} оценок)
                  </div>
                </div>
              </div>

              <div className="all-directions">
                <h4>Направления:</h4>
                <div className="directions-list">
                  {teacher.directions?.map((dir, i) => (
                    <span key={i} className="direction-item">{dir}</span>
                  ))}
                </div>
              </div>

              <NavLink 
                to={`/teachers/${teacher.id}`} 
                className="teacher-profile-link"
              >
                Подробнее о преподавателе
              </NavLink>
            </motion.div>
          </motion.div>
        ))}
      </div>

      <NavLink to="/teachers" className="all-teachers-link">
        Все преподаватели →
      </NavLink>
    </section>
  );
};

export default TeachersGrid;