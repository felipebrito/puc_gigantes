import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { io } from 'socket.io-client'
import TopBar from './components/TopBar'
import BottomBar from './components/BottomBar'
import Home from './views/Home'
import HomeDevonian from './views/HomeDevonian'
import SectionIntro from './views/SectionIntro'
import SilurianGlobe from './views/SilurianGlobe'
import SilurianSpecimen from './views/SilurianSpecimen'
import SilurianDoubleSpecimen from './views/SilurianDoubleSpecimen'
import ExtinctionContent from './views/ExtinctionContent'
import ExtinctionContentDevonian from './views/ExtinctionContentDevonian'
import SpecimenDetail from './views/SpecimenDetail'
import { slidesData, periodStartIndex } from './data/slides'
import EventHeader from './views/EventHeader'
import EventDetail from './views/EventDetail'
import DoubleSpecimenDetail from './views/DoubleSpecimenDetail'
import MorphingPageDots from './components/MorphingPageDots'
import './App.css'

function App() {
  const [slideIndex, setSlideIndex] = useState(0);
  const [slideDirection, setSlideDirection] = useState('up');

  const handleNavigate = useCallback((directionStr, targetAbsoluteIndex = null) => {
    setSlideDirection(directionStr);

    if (targetAbsoluteIndex !== null) {
      setSlideIndex(targetAbsoluteIndex);
      return;
    }

    setSlideIndex((prevIndex) => {
      const currentPeriod = slidesData[prevIndex].period;
      const currentSection = slidesData[prevIndex].section;
      const sectionSlides = slidesData
        .map((s, idx) => ({ ...s, absoluteIndex: idx }))
        .filter(s => s.section === currentSection && s.period === currentPeriod);

      const sectionIndex = sectionSlides.findIndex(s => s.absoluteIndex === prevIndex);
      let newIndex = prevIndex;

      if (directionStr === 'right') {
        if (sectionIndex < sectionSlides.length - 1) {
          newIndex = sectionSlides[sectionIndex + 1].absoluteIndex;
        } else {
          newIndex = sectionSlides[0].absoluteIndex;
        }
      } else if (directionStr === 'left') {
        if (sectionIndex > 0) {
          newIndex = sectionSlides[sectionIndex - 1].absoluteIndex;
        }
      } else if (directionStr === 'down') {
        newIndex = periodStartIndex[currentPeriod] ?? 0;
      }

      return newIndex;
    });
  }, []);

  // Socket IO — encoder
  useEffect(() => {
    const socket = io('https://localhost:3000', {
      secure: true,
      rejectUnauthorized: false
    });
    socket.on('encoder_action', (command) => {
      if (command === 'LEFT')  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
      if (command === 'RIGHT') window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
      if (command === 'CLICK') window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    });
    return () => socket.disconnect();
  }, []);

  // Teclas 1 e 2 — trocar período
  useEffect(() => {
    const handler = (e) => {
      if (e.key === '1') { setSlideDirection('left');  setSlideIndex(periodStartIndex.ordoviciano); }
      if (e.key === '2') { setSlideDirection('right'); setSlideIndex(periodStartIndex.devoniano); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const slideVariants = {
    initial: (dir) => {
      let x = 0, y = 0;
      if (dir === 'right') x = 1080;
      if (dir === 'left')  x = -1080;
      if (dir === 'down')  y = -1920;
      if (dir === 'up')    y = 1920;
      return { x, y, opacity: 0, position: 'absolute', width: '100%', height: '100%', zIndex: 5 };
    },
    animate: { x: 0, y: 0, opacity: 1, zIndex: 10, transition: { duration: 0.6, ease: [0.33, 1, 0.68, 1] } },
    exit: (dir) => {
      let x = 0, y = 0;
      if (dir === 'right') x = -1080;
      if (dir === 'left')  x = 1080;
      if (dir === 'down')  y = 1920;
      if (dir === 'up')    y = -1920;
      return { x, y, opacity: 0, zIndex: 0, transition: { duration: 0.6, ease: [0.33, 1, 0.68, 1] } };
    }
  };

  const currentSlide   = slidesData[slideIndex];
  const type           = currentSlide.type;
  const currentPeriod  = currentSlide.period;
  const currentSection = currentSlide.section;

  const sectionSlides = slidesData
    .map((s, idx) => ({ ...s, absoluteIndex: idx }))
    .filter(s => s.section === currentSection && s.period === currentPeriod);

  const sectionIndex = sectionSlides.findIndex(s => s.absoluteIndex === slideIndex);

  const scopedNavigate = (dir, targetSectionIndex = null) => {
    if (targetSectionIndex !== null) {
      handleNavigate(dir, sectionSlides[targetSectionIndex].absoluteIndex);
    } else {
      handleNavigate(dir);
    }
  };

  const absoluteNavigate = (dir, absoluteIdx) => handleNavigate(dir, absoluteIdx);

  return (
    <>
      <TopBar />
      <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
        <AnimatePresence custom={slideDirection} initial={false}>
          {(() => {
            let ComponentToRender = null;
            const key = `${type}-${slideIndex}`;

            if      (type === 'home')                       ComponentToRender = <Home onNavigate={handleNavigate} />;
            else if (type === 'home_devonian')              ComponentToRender = <HomeDevonian onNavigate={absoluteNavigate} />;
            else if (type === 'section_intro')              ComponentToRender = <SectionIntro slideData={currentSlide} onNavigate={scopedNavigate} />;
            else if (type === 'extinction_content')         ComponentToRender = <ExtinctionContent slideData={currentSlide} onNavigate={scopedNavigate} />;
            else if (type === 'extinction_content_devonian') ComponentToRender = <ExtinctionContentDevonian slideData={currentSlide} onNavigate={scopedNavigate} />;
            else if (type === 'single_species')             ComponentToRender = <SpecimenDetail slideIndex={sectionIndex} totalSlides={sectionSlides.length} onNavigate={scopedNavigate} slideData={currentSlide} />;
            else if (type === 'event_header')               ComponentToRender = <EventHeader slideIndex={sectionIndex} totalSlides={sectionSlides.length} onNavigate={scopedNavigate} slideData={currentSlide} />;
            else if (type === 'event_detail')               ComponentToRender = <EventDetail slideIndex={sectionIndex} totalSlides={sectionSlides.length} onNavigate={scopedNavigate} slideData={currentSlide} />;
            else if (type === 'silurian_globe')             ComponentToRender = <SilurianGlobe slideData={currentSlide} onNavigate={scopedNavigate} />;
            else if (type === 'silurian_specimen')          ComponentToRender = <SilurianSpecimen slideData={currentSlide} onNavigate={scopedNavigate} />;
            else if (type === 'silurian_double_specimen')   ComponentToRender = <SilurianDoubleSpecimen slideData={currentSlide} onNavigate={scopedNavigate} />;
            else if (type === 'double_species')             ComponentToRender = <DoubleSpecimenDetail slideIndex={sectionIndex} totalSlides={sectionSlides.length} onNavigate={scopedNavigate} slideData={currentSlide} />;

            return (
              <motion.div
                key={key}
                custom={slideDirection}
                variants={slideVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                {ComponentToRender}
              </motion.div>
            );
          })()}
        </AnimatePresence>

        {currentSection !== 'home' && (
          <div style={{ position: 'absolute', bottom: '100px', width: '100%', zIndex: 100 }}>
            <MorphingPageDots
              total={sectionSlides.length}
              activeIndex={sectionIndex}
              onChange={(index, direction) => scopedNavigate(direction, index)}
            />
          </div>
        )}

        {currentSection === 'home' && <BottomBar />}
      </div>
    </>
  );
}

export default App;
