import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Show_stocks.css';
import { motion, AnimatePresence } from 'framer-motion';
import { NavLink } from 'react-router-dom';

const StartNowWith = () => {
  const [nap, setNap] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1);    

useEffect(() => {
  axios.get('http://localhost:5000/api/napravleniya')
    .then((response) => {
      setNap(response.data);
    })
    .catch((error) => {
      console.log('Ошибка при получении направлений', error);
    });
}, []);


  useEffect(() => {
    const interval = setInterval(() => {
      nextSlide();
    }, 5000);

    return () => clearInterval(interval);
  }, [currentIndex, nap]);

  const nextSlide = () => {
    setDirection(1);
    setCurrentIndex((prevIndex) => (prevIndex + 1) % nap.length);
  };

  const prevSlide = () => {
    setDirection(-1);
    setCurrentIndex((prevIndex) => (prevIndex - 1 + nap.length) % nap.length);
  };

  const goToSlide = (index) => {
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
  };

  if (nap.length === 0) {
    return (
      <div className="slider-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="slider-container">
      <motion.h1 
        className='nap'
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        Начни сейчас:
      </motion.h1>
      
      <div className="slider">
        <AnimatePresence custom={direction} mode="wait">
          <motion.div
            className="slide"
            key={currentIndex}
            custom={direction}
            initial={{ opacity: 0, x: direction > 0 ? 100 : -100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction > 0 ? -100 : 100 }}
            transition={{ duration: 0.5 }}
          >
            <NavLink to={`/napravleniya/${nap[currentIndex]?.id}`}>
            <div className="slide-content">
              
                <motion.p 
                  className="slide-title"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  {nap[currentIndex].name}
                </motion.p>
                <motion.p 
                  className="slide-description"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  {nap[currentIndex].descr}
                </motion.p>
                <motion.img
                  src={`http://localhost:5000${nap[currentIndex].photo}`}
                  alt={nap[currentIndex].name}
                  className="slide-image"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                  whileHover={{ scale: 1.05 }}
                />
              
            </div>
            </NavLink>
          </motion.div>
        </AnimatePresence>

        <button className="prev-button" onClick={prevSlide}>
          <motion.div whileHover={{ scale: 1.2 }}>❮</motion.div>
        </button>
        <button className="next-button" onClick={nextSlide}>
          <motion.div whileHover={{ scale: 1.2 }}>❯</motion.div>
        </button>

        <div className="slide-indicators">
          {nap.map((_, index) => (
            <motion.div
              key={index}
              className={`indicator ${index === currentIndex ? 'active' : ''}`}
              onClick={() => goToSlide(index)}
              whileHover={{ scale: 1.3 }}
              transition={{ type: 'spring', stiffness: 500 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default StartNowWith;