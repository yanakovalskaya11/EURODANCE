import React, { useContext, useEffect, useState } from 'react';
import { UserContext } from '../../UserContext';
import axios from 'axios';
import './MyThings.css';

const MyThings = () => {
  const { currentUser } = useContext(UserContext);
  const [things, setThings] = useState([]);
  const [activeTab, setActiveTab] = useState('Готово к получению');

  useEffect(() => {
    if (!currentUser) return;

    const fetchUserThings = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/user/${currentUser.id}/things`);
        setThings(res.data);
      } catch (err) {
        console.error('Ошибка при загрузке вещей:', err);
      }
    };

    fetchUserThings();
  }, [currentUser]);

  const filteredThings = things.filter(thing => thing.status === activeTab);

  return (
    <div className="my-things">
      <h3 className='nap'>Мои покупки</h3>

      <div className="tabs">
        {['Готово к получению', 'Доставляется', 'Получено'].map(status => (
          <button
            key={status}
            className={activeTab === status ? 'active' : ''}
            onClick={() => setActiveTab(status)}
          >
            {status}
          </button>
        ))}
      </div>

      <div className="things-list">
        {filteredThings.length === 0 ? (
          <p>Нет заказов со статусом: <strong>{activeTab}</strong></p>
        ) : (
          filteredThings.map((item) => (
            <div key={item.id} className="thing-card">
              <h4>{item.name}</h4>
              <img src={`http://localhost:5000${item.photo}`} alt={item.name} />
              <p>{item.descr}</p>
              <p><strong>{item.price} баллов</strong></p>
              <p className="status">Статус: {item.status}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MyThings;
