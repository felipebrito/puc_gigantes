import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import BackgroundVideo from '../components/BackgroundVideo';
import './EventDetail.css';

const EventDetail = ({ slideIndex, totalSlides, onNavigate, slideData }) => {
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
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: 'easeOut' } }
    };

    return (
        <div className="view-event-detail animate-fade-in">
            <BackgroundVideo src="/assets/placeholder.mp4" variant="full">
                <div className="event-detail-content">
                    <motion.div 
                        className="event-detail-box"
                        initial="hidden"
                        animate="visible"
                        variants={itemVariants}
                    >
                        <h1 className="event-detail-title">{slideData.title}</h1>
                        <div className="event-detail-line"></div>
                        <p className="event-detail-text">
                            {slideData.content.split('\n').map((line, i) => (
                                <React.Fragment key={i}>
                                    {line}
                                    <br />
                                </React.Fragment>
                            ))}
                        </p>
                    </motion.div>
                </div>
            </BackgroundVideo>
        </div>
    );
};

export default EventDetail;
