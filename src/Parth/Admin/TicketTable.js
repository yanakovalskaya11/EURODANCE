import axios from 'axios';
import React, { useEffect, useRef, useState } from 'react';
import './admin.css';
import { toast } from 'react-toastify';

const TicketTable = () => {
    const [selectedFile, setFile] = useState(null);
    const [ticket, setTicket] = useState([]);
    const [sortField, setSortField] = useState('name_ticket');
    const [searchQuery, setSearchQuery] = useState('');
const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({
        name_ticket: '',
        descr: '',
        price: '',
        time: '',
        limits: '',
        photo: null
    });
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
                     const file = new File([blob], `pasted_${Date.now()}.png`, { 
                        type: blob.type 
                    });
                    handleFiles([blob]);
                    break;
                }
            }
        };
        

        // Добавляем обработчики
        dropArea.addEventListener('dragenter', highlight);
        dropArea.addEventListener('dragover', highlight);
        dropArea.addEventListener('dragleave', unhighlight);
        dropArea.addEventListener('drop', handleDrop);
        window.addEventListener('paste', handlePaste);

        return () => {
            // Убираем обработчики при размонтировании
            dropArea.removeEventListener('dragenter', highlight);
            dropArea.removeEventListener('dragover', highlight);
            dropArea.removeEventListener('dragleave', unhighlight);
            dropArea.removeEventListener('drop', handleDrop);
            window.removeEventListener('paste', handlePaste);
        };
    }, []);


    const fetchData = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/tickets');
            setTicket(response.data);
        } catch (error) {
            console.error("Не удалось получить данные, ", error);
        }
    };

        useEffect(() => {
            fetchData();
        }, []);

         const handleFiles = (files) => {
        if (files && files[0]) {
            // Генерируем уникальное имя файла при загрузке
            const file = files[0];
            const uniqueFile = new File([file], generateUniqueName(file), { 
                type: file.type 
            });
            setFile(uniqueFile);
        }
    };

    const handleFileChange = (event) => {
        setFile(event.target.files[0]);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
         if (!selectedFile) {
            toast.warn('Пожалуйста, выберите изображение');
            return;
        }
        const formData = new FormData();

        const name_ticket = event.target.elements.name_ticket.value;
        const descr = event.target.elements.descr.value;
        const price = event.target.elements.price.value;
        const time = event.target.elements.time.value;
        const limits = event.target.elements.limits.value;

        formData.append('image', selectedFile);
        formData.append('name_ticket', name_ticket);
        formData.append('descr', descr);
        formData.append('price', price);
        formData.append('time', time);
        formData.append('limits', limits);
    
        try {
            await axios.post('http://localhost:5000/api/tickets', formData);
            toast.success('Запись успешно добавлена!');
            fetchData(); // Обновляем данные после добавления

            event.target.reset();
        setFile(null); // Убираем файл
        setPreview(null); // Убираем превью
        } catch (error) {
            console.error('Ошибка при загрузке файла:', error);
            toast.error('Ошибка при загрузке файла');
        }
    };

    const deleteItem = async (id) => {
        try {
            await axios.delete(`http://localhost:5000/api/tickets/${id}`);
            toast.success("Запись успешно удалена!");
            fetchData(); // Обновляем данные после удаления
        } catch (error) {
            console.error('Ошибка при удалении записи:', error);
            toast.error('Ошибка при удалении записи');
        }
    };

     const startEditing = (item) => {
        setEditingId(item.id);
        setEditForm({
            name_ticket: item.name_ticket,
            descr: item.descr,
            price: item.price,
            time: item.time,
            limits: item.limits,
            photo: null
        });
    };

    const cancelEditing = () => {
        setEditingId(null);
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

    const saveEdit = async (id) => {
        const formData = new FormData();
        formData.append('name_ticket', editForm.name_ticket);
        formData.append('descr', editForm.descr);
        formData.append('price', editForm.price);
        formData.append('time', editForm.time);
        formData.append('limits', editForm.limits);
        if (editForm.photo) formData.append('image', editForm.photo);

        try {
            await axios.put(`http://localhost:5000/api/tickets/${id}`, formData, {
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


    // Фильтруем билеты по поисковому запросу
    const filteredTickets = ticket.filter((item) => {
        const query = searchQuery.toLowerCase().trim();
        return (
            item.name_ticket.toLowerCase().includes(query) ||
            item.descr.toLowerCase().includes(query)
        );
    });

    // Сортируем перед отображением
    const sortedTickets = [...filteredTickets].sort((a, b) => {
        const valA = String(a[sortField] || '').trim().toLowerCase();
        const valB = String(b[sortField] || '').trim().toLowerCase();

        if (valA < valB) return -1;
        if (valA > valB) return 1;
        return 0;
    });

 return (
        <div className='Naprav'>
            <p>
                Сортировать по:
                <select onChange={handleSortChange} value={sortField}>
                    <option value="name_ticket">Название</option>
                    <option value="descr">Описание</option>
                </select>
            </p>

            <p>
                Поиск:
                <input type="text" placeholder="Введите ключевое слово..." value={searchQuery} onChange={handleSearchChange} />
            </p>

            <table>
                <thead>
                    <tr>
                        <th>Фотография</th>
                        <th>Название</th>
                        <th>Описание</th>
                        <th>Цена</th>
                        <th>Срок действия</th>
                        <th>Ограничения</th>
                        <th>Действия</th>
                    </tr>
                </thead>
                <tbody>
                    {sortedTickets.map((item) => (
                        <tr key={item.id}>
                            <td>
                                {editingId === item.id ? (
                                    <div className="edit-field">
                                        <input 
                                            type="file" 
                                            accept="image/*" 
                                            onChange={handleEditFileChange}
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
                                                alt={item.name_ticket} 
                                                className="image-preview" 
                                            />
                                        )}
                                    </div>
                                ) : (
                                    <img src={`http://localhost:5000${item.photo}`} alt={item.name_ticket} />
                                )}
                            </td>
                            <td>
                                {editingId === item.id ? (
                                    <input 
                                        type="text" 
                                        name="name_ticket" 
                                        value={editForm.name_ticket} 
                                        onChange={handleEditChange} 
                                    />
                                ) : (
                                    <p>{item.name_ticket}</p>
                                )}
                            </td>
                            <td>
                                {editingId === item.id ? (
                                    <input 
                                        type="text" 
                                        name="descr" 
                                        value={editForm.descr} 
                                        onChange={handleEditChange} 
                                    />
                                ) : (
                                    <p>{item.descr}</p>
                                )}
                            </td>
                            <td>
                                {editingId === item.id ? (
                                    <input 
                                        type="text" 
                                        name="price" 
                                        value={editForm.price} 
                                        onChange={handleEditChange} 
                                    />
                                ) : (
                                    <p>{item.price}</p>
                                )}
                            </td>
                            <td>
                                {editingId === item.id ? (
                                    <input 
                                        type="text" 
                                        name="time" 
                                        value={editForm.time} 
                                        onChange={handleEditChange} 
                                    />
                                ) : (
                                    <p>{item.time}</p>
                                )}
                            </td>
                            <td>
                                {editingId === item.id ? (
                                    <input 
                                        type="text" 
                                        name="limits" 
                                        value={editForm.limits} 
                                        onChange={handleEditChange} 
                                    />
                                ) : (
                                    <p>{item.limits}</p>
                                )}
                            </td>
                            <td>
                                {editingId === item.id ? (
                                    <div className="edit-actions">
                                        <button onClick={() => saveEdit(item.id)}>Сохранить</button>
                                        <button onClick={cancelEditing}>Отмена</button>
                                    </div>
                                ) : (
                                    <div className="actions">
                                        <button onClick={() => startEditing(item)}>Редактировать</button>
                                        <button onClick={() => deleteItem(item.id)}>Удалить</button>
                                    </div>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <form onSubmit={handleSubmit}>
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
                <input type='text' name='name_ticket' placeholder='Название' required />
                <input type='text' name='descr' placeholder='Описание' required />
                <input type='text' name='time' placeholder='Срок действия' required />
                <input type='text' name='limits' placeholder='Ограничения' required />
                <input type='text' name='price' placeholder='Цена' required />
                <button type='submit'>Добавить билет</button>
            </form>
        </div>
    );
};

export default TicketTable;