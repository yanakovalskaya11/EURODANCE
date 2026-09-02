import React, { useContext, useEffect, useState } from 'react'
import { UserContext } from '../../UserContext'
import axios from 'axios';
import { toast } from 'react-toastify';

const ShowComments = () => {
    const {currentUser} = useContext(UserContext);
    const [rating, setRating] = useState(0);
    const [text, setText] = useState('');
    const [stars, setStars] = useState('');
    const [comment, setComment]=useState([]);


    const handleStarClick = (value) =>{
        setRating(value);
        setStars(value);
    }

    const renderStars = (value) => {
        return [...Array(5)].map((_, index)=>{
            const starValue  = index+1;
            return(
                <span
                    key={starValue}
                    className={`star ${starValue  <= value ? 'selected' : ''}`}
                    onClick={() => handleStarClick(value)}
                    style={{ fontSize: '30px', cursor: 'pointer', color: starValue <= value ? 'gold' : 'lightgray' }}
                >
                    &#9733;
                </span>
            );
        });
    };

    useEffect(() => {
        fetch('http://localhost:5000/api/comments_start')
          .then((response) => response.json())
          .then((data) => setComment(data))
          .catch((error) => console.error('Ошибка при получении пользователей:', error));
      }, []);
      
      const deleteItem = async(id_of_comm) =>{
        try{
            await axios.delete(`http://localhost:5000/api/comments_start/${id_of_comm}`);
            toast.success("Запись успешно удалена!");
        }catch(error){

    console.error('Ошибка при удалении записи:', error);
    toast.error('Ошибка при удалении записи');
        }
    }

    const acceptComment = (id_of_comm) => {
        fetch('http://localhost:5000/api/comments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ id_of_comm }),
        })
        .then((response) => {
            if (!response.ok) {
                throw new Error(`Ошибка HTTP! Статус: ${response.status}`);
            }
            return response.json();
        })
        .then((data) => {
            setComment((prevComments) => prevComments.filter(comm => comm.id_of_comm !== id_of_comm));
        })
        .catch((error) => {
            console.error('Ошибка при принятии комментария:', error);
        });
    };
    
  return (
    <div className='Naprav'>
      <h2 className='nap'>ОТЗЫВЫ</h2>
      {comment.map((comm) =>(  
        <div key={comm.id_of_comm}>
        <p> {comm.text} </p>
        {renderStars(comm.stars)}<br/>
        <button onClick={() => acceptComment(comm.id_of_comm)}>Принять</button> <button onClick={()=>deleteItem(comm.id_of_comm)}>Отклонить</button>
        </div>
      ))}

    </div>
  )
}

export default ShowComments
