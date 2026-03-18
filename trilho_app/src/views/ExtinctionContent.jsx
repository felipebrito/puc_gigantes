import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import Typewriter from '../components/Typewriter';
import './ExtinctionContent.css';

const ExtinctionContent = ({ onNavigate, slideData }) => {
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
        hidden: { opacity: 0, scale: 0.95, y: 20 },
        visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.8, ease: 'easeOut' } }
    };

    const blurVariants = {
        hidden: { opacity: 0, filter: 'blur(20px)', WebkitFilter: 'blur(20px)', y: 20 },
        visible: { opacity: 1, filter: 'blur(0px)', WebkitFilter: 'blur(0px)', y: 0, transition: { duration: 1.4, ease: 'easeOut' } }
    };

    return (
        <div className="view-extinction-content animate-fade-in" style={{ width: '1080px', height: '1920px', position: 'relative', overflow: 'hidden', backgroundColor: '#ffffff' }}>
            <div id="LBp0D41Ffcn01kT5" style={{ position: 'absolute', width: '1080px', height: '123.81px', transform: 'translate(0px, 0px)' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, transformOrigin: '0px 0px', height: '123.81px', width: '1080px', transform: 'scale(1)' }}>
                    <div style={{ width: '1080px', height: '123.81px', marginLeft: 0, marginTop: 0 }}>
                        <svg style={{ position: 'absolute', width: 0, height: 0 }}>
                            <defs>
                                <clipPath id="__id3500">
                                    <path d="M0,0L2233.092515174864,0L2233.092515174864,256L0,256Z" />
                                </clipPath>
                            </defs>
                        </svg>
                        <div style={{ clipPath: 'url(#__id3500)', background: 'rgb(0, 95, 255)', width: '2233.09px', height: '256px', transform: 'scale(0.483634, 0.483634)', transformOrigin: '0 0' }}></div>
                    </div>
                </div>
            </div>

            <div id="LBqwsj88n4lFbpjM" style={{ position: 'absolute', width: '354.456px', height: '47.8681px', transform: 'translate(362.772px, 39.4381px)' }}>
                <div style={{ width: '354.456px', height: '49.4589px', transform: 'translate(0px, -0.309293px) rotate(0deg)' }}>
                    <img src="/assets/extincao_title.png" alt="Extinção Title" onError={(e) => { e.target.onerror = null; e.target.src = "https://media.canva.com/v2/image-resize/format:PNG/height:72/quality:100/uri:ifs%3A%2F%2FM%2Ff9c64eae-d753-40ea-ab83-44c614c9f1be/watermark:F/width:516"; }} style={{ width: '100%', height: '100%' }} />
                </div>
            </div>

            <div id="LBvmHtnvrPdyDXnW" style={{ position: 'absolute', width: '350.84px', height: '89.6831px', transform: 'translate(621.16px, 1723.87px)' }}>
                <img src="/assets/puc_minas.png" alt="PUC Minas Logo" onError={(e) => { e.target.onerror = null; e.target.src = "https://media.canva.com/v2/image-resize/format:PNG/height:125/quality:100/uri:ifs%3A%2F%2FM%2F9e9a11e5-ddff-48f7-8310-38478dac5927/watermark:F/width:489"; }} style={{ width: '100%', height: '100%' }} />
            </div>

            <div id="LBFDxrczDNrfHkCN" style={{ position: 'absolute', width: '344.755px', height: '88.1275px', transform: 'translate(108px, 1723.87px)' }}>
                <img src="/assets/museu.png" alt="Museu Logo" onError={(e) => { e.target.onerror = null; e.target.src = "https://media.canva.com/v2/image-resize/format:PNG/height:125/quality:100/uri:ifs%3A%2F%2FM%2F60c1fc46-c287-45e5-b695-4bc3016f100e/watermark:F/width:489"; }} style={{ width: '100%', height: '100%' }} />
            </div>

            {/* MAP IMAGE */}
            <div id="LBXC0rkHyhY3lqwL" style={{ position: 'absolute', width: '975.743px', height: '487.871px', transform: 'translate(52.1286px, 628.147px)' }}>
                <motion.img variants={blurVariants} initial="hidden" animate="visible" src={slideData.imageSrc} alt="Mapa Ordoviciano" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>

            {/* TEXT #1 (Top Text) */}
            <div id="LB3XzL9R447P6PXB" style={{ position: 'absolute', width: '864px', height: '420.387px', transform: 'translate(108px, 180.706px)' }}>
                <p style={{ margin: 0, fontFamily: 'YAFdJjTk5UU_0, "Canva Sans Regular", sans-serif', fontSize: '37.3337px', color: 'rgb(11, 14, 33)', lineHeight: '47px', letterSpacing: '0em', textTransform: 'none', listStyleType: 'none', fontWeight: 400, fontStyle: 'normal' }}>
                    {slideData.topText?.split('\n').map((line, i) => (
                        <React.Fragment key={i}>
                            {line}<br />
                        </React.Fragment>
                    ))}
                </p>
            </div>

            {/* TEXT #2 (Map Caption) */}
            <div id="LBMH9sqBBLCb1cNr" style={{ position: 'absolute', width: '919.871px', height: '105.335px', transform: 'translate(108px, 1143.02px)' }}>
                <motion.p variants={blurVariants} initial="hidden" animate="visible">
                    <span style={{ fontSize: '1.7em', fontWeight: 500, fontStyle: 'normal', color: 'rgb(11, 14, 33)', fontKerning: 'normal', textDecorationLine: 'none', textDecorationThickness: 'initial', textDecorationStyle: 'initial' }}>
                        {slideData.imageCaption}
                    </span>
                </motion.p>
            </div>

            {/* STROKE LINE */}
            <div id="LBspcmTbDbm76KP5" style={{ position: 'absolute', width: '890.54px', height: '4px', transform: 'translate(108px, 1246.35px)' }}>
                <svg style={{ width: '890.54px', height: '4px' }}>
                    <path d="M0,2L890.5400397663743,2" stroke="rgb(0, 95, 255)" strokeWidth="4" fill="none" />
                </svg>
            </div>

            {/* TEXT #3 (Bottom Text) */}
            <div id="LBtqWFL1MbBdj6DY" style={{ position: 'absolute', width: '898.552px', height: '326.387px', transform: 'translate(108px, 1307.35px)' }}>
                <p style={{ margin: 0, fontFamily: 'YAFdJjTk5UU_0, "Canva Sans Regular", sans-serif', fontSize: '37.3337px', color: 'rgb(11, 14, 33)', lineHeight: '47px', letterSpacing: '0em' }}>
                    {slideData.bottomText?.split('\n').map((line, i) => {
                        const parts = line.split(/(85% de todas as espécies)/g);
                        return (
                            <React.Fragment key={i}>
                                {parts.map((part, j) => (
                                    part === '85% de todas as espécies' ? (
                                        <span key={j} style={{ fontFamily: 'Inter, sans-serif', color: 'rgb(0, 95, 255)', fontWeight: 'bold', WebkitTextStroke: '1px rgb(0, 95, 255)' }}>
                                            {part}
                                        </span>
                                    ) : part
                                ))}
                                <br />
                            </React.Fragment>
                        );
                    })}
                </p>
            </div>
        </div>
    );
};

export default ExtinctionContent;
