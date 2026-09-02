import React, { useContext, useEffect, useState, useRef } from 'react'
import { UserContext } from '../../UserContext'
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Lessons from './Lessons';
import My_timetable from './My_timetable';
import Notes from './Notes';
import "./teacher2.css"
import TeacherStats from './TeacherStats';
import TeacherChangeTimetable from './TeacherChangeTimetable';

const Teacher = () => {
  const { currentUser, setCurrentUser } = useContext(UserContext);  
  const navigate = useNavigate();

  const [editing, setEditing] = useState(false);
  const [newName, setNewName] = useState('');
  const [selectedFile, setFile] = useState(null);
  const [newInfo, setNewInfo] = useState('');
  const [teacher, setTeacher]=useState([]);
   const [preview, setPreview] = useState(null);
      const dropAreaRef = useRef(null);
   const fileInputRef = useRef(null);
      const [uploadHint, setUploadHint] = useState('Перетащите изображение сюда или нажмите для выбора');

          const fetchData = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/teachers');
            setTeacher(response.data);
        } catch (error) {
            console.error("Не удалось получить данные, ", error);
        }
        
    };


  const exit = () => {
    fetch('http://localhost:5000/api/logout', {
      method: 'POST',
      credentials: 'include',
    })
    .then((res) => {
      if (!res.ok) throw new Error('Ошибка при выходе');
      setCurrentUser(null);
      localStorage.removeItem('teacher');
      navigate('/');
    })
    .catch((error) => {
      console.error('Ошибка при выходе:', error);
    });
  };
const generateUniqueName = (file) => {
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 8);
        const extension = file.name.split('.').pop();
        return `${timestamp}_${randomString}.${extension}`;
    };
     useEffect(() => {
        fetchData();
        
        return () => {
            if (preview) URL.revokeObjectURL(preview);
        };
    }, []);

useEffect(() => {
        if (!selectedFile) {
            setPreview(null);
            return;
        }

        const objectUrl = URL.createObjectURL(selectedFile);
        setPreview(objectUrl);

        return () => URL.revokeObjectURL(objectUrl);
    }, [selectedFile]);
useEffect(() => {
    const preventDefaults = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    
    window.addEventListener('dragover', preventDefaults);
    window.addEventListener('drop', preventDefaults);

    return () => {
        window.removeEventListener('dragover', preventDefaults);
        window.removeEventListener('drop', preventDefaults);
    };
}, []);

useEffect(() => {
  const dropArea = dropAreaRef.current;
  if (!dropArea) return;

  const preventDefaults = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const highlight = () => {
    dropArea.classList.add('highlight');
    setUploadHint('Отпустите для загрузки изображения');
  };

  const unhighlight = () => {
    dropArea.classList.remove('highlight');
    setUploadHint('Перетащите изображение сюда или нажмите для выбора');
  };

  const handleDrop = (e) => {
    preventDefaults(e);
    unhighlight();
    const dt = e.dataTransfer;
    const files = dt.files;
    if (files.length > 0) {
      handleFiles(files);
    }
  };

  const handlePaste = (e) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const blob = items[i].getAsFile();
        handleFiles([blob]);
        break;
      }
    }
  };

  dropArea.addEventListener('dragenter', highlight);
  dropArea.addEventListener('dragover', highlight);
  dropArea.addEventListener('dragleave', unhighlight);
  dropArea.addEventListener('drop', handleDrop);
  window.addEventListener('paste', handlePaste);

  return () => {
    dropArea.removeEventListener('dragenter', highlight);
    dropArea.removeEventListener('dragover', highlight);
    dropArea.removeEventListener('dragleave', unhighlight);
    dropArea.removeEventListener('drop', handleDrop);
    window.removeEventListener('paste', handlePaste);
  };
}, [editing]);


useEffect(() => {
        fetchData();
    }, []);

    const handleFiles = (files) => {
        if (files && files[0]) {
            const file = files[0];
            const uniqueFile = new File([file], generateUniqueName(file), { 
                type: file.type 
            });
            setFile(uniqueFile);
        }
    };

    
      const handleFileChange = (event) => {
        handleFiles(event.target.files);
    };


  const handleUpdate = async () => {
    const formData = new FormData();
    if (newName) formData.append('name', newName);
    if (newInfo) formData.append('info', newInfo);
    if (selectedFile) formData.append('image', selectedFile);

    try {
      const response = await axios.patch(`http://localhost:5000/api/teachers/${currentUser.id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true,
      });
      setCurrentUser(response.data);
      localStorage.setItem('user', JSON.stringify(response.data));
      setEditing(false);
    } catch (error) {
      console.error('Ошибка при обновлении профиля:', error);
    }
  };

  if (!currentUser) {
    return <p>Вы не авторизированы...</p>;
  }

  return (
    <div className="teacher-page">
      <h2 className="page-title">Мой профиль</h2>

      <div className="teacher-info-section">

        <div className="profile-card">
          <img className="profile-photo" src={`http://localhost:5000${currentUser.photo}`} alt="Фото учителя" />
          <h3 className="teacher-name">{currentUser.name}</h3>
          <p><strong>Направления:</strong> {currentUser.subjects?.length > 0 ? currentUser.subjects.join(', ') : 'Нет направлений'}</p>
          
          <div className="profile-buttons">
            <button className="btn exit" onClick={exit}>Выйти</button>
           <button
  className="btn edit-profile"
  onClick={() => {
    setNewName(currentUser.name || '');
    setNewInfo(currentUser.info || '');
    setEditing(true);
  }}
>
  Редактировать профиль
</button>

          </div>
        </div>

        {editing && (
        <div className="edit-form">
          <h3>Редактировать профиль</h3>
          <label>Имя:</label>
          <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} />

          <label>Информация:</label>
          <textarea value={newInfo} onChange={(e) => setNewInfo(e.target.value)} />

                         <div 
                ref={dropAreaRef}
                className="file-upload-area"
                onClick={() => {
                    if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                        fileInputRef.current.click();
                    }
                }}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    onClick={(e) => e.stopPropagation()}
                    className="file-input-hidden"
                />
                {preview ? (
                    <img src={preview} alt="Превью" className="image-preview" />
                ) : (
                    <p>{uploadHint}</p>
                )}
            </div>
         <div className="profile-actions">
            <button onClick={handleUpdate}>Сохранить изменения</button>
            <button className="btn cancel" onClick={() => setEditing(false)}>Отмена</button>
          </div>
        </div>
      )}
      
        <div className="notes-card">
          <Notes teacherId={currentUser.id} />
        </div>
      </div>
      <div className="schedule-section">
        <My_timetable />
      </div>
      <div>
        <TeacherStats/>
      </div>

      <TeacherChangeTimetable currentUser={currentUser}/>
    </div>
  );
}

export default Teacher;
