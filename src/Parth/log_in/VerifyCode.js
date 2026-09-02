import React, { useState } from 'react';

const VerifyCode = ({ email, onVerified }) => {
  const [code, setCode] = useState('');
  const [status, setStatus] = useState('');

  const handleVerify = async () => {
    try {
      const res = await fetch('http://localhost:5000/verify-reset-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus('Код подтверждён');
        onVerified(); // переход к сбросу пароля
      } else {
        setStatus(data.message || 'Ошибка при проверке кода');
      }
    } catch {
      setStatus('Ошибка сервера');
    }
  };

  return (
    <div>
      <h3>Введите код из письма</h3>
      <input
        type="text"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="6-значный код"
      />
      <button onClick={handleVerify}>Подтвердить код</button>
      {status && <p>{status}</p>}
    </div>
  );
};

export default VerifyCode;
