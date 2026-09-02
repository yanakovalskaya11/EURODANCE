import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import './teacher_table.css';
import DropImageUploader from '../../hooks/photo';
import { toast } from 'react-toastify';

const TeachersTable = () => {
    const [selectedFile, setFile] = useState(null);
    const [teachers, setTeachers] = useState([]);
    const [directions, setDirections] = useState([]);
    const [sortField, setSortField] = useState('name');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDirection, setSelectedDirection] = useState('');
    const [preview, setPreview] = useState(null);
    const dropAreaRef = useRef(null);
    const fileInputRef = useRef(null);
    const [uploadHint, setUploadHint] = useState('Перетащите изображение сюда или нажмите для выбора');

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

    const fetchData = async () => {
        try {
            const teachersResponse = await axios.get('http://localhost:5000/api/teachers');
            const directionsResponse = await axios.get('http://localhost:5000/api/napravleniya');
            setTeachers(teachersResponse.data);
            setDirections(directionsResponse.data);
        } catch (error) {
            console.error("Не удалось получить данные: ", error);
        }
    };

    useEffect(() => {
        if (!selectedFile) {
            setPreview(null);
            return;
        }

        const objectUrl = URL.createObjectURL(selectedFile);
        setPreview(objectUrl);

        return () => URL.revokeObjectURL(objectUrl);
    }, [selectedFile]);

    const [newTeacher, setNewTeacher] = useState({
        name: '',
        last_name: '',
        father_name: '',
        email: '',
        login: '',
        password: '',
        info: '',
        experience: '',
        image: null,
    });

    const handleFiles = (files) => {
        if (files && files[0]) {
            const file = files[0];
            const uniqueFile = new File([file], generateUniqueName(file), { 
                type: file.type 
            });
            setFile(uniqueFile);
        }
    };

    const deleteItem = async (id) => {
        if (!window.confirm('Вы уверены, что хотите удалить этого преподавателя?')) return;
        try {
            await axios.delete(`http://localhost:5000/api/teachers/${id}`);
            toast.success('Учитель успешно удалён!');
            setTeachers(teachers.filter((teacher) => teacher.id !== id));
        } catch (error) {
            console.error('Ошибка при удалении учителя:', error);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewTeacher({ ...newTeacher, [name]: value });
    };

    const handleFileChange = (event) => {
        handleFiles(event.target.files);
    };

    const handleAddTeacher = async (e) => {
        e.preventDefault();
        if (!selectedFile) {
            toast.warn('Пожалуйста, выберите изображение');
            return;
        }
        
        const formData = new FormData();
        formData.append('name', newTeacher.name);
        formData.append('last_name', newTeacher.last_name);
        formData.append('father_name', newTeacher.father_name);
        formData.append('email', newTeacher.email);
        formData.append('login', newTeacher.login);
        formData.append('password', newTeacher.password);
        formData.append('info', newTeacher.info);
        formData.append('experience', newTeacher.experience);
        formData.append('image', selectedFile);

        try {
            const response = await axios.post('http://localhost:5000/api/teachers', formData);
            setTeachers([...teachers, response.data]);
            toast.success('Учитель успешно добавлен!');
            setNewTeacher({
                name: '',
                last_name: '',
                father_name: '',
                email: '',
                login: '',
                password: '',
                info: '',
                experience: '',
                image: null,
            });
            setFile(null);
            setPreview(null);
        } catch (error) {
            console.error('Ошибка при добавлении учителя:', error);
        }
    };

    const filteredTeachers = teachers.filter((teacher) => {
        const query = searchQuery.toLowerCase().trim();
        return (
            teacher.name.toLowerCase().includes(query) ||
            teacher.last_name.toLowerCase().includes(query) ||
            teacher.email.toLowerCase().includes(query) ||
            teacher.info.toLowerCase().includes(query) ||
            teacher.experience.toLowerCase().includes(query)
        );
    });

    const teachersByDirection = selectedDirection
        ? filteredTeachers.filter((teacher) => 
            teacher.subjects && teacher.subjects.some(subj => subj.name === selectedDirection))
        : filteredTeachers;

    const sortedTeachers = [...teachersByDirection].sort((a, b) => {
        let valA, valB;

        if (sortField === 'experience') {
            valA = parseInt(a.experience) || 0;
            valB = parseInt(b.experience) || 0;
        } else {
            valA = a[sortField]?.toLowerCase() || '';
            valB = b[sortField]?.toLowerCase() || '';
        }

        return valA < valB ? -1 : valA > valB ? 1 : 0;
    });

    return (
        <div className='Teachers'>
            <h2>Преподаватели</h2>

            <div className="controls">
                <div className="control-group">
                    <label>Поиск:</label>
                    <input 
                        type="text" 
                        placeholder="Имя, фамилия, email..." 
                        value={searchQuery} 
                        onChange={(e) => setSearchQuery(e.target.value)} 
                    />
                </div>

                <div className="control-group">
                    <label>Направление:</label>
                    <select 
                        onChange={(e) => setSelectedDirection(e.target.value)} 
                        value={selectedDirection}
                    >
                        <option value="">Все направления</option>
                        {directions.map((direction) => (
                            <option key={direction.id} value={direction.name}>
                                {direction.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="control-group">
                    <label>Сортировка:</label>
                    <select 
                        onChange={(e) => setSortField(e.target.value)} 
                        value={sortField}
                    >
                        <option value="name">По имени</option>
                        <option value="last_name">По фамилии</option>
                        <option value="experience">По опыту</option>
                        <option value="email">По email</option>
                    </select>
                </div>
            </div>

            <div className="cards-container">
                {sortedTeachers.map((teacher) => (
                    <div key={teacher.id} className="teacher-card">
                        <div className="teacher-photo">
                            <img 
                                src={`http://localhost:5000${teacher.photo}`} 
                                alt={`${teacher.name} ${teacher.last_name}`} 
                            />
                        </div>
                        
                        <div className="teacher-info">
                            <h3>{teacher.last_name} {teacher.name} {teacher.father_name}</h3>
                            
                            <div className="teacher-details">
                                <p><strong>Email:</strong> {teacher.email}</p>
                                <p><strong>Логин:</strong> {teacher.login}</p>
                                <p><strong>Опыт:</strong> {teacher.experience}</p>
                                
                                <div className="teacher-subjects">
                                    <strong>Направления:</strong>
                                    {teacher.subjects && teacher.subjects.length > 0 ? (
                                        <ul>
                                            {teacher.subjects.map((subject, index) => (
                                                <li key={index}>{subject.name}</li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <span>Нет направлений</span>
                                    )}
                                </div>
                                
                                <p className="teacher-bio">{teacher.info}</p>
                            </div>
                            
                            <button 
                                className="delete-btn"
                                onClick={() => deleteItem(teacher.id)}
                            >
                                Удалить
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <form onSubmit={handleAddTeacher} className="add-form">
                <h3>Добавить преподавателя</h3>
                
                <div className="form-row">
                    <div className="form-group">
                        <label>Имя:</label>
                        <input 
                            type="text" 
                            name="name" 
                            placeholder="Имя" 
                            value={newTeacher.name} 
                            onChange={handleInputChange} 
                            required 
                        />
                    </div>
                    
                    <div className="form-group">
                        <label>Фамилия:</label>
                        <input 
                            type="text" 
                            name="last_name" 
                            placeholder="Фамилия" 
                            value={newTeacher.last_name} 
                            onChange={handleInputChange} 
                            required 
                        />
                    </div>
                    
                    <div className="form-group">
                        <label>Отчество:</label>
                        <input 
                            type="text" 
                            name="father_name" 
                            placeholder="Отчество" 
                            value={newTeacher.father_name} 
                            onChange={handleInputChange} 
                        />
                    </div>
                </div>
                
                <div className="form-row">
                    <div className="form-group">
                        <label>Email:</label>
                        <input 
                            type="email" 
                            name="email" 
                            placeholder="Email" 
                            value={newTeacher.email} 
                            onChange={handleInputChange} 
                            required 
                        />
                    </div>
                    
                    <div className="form-group">
                        <label>Логин:</label>
                        <input 
                            type="text" 
                            name="login" 
                            placeholder="Логин" 
                            value={newTeacher.login} 
                            onChange={handleInputChange} 
                            required 
                        />
                    </div>
                    
                    <div className="form-group">
                        <label>Пароль:</label>
                        <input 
                            type="password" 
                            name="password" 
                            placeholder="Пароль" 
                            value={newTeacher.password} 
                            onChange={handleInputChange} 
                            required 
                        />
                    </div>
                </div>
                
                <div className="form-group">
                    <label>Информация:</label>
                    <textarea 
                        name="info" 
                        placeholder="Информация о преподавателе" 
                        value={newTeacher.info} 
                        onChange={handleInputChange} 
                        required 
                    />
                </div>
                
                <div className="form-row">
                    <div className="form-group">
                        <label>Опыт работы:</label>
                        <input 
                            type="text" 
                            name="experience" 
                            placeholder="Опыт работы" 
                            value={newTeacher.experience} 
                            onChange={handleInputChange} 
                            required 
                        />
                    </div>
                    
                    <div className="form-group">
                        <label>Фото:</label>
                        <div 
                            ref={dropAreaRef}
                            className="file-upload-area"
                            onClick={() => fileInputRef.current.click()}
                        >
                            <DropImageUploader onFileSelect={(file) => setFile(file)} />
                        </div>
                    </div>
                </div>
                
                <button type="submit" className="submit-btn">
                    Добавить преподавателя
                </button>
            </form>
        </div>
    );
};

export default TeachersTable;