

import React, { useContext, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserContext } from '../../UserContext';
import Header from '../header/Header';
import './log_in.css';
import Registr from '../registration/Registr';
import Footer from '../Footer/Footer';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Log_in = () => {
  const [isReg, setReg] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassw] = useState('');
  const navigate = useNavigate();
  const { setCurrentUser } = useContext(UserContext);

  useEffect(() => {
    let ignore = false;
  
    fetch('http://localhost:5000/api/check-auth', {
      credentials: 'include',
    })
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => {
        if (!ignore) {
          setCurrentUser(data.user);
          navigate(data.user.role === 'admin' ? '/admin' : data.user.role === 'teacher' ? '/teacher' : '/');
        }
      })
      .catch(() => {
        if (!ignore) {
          setCurrentUser(null);
        }
      });
  
    return () => { ignore = true; };
  }, []);
  
  
  const loginUser = () => {
    fetch('http://localhost:5000/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // ВАЖНО: отправлять куки с токеном, если сервер кладёт токен в HttpOnly cookie
      body: JSON.stringify({ email, password }),
    })
      .then((res) => {
        if (!res.ok) throw new Error('Ошибка авторизации');
        return res.json();
      })
      .then((data) => {
        setCurrentUser(data.user); // user приходит с сервера
        
        navigate(data.redirectTo || '/');
        
      })
      .catch((error) => {
        console.error('Ошибка при входе:', error);
        toast.error('Неверный логин или пароль');
      });
  };

  return (
    
<div className="container">
  <Header />
  <div className="main-content">
  <div className="form-container">
    {!isReg ? (
      <div className="form login">
        <h1>ВХОД</h1>
        <input className='login_input'
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
        />
        <input
        className='login_input'
          type="password"
          value={password}
          onChange={(e) => setPassw(e.target.value)}
          placeholder="Пароль"
        />
        <button onClick={loginUser}>Войти</button>
        <p>
  <button onClick={() => navigate('/forgot-password')}>
    Забыли пароль?
  </button>
</p>

        <p>
          Еще не зарегистрированы?{' '}
          <button onClick={() => setReg(true)}>
            Зарегистрироваться
          </button>
        </p>
      </div>
    ) : (
      <div className="form register">
        
        <Registr />
    
            
        <p>
          Уже есть аккаунт?{' '}
          <button  onClick={() => setReg(false)}>
            Войти
          </button>
          
        </p>
      </div>
    )}
    </div>
    <Footer/>
  </div>
  
</div>

  );
};

export default Log_in;
