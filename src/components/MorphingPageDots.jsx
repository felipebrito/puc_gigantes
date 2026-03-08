import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './MorphingPageDots.css';

const ChevronLeft = ({ onClick, className }) => (
    <svg onClick={onClick} className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m15 18-6-6 6-6"/>
    </svg>
);

const ChevronRight = ({ onClick, className }) => (
    <svg onClick={onClick} className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m9 18 6-6-6-6"/>
    </svg>
);

export default function MorphingPageDots({
    total,
    activeIndex = 0,
    onChange
}) {
    const goPrev = () => {
        if (activeIndex > 0 && onChange) onChange(activeIndex - 1, 'left');
    };
    
    const goNext = () => {
        if (activeIndex < total - 1 && onChange) onChange(activeIndex + 1, 'right');
    };

    return (
        <div className="morphing-dots-container">
            <ChevronLeft
                onClick={goPrev}
                className={`morphing-chevron ${activeIndex === 0 ? 'disabled' : ''}`}
            />

            <div className="morphing-dots-track">
                {Array.from({ length: total }).map((_, i) => {
                    const isActive = i === activeIndex;
                    return (
                        <motion.div
                            key={i}
                            className={`morphing-dot ${isActive ? 'active' : ''}`}
                            onClick={() => onChange && onChange(i, i > activeIndex ? 'right' : 'left')}
                            animate={{
                                width: isActive ? 28 : 10,
                                height: 10,
                                borderRadius: 9999,
                            }}
                            transition={{ type: "spring", stiffness: 300, damping: 24 }}
                        >
                            {isActive && (
                                <AnimatePresence>
                                    <motion.span
                                        key="ripple"
                                        className="morphing-dot-ripple"
                                        initial={{ scale: 0.8, opacity: 0.6 }}
                                        animate={{ scale: 1.6, opacity: 0 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.6 }}
                                    />
                                </AnimatePresence>
                            )}
                        </motion.div>
                    );
                })}
            </div>

            <ChevronRight
                onClick={goNext}
                className={`morphing-chevron ${activeIndex === total - 1 ? 'disabled' : ''}`}
            />
        </div>
    );
}
