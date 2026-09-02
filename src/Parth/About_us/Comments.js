import React, { useContext, useEffect, useState } from 'react';
import { UserContext } from '../../UserContext';
import './about_us.css';

const Comments = () => {
    const { currentUser } = useContext(UserContext);
    const [rating, setRating] = useState(0);
    const [text, setText] = useState('');
    const [comment, setComment] = useState([]);
    const [showAllComments, setShowAllComments] = useState(false);
    const [id, setId] = useState(currentUser ? currentUser.id : '');
    const [hasCommented, setHasCommented] = useState(false);

    useEffect(() => {
        fetch('http://localhost:5000/api/comments')
            .then((response) => response.json())
            .then((data) => {
                setComment(data);
                if (currentUser) {
                    const userComment = data.find(comm => comm.id === currentUser.id);
                    setHasCommented(!!userComment);
                }
            })
            .catch((error) => console.error('Ошибка при получении комментариев:', error));
    }, [currentUser]);

    const handleStarClick = (value) => {
        setRating(value);
    };

    const renderStars = () => {
        return (
            <div className='stars-container'>
                {[...Array(5)].map((_, index) => {
                    const value = index + 1;
                    return (
                        <span
                            key={value}
                            className={`star ${value <= rating ? 'selected' : ''}`}
                            onClick={() => handleStarClick(value)}
                            style={{ fontSize: '30px', cursor: 'pointer', color: value <= rating ? '#FF4F00' : 'lightgray' }}
                        >
                            &#9733;
                        </span>
                    );
                })}
            </div>
        );
    };

    const renderStars_ = (value) => {
        return (
            <div className='stars-container'>
                {[...Array(5)].map((_, index) => {
                    const starValue = index + 1;
                    return (
                        <span
                            key={starValue}
                            className={`star ${starValue <= value ? 'selected' : ''}`}
                            style={{ fontSize: '30px', cursor: 'pointer', color: starValue <= value ? '#FF4F00' : 'lightgray' }}
                        >
                            &#9733;
                        </span>
                    );
                })}
            </div>
        );
    };

    const addComment = () => {
        fetch('http://localhost:5000/api/comments_start', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                id,
                text,
                stars: rating,
            }),
        })
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`Ошибка HTTP! Статус: ${response.status}`);
                }
                return response.json();
            })
            .then(() => {
                setText('');
                setRating(0);
                setHasCommented(true);
                return fetch('http://localhost:5000/api/comments');
            })
            .then(response => response.json())
            .then(data => setComment(data))
            .catch((error) => {
                console.error('Ошибка при добавлении комментария:', error);
            });
    };

    const displayedComments = showAllComments ? comment : comment.slice(0, 3);

    const toggleComments = () => {
        setShowAllComments(!showAllComments);
    };
    if (!currentUser || currentUser.role == 'admin' || currentUser.role == 'teacher') {
        return (
            <>
                <div>
                    <h2 className='nap'>ОТЗЫВЫ</h2>
                    {displayedComments.map((comm) => (
                        <div key={comm.id_of_comm} className='comments'>
                            {renderStars_(comm.stars)} <br />
                            <p>{comm.text}</p>
                        </div>
                    ))}
                    {comment.length > 3 && (
                        <button 
                            className='submit-btn' 
                            onClick={toggleComments}
                        >
                            {showAllComments ? 'Свернуть отзывы' : 'Показать все отзывы'}
                        </button>
                    )}
                </div>
            </>
        );
    }

    return (
        <>
            <div>
                <h2 className='nap'>ОТЗЫВЫ</h2>
                {displayedComments.map((comm) => (
                    <div key={comm.id_of_comm} className='comments'>
                        {renderStars_(comm.stars)} <br />
                        <p>{comm.text}</p>
                    </div>
                ))}
                {comment.length > 3 && (
                    <button 
                        className='submit-btn' 
                        onClick={toggleComments}
                    >
                        {showAllComments ? 'Свернуть отзывы' : 'Показать все отзывы'}
                    </button>
                )}
            </div>
            {!hasCommented && (
                <div className="file-upload-area_2">
                    <p className='nap'>Оставить отзыв</p>
                    {renderStars()} <br />
                    <textarea type='text' value={text} onChange={(e) => setText(e.target.value)} />
                    <br />
                    <button className='submit-btn' onClick={addComment}>Отправить</button>
                </div>
            )}
        </>
    );
};

export default Comments;