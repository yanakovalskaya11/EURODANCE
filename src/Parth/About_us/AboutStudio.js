import React from 'react';
import './AboutStudio.css';
import BranchMap from '../BranchMap';
import Header from '../header/Header';
import Footer from '../Footer/Footer';
import { FaMapMarkerAlt, FaPhoneAlt, FaEnvelope, FaInstagram, FaTelegram, FaVk, FaYoutube } from 'react-icons/fa';
import Comments from './Comments';


const AboutStudio = () => {
  return (
    <>
    <Header/>
    <div className="about-page main-content">
      <div className="about-hero">
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <h1>EURODANCE</h1>
          <p>Танцевальная студия с душой</p>
        </div>
      </div>

      <section className="about-section about_studio">
        <div className="about-container">
          <div className="about-text">
            <h2>Наша история</h2>
            <p>
              EURODANCE - это не просто танцевальная студия, это место, где рождаются страсть и мастерство. 
              С 2025 года мы создаем уникальное пространство для всех, кто хочет выразить себя через танец.
            </p>
            <p>
              Начав с небольшой студии в центре Минска, сегодня мы превратились в одну из ведущих танцевальных школ страны 
              с 3 профессиональными залами и командой из 12 преподавателей.
            </p>
            <p>
              Наша философия - индивидуальный подход к каждому ученику. Мы не просто учим движениям, 
              мы помогаем найти свой уникальный стиль и раскрепоститься.
            </p>
          </div>
          <div className="about-image">
            <img src="/studio-history.jpg" alt="История студии EURODANCE" />
          </div>
        </div>
      </section>

      <section className="halls-section about_studio">
        <h2>Наши залы</h2>
        <p className="section-subtitle">Профессиональные пространства для вашего роста</p>
        
        <div className="halls-gallery">
          <div className="hall-card">
            <img src="/hall1.jpg" alt="Основной зал" />
            <div className="hall-info">
              <h3>Основной зал</h3>
              <p>100 м², профессиональное покрытие Harlequin, зеркальные стены</p>
            </div>
          </div>
          
          <div className="hall-card">
            <img src="/hall2.jpg" alt="Зал Contemporary" />
            <div className="hall-info">
              <h3>Зал Contemporary</h3>
              <p>80 м², амортизирующее покрытие, оборудование для воздушной акробатики</p>
            </div>
          </div>
          
          <div className="hall-card">
            <img src="/hall3.jpg" alt="Балетный класс" />
            <div className="hall-info">
              <h3>Балетный класс</h3>
              <p>Балетные станки, натуральное деревянное покрытие, специальное освещение</p>
            </div>
          </div>
        </div>
      </section>

      
      <section className="contacts-section about_studio">
        <div className="contacts-container">
          <div className="contacts-info">
            <h2>Контакты</h2>
            
            <div className="contact-item">
              <i className="icon icon-location"></i>
              <p>г. Минск, ул. Казинца, д. 91</p>
            </div>
            
            <div className="contact-item">
              <i className="icon icon-phone"></i>
              <p><a href="tel:+375291234567">+375 (29) 123-45-67</a></p>
            </div>
            
            <div className="contact-item">
              <i className="icon icon-email"></i>
              <p><a href="mailto:info@eurodance.by">info@eurodance.by</a></p>
            </div>
            
            <div className="contact-item">
              <i className="icon icon-clock"></i>
              <p>Пн-Пт: 8:00 - 22:00<br />Сб-Вс: 9:00 - 20:00</p>
            </div>
            
            <div className="social-links">
             <a href="https://instagram.com/eurodance" target="_blank" rel="noopener noreferrer"><FaInstagram /></a>
             <a href="https://t.me/eurodance" target="_blank" rel="noopener noreferrer"><FaTelegram /></a>
             <a href="https://vk.com/eurodance" target="_blank" rel="noopener noreferrer"><FaVk /></a>
             <a href="https://youtube.com/eurodance" target="_blank" rel="noopener noreferrer"><FaYoutube /></a>
           
            </div>
          </div>
          
          <BranchMap/>
     </div>
     <div>
     <Comments/>
      </div>     
          {/* <div className="contacts-map">
            <iframe 
              src="https://yandex.ru/map-widget/v1/?um=constructor%3A1a2b3c4d5e6f7g8h9i0j&amp;source=constructor" 
              width="100%" 
              height="400" 
              frameBorder="0"
              title="Карта расположения EURODANCE"
            ></iframe>
          </div> */}
      </section>
    </div>
    <Footer/>
    </>
  );
};

export default AboutStudio;