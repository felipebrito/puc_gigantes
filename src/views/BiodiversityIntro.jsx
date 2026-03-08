import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import BackgroundVideo from '../components/BackgroundVideo';
import Typewriter from '../components/Typewriter';
import './BiodiversityIntro.css';

const BiodiversityIntro = ({ onNavigate }) => {
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                onNavigate('detail', 0, 'right'); // Slide right to first specimen
            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                // Ignore per requested navigation map, can't slide further left. ArrowRight advances.
            } else if (e.key === 'Enter') {
                onNavigate('home', 0, 'down'); // Hit enter -> Back to home screen
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

    return (
        <div className="view-intro animate-fade-in">
            <BackgroundVideo src="/assets/placeholder.mp4" variant="full">
                <div className="intro-content">
                    {/* SVG Phantom overlay for alignment reference */}
                    {/* <img className="svg-reference" src="/assets/pg2.svg" alt="Layout reference" /> */}

                    <motion.div
                        className="html-overlay"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        <div className="intro-header">
                            <motion.h3 variants={itemVariants} className="section-subtitle">PERÍODO</motion.h3>
                            <motion.h2 variants={itemVariants} className="section-title">ORDOVICIANO</motion.h2>
                            <motion.img variants={itemVariants} className="title-underline-small" src="/assets/linha.svg" alt="" />
                        </div>

                        <div className="intro-body">
                            <motion.h1 variants={itemVariants} className="main-heading">
                                <Typewriter text="A BIODIVERSIDADE DA ÉPOCA" delay={50} initialDelay={300} />
                            </motion.h1>
                            <motion.div variants={itemVariants} className="main-text">
                                <Typewriter
                                    text="Conheça os representantes da fauna e da flora característicos desse momento geológico."
                                    delay={20}
                                    initialDelay={1500}
                                />
                            </motion.div>
                            <motion.img variants={itemVariants} className="footer-underline-small" src="/assets/linha.svg" alt="" />
                        </div>
                    </motion.div>
                </div>
            </BackgroundVideo>
        </div>
    );
};

export default BiodiversityIntro;
