import axios from 'axios';
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import './Show_stocks.css';

const Show_stocks = () => {
  const [stocks, setStocks] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    axios.get('http://localhost:5000/api/stocks')
      .then((response) => {
        setStocks(response.data);
        setIsLoading(false);
      })
      .catch((error) => {
        console.log('Ошибка при получении акций', error);
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      nextSlide();
    }, 5000);

    return () => clearInterval(interval);
  }, [currentIndex, stocks]);

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % stocks.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + stocks.length) % stocks.length);
  };
  

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (stocks.length === 0) {
    return (
      <div className="no-stocks">
        <p>Акции временно отсутствуют</p>
      </div>
    );
  }

  
  return (
    <div className="stocks-section">
      <div className="decoration-circle circle-1"></div>
      <div className="decoration-circle circle-2"></div>
      
      <motion.h1 
        className="section-title"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        Наши акции
      </motion.h1>

      <div className="slider-container">
        <div className="slider">
          {stocks.map((stock, index) => (
            <motion.div
              className={`slide ${index === currentIndex ? 'active' : ''}`}
              key={stock.id}
              initial={{ opacity: 0 }}
              animate={{ 
                opacity: index === currentIndex ? 1 : 0,
                transition: { duration: 0.8 }
              }}
            >
              <div className="slide-content">
                <motion.p 
                  className="stock-title"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ 
                    opacity: index === currentIndex ? 1 : 0,
                    y: index === currentIndex ? 0 : 20,
                    transition: { delay: 0.2 }
                  }}
                >
                  {stock.name}
                </motion.p>
                
                <motion.p 
                  className="stock-description"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ 
                    opacity: index === currentIndex ? 1 : 0,
                    y: index === currentIndex ? 0 : 20,
                    transition: { delay: 0.4 }
                  }}
                >
                  {stock.descr}
                </motion.p>
                
                <motion.div
                  className="image-container"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ 
                    opacity: index === currentIndex ? 1 : 0,
                    scale: index === currentIndex ? 1 : 0.9,
                    transition: { delay: 0.6 }
                  }}
                >
                  <img 
                    src={`http://localhost:5000${stock.photo}`} 
                    alt={stock.name} 
                    className="stock-image"
                  />
                </motion.div>
              </div>
            </motion.div>
          ))}
          
          <button className="nav-button prev" onClick={prevSlide}>
            <FaChevronLeft />
          </button>
          <button className="nav-button next" onClick={nextSlide}>
            <FaChevronRight />
          </button>
          
          <div className="indicators">
            {stocks.map((_, index) => (
              <div 
                key={index}
                className={`indicator ${index === currentIndex ? 'active' : ''}`}
                onClick={() => setCurrentIndex(index)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Show_stocks;