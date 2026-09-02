import React, { useContext, useState, useEffect } from 'react';
import { UserContext } from '../../UserContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './personal1.css';
import Header from '../header/Header';
import MyTickets from './MyTickets';
import MyLessons from './MyLessons';
import Footer from '../Footer/Footer'
import MyThings from './MyThings'
import Achievements from './Achievements';
import NotificationBell from './NotificationBell';
import DropImageUploader from '../../hooks/photo';
import { toast } from 'react-toastify';
const Personal = () => {
  const navigate = useNavigate();
  const { currentUser, setCurrentUser } = useContext(UserContext);

  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    surname: '',
    birthday: '',
    // email: '',
    password: ''
  });
  const [newPhoto, setNewPhoto] = useState(null);
  const [showSurveyNotification, setShowSurveyNotification] = useState(false);
  const [reservationsForSurvey, setReservationsForSurvey] = useState([]);
  const [isLoading, setIsLoading] = useState(false);



  useEffect(() => {
}, [currentUser]);


  // Загрузка данных пользователя и анкет
  useEffect(() => {
  const fetchSurveys = async () => {
    if (!currentUser?.id) return;
    
    setIsLoading(true);
    try {
      const { data } = await axios.get(
        `http://localhost:5000/api/users/${currentUser.id}/lessons-need-survey`,
        { withCredentials: true }
      );
      
      
      if (data?.length > 0) {
        setReservationsForSurvey(data);
        setShowSurveyNotification(true);
      } else {
        setShowSurveyNotification(false);
      }
    } catch (error) {
      console.error('Ошибка загрузки анкет:', error);
      setShowSurveyNotification(false);
    } finally {
      setIsLoading(false);
    }
  };

  fetchSurveys();
}, [currentUser?.id]);

useEffect(() => {
  if (!currentUser?.id) return;

  const fetchUserData = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/users/${currentUser.id}`, { withCredentials: true });
      const newUserData = response.data;

      // Сравним JSON, чтобы обновить состояние только если данные действительно изменились
      if (JSON.stringify(newUserData) !== JSON.stringify(currentUser)) {
        setCurrentUser(newUserData);
        localStorage.setItem('user', JSON.stringify(newUserData));
      }
    } catch (error) {
      console.error('Ошибка при загрузке данных пользователя:', error);
    }
  };

  fetchUserData();
}, [currentUser?.id, currentUser, setCurrentUser]);


  const exit = async () => {
    try {
      await axios.post('http://localhost:5000/api/logout', {}, {
        withCredentials: true,
      });
      setCurrentUser(null);
      localStorage.removeItem('user');
      navigate('/');
    } catch (error) {
      console.error('Ошибка при выходе:', error);
    }
  };
const handleDeleteProfile = async () => {
  if (!window.confirm("Вы уверены, что хотите удалить профиль? Это действие необратимо.")) return;

  try {
    await axios.delete(`http://localhost:5000/api/users/${currentUser.id}`, {
      withCredentials: true
    });

    // Очистка состояния и переход на главную
    setCurrentUser(null);
    localStorage.removeItem('user');
    navigate('/');
  } catch (error) {
    console.error('Ошибка при удалении профиля:', error);
    toast.error('Не удалось удалить профиль. Попробуйте позже.');
  }
};

  const handleUpdate = async () => {
    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (value) data.append(key, value);
    });
    if (newPhoto) data.append('photo', newPhoto);

    try {
      const response = await axios.patch(
        `http://localhost:5000/api/users/${currentUser.id}`,
        data,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          withCredentials: true,
        }
      );
      
      // Обновляем только если данные изменились
      if (JSON.stringify(response.data) !== JSON.stringify(currentUser)) {
        setCurrentUser(response.data);
        localStorage.setItem('user', JSON.stringify(response.data));
      }
      
      setEditMode(false);
      setFormData({ name: '', surname: '', birthday: '', password: '' });
      setNewPhoto(null);
    } catch (error) {
      console.error('Ошибка при обновлении профиля:', error);
    }
  };
      const defaultAvatar='../image1.png'
    const getPhotoUrl = () => {
    if (!currentUser?.photo) {

      return defaultAvatar; // Возвращаем дефолтное изображение
    }
    
    // Проверяем, является ли photo URL (начинается с http)
    if (currentUser.photo.startsWith('http')) {
      return currentUser.photo;
    }
    
    // Иначе считаем, что это путь на сервере
    return `http://localhost:5000${currentUser.photo}`;
  };

  const handleSurveyClick = (reservationId) => {
    if (!reservationId) return;
    navigate(`/survey/${reservationId}`);
  };

  const closeNotification = () => setShowSurveyNotification(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

          const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
};




  if (!currentUser) return <p>Пользователь не авторизован</p>;
  if (isLoading) return <div>Загрузка...</div>;

  return (
    
    <>
      <Header />
      <NotificationBell userId={currentUser?.id} />

      <div className="main-content">
      <div className="personal">
      

        <div className="profile-block">
  <img
              src={getPhotoUrl()}
              alt="Аватар"
              className="profile-photo"
              onError={(e) => {
                e.target.onerror = null; // Предотвращаем бесконечный цикл
                e.target.src = defaultAvatar; // Устанавливаем дефолтное изображение при ошибке
              }}
            />
          
          {!editMode ? (
            <>
              <div className="profile-info">
                <p><strong>Имя:</strong> {currentUser.name}</p>
                <p><strong>Фамилия:</strong> {currentUser.surname}</p>
                <p><strong>Дата рождения:</strong> {formatDate(currentUser.birthday)}</p>
                <p><strong>Email:</strong> {currentUser.email}</p>
                <p><strong>Пароль:</strong> ••••••••</p>
                <p><strong>Баллы:</strong> {currentUser.score}</p>
              </div>
              <div className="profile-actions">
                <button onClick={() => setEditMode(true)}>Редактировать</button>
                <button onClick={exit}>Выйти</button>
              </div>
            </>
          ) : (
            <div className="edit-form">
              <label>Имя:</label>
              <input
                type="text"
                name="name"
                 autoComplete="given-name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder={currentUser.name}
              />
              <label>Фамилия:</label>
              <input
                type="text"
                name="surname"
                value={formData.surname}
                onChange={handleInputChange}
                placeholder={currentUser.surname}
                autoComplete="family-name"
              />
              {/* <label>Дата рождения:</label>
              <input
                type="date"
                name="birthday"
                value={formData.birthday}
                onChange={handleInputChange}
                placeholder={currentUser.birthday}
              /> */}
              {/* <label>Email:</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder={currentUser.email}
              /> */}
              <label>Пароль:</label>
              <input
                type="password"
                name="password"
                autoComplete="new-password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Новый пароль"
              />
              <label>Фото:</label>
              <DropImageUploader onFileSelect={(file) => setNewPhoto(file)} />


              <div className="profile-actions">
                <button onClick={handleUpdate}>Сохранить</button>
                <button onClick={() => setEditMode(false)}>Отмена</button>
                <button onClick={handleDeleteProfile}>Удалить профиль</button>

              </div>
            </div>
          )}
        </div>

        <MyTickets />
        <MyLessons />
        <MyThings/>
          <div className="achievements-section">
    <h2 className="section-title">Мои достижения</h2>
    <Achievements />
  </div>
        <Footer/>
      </div>
      
      </div>
    </>
  );
};

export default Personal;