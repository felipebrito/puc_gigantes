import React, { useEffect } from 'react';
import BackgroundVideo from '../components/BackgroundVideo';
import Typewriter from '../components/Typewriter';
import { slidesData } from '../data/slides';
import './SpecimenDetail.css';

const SpecimenDetail = ({ slideIndex, totalSlides, onNavigate, slideData }) => {
    const specimen = slideData;

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

    if (!specimen) return null;

    return (
        <div className="view-detail animate-fade-in" key={specimen.id}>
            <BackgroundVideo src={specimen.videoSrc} variant="split" />

            <div className="detail-content">
                {/* SVG Phantom overlay for alignment reference */}
                {/* <img className="png-reference" src="/assets/ref1.png" alt="Layout reference" /> */}

                <div className="detail-empty-top"></div>

                <div className="detail-info-area">
                    <img className="detail-base-bg" src="/assets/baseInternaBranca.svg" alt="" />

                    <div className="detail-text-overlay">
                        <h1 className="specimen-name">
                            <Typewriter text={specimen.name} delay={50} initialDelay={300} />
                        </h1>
                        {/* Assuming max 25 chars for name: 300 + 25 * 50 = 1550 -> 1600 starts subtitle */}
                        <h2 className="specimen-subtitle">
                            <Typewriter text={specimen.subtitle} delay={30} initialDelay={1000} />
                        </h2>

                        {/* Description starts much sooner */}
                        <div className="specimen-description-container">
                            <p className="specimen-description">
                                <Typewriter text={specimen.description} delay={15} initialDelay={2000} />
                            </p>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default SpecimenDetail;
