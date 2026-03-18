import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import BackgroundVideo from '../components/BackgroundVideo';
import './EventHeader.css';

const EventHeader = ({ slideIndex, totalSlides, onNavigate, slideData }) => {
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                onNavigate('right');
            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                onNavigate('left');
            } else if (e.key === 'Enter') {
                onNavigate('down');
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onNavigate]);

    const itemVariants = {
        hidden: { opacity: 0, scale: 0.9 },
        visible: { opacity: 1, scale: 1, transition: { duration: 0.8, ease: 'easeOut' } }
    };

    return (
        <div className="view-event-header animate-fade-in">
            <BackgroundVideo src="/assets/placeholder.mp4" variant="full">
                <div className="event-header-content">
                    <motion.div 
                        className="event-header-center"
                        initial="hidden"
                        animate="visible"
                        variants={itemVariants}
                    >
                        {slideData.subtitle && <h2 className="event-subtitle">{slideData.subtitle}</h2>}
                        <h1 className="event-title">{slideData.title}</h1>
                        <div className="event-line"></div>
                        {slideData.description && (
                            <motion.p variants={itemVariants} className="event-description">
                                {slideData.description}
                            </motion.p>
                        )}
                    </motion.div>
                </div>
            </BackgroundVideo>
        </div>
    );
};

export default EventHeader;
