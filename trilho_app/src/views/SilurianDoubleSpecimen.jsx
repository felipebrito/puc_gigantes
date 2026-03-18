import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import './SilurianDoubleSpecimen.css';

const SilurianDoubleSpecimen = ({ onNavigate, slideData }) => {
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
        <div className="view-silurian-double animate-fade-in">
            <div className="silurian-header-bar">
                <h1 className="silurian-header-text">EXTINÇÃO</h1>
            </div>

            <div className="silurian-double-content">
                {/* Intro text — exibido apenas quando presente (ex: primeiro slide do Carbonífero) */}
                {slideData.introText && (
                    <p className="silurian-double-intro-text">{slideData.introText}</p>
                )}

                {/* UP SPECIMEN */}
                <div className="specimen-segment">
                    <div className="silurian-image-section">
                        <img src="assets/barrabranca.png" className="barrabrancaInterna" />
                        <img src={slideData.speciesLeft.imageSrc} alt={slideData.speciesLeft.name} className="silurian-specimen-image" />
                        <div className="silurian-name-overlay">
                            <h2 className="silurian-specimen-name">{slideData.speciesLeft.name}</h2>
                            <h3 className="silurian-specimen-subtitle">{slideData.speciesLeft.subtitle}</h3>
                        </div>
                    </div>
                    <div className="silurian-description-box">
                        <p className="silurian-description-text">
                            {slideData.speciesLeft.description}
                        </p>
                    </div>
                </div>

                {/* DOWN SPECIMEN */}
                <div className="specimen-segment">
                    <div className="silurian-image-section">
                        <img src="assets/barrabranca.png" className="barrabrancaInterna" />
                        <img src={slideData.speciesRight.imageSrc} alt={slideData.speciesRight.name} className="silurian-specimen-image" />
                        <div className="silurian-name-overlay">
                            <h2 className="silurian-specimen-name">{slideData.speciesRight.name}</h2>
                            <h3 className="silurian-specimen-subtitle">{slideData.speciesRight.subtitle}</h3>
                        </div>
                    </div>
                    <div className="silurian-description-box">
                        <p className="silurian-description-text">
                            {slideData.speciesRight.description}
                        </p>

                    </div>
                </div>
            </div>


        </div>
    );
};

export default SilurianDoubleSpecimen;
