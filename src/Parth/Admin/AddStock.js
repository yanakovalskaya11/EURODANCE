import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AddStockForm = ({ onStockAdded }) => {
  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [imagePreview, setImagePreview] = useState(null);

  const [stockData, setStockData] = useState({
    name: '',
    descr: '',
    date_begin: new Date().toISOString().split('T')[0],
    date_end: '',
    photo: null,
    abonements: []
  });

  const [newAbonement, setNewAbonement] = useState({
    abonement_id: '',
    discount_percent: 0
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/tickets');
        setTickets(Array.isArray(res.data) ? res.data : []);
      } catch (error) {
        setErrors(prev => ({
          ...prev,
          fetch: 'Не удалось загрузить список абонементов'
        }));
      } finally {
        setIsLoading(false);
      }
    };

    fetchTickets();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setStockData(prev => ({ ...prev, [name]: value }));
  };

  const handleAbonementChange = (e) => {
    const { name, value } = e.target;
    setNewAbonement(prev => ({
      ...prev,
      [name]: name === 'discount_percent'
        ? parseInt(value) || 0
        : Number(value) || ''
    }));
  };

  const addAbonement = () => {
    if (!newAbonement.abonement_id) {
      setErrors(prev => ({ ...prev, abonement: 'Выберите абонемент' }));
      return;
    }
    if (newAbonement.discount_percent <= 0 || newAbonement.discount_percent > 100) {
      setErrors(prev => ({ ...prev, abonement: 'Скидка должна быть от 1% до 100%' }));
      return;
    }
    if (stockData.abonements.find(a => a.abonement_id === newAbonement.abonement_id)) {
      setErrors(prev => ({ ...prev, abonement: 'Абонемент уже добавлен' }));
      return;
    }

    setStockData(prev => ({
      ...prev,
      abonements: [...prev.abonements, { ...newAbonement }]
    }));

    setNewAbonement({ abonement_id: '', discount_percent: 0 });
    setErrors(prev => ({ ...prev, abonement: '' }));
  };

  const removeAbonement = (index) => {
    setStockData(prev => ({
      ...prev,
      abonements: prev.abonements.filter((_, i) => i !== index)
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!stockData.name.trim()) newErrors.name = 'Введите название акции';
    if (!stockData.descr.trim()) newErrors.descr = 'Введите описание';
    if (!stockData.date_begin) newErrors.date_begin = 'Укажите дату начала';
    if (stockData.date_end && new Date(stockData.date_end) < new Date(stockData.date_begin)) {
      newErrors.date_end = 'Дата окончания не может быть раньше начала';
    }
    if (!stockData.photo) newErrors.photo = 'Добавьте изображение';
    if (stockData.abonements.length === 0) newErrors.abonements = 'Добавьте хотя бы один абонемент';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newAbonement.abonement_id && newAbonement.discount_percent > 0) {
      const alreadyExists = stockData.abonements.some(
        a => a.abonement_id === newAbonement.abonement_id
      );
      if (!alreadyExists) {
        stockData.abonements.push({ ...newAbonement });
        setNewAbonement({ abonement_id: '', discount_percent: 0 });
      }
    }

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('name', stockData.name);
      formData.append('descr', stockData.descr);
      formData.append('date_begin', stockData.date_begin);
      formData.append('date_end', stockData.date_end || '');
      formData.append('photo', stockData.photo);

      const res = await axios.post('http://localhost:5000/api/stocks', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const stockId = res.data.id;

      await Promise.all(
        stockData.abonements.map(a =>
          axios.post('http://localhost:5000/api/stock-abonements', {
            stock_id: stockId,
            abonement_id: a.abonement_id,
            discount_percent: a.discount_percent
          })
        )
      );

      onStockAdded();
      setStockData({
        name: '',
        descr: '',
        date_begin: new Date().toISOString().split('T')[0],
        date_end: '',
        photo: null,
        abonements: []
      });
      setImagePreview(null);
      setErrors({});
    } catch (error) {
      console.error(error);
      setErrors(prev => ({
        ...prev,
        submit: 'Ошибка при сохранении акции'
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div>Загрузка абонементов...</div>;

  return (
    <div className="Naprav">
      <div className="survey-creation">
        <h2>Добавить новую акцию</h2>
        {errors.fetch && <div className="error-message">{errors.fetch}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Название акции</label>
            <input
              type="text"
              name="name"
              value={stockData.name}
              onChange={handleInputChange}
              
              className={errors.name ? 'error' : ''}
            />
            {errors.name && <div className="error-message">{errors.name}</div>}
          </div>

          <div className="form-group">
            <label>Описание</label>
            <textarea
              name="descr"
              value={stockData.descr}
              onChange={handleInputChange}
              className={errors.descr ? 'error' : ''}
            />
            {errors.descr && <div className="error-message">{errors.descr}</div>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Дата начала</label>
              <input
                type="date"
                name="date_begin"
                value={stockData.date_begin}
                onChange={handleInputChange}
                className={errors.date_begin ? 'error' : ''}
              />
              {errors.date_begin && <div className="error-message">{errors.date_begin}</div>}
            </div>
            <div className="form-group">
              <label>Дата окончания</label>
              <input
                type="date"
                name="date_end"
                value={stockData.date_end}
                onChange={handleInputChange}
                className={errors.date_end ? 'error' : ''}
                min={stockData.date_begin}
              />
              {errors.date_end && <div className="error-message">{errors.date_end}</div>}
            </div>
          </div>

          <div className="form-group">
            <label>Фото</label>
            <input
              type="file"
              accept="image/*"
              className='file-input-hidden'
              onChange={(e) => {
                const file = e.target.files[0];
                setStockData(prev => ({ ...prev, photo: file || null }));
                setImagePreview(file ? URL.createObjectURL(file) : null);
              }}
            />
            {imagePreview && (
              <div className="image-preview">
                <img src={imagePreview} alt="Предпросмотр" style={{ maxHeight: 150 }} />
              </div>
            )}
            {errors.photo && <div className="error-message">{errors.photo}</div>}
          </div>

          <div className="form-group">
            <h3>Абонементы</h3>
            {errors.abonements && <div className="error-message">{errors.abonements}</div>}
            <div className="add-abonement">
              <select
                name="abonement_id"
                value={newAbonement.abonement_id}
                onChange={handleAbonementChange}
              >
                <option value="">Выберите абонемент</option>
                {tickets.map(ticket => (
                  <option
                    key={ticket.id}
                    value={ticket.id}
                    disabled={stockData.abonements.some(a => a.abonement_id === ticket.id)}
                  >
                    {ticket.name_ticket} (ID: {ticket.id})
                  </option>
                ))}
              </select>
              <input
                type="number"
                name="discount_percent"
                value={newAbonement.discount_percent}
                onChange={handleAbonementChange}
                min="1"
                max="100"
                placeholder="Скидка %"
              />
            </div>
            {errors.abonement && <div className="error-message">{errors.abonement}</div>}

            <div className="abonements-list">
              {stockData.abonements.map((abonement, index) => {
                const ticket = tickets.find(t => t.id === abonement.abonement_id);
                return (
                  <div key={index}>
                    {ticket?.name_ticket || `Абонемент ID: ${abonement.abonement_id}`} — {abonement.discount_percent}%
                    <button type="button" onClick={() => removeAbonement(index)}>Удалить</button>
                  </div>
                );
              })}
            </div>
          </div>

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Сохранение...' : 'Сохранить акцию'}
          </button>

          {errors.submit && <div className="error-message">{errors.submit}</div>}
        </form>
      </div>
    </div>
  );
};

export default AddStockForm;
