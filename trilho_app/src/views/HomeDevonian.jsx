import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import BackgroundVideo from '../components/BackgroundVideo';
import { slidesData, periodStartIndex } from '../data/slides';
import './HomeDevonian.css';

// Absolute indices in slidesData for each devoniano section
const DEVONIAN_OFFSET    = periodStartIndex.devoniano;
const BIODIVERSIDADE_IDX = DEVONIAN_OFFSET + slidesData.slice(DEVONIAN_OFFSET).findIndex(s => s.section === 'biodiversidade');
const EXTINCAO_IDX       = DEVONIAN_OFFSET + slidesData.slice(DEVONIAN_OFFSET).findIndex(s => s.section === 'extincao');
const POS_EXTINCAO_IDX   = DEVONIAN_OFFSET + slidesData.slice(DEVONIAN_OFFSET).findIndex(s => s.section === 'pos_extincao');

const HomeDevonian = ({ onNavigate }) => {
    const [activeIndex, setActiveIndex] = useState(0);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                setActiveIndex((prev) => (prev < 2 ? prev + 1 : 0));
            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                setActiveIndex((prev) => (prev > 0 ? prev - 1 : 2));
            } else if (e.key === 'Enter') {
                if (activeIndex === 0) {
                    onNavigate('up', BIODIVERSIDADE_IDX);
                } else if (activeIndex === 1) {
                    onNavigate('up', EXTINCAO_IDX);
                } else if (activeIndex === 2) {
                    onNavigate('up', POS_EXTINCAO_IDX);
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
        <div className="view-home-devonian animate-fade-in">
            <BackgroundVideo src="/assets/placeholder.mp4" variant="full">
                <motion.div
                    className="home-devonian-content"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    <div className="home-devonian-titles">
                        <motion.h2 variants={itemVariants} className="devonian-subtitle">PERÍODO</motion.h2>
                        <motion.h1 variants={itemVariants} className="devonian-title">DEVONIANO</motion.h1>
                        <motion.div variants={itemVariants} className="devonian-title-underline"></motion.div>
                        <motion.p variants={itemVariants} className="devonian-description">360 milhões de anos</motion.p>
                        <motion.p variants={itemVariants} className="devonian-sub-description">A 2ª extinção em massa</motion.p>
                        <motion.img variants={itemVariants} src="/assets/linha.png" alt="Linha Grafismo" className="devonian-line-graphic" />
                    </div>

                    <motion.div variants={itemVariants} className="home-devonian-menu">
                        <button
                            className={`btn-devonian ${activeIndex === 0 ? 'btn-devonian-active' : 'btn-devonian-inactive'}`}
                            onClick={() => onNavigate('up', BIODIVERSIDADE_IDX)}
                            onMouseEnter={() => setActiveIndex(0)}
                        >
                            <span>A BIODIVERSIDADE DA ÉPOCA</span>
                            <span className={activeIndex === 0 ? "btn-devonian-icon-active" : "btn-devonian-icon-inactive"}>›</span>
                        </button>
                        <button
                            className={`btn-devonian ${activeIndex === 1 ? 'btn-devonian-active' : 'btn-devonian-inactive'}`}
                            onClick={() => onNavigate('up', EXTINCAO_IDX)}
                            onMouseEnter={() => setActiveIndex(1)}
                        >
                            <span>A EXTINÇÃO</span>
                            <span className={activeIndex === 1 ? "btn-devonian-icon-active" : "btn-devonian-icon-inactive"}>›</span>
                        </button>
                        <button
                            className={`btn-devonian ${activeIndex === 2 ? 'btn-devonian-active' : 'btn-devonian-inactive'}`}
                            onClick={() => onNavigate('up', POS_EXTINCAO_IDX)}
                            onMouseEnter={() => setActiveIndex(2)}
                        >
                            <span>E DEPOIS?</span>
                            <span className={activeIndex === 2 ? "btn-devonian-icon-active" : "btn-devonian-icon-inactive"}>›</span>
                        </button>
                    </motion.div>
                </motion.div>
            </BackgroundVideo>
        </div>
    );
};

export default HomeDevonian;
