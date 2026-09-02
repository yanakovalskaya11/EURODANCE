import axios from 'axios';
import React, { useContext, useEffect, useState } from 'react';
import './spend.css';
import Header from '../header/Header';
import Footer from '../Footer/Footer';
import { UserContext } from '../../UserContext';
import { useNavigate } from 'react-router-dom';
import ScrollButton from '../ScrollButton';
import { toast } from 'react-toastify';

const SpendScores = () => {
  const [things, setThings] = useState([]);
  const { currentUser, setCurrentUser } = useContext(UserContext); // Добавляем setCurrentUser
  const navigate = useNavigate();

  useEffect(() => {
    axios.get('http://localhost:5000/api/things')
      .then((response) => {
        setThings(response.data);
      })
      .catch((error) => {
        console.error('Ошибка при получении данных:', error);
      });
  }, []);

  const buy_thing = async (itemPrice, itemId) => { // Добавляем itemId для идентификации товара
    if (!currentUser) {
      toast.warn("Сначала войдите в аккаунт!");
      navigate('/login');
      return;
    }

    if (currentUser.score < itemPrice) {
      toast.warn("У вас не хватает баллов!");
      return;
    }

    try {
      // Отправляем запрос на сервер для списания баллов
      const response = await axios.post('http://localhost:5000/api/buy', {
        userId: currentUser.id,
        itemId: itemId,
        price: itemPrice
      }, { withCredentials: true });

      // Обновляем данные пользователя
      setCurrentUser({
        ...currentUser,
        score: currentUser.score - itemPrice
      });

      toast.success("Покупка успешно совершена!");
    } catch (error) {
      console.error('Ошибка при покупке:', error);
      toast.error("Произошла ошибка при покупке");
    }
  };

  return (
    <>
      <Header/>
      <div className='main-content'>
        <div className='spend_score'>
          <h1>Баллы</h1>
          <p>Баллы можно получить за прохождение опросов в личном кабинете</p>
          <p>Награду можно забрать в нашей студии спустя три дня после оформления </p>
         <div className='things'>
  {things.map((item) => (
    <div key={item.id} className='thing'>
      <div className="image-container">
        <img src={`http://localhost:5000${item.photo}`} alt={item.name} />
      </div>
      <div className="text-container">
        <h2>{item.name}</h2>
        <p>{item.descr}</p>
        <p>{item.price} баллов</p>
        <button onClick={() => buy_thing(item.price, item.id)}>Купить</button>
      </div>
    </div>
  ))}
</div>
        </div>
        <ScrollButton/>
        <Footer/>
      </div>
    </>
  );
};

export default SpendScores;