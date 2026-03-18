import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import BackgroundVideo from '../components/BackgroundVideo';
import Typewriter from '../components/Typewriter';
import './SectionIntro.css';

const SectionIntro = ({ onNavigate, slideData }) => {
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

    const periodLabel = slideData.periodLabel || "PERÍODO";
    const periodName = slideData.periodName || slideData.period?.toUpperCase() || "ORDOVICIANO";

    return (
        <div className={`view-section-intro ${slideData.period || ''} ${slideData.section || ''} animate-fade-in`}>
            {slideData.videoSrc ? (
                <BackgroundVideo src={slideData.videoSrc} variant="full" />
            ) : (
                <img className="section-bg-image" src={slideData.bgImage || '/assets/extinction_map.png'} alt="Background" />
            )}

            <div className="section-intro-content">
                <motion.div
                    className="section-html-overlay"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    <div className="section-intro-header">
                        <motion.h3 variants={itemVariants} className="section-intro-period-label">{periodLabel}</motion.h3>
                        <motion.h2 variants={itemVariants} className="section-intro-period-name">{periodName}</motion.h2>
                        <motion.img variants={itemVariants} className="section-title-underline" src="/assets/linha.svg" alt="" />
                    </div>

                    <div className="section-intro-body">
                        <motion.h1 variants={itemVariants} className="section-intro-main-heading">
                            <Typewriter text={slideData.title} delay={50} initialDelay={300} />
                        </motion.h1>
                        
                        <motion.img variants={itemVariants} className="section-body-top-line" src="/assets/linha.svg" alt="" />
                        
                        <motion.div variants={itemVariants} className="section-intro-main-text">
                            <Typewriter
                                text={slideData.content || slideData.description}
                                delay={15}
                                initialDelay={1500}
                            />
                        </motion.div>
                        
                        <motion.img variants={itemVariants} className="section-body-bottom-line" src="/assets/linha.svg" alt="" />
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default SectionIntro;
