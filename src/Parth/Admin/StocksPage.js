import React, { useState, useEffect } from 'react';
import AddStockForm from './AddStock';
import axios from 'axios'; 
import { toast } from 'react-toastify';

const StocksPage = () => {
  const [abonements, setAbonements] = useState([]);
  const [stocks, setStocks] = useState([]);

  useEffect(() => {
    fetchAbonements();
    fetchStocks();
  }, []);

  const fetchAbonements = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/tickets');
      setAbonements(response.data);
    } catch (error) {
      console.error('Ошибка при загрузке абонементов:', error);
    }
  };

  const fetchStocks = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/stocks');
      setStocks(response.data);
    } catch (error) {
      console.error('Ошибка при загрузке акций:', error);
    }
  };

  const handleDeleteStock = async (id) => {
    if (!window.confirm('Удалить акцию?')) return;

    try {
      await axios.delete(`http://localhost:5000/api/stocks/${id}`);
      setStocks(stocks.filter(stock => stock.id !== id));
    } catch (error) {
      console.error('Ошибка при удалении акции:', error);
      toast.error('Не удалось удалить акцию');
    }
  };

  const handleStockAdded = () => {
    toast.error('Акция загружена!');
    fetchStocks(); // обновить список после добавления
  };
  const formatDate = (dateString) => {
  if (!dateString) return '';
  return dateString.split('T')[0]; // берём только часть до "T"
};


  return (
    <div>
      <AddStockForm 
        onStockAdded={handleStockAdded} 
        abonementsList={abonements} 
      />
<div className='Naprav'>
      <h2>Список акций</h2>
      {stocks.length === 0 ? (
        <p>Акций пока нет</p>
      ) : (
        <ul>
          {stocks.map(stock => (
            <li key={stock.id} style={{ marginBottom: '10px' }}>
              <strong>{stock.name}</strong> — {formatDate(stock.date_begin)} до {stock.date_end ? formatDate(stock.date_end) : '∞'}

              <button 
                onClick={() => handleDeleteStock(stock.id)} 
                className='sumbit-btn'
                style={{ marginLeft: '10px'}}
              >
                Удалить
              </button>
            </li>
          ))}
        </ul>
      )}
      </div>
    </div>
  );
};

export default StocksPage;
