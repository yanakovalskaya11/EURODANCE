import { useState, useRef, useEffect } from 'react';
import './DanceGallery.css';

const danceStyles = [
  { id: 1, name: 'Hip-Xop', video: '/videos/hip-hop.mp4' },
  { id: 2, name: 'Tango', video: '/videos/tango.mp4' },
  { id: 3, name: 'Contemporary', video: '/videos/contem.mp4' },
  { id: 4, name: 'Commercial', video: '/videos/comm.mp4' },
];

export default function DanceMenu() {
  const [activeCard, setActiveCard] = useState(null);
  const [thumbnails, setThumbnails] = useState({});
  const videoRefs = useRef({});
  const [isMobile, setIsMobile] = useState(false);

  // Проверка на мобильное устройство
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  // Генерация превью
  useEffect(() => {
    danceStyles.forEach(style => {
      const video = document.createElement('video');
      video.src = style.video;
      video.crossOrigin = 'anonymous';
      video.muted = true;
      video.preload = 'metadata';
      
      video.onloadeddata = () => {
        video.currentTime = 0.1;
      };

      video.onseeked = () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        try {
          const thumbnailUrl = canvas.toDataURL('image/jpeg');
          setThumbnails(prev => ({ ...prev, [style.id]: thumbnailUrl }));
        } catch (error) {
          console.error('Error generating thumbnail:', error);
        }
      };
    });
  }, []);

  const handleCardClick = (id) => {
    if (isMobile) {
      setActiveCard(activeCard === id ? null : id);
      const video = videoRefs.current[id];
      if (video) {
        if (activeCard !== id) {
          video.currentTime = 0;
          video.play().catch(e => console.log('Play error:', e));
        } else {
          video.pause();
        }
      }
    }
  };

  const handleMouseEnter = (id) => {
    if (!isMobile) {
      setActiveCard(id);
      const video = videoRefs.current[id];
      if (video) {
        video.currentTime = 0;
        video.play().catch(e => console.log('Autoplay error:', e));
      }
    }
  };

  return (
    <section className="dance-gallery-section">
       <div class="gallery-logo-wrapper">
      <h2 className="gallery-logo">EURODANCE</h2>
      <h3 className="gallery-logo_2">ТАНЦУЙ ВЕЗДЕ<br></br>ТАНЦУЙ ВСЕГДА</h3>
      </div>
      <div className="dance-gallery-container">
        <div className={`dance-gallery-row ${isMobile ? 'mobile' : ''}`}>
          {danceStyles.map(style => (
            <div
              key={style.id}
              className={`dance-card ${activeCard === style.id ? 'active' : ''} ${isMobile ? 'mobile' : ''}`}
              onMouseEnter={() => handleMouseEnter(style.id)}
              onMouseLeave={() => !isMobile && setActiveCard(null)}
              onClick={() => handleCardClick(style.id)}
            >
              {thumbnails[style.id] ? (
                <img
                  src={thumbnails[style.id]}
                  alt={`Превью ${style.name}`}
                  className="dance-preview"
                />
              ) : (
                <div className="dance-preview-fallback"></div>
              )}

              <video
                ref={el => videoRefs.current[style.id] = el}
                src={style.video}
                className="dance-video"
                loop
                muted
                playsInline
                preload="none"
              />

              <div className="dance-title">{style.name}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}