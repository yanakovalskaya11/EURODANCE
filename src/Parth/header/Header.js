import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserContext } from '../../UserContext';
import "./header.css";

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);
   const [submenuOpen, setSubmenuOpen] = useState(false);
  const { currentUser } = useContext(UserContext);
  const navigate = useNavigate();

  const handleUserClick = () => {
    if (!currentUser) return;
    
    if (currentUser.role === 'admin') {
      navigate('/admin');
    } else if (currentUser.role === 'teacher') {
      navigate('/teacher');
    } else {
      navigate('/personal');
    }
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };


  const toggleSubmenu = () => {
    setSubmenuOpen(!submenuOpen);
  };

  return (
    <header className="dance-header">
      <div className="header-container">
        <Link to="/" className="logo-link">
          <div className="logo-container">
            <img 
              src='../logo.png' 
              alt="EuroDance Logo"
              className="logo-image"
            />
            <h1 className="studio-name">EURODANCE</h1>
          </div>
        </Link>

        <nav className="desktop-nav">
          <ul className="nav-list">
            <li className="nav-item">
              <Link to="/napravleniya" className="nav-link">
                <span className="link-text">Направления</span>
                <span className="link-hover"></span>
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/timetable" className="nav-link">
                <span className="link-text">Расписание</span>
                <span className="link-hover"></span>
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/tickets" className="nav-link">
                <span className="link-text">Абонементы</span>
                <span className="link-hover"></span>
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/teachers" className="nav-link">
                <span className="link-text">Преподаватели</span>
                <span className="link-hover"></span>
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/about_studio" className="nav-link">
                <span className="link-text">О нас</span>
                <span className="link-hover"></span>
              </Link>
            </li>
            <li className="nav-item dropdown">
              <div className="nav-link" onClick={toggleSubmenu}>
                <span className="link-text">Еще</span>
                <span className="link-hover"></span>
                <span className={`dropdown-arrow ${submenuOpen ? 'open' : ''}`}>▼</span>
              </div>
              {submenuOpen && (
                <div className="dropdown-menu">
                  <Link to="/teacher-advices" className="dropdown-item">
                    Советы наших преподавателей
                  </Link>
                  <Link 
                    to="/questions" 
                    className="dropdown-item"
                  >
                    Ваши вопросы и наши ответы
                  </Link>
                  <Link to="/teacher-videos" className="dropdown-item">
                    Видео наших преподаваталей
                  </Link>
                  <Link to="/scores" className="dropdown-item">
                    Как потратить баллы?
                  </Link>
                </div>
              )}
            </li>
            <li className="nav-item">
              {currentUser ? (
                <div className="user-profile" onClick={handleUserClick}>
                  <span className="username">{currentUser.name}</span>
                  <div className="profile-glow"></div>
                </div>
              ) : (
                <Link to="/login" className="nav-link login-link">
                  <span className="link-text">Войти</span>
                  <span className="link-hover"></span>
                </Link>
              )}
            </li>
          </ul>
        </nav>

        <button 
          className={`mobile-menu-toggle ${menuOpen ? 'open' : ''}`}
          onClick={toggleMenu}
          aria-label="Toggle menu"
        >
          <span className="bar"></span>
          <span className="bar"></span>
          <span className="bar"></span>
        </button>

        <div className={`mobile-nav ${menuOpen ? 'open' : ''}`}>
          <ul className="mobile-nav-list">
            <li className="mobile-nav-item">
              <Link to="/napravleniya" className="mobile-nav-link" onClick={toggleMenu}>
                Направления
              </Link>
            </li>
            <li className="mobile-nav-item">
              <Link to="/timetable" className="mobile-nav-link" onClick={toggleMenu}>
                Расписание
              </Link>
            </li>
            <li className="mobile-nav-item">
              <Link to="/tickets" className="mobile-nav-link" onClick={toggleMenu}>
                Абонементы
              </Link>
            </li>
            <li className="mobile-nav-item">
              <Link to="/teachers" className="mobile-nav-link" onClick={toggleMenu}>
                Преподаватели
              </Link>
            </li>
            <li className="mobile-nav-item">
              <Link to="/about_studio" className="mobile-nav-link" onClick={toggleMenu}>
                О нас
              </Link>
            </li>
            <li className="mobile-nav-item">
              <div 
                className="mobile-nav-link mobile-dropdown-toggle" 
                onClick={() => setSubmenuOpen(!submenuOpen)}
              >
                Еще
                <span className={`mobile-dropdown-arrow ${submenuOpen ? 'open' : ''}`}>▼</span>
              </div>
              {submenuOpen && (
                <div className="mobile-dropdown-menu">
                  <Link 
                    to="/teacher-advices" 
                    className="mobile-dropdown-item" 
                    onClick={() => {
                      toggleMenu();
                      setSubmenuOpen(false);
                    }}
                  >
                    Советы наших преподавателей
                  </Link>
                  <Link 
                    to="/questions" 
                    className="mobile-dropdown-item" 
                    onClick={() => {
                      toggleMenu();
                      setSubmenuOpen(false);
                    }}
                  >
                    Ваши вопросы и наши ответы
                  </Link>
                  <Link 
                    to="/teacher-videos" 
                    className="mobile-dropdown-item" 
                    onClick={() => {
                      toggleMenu();
                      setSubmenuOpen(false);
                    }}
                  >
                    Видео наших преподавателей
                  </Link>
                  <Link to="/scores"className="mobile-dropdown-item" 
                    onClick={() => {
                      toggleMenu();
                      setSubmenuOpen(false);
                    }}>
                    Как потратить баллы?
                  </Link>
                </div>
              )}
            </li>
            <li className="mobile-nav-item">
              {currentUser ? (
                <div className="mobile-user-profile" onClick={() => {
                  handleUserClick();
                  toggleMenu();
                }}>
                  {currentUser.name}
                </div>
              ) : (
                <Link to="/login" className="mobile-nav-link" onClick={toggleMenu}>
                  Войти
                </Link>
              )}
            </li>
          </ul>
        </div>
      </div>
    </header>
  );
};

export default Header;