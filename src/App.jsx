import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import TopBar from './components/TopBar'
import BottomBar from './components/BottomBar'
import Home from './views/Home'
import BiodiversityIntro from './views/BiodiversityIntro'
import SpecimenDetail from './views/SpecimenDetail'
import './App.css'

function App() {
  const [currentView, setCurrentView] = useState('home')
  const [specimenIndex, setSpecimenIndex] = useState(0)
  const [slideDirection, setSlideDirection] = useState('up'); // 'up', 'down', 'left', 'right'

  const handleNavigate = (view, index = 0, direction = 'up') => {
    setSlideDirection(direction);
    setCurrentView(view);
    if (view === 'detail') {
      setSpecimenIndex(index)
    }
  }

  const slideVariants = {
    initial: (direction) => {
      let x = 0; let y = 0;
      if (direction === 'right') x = 1080;
      if (direction === 'left') x = -1080;
      if (direction === 'down') y = -1920;
      if (direction === 'up') y = 1920;

      return {
        x, y,
        opacity: 0,
        position: 'absolute',
        width: '100%',
        height: '100%',
        zIndex: 5
      };
    },
    animate: {
      x: 0, y: 0,
      opacity: 1,
      zIndex: 10,
      transition: { duration: 0.6, ease: [0.33, 1, 0.68, 1] } // smooth out/in bezier
    },
    exit: (direction) => {
      let x = 0; let y = 0;
      if (direction === 'right') x = -1080;
      if (direction === 'left') x = 1080;
      if (direction === 'down') y = 1920;
      if (direction === 'up') y = -1920;

      return {
        x, y,
        opacity: 0,
        zIndex: 0,
        transition: { duration: 0.6, ease: [0.33, 1, 0.68, 1] }
      };
    }
  };

  return (
    <>
      <TopBar />

      <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
        <AnimatePresence custom={slideDirection} initial={false}>
          {currentView === 'home' && (
            <motion.div
              key="home"
              custom={slideDirection}
              variants={slideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <Home onNavigate={handleNavigate} />
            </motion.div>
          )}

          {currentView === 'intro' && (
            <motion.div
              key="intro"
              custom={slideDirection}
              variants={slideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <BiodiversityIntro onNavigate={handleNavigate} />
            </motion.div>
          )}

          {currentView === 'detail' && (
            <motion.div
              key={`detail-${specimenIndex}`}
              custom={slideDirection}
              variants={slideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <SpecimenDetail
                specIndex={specimenIndex}
                onNavigate={handleNavigate}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <BottomBar />
    </>
  )
}

export default App
