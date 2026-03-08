import React, { useEffect } from 'react';
import BackgroundVideo from '../components/BackgroundVideo';
import Typewriter from '../components/Typewriter';
import { speciesData } from '../data/species';
import './SpecimenDetail.css';
import MorphingPageDots from '../components/MorphingPageDots';

const SpecimenDetail = ({ specIndex, onNavigate }) => {
    const specimen = speciesData[specIndex];

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                if (specIndex < speciesData.length - 1) {
                    onNavigate('detail', specIndex + 1, 'right');
                } else {
                    onNavigate('home', 0, 'down'); // Go back to home if at last item
                }
            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                if (specIndex > 0) {
                    onNavigate('detail', specIndex - 1, 'left');
                } else {
                    onNavigate('intro', 0, 'left'); // Go back to intro if at first item
                }
            } else if (e.key === 'Enter') {
                onNavigate('home', 0, 'down');
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [specIndex, onNavigate]);

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
                            <Typewriter text={specimen.subtitle} delay={30} initialDelay={1600} />
                        </h2>

                        {/* Assuming max 100 chars for subtitle: 1600 + 100 * 30 = 4600 -> 4700 starts description */}
                        <div className="specimen-description-container">
                            <p className="specimen-description">
                                <Typewriter text={specimen.description} delay={15} initialDelay={4700} />
                            </p>
                        </div>
                    </div>
                    
                    <div className="morphing-dots-wrapper">
                        <MorphingPageDots 
                            total={speciesData.length} 
                            activeIndex={specIndex} 
                            onChange={(index, direction) => onNavigate('detail', index, direction)} 
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SpecimenDetail;
