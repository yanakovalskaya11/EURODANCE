import React, { useContext, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import { UserContext } from '../../UserContext';
import './AddAdviceForm.css';

const AddAdviceForm = ({ onAdd }) => {
  const [title, setTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const { currentUser } = useContext(UserContext);
  
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
    ],
    content: '<p>Начните писать ваш совет здесь...</p>',
  });



const handleSubmit = async (e) => {
  e.preventDefault();
  
  if (!editor || !currentUser) return;
  
  setIsSubmitting(true);
  setError(null);
  
  const htmlContent = editor.getHTML();
  
  try {
    const response = await fetch('http://localhost:5000/api/advices', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title,
        text: htmlContent,
        teacher_id: currentUser.id // ID берется из контекста пользователя
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Ошибка при сохранении');
    }
    
    const newAdvice = await response.json();
    onAdd(newAdvice);
    editor.commands.clearContent();
    setTitle('');
  } catch (error) {
    console.error('Ошибка:', error);
    setError(error.message);
  } finally {
    setIsSubmitting(false);
  }
};


  return (
    <div className="add-advice-form">
      <h2 className="form-title">Добавить новый совет</h2>
      {error && <div className="error-message">{error}</div>}
      <form className='form_advice' onSubmit={handleSubmit}>
        <div className="form-group_h">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="form-input_h"
            required
            disabled={isSubmitting}
          />
        </div>
        
        <div className="editor-container">
          <MenuBar editor={editor} disabled={isSubmitting} />
          <EditorContent 
            editor={editor} 
            className="editor-content" 
            disabled={isSubmitting}
          />
        </div>
        
        <button 
          type="submit" 
          className="submit-btn"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Отправка...' : 'Опубликовать совет'}
        </button>
      </form>
    </div>
  );
};

const MenuBar = ({ editor, disabled }) => {
  if (!editor) return null;

  return (
    <div className="editor-menu">
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`menu-btn ${editor.isActive('bold') ? 'active' : ''}`}
        disabled={disabled}
      >
        Жирный
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`menu-btn ${editor.isActive('italic') ? 'active' : ''}`}
        disabled={disabled}
      >
        Курсив
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={`menu-btn ${editor.isActive('underline') ? 'active' : ''}`}
        disabled={disabled}
      >
        Подчеркивание
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`menu-btn ${editor.isActive('bulletList') ? 'active' : ''}`}
        disabled={disabled}
      >
        Список
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={`menu-btn ${editor.isActive('heading', { level: 3 }) ? 'active' : ''}`}
        disabled={disabled}
      >
        Заголовок
      </button>
    </div>
  );
};

export default AddAdviceForm;