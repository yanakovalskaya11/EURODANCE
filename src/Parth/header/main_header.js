import React, { useContext, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserContext } from '../../UserContext';  // Импортируем контекст
import "./header.css"

const Main_header = () => {

  const initialHeight = window.innerWidth < 768 ? 40 : 60; // Начальная высота 40vh для мобильных, 60vh для ПК
  const [height, setHeight] = useState(initialHeight); // Начальная высота в vh
  const handleScroll = () => {
    const scrollY = window.scrollY;
    const newHeight = Math.max(window.innerWidth < 768 ? 15 : 15, 60 - scrollY / 5); // 20vh для мобильных, 15vh для ПК
    setHeight(newHeight);
  };

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const [menuOpen, setMenu] = useState(false);
  const { currentUser } = useContext(UserContext);  // Получаем currentUser из контекста

  const navigate = useNavigate();
  const click = () => {
    if (currentUser.role === 'admin') {
      navigate('/admin');
    } else if (currentUser.role === 'teacher') {
      navigate('/teacher');
    } else {
      navigate('/personal');
    }
  };

  const toggleMenu = () => {
    setMenu(!menuOpen);
  };

  return (
    <div 
      className='header' 
      style={{ height: `${height}vh` }} // Устанавливаем динамическую высоту
    >
      <Link to='/'><img src='https://i.pinimg.com/originals/ba/b0/72/bab0721e8d0cf0765481290ae3f61d0a.png' alt='Logo'></img></Link>
      <h1>EURODANCE</h1>
      <div className='menu'>
        {/* отображение для ПК */}
        <div className='ssilki'>
          <span className='ssil'>
            <Link className='ssil' to='/napravleniya'>
              Направления
            </Link> 
          </span>
          <span className='ssil'>
            <Link className='ssil' to='/tickets'>
              Абонементы
            </Link> 
          </span>
          <span className='ssil'>
            <Link className='ssil' to='/teachers'>
              Учителя
            </Link>
          </span>
          
                    <span className='ssil'>
                    <Link className='ssil' to='/about'>
                        О нас
                      </Link>
                    </span>
          {currentUser ? (  // Если currentUser есть, показываем имя
            <span className='ssil' onClick={click}>
              {currentUser.name}  {/* Имя пользователя */}
            </span>
          ) : (  // Если currentUser нет, показываем ссылку на вход
            <span className='ssil'>
              <Link to="/login" className='ssil'>Войти</Link>
            </span>
          )}
        </div>

        {/* отображение для телефона */}
        <button className='menu-toggle' onClick={toggleMenu}> Меню </button>
        {menuOpen && (
          <div className='mobile-menu'>
            <span className='ssil'>
              <Link to='/napravleniya'>
                Направления
              </Link> 
            </span>
            <span className='ssil'>
              <Link to='/tickets'>
                Абонементы
              </Link> 
            </span>
            <span className='ssil'>
              <Link to='/teachers'>
                Учителя
              </Link>
            </span>
            
                      <span className='ssil'>
                      <Link className='ssil' to='/about'>
                          О нас
                        </Link>
                      </span>
            {currentUser ? (  // Если currentUser есть, показываем имя
              <span className='ssil' onClick={click}>
                {currentUser.name}  {/* Имя пользователя */}
              </span>
            ) : (  // Если currentUser нет, показываем ссылку на вход
              <span className='ssil'>
                <Link to="/login" className='ssil'>Войти</Link>
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Main_header;
