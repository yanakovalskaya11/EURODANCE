import axios from 'axios';
import React, { useEffect, useState, useRef } from 'react';
import './admin.css';
import { toast } from 'react-toastify';

const NewsTable = () => {
    const [selectedFile, setFile] = useState(null);
    const [news, setNews] = useState([]);
    const [sortField, setSortField] = useState('name');
    const [searchQuery, setSearchQuery] = useState('');
  const [preview, setPreview] = useState(null);

  const [editingId, setEditingId] = useState(null);
const [editForm, setEditForm] = useState({ name: '', descr: '', photo: null });

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
            const response = await axios.get('http://localhost:5000/api/news');
            setNews(response.data);
        } catch (error) {
            console.error("Не удалось получить данные, ", error);
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
  const handleFiles = (files) => {
        if (files && files[0]) {
            const file = files[0];
            const uniqueFile = new File([file], generateUniqueName(file), { 
                type: file.type 
            });
            setFile(uniqueFile);
        }
    };

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

        const startEditing = (item) => {
    setEditingId(item.id);
    setEditForm({ name: item.name, descr: item.descr, photo: null });
};

const cancelEditing = () => {
    setEditingId(null);
    setEditForm({ name: '', descr: '', photo: null });
};

const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
};

const handleEditFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
        const uniqueFile = new File([file], generateUniqueName(file), { type: file.type });
        setEditForm((prev) => ({ ...prev, photo: uniqueFile }));
    }
};

const saveEdit = async (id) => {
    const formData = new FormData();
    formData.append('name', editForm.name);
    formData.append('descr', editForm.descr);
    if (editForm.photo) formData.append('photo', editForm.photo);

    try {
        await axios.put(`http://localhost:5000/api/news/${id}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Изменения сохранены!');
        fetchData();
        cancelEditing();
    } catch (err) {
        console.error('Ошибка при редактировании:', err);
        toast.error('Ошибка при редактировании');
    }
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
    }, []);




    const handleFileChange = (event) => {
        handleFiles(event.target.files);
    };
    const handleSubmit = async (event) => {
         event.preventDefault();
         if (!selectedFile) {
            toast.warn('Пожалуйста, выберите изображение');
            return;
        }
        const formData = new FormData();

        const name = event.target.elements.name.value;
        const descr = event.target.elements.descr.value;

        formData.append('image', selectedFile);
        formData.append('name', name);
        formData.append('descr', descr);
    
        try {
            await axios.post('http://localhost:5000/api/news', formData);
            toast.success('Запись успешно добавлена!');
            fetchData(); // Обновляем данные после добавления
        } catch (error) {
            console.error('Ошибка при загрузке файла:', error);
            toast.error('Ошибка при загрузке файла');
        }
    };

    const startEditing = (item) => {
    setEditingId(item.id);
    setEditForm({ name: item.name, descr: item.descr, photo: null });
};

const cancelEditing = () => {
    setEditingId(null);
    setEditForm({ name: '', descr: '', photo: null });
};

const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
};

const handleEditFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
        const uniqueFile = new File([file], generateUniqueName(file), { type: file.type });
        setEditForm((prev) => ({ ...prev, photo: uniqueFile }));
    }
};

const saveEdit = async (id) => {
    const formData = new FormData();
    formData.append('name', editForm.name);
    formData.append('descr', editForm.descr);
    if (editForm.photo) formData.append('photo', editForm.photo);

    try {
        await axios.put(`http://localhost:5000/api/news/${id}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Изменения сохранены!');
        fetchData();
        cancelEditing();
    } catch (err) {
        console.error('Ошибка при редактировании:', err);
        toast.error('Ошибка при редактировании');
    }
};


    const deleteItem = async (id) => {
        try {
            await axios.delete(`http://localhost:5000/api/news/${id}`);
            toast.success("Запись успешно удалена!");
            fetchData(); // Обновляем данные после удаления
        } catch (error) {
            console.error('Ошибка при удалении записи:', error);
            toast.success('Ошибка при удалении записи');
        }
    };

    const handleSortChange = (event) => {
        setSortField(event.target.value);
    };

    const handleSearchChange = (event) => {
        setSearchQuery(event.target.value);
    };
    const filteredNews = news.filter((item) => {
        const query = searchQuery.toLowerCase().trim();
        return (
            item.name.toLowerCase().includes(query) ||
            item.descr.toLowerCase().includes(query)
        );
    });
    const sortedNews = [...filteredNews].sort((a, b) => {
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
                    <option value="name">Название</option>
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
                        <th>Изменение</th>
                    </tr>
                </thead>
                <tbody>
                    {sortedNews.map((item) => (
                        <tr key={item.id}>
    <td>
        {editingId === item.id ? (
            <div className="edit-field">
                <input type="file" onChange={handleEditFileChange} />
                {editForm.photo ? (
                    <img src={URL.createObjectURL(editForm.photo)} alt="preview" className="image-preview" />
                ) : (
                    <img src={`http://localhost:5000${item.photo}`} alt={item.name} className="image-preview" />
                )}
            </div>
        ) : (
            <img src={`http://localhost:5000${item.photo}`} alt={item.name} />
        )}
    </td>
    <td>
        {editingId === item.id ? (
            <input type="text" name="name" value={editForm.name} onChange={handleEditChange} />
        ) : (
            <p>{item.name}</p>
        )}
    </td>
    <td>
        {editingId === item.id ? (
            <input type="text" name="descr" value={editForm.descr} onChange={handleEditChange} />
        ) : (
            <p>{item.descr}</p>
        )}
    </td>
    <td>
        {editingId === item.id ? (
            <>
                <button onClick={() => saveEdit(item.id)}>Сохранить</button>
                <button onClick={cancelEditing}>Отмена</button>
            </>
        ) : (
            <button onClick={() => startEditing(item)}>Редактировать</button>

        )}
        <button onClick={() => deleteItem(item.id)}>Удалить</button>
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
                    onClick={(e) => e.stopPropagation()} // предотвращаем повторный клик
                    className="file-input-hidden"
                />
                {preview ? (
                    <img src={preview} alt="Превью" className="image-preview" />
                ) : (
                    <p>{uploadHint}</p>
                )}
            </div>
                <input type='text' name='name' placeholder='Название'></input>
                <input type='text' name='descr' placeholder='Описание'></input>
                <button type='submit'>Отправить</button>
            </form>
        </div>
    );
};

export default NewsTable;
