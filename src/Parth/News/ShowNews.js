import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { NavLink } from 'react-router-dom';
import './news.css';

const ShowNews = () => {
    const [news, setNews] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [direction, setDirection] = useState(1);

    useEffect(() => {
        axios.get('http://localhost:5000/api/news')
            .then((response) => {
                setNews(response.data);
            })
            .catch((error) => {
                console.error('Ошибка при получении данных:', error);
            });
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            nextSlide();
        }, 5000);

        return () => clearInterval(interval);
    }, [currentIndex, news]);

    const nextSlide = () => {
        setDirection(1);
        setCurrentIndex((prevIndex) => (prevIndex + 1) % news.length);
    };


    if (news.length === 0) {
        return (
            <div className="slider-container">
                <div className="loading-spinner"></div>
            </div>
        );
    }

    return (
  <section className="testimonials">
      <h2>Последние новости</h2>
      <div className="testimonials-grid">
        {news.slice(0, 3).map(item => (
          <div key={item.id} className="testimonial-card">
            <img   src={`http://localhost:5000${item.photo}`} alt={item.title} />
            <div className="news-content">
              <h3>{item.name}</h3>
              <p>{item.descr}</p>
              <span className="date">{item.date}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
    );
}

export default ShowNews;