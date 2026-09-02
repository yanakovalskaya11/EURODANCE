import React from 'react';
import { motion } from 'framer-motion';
import { 
  FaHome, 
  FaChalkboardTeacher, 
  FaListUl, 
  FaMapMarkerAlt,
  FaHeart,
  FaRegLightbulb,
  FaUsers,
  FaAward
} from 'react-icons/fa';
import { IoMdRibbon } from 'react-icons/io';
import './about_us.css';

const features = [
  { 
    text: 'Уютные залы с современным оборудованием', 
    icon: <FaHome size={28} />, 
    bg: 'dark',
    highlight: '#FF6B6B'
  },
  { 
    text: 'Профессиональные преподаватели с большим опытом', 
    icon: <FaChalkboardTeacher size={28} />, 
    bg: 'light',
    highlight: '#D200A3'
  },
  { 
    text: 'Широкий выбор современных направлений обучения', 
    icon: <FaListUl size={28} />, 
    bg: 'dark',
    highlight: '#00C2FF'
  },
  { 
    text: 'Удобное расположение в центре города', 
    icon: <FaMapMarkerAlt size={28} />, 
    bg: 'light',
    highlight: '#00D1A3'
  },
  {
    text: 'Индивидуальный подход к каждому ученику',
    icon: <FaHeart size={28} />,
    bg: 'dark',
    highlight: '#FF8E53'
  },
  {
    text: 'Инновационные методики обучения',
    icon: <FaRegLightbulb size={28} />,
    bg: 'light',
    highlight: '#A162E8'
  },
  {
    text: 'Дружелюбное сообщество единомышленников',
    icon: <FaUsers size={28} />,
    bg: 'dark',
    highlight: '#2EC4B6'
  },
  {
    text: 'Доказанные результаты и достижения',
    icon: <FaAward size={28} />,
    bg: 'light',
    highlight: '#FF9F1C'
  }
];

const About_us = () => {
  const textVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3
      }
    }
  };

  return (
    <section className="about-us">
      <div className="decoration-circle circle-1"></div>
      <div className="decoration-circle circle-2"></div>
      <div className="decoration-circle circle-3"></div>
      
      <motion.div 
        className="header-container"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <IoMdRibbon className="title-icon" />
        <motion.h1 
          className="about-title"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          Почему выбирают нас?
        </motion.h1>
        <motion.p 
          className="about-subtitle"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
        >
          Мы создаем пространство, где обучение становится вдохновением
        </motion.p>
      </motion.div>

      <motion.div 
        className="features-list"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
      >
        {features.map((feature, index) => (
          <motion.div
            className={`feature-item ${feature.bg}`}
            key={index}
            variants={{
              hidden: { opacity: 0, y: 50 },
              visible: { 
                opacity: 1, 
                y: 0,
                transition: {
                  type: "spring",
                  stiffness: 100,
                  damping: 10
                }
              }
            }}
            whileHover={{
              scale: 1.03,
              boxShadow: `0 15px 30px ${feature.highlight}33`
            }}
            style={{ '--highlight-color': feature.highlight }}
          >
            <motion.span 
              className="feature-icon"
              whileHover={{ rotate: 15, scale: 1.2 }}
            >
              {feature.icon}
            </motion.span>
            <motion.h2 
              className="feature-text"
              variants={textVariants}
            >
              {feature.text}
            </motion.h2>
            <div className="feature-highlight"></div>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
};

export default About_us;