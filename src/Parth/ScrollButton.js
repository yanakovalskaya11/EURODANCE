import React, { useEffect, useState } from 'react';
import { FaArrowUp, FaArrowDown } from 'react-icons/fa'; // npm install react-icons
import './ScrollButton.css';

const ScrollButton = () => {
    const [atTop, setAtTop] = useState(true);

    const handleScroll = () => {
        setAtTop(window.scrollY === 0);
    };

    const scrollTo = () => {
        if (atTop) {
            window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    useEffect(() => {
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <button className="scroll-button" onClick={scrollTo}>
            {atTop ? <FaArrowDown /> : <FaArrowUp />}
        </button>
    );
};

export default ScrollButton;
