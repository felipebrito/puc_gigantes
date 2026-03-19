import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import BackgroundVideo from '../components/BackgroundVideo';
import { slidesData, periodStartIndex } from '../data/slides';
import './HomePermian.css';

// Absolute indices in slidesData for each permiano section
const PERMIAN_OFFSET    = periodStartIndex.permiano;
const BIODIVERSIDADE_IDX = PERMIAN_OFFSET + slidesData.slice(PERMIAN_OFFSET).findIndex(s => s.section === 'biodiversidade');
const EXTINCAO_IDX       = PERMIAN_OFFSET + slidesData.slice(PERMIAN_OFFSET).findIndex(s => s.section === 'extincao');
const POS_EXTINCAO_IDX   = PERMIAN_OFFSET + slidesData.slice(PERMIAN_OFFSET).findIndex(s => s.section === 'pos_extincao');

const HomePermian = ({ onNavigate }) => {
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
        <div className="view-home-permian animate-fade-in">
            <BackgroundVideo src="/assets/placeholder.mp4" variant="full">
                <motion.div
                    className="home-permian-content"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    <div className="home-permian-titles">
                        <motion.h2 variants={itemVariants} className="permian-subtitle">PERÍODO</motion.h2>
                        <motion.h1 variants={itemVariants} className="permian-title">PERMIANO</motion.h1>
                        <motion.div variants={itemVariants} className="permian-title-underline"></motion.div>
                        <motion.p variants={itemVariants} className="permian-description">251 milhões de anos</motion.p>
                        <motion.p variants={itemVariants} className="permian-sub-description">A 3ª extinção em massa</motion.p>
                        <motion.img variants={itemVariants} src="/assets/linha.png" alt="Linha Grafismo" className="permian-line-graphic" />
                    </div>

                    <motion.div variants={itemVariants} className="home-permian-menu">
                        <button
                            className={`btn-permian ${activeIndex === 0 ? 'btn-permian-active' : 'btn-permian-inactive'}`}
                            onClick={() => onNavigate('up', BIODIVERSIDADE_IDX)}
                            onMouseEnter={() => setActiveIndex(0)}
                        >
                            <span>A BIODIVERSIDADE DA ÉPOCA</span>
                            <span className={activeIndex === 0 ? "btn-permian-icon-active" : "btn-permian-icon-inactive"}>›</span>
                        </button>
                        <button
                            className={`btn-permian ${activeIndex === 1 ? 'btn-permian-active' : 'btn-permian-inactive'}`}
                            onClick={() => onNavigate('up', EXTINCAO_IDX)}
                            onMouseEnter={() => setActiveIndex(1)}
                        >
                            <span>A EXTINÇÃO</span>
                            <span className={activeIndex === 1 ? "btn-permian-icon-active" : "btn-permian-icon-inactive"}>›</span>
                        </button>
                        <button
                            className={`btn-permian ${activeIndex === 2 ? 'btn-permian-active' : 'btn-permian-inactive'}`}
                            onClick={() => onNavigate('up', POS_EXTINCAO_IDX)}
                            onMouseEnter={() => setActiveIndex(2)}
                        >
                            <span>E DEPOIS?</span>
                            <span className={activeIndex === 2 ? "btn-permian-icon-active" : "btn-permian-icon-inactive"}>›</span>
                        </button>
                    </motion.div>
                </motion.div>
            </BackgroundVideo>
        </div>
    );
};

export default HomePermian;
