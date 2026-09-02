import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './forgotPassword.css';
import Header from '../header/Header';
import Footer from '../Footer/Footer';

const ForgotPassword = ({ setCurrentUser }) => {  // получили setCurrentUser из пропсов
  const navigate = useNavigate();  // хук для навигации
  
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [step, setStep] = useState('request');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

const handleRequest = async () => {
  const res = await fetch('http://localhost:5000/api/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  const data = await res.json();
  
  if (res.ok) {
    setMessage('Код отправлен! Проверьте вашу почту');
    setStep('verify');
  } else {
    setMessage(data.message || 'Ошибка при отправке кода');
  }
};
  const handleVerify = async () => {
    const res = await fetch('http://localhost:5000/api/verify-reset-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code }),
    });
    const data = await res.json();
    if (res.ok) {
      setMessage('');
      setStep('reset');
    } else {
      setMessage(data.message);
    }
  };

  const handleReset = async () => {
    if (!newPassword || !confirmPassword) {
      setMessage('Пожалуйста, заполните оба поля');
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage('Пароли не совпадают');
      return;
    }

    const res = await fetch('http://localhost:5000/api/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code, newPassword }),
    });
    const data = await res.json();
    setMessage(data.message);
    if (res.ok) {
      setStep('done');
      setNewPassword('');
      setConfirmPassword('');
      if (setCurrentUser && data.user) {
        setCurrentUser(data.user);
      }
      navigate(data.redirectTo || '/');
    }
  };

  return (
    <div className="container">
      <Header />
      <div className="main-content">
        <div className="form-container">
          <h2>Восстановление пароля</h2>

          {step === 'request' && (
            <>
              <h3>Введите email</h3>
              <input
                type="email"
                placeholder="Введите email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <button onClick={handleRequest}>Отправить код подтверждения</button>
            </>
          )}

          {step === 'verify' && (
            <>
              <h3>Введите код из письма</h3>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Код из письма"
              />
              <button onClick={handleVerify}>Подтвердить</button>
            </>
          )}

          {step === 'reset' && (
            <>
              <h3>Введите новый пароль</h3>
              <input
                type="password"
                placeholder="Новый пароль"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <input
                type="password"
                placeholder="Подтвердите новый пароль"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <button onClick={handleReset}>Подтвердить пароль</button>
            </>
          )}

          {step === 'done' && <p>Пароль успешно сброшен!</p>}

          {message && <p>{message}</p>}

        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ForgotPassword;
