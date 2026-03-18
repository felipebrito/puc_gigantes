import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import BackgroundVideo from '../components/BackgroundVideo';
import './Home.css';

const Home = ({ onNavigate }) => {
    const [activeIndex, setActiveIndex] = useState(0);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                setActiveIndex((prev) => (prev < 2 ? prev + 1 : 0));
            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                setActiveIndex((prev) => (prev > 0 ? prev - 1 : 2));
            } else if (e.key === 'Enter') {
                // Execute action based on active index
                if (activeIndex === 0) {
                    onNavigate('up', 1);
                } else if (activeIndex === 1) {
                    onNavigate('up', 9); // A EXTINÇÃO
                } else if (activeIndex === 2) {
                    onNavigate('up', 11); // E DEPOIS?
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [activeIndex, onNavigate]);

    const containerVariants = {
        hidden: { opacity: 1 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.15 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, filter: 'blur(15px)', y: 20 },
        visible: { opacity: 1, filter: 'blur(0px)', y: 0, transition: { duration: 0.8, ease: 'easeOut' } }
    };

    return (
        <div className="view-home animate-fade-in">

            <BackgroundVideo src="/assets/placeholder.mp4" variant="full">
                {/* <img src="/assets/bg.png" className="bg-image" /> */}
                <motion.div
                    className="home-content"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    <div className="home-titles">
                        <motion.h2 variants={itemVariants} className="subtitle">PERÍODO</motion.h2>
                        <motion.h1 variants={itemVariants} className="title">ORDOVICIANO</motion.h1>
                        <motion.div variants={itemVariants} className="title-underline"></motion.div>
                        <motion.p variants={itemVariants} className="description">440 milhões de anos</motion.p>
                        <motion.p variants={itemVariants} className="sub-description">A 1ª extinção em massa</motion.p>
                        <motion.img variants={itemVariants} src="/assets/linha.png" alt="Linha Grafismo" className="line-graphic" />
                    </div>

                    <motion.div variants={itemVariants} className="home-menu">
                        <button
                            className={`btn-home ${activeIndex === 0 ? 'btn-home-active' : 'btn-home-inactive'}`}
                            onClick={() => onNavigate('up', 1)}
                            onMouseEnter={() => setActiveIndex(0)}
                        >
                            <span>A BIODIVERSIDADE DA ÉPOCA</span>
                            <span className={activeIndex === 0 ? "btn-icon-active" : "btn-icon-inactive"}>›</span>
                        </button>
                        <button
                            className={`btn-home ${activeIndex === 1 ? 'btn-home-active' : 'btn-home-inactive'}`}
                            onClick={() => onNavigate('up', 9)}
                            onMouseEnter={() => setActiveIndex(1)}
                        >
                            <span>A EXTINÇÃO</span>
                            <span className={activeIndex === 1 ? "btn-icon-active" : "btn-icon-inactive"}>›</span>
                        </button>
                        <button
                            className={`btn-home ${activeIndex === 2 ? 'btn-home-active' : 'btn-home-inactive'}`}
                            onClick={() => onNavigate('up', 11)}
                            onMouseEnter={() => setActiveIndex(2)}
                        >
                            <span>E DEPOIS?</span>
                            <span className={activeIndex === 2 ? "btn-icon-active" : "btn-icon-inactive"}>›</span>
                        </button>
                    </motion.div>
                </motion.div>
            </BackgroundVideo>
        </div>
    );
};

export default Home;
