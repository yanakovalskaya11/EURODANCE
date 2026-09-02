import React, { useState, useEffect } from 'react';
import { UserContext } from '../../UserContext';
import './comments_slider.css';

const CommentsSlider = () => {
    const [comments, setComments] = useState([]);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('http://localhost:5000/api/comments')
            .then((response) => response.json())
            .then((data) => {
                setComments(data);
                setLoading(false);
            })
            .catch((error) => {
                console.error('Ошибка при получении комментариев:', error);
                setLoading(false);
            });
    }, []);


    const renderStars = (rating) => {
        return [...Array(5)].map((_, index) => {
            const value = index + 1;
            return (
                <span
                    key={value}
                    className={`star ${value <= rating ? 'selected' : ''}`}
                    style={{ fontSize: '30px', color: value <= rating ? '#FF4F00' : 'lightgray' }}
                >
                    &#9733;
                </span>
            );
        });
    };

    if (loading) {
        return (
            <div className="slider-container">
                <div className="loading-spinner"></div>
            </div>
        );
    }

    if (comments.length === 0) {
        return (
            <div className="slider-container">
                <h2 className="nap">ОТЗЫВЫ</h2>
                <p style={{ textAlign: 'center', color: 'var(--text-color)' }}>Пока нет отзывов</p>
            </div>
        );
    }

    return (
         <section className="testimonials">
      <h2 className='nap'>Отзывы наших учеников</h2>
      <div className="testimonials-grid">
        {comments.slice(0, 4).map(comment => (
          <div key={comment.id} className="testimonial-card">
   
            <div className="stars">{renderStars(comment.stars)}</div>
            <p className="text">"{comment.text.slice(0, 120)}..."</p>
          
          </div>
        ))}
      </div>
      <button className="show-all-btn">Все отзывы</button>
    </section>
  );
};

export default CommentsSlider;