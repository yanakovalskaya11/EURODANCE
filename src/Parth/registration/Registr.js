import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { UserContext } from '../../UserContext';
import { useNavigate } from 'react-router-dom';
import PrivacyPolicy from '../About_us/PrivacyPolitick';


const Registr = () => {
    const { setCurrentUser } = useContext(UserContext);
    const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    surname: '',
    father_name: '',
    email: '',
    birthday: '',
    phone: '+375-',
    password: ''
  });
  
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [canResend, setCanResend] = useState(true);
  const [timer, setTimer] = useState(60);
  const [phone, setPhone] = useState('+375-');
  const [pass, setPass] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  const handleChangePassword = (e) =>{
    const value=e.target.value;
    setFormData(prev=>({...prev, password: value}));
  }
  const handlePhoneChange = (e) => {
    const value = e.target.value;
    if (value.startsWith('+375-') && value.length <= 17) {
      // Удаляем все нецифровые символы кроме +
      const digits = value.replace(/[^\d+]/g, '').substring(4);
      let formatted = '+375-';
      
      if (digits.length > 0) formatted += digits.substring(0, 2);
      if (digits.length > 2) formatted += '-' + digits.substring(2, 5);
      if (digits.length > 5) formatted += '-' + digits.substring(5, 7);
      if (digits.length > 7) formatted += '-' + digits.substring(7, 9);
      
      setPhone(formatted);
    }
  };

  const handleCodeChange = (e, index) => {
    const value = e.target.value;
    if (/^\d*$/.test(value) && value.length <= 1) {
      const newCode = [...verificationCode];
      newCode[index] = value;
      setVerificationCode(newCode);
      
      // Auto-focus to next input
      if (value && index < 5) {
        document.getElementById(`code-${index + 1}`).focus();
      }
    }
  };

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

const sendVerificationCode = async () => {
  // Проверка обязательных полей
  const requiredFields = ['name', 'surname', 'email', 'birthday', 'password'];
  for (let field of requiredFields) {
    if (!formData[field]) {
      setError('Пожалуйста, заполните все обязательные поля');
      return;
    }
  }

  // Проверка email
  if (!validateEmail(formData.email)) {
    setError('Введите корректный email');
    return;
  }

  // Проверка пароля
  if (formData.password.length < 8) {
    setError('Пароль должен быть не менее 8 символов');
    return;
  }

  // Проверка телефона
  if (phone.length < 17) {
    setError('Введите корректный номер телефона');
    return;
  }

  // Отправка кода
  try {
    await axios.post('http://localhost:5000/api/users/send-verification', { 
      email: formData.email 
    });

    setIsEmailSent(true);
    setError('');
    setSuccess('Код подтверждения отправлен на вашу почту');
    setCanResend(false);
    setTimer(60);

    const interval = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

  } catch (err) {
    const message = err.response?.data?.error || err.response?.data || 'Ошибка отправки кода';
    setError(typeof message === 'string' ? message : JSON.stringify(message));
  }
};


  const handleSubmit = async (e) => {
  e.preventDefault();
  const code = verificationCode.join('');
  const requiredFields = ['name', 'surname', 'email', 'birthday', 'password'];
for (let field of requiredFields) {
  if (!formData[field]) {
    setError('Пожалуйста, заполните все обязательные поля');
    return;
  }
}
  if (formData.password.length < 8) {
  setError('Пароль должен быть не менее 8 символов');
  return;
}
if (phone.length < 17) {
  setError('Введите корректный номер телефона');
  return;
}
  if (code.length !== 6) {
    setError('Введите полный код подтверждения');
    return;
  }






 try {
  const response = await axios.post('http://localhost:5000/api/users', {
    ...formData,
    phone,
    verificationCode: code
  }, { withCredentials: true });

  const user = response.data.user;
  setCurrentUser(user);
  setSuccess('Регистрация успешна! Перенаправляем...');

  setTimeout(() => {
    navigate('/login');
  }, 1500);
  
} catch (err) {
  const message = err.response?.data?.error || 'Ошибка регистрации';
  setError(typeof message === 'string' ? message : JSON.stringify(message));
}

};

  return (
    <div className="registration-container">
      <h1>РЕГИСТРАЦИЯ</h1>
      
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
      
      <form onSubmit={handleSubmit}>
        <input
          className="reg"
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Имя"
          required
        />
        
        <input
          className="reg"
          type="text"
          name="surname"
          value={formData.surname}
          onChange={handleChange}
          placeholder="Фамилия"
          required
        />
        
        <input
          className="reg"
          type="text"
          name="father_name"
          value={formData.father_name}
          onChange={handleChange}
          placeholder="Отчество"
        />
        
        <input
          className="reg"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="Email"
          required
        />
        
         <input
         className="reg"
      type="text"
      value={phone}
      onChange={handlePhoneChange}
      placeholder="+375-XX-XXX-XX-XX"
      />
        <input
          className="reg"
          type="date"
          name="birthday"
          value={formData.birthday}
          onChange={handleChange}
          placeholder="Дата рождения"
        />
        
        <input
          className="reg"
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChangePassword}
          placeholder="Пароль"
          required
        />
                                     <hr style={{ margin: '30px 0' }} />
    <p className="privacy-link">
  Регистрируясь, вы соглашаетесь с <Link to="/privacy-policy">Политикой конфиденциальности</Link>.
</p>
        {!isEmailSent ? (
          <button 
            type="button" 
            className="reg-button"
            onClick={sendVerificationCode}
            disabled={!formData.email}
          >
            Отправить код подтверждения
          </button>
          
        ) : (
          <div className="verification-code-container">
            <h3>Введите код подтверждения</h3>
            <p>Мы отправили 6-значный код на {formData.email}</p>
            
            <div className="code-inputs">
              {verificationCode.map((digit, index) => (
                <input
                  key={index}
                  id={`code-${index}`}
                  className="code-input"
                  type="text"
                  maxLength="1"
                  value={digit}
                  onChange={(e) => handleCodeChange(e, index)}
                />
              ))}
            </div>
                         <hr style={{ margin: '30px 0' }} />
            
            <button 
              type="submit" 
              className="reg-button"
              disabled={verificationCode.join('').length !== 6}
            >
              Зарегистрироваться
            </button>
 
            <div className="resend-code">
              {canResend ? (
                <span onClick={sendVerificationCode}>Отправить код повторно</span>
              ) : (
                <span>Повторная отправка через {timer} сек</span>
              )}
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default Registr;