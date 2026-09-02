import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AdminSurveys = () => {
  const [surveys, setSurveys] = useState([]);
  const [selectedSurvey, setSelectedSurvey] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [reservId, setReservId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('manage'); 
  const [responses, setResponses] = useState([]);
  const navigate = useNavigate();
  const handleAxiosError = (error, defaultMessage) => {
    console.error(error);
    setError(error.response?.data?.error || defaultMessage);
    return null;
  };
  const fetchSurveys = async () => {
    try {
      setLoading(true);
      setError('');
      const { data } = await axios.get('http://localhost:5000/api/admin/surveys', { 
        withCredentials: true 
      });
      setSurveys(data);
    } catch (error) {
      handleAxiosError(error, 'Не удалось загрузить анкеты');
    } finally {
      setLoading(false);
    }
  };
  const fetchQuestions = async (surveyId) => {
    try {
      setLoading(true);
      setError('');
      const { data } = await axios.get(
        `http://localhost:5000/api/admin/surveys/${surveyId}/questions`,
        { withCredentials: true }
      );
      setQuestions(data);
    } catch (error) {
      handleAxiosError(error, 'Не удалось загрузить вопросы');
    } finally {
      setLoading(false);
    }
  };
  const fetchResponses = async () => {
    try {
      setLoading(true);
      setError('');
      const { data } = await axios.get(
        'http://localhost:5000/api/admin/surveys/responses',
        { withCredentials: true }
      );
      setResponses(data);
    } catch (error) {
      handleAxiosError(error, 'Не удалось загрузить ответы');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSurveys();
      fetchResponses();
  }, []);

  useEffect(() => {
    if (selectedSurvey) {
      fetchQuestions(selectedSurvey);
    }
  }, [selectedSurvey]);

  useEffect(() => {
    if (activeTab === 'responses') {
      fetchResponses();
    }
  }, [activeTab]);
  const handleCreateSurvey = async () => {
    if (!reservId) {
      setError('Введите ID бронирования');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const { data } = await axios.post(
        'http://localhost:5000/api/admin/surveys/create',
        { reservId },
        { withCredentials: true }
      );
      
      setSurveys(prev => [...prev, data]);
      setReservId('');
      await fetchSurveys();
    } catch (error) {
      handleAxiosError(error, 'Ошибка создания анкеты');
    } finally {
      setLoading(false);
    }
  };
  const handleAddQuestion = async () => {
    if (!newQuestion.trim() || !selectedSurvey) {
      setError('Введите текст вопроса');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const { data } = await axios.post(
        `http://localhost:5000/api/admin/surveys/${selectedSurvey}/questions`,
        { questionText: newQuestion },
        { withCredentials: true }
      );
      
      setQuestions(prev => [...prev, data]);
      setNewQuestion('');
    } catch (error) {
      handleAxiosError(error, 'Ошибка добавления вопроса');
    } finally {
      setLoading(false);
    }
  };
  const handleDeleteQuestion = async (questionId) => {
    if (!window.confirm('Удалить этот вопрос?')) return;

    try {
      setLoading(true);
      await axios.delete(
        `http://localhost:5000/api/admin/surveys/questions/${questionId}`,
        { withCredentials: true }
      );
      
      setQuestions(prev => prev.filter(q => q.id !== questionId));
    } catch (error) {
      handleAxiosError(error, 'Ошибка удаления вопроса');
    } finally {
      setLoading(false);
    }
  };

  const answeredReservIds = new Set(responses.map(r => r.reserv_id));

const filteredSurveys = surveys.filter(survey => !answeredReservIds.has(survey.reserv_id));


  return (
    <div className="admin-surveys">
      <h1>Управление анкетами</h1>
      
      <div className="tabs">
        <button 
          className={`survey tab-button ${activeTab === 'manage' ? 'active' : ''}`}
          onClick={() => setActiveTab('manage')}
        >
          Управление анкетами
        </button>
        <button 
          className={`survey tab-button ${activeTab === 'responses' ? 'active' : ''}`}
          onClick={() => setActiveTab('responses')}
        >
          Ответы пользователей
        </button>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      {activeTab === 'manage' ? (
        <>
          <div className="survey-creation">
            <h2>Создать новую анкету</h2>
            <div>
              <input 
                type="text"
                value={reservId}
                onChange={(e) => setReservId(e.target.value)}
                placeholder="ID бронирования"
                disabled={loading}
              />
              <button className='survey'
                onClick={handleCreateSurvey}
                disabled={loading}
              >
                {loading ? 'Создание...' : 'Создать анкету'}
              </button>
            </div>
          </div>
          
          <div className="surveys-list">
  <h2>Существующие анкеты</h2>
  <select
    value={selectedSurvey || ''}
    onChange={(e) => setSelectedSurvey(e.target.value)}
    disabled={loading}
  >
    <option value="">Выберите анкету</option>
    {surveys.length > 0 && responses.length > 0 ? (
      surveys
        .filter(survey => !new Set(responses.map(r => r.reserv_id)).has(survey.reserv_id))
        .map(survey => (
          <option key={survey.id} value={survey.id}>
            Анкета для брони #{survey.reserv_id}
          </option>
        ))
    ) : (
      surveys.map(survey => (
        <option key={survey.id} value={survey.id}>
          Анкета для брони #{survey.reserv_id}
        </option>
      ))
    )}
  </select>
</div>

          
          {selectedSurvey && (
            <div className="questions-management">
              <h3>Вопросы анкеты</h3>
              
              <div className="add-question">
                <input
                  type="text"
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  placeholder="Текст нового вопроса"
                  disabled={loading}
                />
                <button className='survey'
                  onClick={handleAddQuestion}
                  disabled={loading}
                >
                  Добавить вопрос
                </button>
              </div>
              
              <ul className="questions-list">
                {questions.map(question => (
                  <li key={question.id}>
                    {question.text}
                    <button 
                      onClick={() => handleDeleteQuestion(question.id)}
                      disabled={loading}
                      className='survey'
                    >
                      Удалить
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      ) : (
         <div className="responses-view">
    <h2>Ответы пользователей</h2>
    
    {loading ? (
      <p>Загрузка ответов...</p>
    ) : responses.length === 0 ? (
      <p>Нет данных об ответах</p>
    ) : (
      <div className="responses-list">
        {responses.map(response => (
          <div key={response.id} className="response-item">
            <h3>Ответ пользователя {response.user_email || `#${response.user_id}`}</h3>
            <p>Анкета для брони #{response.reserv_id}</p>
            <p>Дата заполнения: {new Date(response.completed_at).toLocaleString()}</p>
            
            <div className="answers">
              <h4>Ответы:</h4>
             {Object.entries(response.answers).map(([questionId, answerObj]) => (
  <div key={questionId} className="answer">
    <strong>{answerObj.questionText}</strong>: {answerObj.answer}
  </div>
))}


            </div>
          </div>
        ))}
      </div>
    )}
  </div>
)}

    </div>
  );
};

export default AdminSurveys;