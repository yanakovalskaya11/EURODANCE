import React, { useEffect, useState } from 'react';
import axios from 'axios';
import "./naprav.css"
import Header from '../header/Header';
import Footer from '../Footer/Footer';
import { NavLink } from 'react-router-dom';
const Napravleniya = () => {
    const [napravleniya, setNapravleniya] = useState([]);
    const [selectedLevel, setSelectedLevel] = useState('all');

    useEffect(() => {
      // Получаем данные с сервера
      axios.get('http://localhost:5000/api/napravleniya')
          .then((response) => {
              setNapravleniya(response.data);
          })
          .catch((error) => {
              console.error('Ошибка при получении данных:', error);
          });
  }, []);


        const handleLevelChange = (event) => {
        setSelectedLevel(event.target.value);
        };


   const filteredNapravleniya = napravleniya.filter(item => {
  if (selectedLevel === 'all') return true;
  if (!item.levels || item.levels.length === 0) return false;
  return item.levels.includes(selectedLevel);
});


  return (
    <div className='naprav_'>            
        <h1 className='nap'>Направления</h1>
          <p>
    Уровень:
    <select onChange={handleLevelChange} value={selectedLevel}>
      <option value="all">Все направления</option>
      <option value="все уровни">Все уровни</option>
       <option value="начинающий">Начальный</option>
      <option value="продвинутый">Продвинутый</option>
    </select>
  </p>
        
          <div className='napravleniya'>


 
          {filteredNapravleniya.map((item) => (

                <div key={item.id} className='n_type'>
                    <NavLink to={`/napravleniya/${item.id}`}> <h2>{item.name}</h2></NavLink>
                    <p>{item.short_descr}</p>
                    {/* Отображение изображения */}
                    <NavLink to={`/napravleniya/${item.id}`}> 
                    <img 
            src={`http://localhost:5000${item.photo}`} 
            alt={item.name} 
                />
                </NavLink>
                <NavLink to={`/napravleniya/${item.id}`}> <button>Записаться</button></NavLink>
                </div>
            ))}
        </div>
    </div>
  )
}

export default Napravleniya
