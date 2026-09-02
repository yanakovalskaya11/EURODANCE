import React, { useContext, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import './TeacherVideos.css';
import Header from '../header/Header';
import Footer from '../Footer/Footer';
import AddVideoForm from './AddVideoForm';
import { UserContext } from '../../UserContext';
import ScrollButton from '../ScrollButton';
import { Link } from 'react-router-dom';
import { FaEllipsisV } from 'react-icons/fa';
import { toast } from 'react-toastify';

const Teacher_videos = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currentUser } = useContext(UserContext);
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [editModeId, setEditModeId] = useState(null);
  const [editDescription, setEditDescription] = useState('');
  const [editVideoFile, setEditVideoFile] = useState(null);
  const [types, setTypes] = useState([]);
  const [typeId, setTypeId] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpenId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    axios.get('http://localhost:5000/api/posts')
      .then(response => {
        setPosts(response.data.map(post => ({
          ...post,
          videoUrl: `http://localhost:5000${post.video}`
        })));
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetch('http://localhost:5000/api/napravleniya')
      .then((res) => res.json())
      .then((data) => setTypes(data))
      .catch((err) => console.error('Ошибка при получении направлений:', err));
  }, []);

  const handleDelete = async (postId) => {
    try {
      await axios.delete(`http://localhost:5000/api/posts/${postId}`);
      setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
    } catch (err) {
      console.error('Ошибка при удалении видео:', err);
    }
  };

  const startEdit = (post) => {
    setEditModeId(post.id);
    setEditDescription(post.description || '');
    setEditVideoFile(null);
    setMenuOpenId(null);
  };

  const cancelEdit = () => {
    setEditModeId(null);
    setEditDescription('');
    setEditVideoFile(null);
  };

const saveEdit = async (postId) => {
  const formData = new FormData();
  formData.append('description', editDescription);
  if (editVideoFile) {
    formData.append('video', editVideoFile);
  }

  try {
    const res = await axios.put(`http://localhost:5000/api/posts/${postId}`, formData, {
      headers: { 
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${localStorage.getItem('token')}` // если используется авторизация
      }
    });

    const updatedPost = {
      ...res.data,
      videoUrl: `${res.data.video}?t=${Date.now()}` // Добавляем timestamp для избежания кеширования
    };

    setPosts(prev => prev.map(p => p.id === postId ? updatedPost : p));
    cancelEdit();
    
  } catch (err) {
    console.error('Ошибка при сохранении:', err);
    if (err.response) {
      toast.error(`Ошибка ${err.response.status}: ${err.response.data.error || err.response.data.message}`);
    } else {
      toast.error('Ошибка сети или сервера');
    }
  }
};

  const handleAddVideo = (newVideo) => {
    setPosts(prevPosts => [newVideo, ...prevPosts]);
  };

  const filteredPosts = posts.filter(post => {
    if (!typeId) return true;
    return post.napravleniya?.some(n => String(n.id) === String(typeId));
  });

  if (loading) return <div className="loading">Загрузка...</div>;
  if (error) return <div className="error">Ошибка: {error}</div>;

  return (
    <>
      <div className="videos-feed">
        <Header />

        <div className="filter-container">
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

        {currentUser?.role === 'teacher' && (
          <AddVideoForm onAdd={handleAddVideo} />
        )}

        {filteredPosts.map((post, index) => (
          <div key={post.id} className="video-post" style={{ animationDelay: `${index * 0.1}s` }}>
            <div className="post-header">
              <div className="teacher-info-vid">
                {post.teacher_photo && (
                  <img
                    src={`http://localhost:5000${post.teacher_photo}`}
                    alt={`${post.teacher_name} ${post.teacher_last_name}`}
                    className="teacher-avatar"
                  />
                )}
                <div className="teacher-name-container">
                  <Link to={`/teachers/${post.teacher_id}`} className="no-text-decoration">
                    <h3 className="teacher-name">
                      {post.teacher_name} {post.teacher_last_name}
                    </h3>
                  </Link>
                  <div className="teacher-directions">
                    {post.napravleniya && post.napravleniya.map((napravlenie, idx) => (
                      <Link
                        key={idx}
                        to={`/napravleniya/${napravlenie.id}`}
                        className="specialty-tag no-text-decoration"
                      >
                        {napravlenie.name}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              {(currentUser?.id === post.teacher_id && currentUser?.role === 'teacher') || currentUser?.role === 'admin' ? (
  <div className="menu-container" ref={menuRef}>
    <FaEllipsisV
      className="menu-icon"
      onClick={(e) => {
        e.stopPropagation();
        setMenuOpenId(menuOpenId === post.id ? null : post.id);
      }}
    />
    {menuOpenId === post.id && (
      <div className="dropdown-menu">
        <button onClick={(e) => {
          e.stopPropagation();
          startEdit(post);
        }}>
          <i className="icon-edit">✏️</i> Редактировать
        </button>
        <button onClick={(e) => {
          e.stopPropagation();
          handleDelete(post.id);
        }}>
          <i className="icon-delete">🗑️</i> Удалить
        </button>
      </div>
    )}
  </div>
) : null}
            </div>

            <div className="video-container">
              {editModeId === post.id ? (
                <>
                  <video 
                    controls 
                    className="video-player" 
                    src={editVideoFile ? URL.createObjectURL(editVideoFile) : post.videoUrl} 
                  />
                  <div className="video-upload-container">
                    <label className="video-upload-label">
                      <span>Выберите новое видео</span>
                      <input 
                        type="file" 
                        accept="video/*" 
                        onChange={(e) => setEditVideoFile(e.target.files[0])} 
                        className="video-upload-input"
                      />
                    </label>
                    {editVideoFile && (
                      <span className="video-file-name">{editVideoFile.name}</span>
                    )}
                  </div>
                </>
              ) : (
                <video controls className="video-player">
                  <source src={post.videoUrl} type="video/mp4" />
                  Ваш браузер не поддерживает видео.
                </video>
              )}
            </div>

            <div className="post-description">
              {editModeId === post.id ? (
                <>
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="edit-textarea"
                    placeholder="Введите описание видео..."
                  />
                  <div className="edit-buttons">
                    <button className="save-btn" onClick={() => saveEdit(post.id)}>
                      Сохранить
                    </button>
                    <button className="cancel-btn" onClick={cancelEdit}>
                      Отмена
                    </button>
                  </div>
                </>
              ) : (
                <p>{post.description}</p>
              )}
            </div>
          </div>
        ))}

        <ScrollButton />
      </div>

      <Footer />
    </>
  );
};

export default Teacher_videos;