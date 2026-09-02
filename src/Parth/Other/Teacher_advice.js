import React, { useContext, useEffect, useState } from 'react';
import { UserContext } from '../../UserContext';
import './TeacherAdvice.css';
import AddAdviceForm from './AddAdviceForm';
import Header from '../header/Header';
import Footer from '../Footer/Footer';
import ScrollButton from '../ScrollButton';
import Students_questions from './Students_questions';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { FaEllipsisV } from 'react-icons/fa';

const TeacherAdvice = () => {
  const { currentUser } = useContext(UserContext);
  const [advices, setAdvices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedPosts, setExpandedPosts] = useState({});
  const [menuOpenId, setMenuOpenId] = useState(null);

  useEffect(() => {
    fetch('http://localhost:5000/api/advices')
      .then((response) => {
        if (!response.ok) throw new Error('Ошибка соединения с сервером');
        return response.json();
      })
      .then((data) => {
        setAdvices(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Ошибка при получении советов:', error);
        setError(error.message);
        setLoading(false);
      });
  }, []);

  const toggleExpand = (id) => {
    setExpandedPosts(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleAddAdvice = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/advices');
      if (!response.ok) throw new Error('Ошибка при обновлении списка советов');
      const data = await response.json();
      setAdvices(data);
    } catch (error) {
      console.error('Ошибка при обновлении списка советов:', error);
      setError(error.message);
    }
  };

  const handleDelete = async (adviceId) => {
    try {
      await axios.delete(`http://localhost:5000/api/advice/${adviceId}`);
      setAdvices(prevAdvice => prevAdvice.filter(advice => advice.id !== adviceId));
    } catch (err) {
      console.error('Ошибка при удалении совета:', err);
    }
  };

  if (loading) return <div className="loading">Загрузка...</div>;
  if (error) return <div className="error">Ошибка: {error}</div>;

  const renderAdviceList = () => (
    <>
      {advices.map((advice) => {
        if (!advice.teacher || !advice.napravleniya) return null;
        
        return (
          <div key={advice.id} className="advice-post">
            {/* Условие для отображения меню */}
            {(currentUser?.role === 'teacher' && currentUser?.id === advice.teacher.id) || 
             currentUser?.role === 'admin' ? (
              <div className="menu-container">
                <FaEllipsisV
                  className="menu-icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpenId(menuOpenId === advice.id ? null : advice.id);
                  }}
                />
                {menuOpenId === advice.id && (
                  <div className="dropdown-menu">
                    <button onClick={() => handleDelete(advice.id)}>Удалить</button>
                  </div>
                )}
              </div>
            ) : null}

            <div className="post-header">
              <div className="teacher-info">
                {advice.teacher?.photo && (
                  <img  
                    src={`http://localhost:5000${advice.teacher.photo}`}
                    alt={`${advice.teacher.name} ${advice.teacher.last_name}`} 
                    className="teacher-avatar"
                  />
                )}
                <div className="teacher-name-container">
                  <Link to={`/teachers/${advice.teacher.id}`} className="no-text-decoration">
                    <h3 className="teacher-name">
                      {advice.teacher.name} {advice.teacher.last_name}
                    </h3>
                  </Link>

                  <div className="teacher-directions">
                    {advice.napravleniya.map((napravlenie) => (
                      <Link 
                        key={napravlenie.id}
                        to={`/napravleniya/${napravlenie.id}`}
                        className="specialty-tag no-text-decoration"
                      >
                        {napravlenie.name}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <h2 className="advice-title">{advice.title}</h2>
            <div 
              className={`advice-text ${expandedPosts[advice.id] ? 'expanded' : ''}`}
              dangerouslySetInnerHTML={{ __html: advice.text }} 
            />
            <div className="read-more-container">
              <button 
                className="read-more-btn"
                onClick={() => toggleExpand(advice.id)}
              >
                {expandedPosts[advice.id] ? 'Свернуть' : 'Читать полностью'}
              </button>
            </div>
          </div>
        );
      })}

      {currentUser?.role === 'teacher' && (
        <AddAdviceForm onAdd={handleAddAdvice} />
      )}
    </>
  );

  return (
    <>
      <Header />
      <div className="advice-feed">
        {renderAdviceList()}
      </div>
      <ScrollButton/>
      <Footer />
    </>
  );
};

export default TeacherAdvice;