import React, { useContext, useEffect, useState, useRef } from 'react';
import { UserContext } from '../../UserContext';
import TeacherQuestions from './TeacherQuestions';
import './questions.css';
import Header from '../header/Header';
import Footer from '../Footer/Footer';
import { Link } from 'react-router-dom';
import QuestionDetail from './QuestionDetail';
import QuestionsManager from '../Admin/QuestionMeneger';
import { toast } from 'react-toastify';

const Students_questions = () => {
    const { currentUser } = useContext(UserContext);
    const [text, setText] = useState('');
    const [typeId, setTypeId] = useState(null);
    const [isAnonym, setIsAnonym] = useState(false);
    const [quest, setQuest] = useState([]);
    const [types, setTypes] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showForm, setShowForm] = useState(false);
    const formRef = useRef(null);

    useEffect(() => {
        fetch('http://localhost:5000/api/questions')
            .then((response) => response.json())
            .then((data) => setQuest(data))
            .catch((error) => console.error('Ошибка при получении вопросов:', error));

        fetch('http://localhost:5000/api/napravleniya')
            .then((res) => res.json())
            .then((data) => setTypes(data))
            .catch((err) => console.error('Ошибка при получении типов:', err));
    }, []);
    // Закрытие формы при клике вне её
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (formRef.current && !formRef.current.contains(event.target)) {
                setShowForm(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [formRef]);

    const addQuestion = () => {
        if (!text.trim()) {
            toast.warn("Пожалуйста, введите вопрос");
            return;
        }

        fetch('http://localhost:5000/api/questions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                type_id: typeId || null,
                user_id: currentUser.id,
                question: text,
                is_anonym: isAnonym,
                is_read_by_teacher: false,
                is_deleted: false,
                teacher_id: text,
                created_at: new Date().toLocaleDateString('sv-SE')

            }),
        })
            .then((response) => {
                if (!response.ok) throw new Error(`Ошибка HTTP! Статус: ${response.status}`);

                return response.json();
            })
            .then((newQuestion) => {
                setQuest([newQuestion, ...quest]);
                setText('');
                setIsAnonym(false);
                setTypeId(null);
                setShowForm(false);
            })
            .catch((error) => console.error('Ошибка при добавлении вопроса:', error));
    };

    // Фильтрация вопросов
const filteredQuestions = quest.filter(q => {
    const hasAnswer = !!q.answer;
    const matchesSearch = q.question.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !typeId || (q.napravleniya && q.napravleniya.some(n => n.id == typeId));

    // Показываем только вопросы с ответами, если пользователь не залогинен или студент
    if (!currentUser || currentUser?.role === 'user') {
        if (!hasAnswer) return false;
    }

    return matchesSearch && matchesType;
});


useEffect(() => {
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setShowForm(false);
    }
  };
  document.addEventListener('keydown', handleKeyDown);
  return () => {
    document.removeEventListener('keydown', handleKeyDown);
  };
}, []);


const canAddQuestion = currentUser?.role === 'user';

if(currentUser?.role=='admin'){
  return <QuestionsManager/>
}
return (
  <>
    <Header />{currentUser?.role === 'teacher' && (
  <div className="teacher-section main-content">
    <h2 className="nap">Ваши вопросы для ответа</h2>
    <TeacherQuestions />
  </div>
)}

    <div className='main-content'>
      <div className="questions-container">
        <div className="questions-header">
          <h1>Вопросы и ответы</h1>

          <div className="controls-row">
            <div className="search-wrapper">
              <input
                type="text"
                placeholder="Поиск вопросов..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              <span className="search-icon">🔍</span>
            </div>

            <select
              value={typeId || ''}
              onChange={(e) => setTypeId(e.target.value || null)}
              className="direction-select"
            >
              <option value="">Все направления</option>
              {types.map((type) => (
                <option key={type.id} value={type.id}>{type.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="questions-list">
          {filteredQuestions.map((q) => (
            <div key={q.id} className="question-item">
              <div className="question-meta">
                <span className={`author ${q.is_anonym ? 'anonymous' : ''}`}>
                  {q.is_anonym ? 'Аноним' : q.user_name || 'Ученик'}
                </span>
                <span className="date">
                  {new Date(q.created_at).toLocaleDateString()}
                </span>
                {q.napravleniya?.length > 0 && (
                  
                  <span>
                      <Link 
                                key={q.napravleniya.type_id}
                                to={`/napravleniya/${q.napravleniya}`}
                                className="no-text-decoration specialty-tag "
                            >
                            {q.napravleniya[0].name}</Link>
                  </span>
                )}
              </div>

              <div className="question-text">{q.question}</div>

              {q.answer && (
                <div className="answer-block">
                  <div className="teacher-info_2">
                    <div className="teacher-avatar-wrapper">
                      {q.teacher_photo ? (
                        <img
                          src={`http://localhost:5000${q.teacher_photo}`}
                          alt={q.teacher_name}
                          className="teacher-avatar"
                          onError={(e) => e.target.src = '/default-avatar.jpg'}
                        />
                      ) : (
                        <div className="avatar-placeholder">
                          {q.teacher_name?.charAt(0)}{q.teacher_last_name?.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="teacher-details_2">
                                                  <Link  key={q.teacher_id}
                                                    to={`/teachers/${q.teacher_id}`}
                                                    className="no-text-decoration">
                                                  <span className="teacher-name_quest">
                        {q.teacher_name} {q.teacher_last_name}
                      </span>
                                                  </Link>

                      <span className="answer-date">
                        Ответ от {q.answer_date && new Date(q.answer_date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="answer-text">{q.answer}</div>
                </div>
              )}
            </div>
          ))}
        </div>

        {canAddQuestion && (
          <>
            <button
              className="add-question-btn"
              onClick={() => setShowForm(!showForm)}
            >
              +
            </button>

            {showForm && (
              <div className="question-form-modal" ref={formRef} onClick={() => setShowForm(false)}>
                <div className="form-content" onClick={(e) => e.stopPropagation()}>
                  <h3>Новый вопрос</h3>
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Введите ваш вопрос..."
                    className="question-textarea"
                  />
                  <div className="form-actions">
                    <select
                      value={typeId || ''}
                      onChange={(e) => setTypeId(e.target.value || null)}
                      className="form-select"
                    >
                      <option value="">Выберите направление</option>
                      {types.map((type) => (
                        <option key={type.id} value={type.id}>{type.name}</option>
                      ))}
                    </select>
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={isAnonym}
                        onChange={() => setIsAnonym(!isAnonym)}
                      />
                      <span>Анонимный вопрос</span>
                    </label>
                    <button onClick={addQuestion} className="submit-btn">
                      Отправить
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
    <Footer />
  </>
  );
};

export default Students_questions;