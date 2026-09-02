import axios from 'axios';
import React, { useEffect, useRef, useState } from 'react';
import './admin.css';
import { toast } from 'react-toastify';

const ThingsTable = () => {
    const [selectedFile, setFile] = useState(null);
    const [things, setThings] = useState([]);
    const [sortField, setSortField] = useState('name');
    const [searchQuery, setSearchQuery] = useState('');

    //вставка изображения классная отвечаю
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
        
        // Очистка превью при размонтировании
        return () => {
            if (preview) URL.revokeObjectURL(preview);
        };
    }, []);

    useEffect(() => {
        // Создаем превью для выбранного файла
        if (!selectedFile) {
            setPreview(null);
            return;
        }

        const objectUrl = URL.createObjectURL(selectedFile);
        setPreview(objectUrl);

        // Очистка при размонтировании или изменении файла
        return () => URL.revokeObjectURL(objectUrl);
    }, [selectedFile]);
useEffect(() => {
    const preventDefaults = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    // Предотвращаем открытие файла в новом окне
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



    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/things');
            setThings(response.data);
        } catch (error) {
            console.error("Не удалось получить данные, ", error);
        }
        
    };

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
        const desc = event.target.elements.descr.value;
        const price = event.target.elements.price.value;

        formData.append('image', selectedFile);
        formData.append('name', name);
        formData.append('descr', desc);
        formData.append('price', price);
    
        try {
            await axios.post('http://localhost:5000/api/things', formData);
            toast.success('Запись успешно добавлена!');
            fetchData(); // Обновляем данные после добавления

             event.target.reset();
        setFile(null); // Убираем файл
        setPreview(null); // Убираем превью
        } catch (error) {
            console.error('Ошибка при загрузке файла:', error);
            toast.warn('Ошибка при загрузке файла');
        }
    };

    const deleteItem = async (id) => {
        try {
            await axios.delete(`http://localhost:5000/api/things/${id}`);
            toast.success("Запись успешно удалена!");
            fetchData(); // Обновляем данные после удаления
        } catch (error) {
            console.error('Ошибка при удалении записи:', error);
            toast.error('Ошибка при удалении записи');
        }
    };
const [sortOrder, setSortOrder] = useState('asc');
    const handleSortChange = (event) => {
          setSortField(event.target.value);
    // Переключаем порядок сортировки при повторном выборе того же поля
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    };

    const handleSearchChange = (event) => {
        setSearchQuery(event.target.value);
    };


    // Фильтруем новости по поисковому запросу
    const filteredNews = things.filter((item) => {
        const query = searchQuery.toLowerCase().trim();
         const priceString = item.price.toString(); 
        return (
            item.name.toLowerCase().includes(query) ||
            item.descr.toLowerCase().includes(query)||
             priceString.includes(query)
        );
    });

    // Сортируем перед отображением
    const sortedNews = [...filteredNews].sort((a, b) => {
        if (sortField === 'price') {
        return sortOrder === 'asc' ? a.price - b.price : b.price - a.price;
    } else {
        const valA = String(a[sortField] || '').trim().toLowerCase();
        const valB = String(b[sortField] || '').trim().toLowerCase();
        return sortOrder === 'asc' 
            ? valA.localeCompare(valB) 
            : valB.localeCompare(valA);
    }
    });

    return (
        <div className='Naprav'>
            <p>
                Сортировать по:
                <select onChange={handleSortChange} value={sortField}>
                    <option value="name">Название</option>
                    <option value="descr">Описание</option>
                     <option value="price">Цена</option>
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
                        <th>Изменение</th>
                    </tr>
                </thead>
                <tbody>
                    {sortedNews.map((item) => (
                        <tr key={item.id}>
                            <td>
                                <img src={`http://localhost:5000${item.photo}`} alt={item.name} />
                            </td>
                            <td><p>{item.name}</p></td>
                            <td><p>{item.descr}</p></td>
                            <td><p>{item.price} баллов</p></td>
                            
                            <td>
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
                <input type='number' name='price' placeholder='Цена'></input>
                <button type='submit' >Отправить</button>
            </form>
        </div>
    );
};

export default ThingsTable;
