import React, { useContext, useEffect, useState } from 'react';
import { UserContext } from '../../UserContext';
import Footer from '../Footer/Footer';
import Header from '../header/Header';
import { FaEllipsisV } from 'react-icons/fa';
import { toast } from 'react-toastify';

const TeacherQuestions = () => {
  const { currentUser } = useContext(UserContext);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');

  useEffect(() => {
    if (!currentUser?.id) return;

    const url =
      currentUser.role === 'admin'
        ? 'http://localhost:5000/api/admin/questions'
        : `http://localhost:5000/api/teacher/questions/${currentUser.id}`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => setQuestions(data))
      .catch((err) => console.error('Ошибка при загрузке вопросов:', err));
  }, [currentUser]);

  const handleAnswerChange = (questionId, text) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: text,
    }));
  };

  const sendAnswer = (questionId) => {
    const answerText = answers[questionId];

    if (!answerText?.trim()) {
      toast.warn('Введите ответ');
      return;
    }

    fetch('http://localhost:5000/api/answers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id_quest: questionId,
        id_teacher: currentUser.id,
        answer: answerText,
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error('Ошибка при отправке ответа');
        return res.json();
      })
      .then(() => {
        toast.success('Ответ отправлен');
        setQuestions((prev) => prev.filter((q) => q.id !== questionId));
        setAnswers((prev) => {
          const newState = { ...prev };
          delete newState[questionId];
          return newState;
        });
      })
      .catch((err) => console.error('Ошибка при отправке ответа:', err));
  };

  const deleteQuestion = (questionId) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот вопрос?')) return;

    fetch(`http://localhost:5000/api/questions/${questionId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Ошибка при удалении вопроса');
        return res.json();
      })
      .then(() => {
        toast.success('Вопрос удалён');
        setQuestions((prev) => prev.filter((q) => q.id !== questionId));
        setAnswers((prev) => {
          const newState = { ...prev };
          delete newState[questionId];
          return newState;
        });
      })
      .catch((err) => console.error('Ошибка при удалении вопроса:', err));
  };

  const toggleMenu = (id) => {
    setMenuOpenId(menuOpenId === id ? null : id);
  };

  const startEdit = (question) => {
    setEditingId(question.id);
    setEditText(question.question);
    setMenuOpenId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText('');
  };

  const saveEdit = async (questionId) => {
    if (!editText.trim()) {
      toast.warn('Текст вопроса не может быть пустым');
      return;
    }

    try {
      const res = await fetch(`http://localhost:5000/api/questions/${questionId}`, {
        method: 'PUT', // Или PATCH — зависит от реализации API
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: editText }),
      });

      if (!res.ok) throw new Error('Ошибка при обновлении вопроса');

      const updatedQuestion = await res.json();
      setQuestions((prev) =>
        prev.map((q) => (q.id === questionId ? updatedQuestion : q))
      );
      setEditingId(null);
      setEditText('');
      toast.success('Вопрос обновлён');
    } catch (err) {
      console.error(err);
      toast.error('Ошибка при обновлении вопроса');
    }
  };

  if (!currentUser || (currentUser.role !== 'teacher' && currentUser.role !== 'admin')) {
    return <p>Доступ запрещён</p>;
  }

  return (
    <>
      <Header />
      <div className="main-content">
        {questions.length === 0 ? (
          <p>Нет новых вопросов</p>
        ) : (
          questions.map((q) => (
            <div key={q.id} className="comments" style={{ position: 'relative' }}>
              <p><strong>Направление:</strong> {q.napravleniya ? q.napravleniya.name : 'Общий вопрос'}</p>
              <p><strong>От:</strong> {q.is_anonym ? 'Анонимно' : q.user_name || 'Неизвестно'}</p>

              {/* Меню */}
              {(currentUser.role === 'admin' || currentUser.id === q.teacher_id) && (
                <div style={{ position: 'absolute', top: '10px', right: '10px' }}>
                  <FaEllipsisV
                    style={{ cursor: 'pointer' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleMenu(q.id);
                    }}
                  />
                  {menuOpenId === q.id && (
                    <div className="dropdown-menu" style={{
                      position: 'absolute',
                      background: '#fff',
                      border: '1px solid #ccc',
                      padding: '5px',
                      zIndex: 1000
                    }}>
                      <button onClick={() => startEdit(q)}>Редактировать</button>
                      <button onClick={() => deleteQuestion(q.id)}>Удалить</button>
                    </div>
                  )}
                </div>
              )}

              {/* Вопрос */}
              {editingId === q.id ? (
                <>
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    style={{ width: '100%', minHeight: '60px' }}
                  />
                  <div style={{ marginTop: '10px' }}>
                    <button onClick={() => saveEdit(q.id)}>Сохранить</button>
                    <button onClick={cancelEdit} style={{ marginLeft: '10px' }}>Отмена</button>
                  </div>
                </>
              ) : (
                <p><strong>Вопрос:</strong> {q.question}</p>
              )}

              {/* Ответ */}
              <textarea
                value={answers[q.id] || ''}
                onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                placeholder="Введите ваш ответ..."
                className="question-textarea"
              />
              <button onClick={() => sendAnswer(q.id)} className="submit-btn">Отправить ответ</button>
            </div>
          ))
        )}
      </div>
    </>
  );
};

export default TeacherQuestions;
