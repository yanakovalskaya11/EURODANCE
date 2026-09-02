import React, { useState, useContext } from 'react';
import { UserContext } from '../../UserContext';
import './TeacherVideos.css';

const AddVideoForm = ({ onAdd }) => {
  const [description, setDescription] = useState('');
  const [videoFile, setVideoFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const { currentUser } = useContext(UserContext);

  const handleFileChange = (e) => {
    setVideoFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!videoFile || !currentUser) return;
    
    setIsSubmitting(true);
    setError(null);
    
    const formData = new FormData();
    formData.append('description', description);
    formData.append('video', videoFile);
    formData.append('teacher_id', currentUser.id);
    
    try {
      const response = await fetch('http://localhost:5000/api/posts', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка при загрузке видео');
      }
      
      const newVideo = await response.json();
      onAdd({
        ...newVideo,
        videoUrl: `http://localhost:5000${newVideo.video}`,
        teacher_name: currentUser.name,
        teacher_last_name: currentUser.last_name,
        teacher_photo: currentUser.photo
      });
      
      setDescription('');
      setVideoFile(null);
    } catch (error) {
      console.error('Ошибка:', error);
      setError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="add-video-form">
      <h2 className="form-title">Добавить новое видео</h2>
      {error && <div className="error-message">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Описание:</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="form-input"
            required
            disabled={isSubmitting}
          />
        </div>
        
        <div className="form-group">
          <label className="form-label">Видеофайл:</label>
          <input
           className='file-upload-button'
            type="file"
            accept="video/mp4,video/webm,video/ogg"
            onChange={handleFileChange}
            required
            disabled={isSubmitting}
          />
        </div>
        
        <button 
          type="submit" 
          className="submit-btn"
          disabled={isSubmitting || !videoFile}
        >
          {isSubmitting ? 'Загрузка...' : 'Опубликовать видео'}
        </button>
      </form>
    </div>
  );
};

export default AddVideoForm;