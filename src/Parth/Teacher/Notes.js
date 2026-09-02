import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './notes.css';
import { FiChevronDown, FiChevronUp } from 'react-icons/fi'; // стрелочки

const Notes = ({ teacherId }) => {
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [expanded, setExpanded] = useState(false); // новое состояние - развернуты или нет

  const fetchNotes = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/notes?id=${teacherId}`);
      setNotes(response.data);
    } catch (error) {
      console.error('Ошибка при загрузке заметок:', error);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [teacherId]);

  const handleAddNote = async () => {
    if (newNote.trim() === '') return;

    try {
      await axios.post('http://localhost:5000/api/notes', { id: teacherId, note: newNote });
      setNewNote('');
      fetchNotes();
    } catch (error) {
      console.error('Ошибка при добавлении заметки:', error);
    }
  };

  const handleUpdateNote = async (noteID, updatedText) => {
    try {
      await axios.patch(`http://localhost:5000/api/notes/${noteID}`, { note: updatedText });
      fetchNotes();
    } catch (error) {
      console.error('Ошибка при обновлении заметки:', error);
    }
  };

  const handleDeleteNote = async (noteID) => {
    try {
      await axios.delete(`http://localhost:5000/api/notes/${noteID}`);
      fetchNotes();
    } catch (error) {
      console.error('Ошибка при удалении заметки:', error);
    }
  };

  const displayedNotes = expanded ? notes : notes.slice(0, 1);

  return (
    <div className="notes-section">
      <h3>Мои заметки</h3>

      <div className="add-note">
        <textarea 
          value={newNote} 
          onChange={(e) => setNewNote(e.target.value)} 
          placeholder="Новая заметка..." 
        />
        <button onClick={handleAddNote}>Добавить заметку</button>
      </div>

      <div className="notes-list">
        {displayedNotes.length === 0 ? (
          <p>Нет заметок</p>
        ) : (
          displayedNotes.map((note) => (
            <NoteItem 
              key={note.noteID} 
              note={note} 
              onUpdate={handleUpdateNote} 
              onDelete={handleDeleteNote}
            />
          ))
        )}
      </div>

      {notes.length > 1 && (
        <button className="toggle-button" onClick={() => setExpanded(!expanded)}>
          {expanded ? <FiChevronUp size={24} /> : <FiChevronDown size={24} />}
        </button>
      )}
    </div>
  );
};

const NoteItem = ({ note, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(note.note);

  const handleSave = () => {
    onUpdate(note.noteID, editedText);
    setIsEditing(false);
  };

  return (
    <div className="note-item">
      {isEditing ? (
        <>
          <textarea 
            value={editedText} 
            onChange={(e) => setEditedText(e.target.value)} 
          />
          <button onClick={handleSave}>Сохранить</button>
          <button onClick={() => setIsEditing(false)}>Отмена</button>
        </>
      ) : (
        <>
          <p>{note.note}</p>
          <button onClick={() => setIsEditing(true)}>Редактировать</button>
          <button onClick={() => onDelete(note.noteID)}>Удалить</button>
        </>
      )}
    </div>
  );
};

export default Notes;
