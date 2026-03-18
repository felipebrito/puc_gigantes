import React, { useEffect } from 'react';
import Typewriter from '../components/Typewriter';
import BackgroundVideo from '../components/BackgroundVideo';
import './DoubleSpecimenDetail.css';

const DoubleSpecimenDetail = ({ slideIndex, totalSlides, onNavigate, slideData }) => {
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
        <div className="view-double-detail animate-fade-in">
            <BackgroundVideo src="/assets/placeholder.mp4" variant="full" />
            
            <div className="double-detail-content">
                <div className="double-specimen-top">
                    <div className="double-text-block">
                        <h1 className="double-specimen-name">
                            <Typewriter text={slideData.speciesLeft.name} delay={40} initialDelay={300} />
                        </h1>
                        <h2 className="double-specimen-subtitle">
                            <Typewriter text={slideData.speciesLeft.subtitle} delay={20} initialDelay={700} />
                        </h2>
                        <div className="double-specimen-description">
                            <Typewriter text={slideData.speciesLeft.description} delay={15} initialDelay={1200} />
                        </div>
                    </div>
                </div>

                <div className="double-specimen-divider"></div>

                <div className="double-specimen-bottom">
                    <div className="double-text-block">
                         <h1 className="double-specimen-name">
                            <Typewriter text={slideData.speciesRight.name} delay={40} initialDelay={600} />
                        </h1>
                        <h2 className="double-specimen-subtitle">
                            <Typewriter text={slideData.speciesRight.subtitle} delay={20} initialDelay={1000} />
                        </h2>
                        <div className="double-specimen-description">
                            <Typewriter text={slideData.speciesRight.description} delay={15} initialDelay={1500} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DoubleSpecimenDetail;
