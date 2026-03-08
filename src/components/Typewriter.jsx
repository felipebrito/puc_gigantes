import React, { useState, useEffect } from 'react';

const Typewriter = ({ text, delay = 30, initialDelay = 0, className = '' }) => {
    const [displayedText, setDisplayedText] = useState('');

    useEffect(() => {
        setDisplayedText(''); // Reset on text change
        let timer;

        const startTimeout = setTimeout(() => {
            let i = 0;
            timer = setInterval(() => {
                // To avoid stale closures we capture the current value of i
                if (i < text.length) {
                    setDisplayedText(text.substring(0, i + 1));
                    i++;
                } else {
                    clearInterval(timer);
                }
            }, delay);
        }, initialDelay);

        return () => {
            clearTimeout(startTimeout);
            if (timer) clearInterval(timer);
        };
    }, [text, delay, initialDelay]);

    return <span className={className}>{displayedText}</span>;
}

export default Typewriter;
