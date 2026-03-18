import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import './SilurianSpecimen.css';

const SilurianSpecimen = ({ onNavigate, slideData }) => {
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

    return (
        <div className="view-silurian-specimen animate-fade-in">
            <div className="silurian-header-bar">
                <h1 className="silurian-header-text">EXTINÇÃO</h1>
            </div>

            <div className="silurian-specimen-content">
                {/* Imagem de cenário acima do introText — opcional */}
                {slideData.introImage && (
                    <div className="silurian-intro-image-box">
                        <img src={slideData.introImage} alt="Cenário" className="silurian-intro-image" />
                    </div>
                )}

                {slideData.introText && (
                    <div className="silurian-intro-box">
                        <p className="silurian-intro-text">{slideData.introText}</p>
                    </div>
                )}

                <div className="silurian-image-section1">
                    <img src="assets/barrabranca.png" className="barrabrancaDalmanites" />
                    <img src={slideData.imageSrc} alt={slideData.name} className="silurian-specimen-image" />
                    <div className="silurian-name-overlay">
                        <br /><br /><br /><br /><br />
                        <h2 className="silurian-specimen-name1">{slideData.name}</h2>
                        <h3 className="silurian-specimen-subtitle1">{slideData.subtitle}</h3>
                    </div>
                </div>

                <div className="silurian-description-box1">

                    <p className="silurian-description-text1">
                        {slideData.description}
                    </p>

                    <div className="silurian-stepped-line">
                        <img src="assets/linha2.png" alt="linha" />
                    </div>
                </div>
            </div>

            {/* Logos consistently positioned */}

        </div>
    );
};

export default SilurianSpecimen;
