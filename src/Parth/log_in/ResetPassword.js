import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ResetPassword = ({ email, code }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState('');
  const navigate = useNavigate();

  const handleReset = async () => {
    if (newPassword === '' || confirmPassword === '') {
      setStatus('Пожалуйста, заполните оба поля');
      return;
    }
    if (newPassword !== confirmPassword) {
      setStatus('Пароли не совпадают');
      return;
    }

    try {
      const res = await fetch('http://localhost:5000/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, newPassword }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus('Пароль успешно сброшен! Сейчас перенаправим...');
        setTimeout(() => {
          navigate('/');  // редирект на главную
        }, 2000);
      } else {
        setStatus(data.message || 'Ошибка при сбросе');
      }
    } catch {
      setStatus('Ошибка сервера');
    }
  };

  return (
    <div>
      <h3>Новый пароль</h3>
      <input
        type="password"
        placeholder="Введите новый пароль"
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
      {status && <p>{status}</p>}
    </div>
  );
};

export default ResetPassword;
