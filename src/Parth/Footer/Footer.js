import React from 'react';
import './footer.css';
import { Link } from 'react-router-dom';
import { FaMapMarkerAlt, FaPhoneAlt, FaEnvelope, FaInstagram, FaTelegram, FaVk, FaYoutube } from 'react-icons/fa';


const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-brand">
          <h3 className="footer-logo">EURODANCE</h3>
          <p className="footer-slogan">Танцевальная студия нового поколения</p>
          <div className="footer-copyright">
            © 2025 EURODANCE. Все права защищены
          </div>
        </div>

        <div className="footer-links">
          <h4 className="footer-heading">Навигация</h4>
                      
          <ul>
            <li><Link to="/">Главная</Link></li>
            <li><Link to='/napravleniya'>Направления</Link></li>
            <li><Link to="/timetable">Расписание</Link></li>
            <li><Link to='/tickets'>Абонементы</Link></li>
            <li><Link to='/teachers'>Преподаватели</Link></li>
            <li><Link to="/about_studio">О нас</Link></li>
          </ul>
        </div>

        <div className="footer-contact">
          <h4 className="footer-heading">Контакты</h4>
          <address>
           <p className="contact-item">
  <FaMapMarkerAlt /> г. Минск, ул. Казинца, д. 91
</p>
<p className="contact-item">
  <FaPhoneAlt /> <a href="tel:+375291234567">+375 (29) 123-45-67</a>
</p>
<p className="contact-item">
  <FaEnvelope /> <a href="mailto:eurodanceminsk@gmail.com">eurodanceminsk@gmail.com</a>
</p>

          </address>
        </div>

        <div className="footer-social">
          <h4 className="footer-heading">Мы в соцсетях</h4>
          <div className="social-links">
  <a href="https://instagram.com/eurodance" target="_blank" rel="noopener noreferrer"><FaInstagram /></a>
  <a href="https://t.me/eurodance" target="_blank" rel="noopener noreferrer"><FaTelegram /></a>
  <a href="https://vk.com/eurodance" target="_blank" rel="noopener noreferrer"><FaVk /></a>
  <a href="https://youtube.com/eurodance" target="_blank" rel="noopener noreferrer"><FaYoutube /></a>
</div>

          
          <div className="footer-legal">
            <Link to="/privacy-policy">Политика конфиденциальности</Link>
            <Link to="/terms">Условия использования</Link>
          </div>
        </div>
      </div>

      <div className="footer-developer">
        <p>Разработано: Ковальская Яна</p>
      </div>
    </footer>
  );
};

export default Footer;