import React, { useEffect, useRef, useState } from 'react';

const DropImageUploader = ({ onFileSelect }) => {
    const [preview, setPreview] = useState(null);
    const [uploadHint, setUploadHint] = useState('Перетащите изображение сюда или нажмите для выбора');
    const dropAreaRef = useRef(null);
    const fileInputRef = useRef(null);

    const handleFiles = (files) => {
        if (files && files[0]) {
            const file = files[0];
            setPreview(URL.createObjectURL(file));
            onFileSelect(file);
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

        const handleDrop = (e) => {
            preventDefaults(e);
            unhighlight();
            const files = e.dataTransfer.files;
            if (files.length > 0) handleFiles(files);
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

dropArea.addEventListener('dragenter', (e) => {
    preventDefaults(e);
    highlight();
});
dropArea.addEventListener('dragover', (e) => {
    preventDefaults(e);
    highlight();
});
dropArea.addEventListener('dragleave', (e) => {
    preventDefaults(e);
    unhighlight();
});

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

    return (
        <div
            ref={dropAreaRef}
            className="file-upload-area"
            onClick={() => fileInputRef.current?.click()}
        >
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleFiles(e.target.files)}
                className="file-input-hidden"
                 onClick={(e) => e.stopPropagation()}
            />
            {preview ? (
                <img src={preview} alt="Превью" className="image-preview" />
            ) : (
                <p>{uploadHint}</p>
            )}
        </div>
    );
};

export default DropImageUploader;
