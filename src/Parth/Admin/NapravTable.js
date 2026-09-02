import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import './admin_naprav.css';
import DropImageUploader from '../../hooks/photo';
import { toast } from 'react-toastify';

const NapravTable = () => {
    const [naprav, setNaprav] = useState([]);
    const [sortField, setSortField] = useState('name');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFile, setFile] = useState(null);
    const [selectedVideoFile, setVideoFile] = useState(null);
    const [isMobile, setIsMobile] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({
        name: '',
        short_descr: '',
        destriction: '',
        photo: null,
        video: null
    });
    
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const [preview, setPreview] = useState(null);
    const [videoPreview, setVideoPreview] = useState(null);
    const dropAreaRef = useRef(null);
    const videoDropAreaRef = useRef(null);
    const fileInputRef = useRef(null);
    const videoFileInputRef = useRef(null);
    const [uploadHint, setUploadHint] = useState('Перетащите изображение сюда или нажмите для выбора');
    const [videoUploadHint, setVideoUploadHint] = useState('');

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
            if (videoPreview) URL.revokeObjectURL(videoPreview);
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
        if (!selectedVideoFile) {
            setVideoPreview(null);
            return;
        }

        const objectUrl = URL.createObjectURL(selectedVideoFile);
        setVideoPreview(objectUrl);

        return () => URL.revokeObjectURL(objectUrl);
    }, [selectedVideoFile]);

    const fetchData = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/napravleniya');
            setNaprav(response.data);
        } catch (error) {
            console.error("Не удалось получить данные: ", error);
        }
    };

    const handleFiles = (files) => {
        if (files && files[0]) {
            const file = files[0];
            const uniqueFile = new File([file], generateUniqueName(file), { 
                type: file.type 
            });
            setFile(uniqueFile);
        }
    };

    const handleVideoFiles = (files) => {
        if (files && files[0]) {
            const file = files[0];
            const uniqueFile = new File([file], generateUniqueName(file), { 
                type: file.type 
            });
            setVideoFile(uniqueFile);
        }
    };

    const handleFileChange = (event) => {
        handleFiles(event.target.files);
    };

    const handleVideoFileChange = (event) => {
        handleVideoFiles(event.target.files);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!selectedFile) {
            toast.warn('Пожалуйста, выберите изображение');
            return;
        }

        const formData = new FormData();
        const name = event.target.elements.name.value;
        const destriction = event.target.elements.destriction.value;
        const short_descr = event.target.elements.short_descr.value;

        formData.append('image', selectedFile);
        if (selectedVideoFile) formData.append('video', selectedVideoFile);
        formData.append('name', name);
        formData.append('destriction', destriction);
        formData.append('short_descr', short_descr);

        try {
            await axios.post('http://localhost:5000/api/napravleniya', formData);
            toast.success('Запись успешно добавлена!');
            fetchData();
            event.target.reset();
            setFile(null);
            setVideoFile(null);
            setPreview(null);
            setVideoPreview(null);
        } catch (error) {
            console.error('Ошибка при загрузке файла:', error);
            toast.error('Ошибка при загрузке файла');
        }
    };

    const deleteItem = async (id) => {
        if (!window.confirm('Вы уверены, что хотите удалить эту запись?')) return;
        
        try {
            await axios.delete(`http://localhost:5000/api/napravleniya/${id}`);
            toast.success("Запись успешно удалена!");
            fetchData();
        } catch (error) {
            console.error('Ошибка при удалении записи:', error);
            toast.error('Ошибка при удалении записи');
        }
    };

    const startEditing = (item) => {
        setEditingId(item.id);
        setEditForm({
            name: item.name,
            short_descr: item.short_descr,
            destriction: item.destriction,
            photo: null,
            video: null
        });
    };

    const cancelEditing = () => {
        setEditingId(null);
        setEditForm({
            name: '',
            short_descr: '',
            destriction: '',
            photo: null,
            video: null
        });
    };

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditForm(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleEditFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const uniqueFile = new File([file], generateUniqueName(file), { 
                type: file.type 
            });
            setEditForm(prev => ({
                ...prev,
                photo: uniqueFile
            }));
        }
    };

    const handleEditVideoChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const uniqueFile = new File([file], generateUniqueName(file), { 
                type: file.type 
            });
            setEditForm(prev => ({
                ...prev,
                video: uniqueFile
            }));
        }
    };

    const saveEdit = async (id) => {
        const formData = new FormData();
        formData.append('name', editForm.name);
        formData.append('short_descr', editForm.short_descr);
        formData.append('destriction', editForm.destriction);
        if (editForm.photo) formData.append('image', editForm.photo);
        if (editForm.video) formData.append('video', editForm.video);

        try {
            await axios.put(`http://localhost:5000/api/napravleniya/${id}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            toast.success('Изменения сохранены!');
            setEditingId(null);
            fetchData();
        } catch (error) {
            console.error('Ошибка при обновлении записи:', error);
            toast.error('Ошибка при обновлении записи');
        }
    };

    const handleSortChange = (event) => {
        setSortField(event.target.value);
    };

    const handleSearchChange = (event) => {
        setSearchQuery(event.target.value);
    };

    const filteredNaprav = naprav.filter((item) => {
        const query = searchQuery.toLowerCase().trim();
        return (
            item.name.toLowerCase().includes(query) ||
            item.short_descr.toLowerCase().includes(query) ||
            item.destriction.toLowerCase().includes(query)
        );
    });

    const sortedNaprav = [...filteredNaprav].sort((a, b) => {
        const valA = String(a[sortField] || '').trim().toLowerCase();
        const valB = String(b[sortField] || '').trim().toLowerCase();

        if (valA < valB) return -1;
        if (valA > valB) return 1;
        return 0;
    });

    return (
        <div className='Naprav'>
            <h2>Управление направлениями</h2>

            <div className="controls">
                <div className="control-group">
                    <label>Сортировать по:</label>
                    <select onChange={handleSortChange} value={sortField}>
                        <option value="name">Название</option>
                        <option value="short_descr">Короткое описание</option>
                        <option value="destriction">Описание</option>
                    </select>
                </div>

                <div className="control-group">
                    <label>Поиск:</label>
                    <input 
                        type="text" 
                        placeholder="Введите ключевое слово..." 
                        value={searchQuery} 
                        onChange={handleSearchChange} 
                    />
                </div>
            </div>

            <div className="cards-container">
                {sortedNaprav.map((item) => (
                    <div key={item.id} className="card">
                        {editingId === item.id ? (
                            <div className="edit-form">
                                <div className="form-group">
                                    
                                    <label>Изображение:</label>
                                    <div 
                                        className="file-upload-area"
                                        onClick={() => document.getElementById('edit-photo-input').click()}
                                    >
                                        <input
                                            id="edit-photo-input"
                                            type="file"
                                            accept="image/*"
                                            onChange={handleEditFileChange}
                                            className="file-input-hidden"
                                        />
                                        {editForm.photo ? (
                                            <img 
                                                src={URL.createObjectURL(editForm.photo)} 
                                                alt="Превью" 
                                                className="image-preview" 
                                            />
                                        ) : (
                                            <img 
                                                src={`http://localhost:5000${item.photo}`} 
                                                alt={item.name} 
                                                className="image-preview" 
                                            />
                                        )}
                                    </div>
                                </div>
                                
                                <div className="form-group">
                                    <label>Видео:</label>
                                    <div 
                                        className="file-upload-area"
                                        onClick={() => document.getElementById('edit-video-input').click()}
                                    >
                                        
                                        <input
                                            id="edit-video-input"
                                            type="file"
                                            accept="video/*"
                                            onChange={handleEditVideoChange}
                                            className="file-input-hidden"
                                        />
                                        {editForm.video ? (
                                            <video 
                                                src={URL.createObjectURL(editForm.video)} 
                                                controls 
                                                className="video-preview" 
                                            />
                                        ) : item.video ? (
                                            <video 
                                                src={`http://localhost:5000${item.video}`} 
                                                controls 
                                                className="video-preview" 
                                            />
                                        ) : (
                                            <p>Нет видео</p>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="form-group">
                                    <label>Название:</label>
                                    <input 
                                        type="text" 
                                        name="name" 
                                        value={editForm.name} 
                                        onChange={handleEditChange} 
                                    />
                                </div>
                                
                                <div className="form-group">
                                    <label>Короткое описание:</label>
                                    <input 
                                        type="text" 
                                        name="short_descr" 
                                        value={editForm.short_descr} 
                                        onChange={handleEditChange} 
                                    />
                                </div>
                                
                                <div className="form-group">
                                    <label>Описание:</label>
                                    <textarea 
                                        name="destriction" 
                                        value={editForm.destriction} 
                                        onChange={handleEditChange} 
                                    />
                                </div>
                                
                                <div className="form-actions">
                                    <button className="save-btn" onClick={() => saveEdit(item.id)}>
                                        Сохранить
                                    </button>
                                    <button className="cancel-btn" onClick={cancelEditing}>
                                        Отмена
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="card-media">
                                    <img 
                                        src={`http://localhost:5000${item.photo}`} 
                                        alt={item.name} 
                                        className="card-image" 
                                    />
                                    {item.video && (
                                        <video 
                                            src={`http://localhost:5000${item.video}`} 
                                            controls 
                                            className="card-video" 
                                        />
                                    )}
                                </div>
                                
                                <div className="card-content">
                                    <h3>{item.name}</h3>
                                    <p className="short-descr">{item.short_descr}</p>
                                    <p className="full-descr">{item.destriction}</p>
                                </div>
                                
                                <div className="card-actions">
                                    <button className="edit-btn" onClick={() => startEditing(item)}>
                                        Редактировать
                                    </button>
                                    <button className="delete-btn" onClick={() => deleteItem(item.id)}>
                                        Удалить
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                ))}
            </div>

            <form onSubmit={handleSubmit} className="add-form">
                <h3>Добавить новое направление</h3>
                
                <div className="form-row">
                    <div className="form-group">
                        <label>Изображение:</label>
                        <div 
                            ref={dropAreaRef}
                            className="file-upload-area"
                            onClick={() => fileInputRef.current.click()}
                        >
                            
              <DropImageUploader onFileSelect={(file) => setFile(file)} />
                            {/* <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="file-input-hidden"
                            />
                            {preview ? (
                                <img src={preview} alt="Превью" className="image-preview" />
                            ) : (
                                <p>{uploadHint}</p>
                            )} */}
                        </div>
                    </div>
                    
                    <div className="form-group">
                        <label>Видео:</label>
                        <div 
                            ref={videoDropAreaRef}
                            className="file-upload"
                            onClick={() => videoFileInputRef.current.click()}
                            
                        >
                            <input
                                ref={videoFileInputRef}
                                type="file"
                                accept="video/*"
                                onChange={handleVideoFileChange}
                                className="file-input-hidden"
                            />
                            {videoPreview ? (
                                <video src={videoPreview} controls className="video-preview"/>
                            ) : (
                                <p>{videoUploadHint}</p>
                            )}
                        </div>
                    </div>
                </div>
                
                <div className="form-group">
                    <label>Название:</label>
                    <input type="text" name="name" placeholder="Название" required />
                </div>
                
                <div className="form-group">
                    <label>Короткое описание:</label>
                    <input 
                        type="text" 
                        name="short_descr" 
                        placeholder="Короткое описание" 
                        required 
                    />
                </div>
                
                <div className="form-group">
                    <label>Описание:</label>
                    <textarea name="destriction" placeholder="Описание" required />
                </div>
                
                <button type="submit" className="submit-btn">
                    Добавить направление
                </button>
            </form>
        </div>
    );
};

export default NapravTable;