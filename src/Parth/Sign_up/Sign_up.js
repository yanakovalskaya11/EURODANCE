import axios from 'axios';
import React, { useEffect, useState } from 'react'

const Sign_up = () => {
    const [names, setNames]=useState([]);
     const [selectedName, setSelectedName] = useState('');
    useEffect(() => {
        const fetchData = async () => {
            try {
                const teachersResponse = await axios.get('http://localhost:5000/api/teachers');
                setNames(teachersResponse.data);
            } catch (error) {
                console.error('Ошибка при загрузке учителей:', error);
            }
        };

        fetchData();
    }, []);

    const handleSubmit = async (event) => {
        event.preventDefault();
        const formData = new FormData();
        formData.append('teacher_id', selectedName);
    }

    // console.log('FormData:', {
    //     teacher_id: selectedName
    // });

  return (
    <div>
       <form onSubmit={handleSubmit}>
            <div>
                <label>Имя учителя:</label>
                <select 
                name='teacher_id'
                    value={selectedName} 
                    onChange={(e) => {
                        const options = Array.from(e.target.selectedOptions);
                        const selectedId = e.target.value; 
                       
                        const selected = options.map(option => option.value);
                        setSelectedName(selected.length > 0 ? selected[0] : ''); // Сохраняем только первое выбранное имя
                        
                    }}
                >
                    {names.map(name => (
                        <option key={name.id} value={name.name}>
                            {name.name}
                        </option>
                    ))}
                </select>
                <input type='text' value={selectedName} readOnly /> {/* Отображаем выбранное имя */}
            </div>
            </form>
    </div>
  )
}

export default Sign_up
