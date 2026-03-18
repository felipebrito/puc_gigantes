import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import './SilurianGlobe.css';

const SilurianGlobe = ({ onNavigate, slideData }) => {
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
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: 'easeOut' } }
    };

    return (
        <div className={`view-silurian-globe ${slideData.period || ''} animate-fade-in`}>
            {/* Blue Header Bar - 1:1 with Canva */}
            <div className="silurian-header-bar">
                <h1 className="silurian-header-text">EXTINÇÃO</h1>
            </div>

            <div className="silurian-globe-content">
                {/* Central Globe Image */}
                <motion.div
                    className="globe-container"
                    initial="hidden"
                    animate="visible"
                    variants={itemVariants}
                >
                    <img
                        src={slideData.imageSrc || "/assets/silurian_globe.png"}
                        alt="Silurian Globe"
                        className="globe-image"
                    />
                </motion.div>

                {/* Text Paragraph */}
                <motion.div
                    className="text-container"
                    initial="hidden"
                    animate="visible"
                    variants={itemVariants}
                    transition={{ delay: 0.3 }}
                >
                    {slideData.imageCaption && (
                        <p className="globe-image-caption">
                            {slideData.imageCaption}
                        </p>
                    )}
                    <p className="globe-description">
                        {slideData.content}
                    </p>
                    {/* Bottom Blue Line */}
                    <div className="globe-bottom-line"></div>
                    {/* Optional image caption — used by Devoniano, not Ordoviciano */}

                </motion.div>
            </div>

            {/* Logos and Footer mirroring original design */}

        </div>
    );
};

export default SilurianGlobe;
