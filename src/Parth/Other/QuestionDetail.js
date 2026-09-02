import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import Header from '../header/Header';
import Footer from '../Footer/Footer';

const QuestionDetail = () => {
  const { id } = useParams();
  const [questionData, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

  const fetchQuestion = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/questions/${id}`);
      setQuestion(res.data);
    } catch (err) {
      console.error('Ошибка при загрузке вопроса:', err);
    } finally {
      setLoading(false);  // <-- важно сбросить загрузку в false
    }
  };

  fetchQuestion();
}, [id]);


  if (loading) return <p>Загрузка...</p>;
  if (!questionData) return <p>Вопрос не найден</p>;

  const { question, answers } = questionData;

  return (
    <div>
        <Header/>
        <div className='main-content'>
         <div  className="question-item">
      <h2 className="question-text" >Вопрос:</h2>
      <p className="question-text">{question.question}</p>
        </div>
               <div className="answer-block">
      <h3 className="question-text">Ответ</h3>

      {answers.length === 0 ? (
        <p>Ответов пока нет</p>
      ) : (
              <div className="answer-card">
          {answers.map(answer => (
            <div key={answer.id}>
              <p>{answer.answer}</p>
              <p>
                — <em>{answer.teacher_name} {answer.teacher_surname}</em>
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
    
    </div>
<Footer/>
    </div>
  );
};

export default QuestionDetail;
