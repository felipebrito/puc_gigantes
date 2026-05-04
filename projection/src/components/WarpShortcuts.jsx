import { useEffect, useRef } from 'react'

export function WarpShortcuts({ warp, onCommit, onMoveVertex, onYOffset, showStats, setShowStats }) {
  const callbacksRef = useRef({ warp, onCommit, onMoveVertex, onYOffset, showStats, setShowStats })
  useEffect(() => { callbacksRef.current = { warp, onCommit, onMoveVertex, onYOffset, showStats, setShowStats } })

  useEffect(() => {
    const getCornerIdx = (n, cols, rows) => {
      if (n === 1) return 0; // TL
      if (n === 2) return cols - 1; // TR
      if (n === 3) return (cols * rows) - 1; // BR
      if (n === 4) return cols * (rows - 1); // BL
      return null;
    };

    const onKeyDown = (e) => {
      const { warp, onMoveVertex, onCommit, onYOffset, setShowStats } = callbacksRef.current;
      if (!warp) return;
      const { state, setSelectedIdx, setEditing, setEnabled } = warp;

      const key = e.key.toLowerCase();

      // F - Fullscreen
      if (key === 'f') {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(err => console.error(err));
        } else {
          document.exitFullscreen();
        }
        return;
      }

      // S - Toggle FPS (Stats)
      if (key === 's') {
        setShowStats(prev => !prev);
        return;
      }

      // M - Toggle GUI (Sumir da tela)
      if (key === 'm') {
        const gui = window.__gui;
        if (gui) {
          const isHidden = gui.domElement.style.display === 'none';
          gui.domElement.style.display = isHidden ? 'block' : 'none';
        }
        return;
      }

      // Q / A — ajusta Y dos visitantes
      if (key === 'q' || key === 'a') {
        const step = e.shiftKey ? 0.2 : 0.05;
        const delta = key === 'q' ? step : -step;
        onYOffset?.(delta);
        return;
      }

      // C - Toggle Calibragem
      if (key === 'c') {
        if (!state.enabled) {
          setEnabled(true);
          setEditing(true);
        } else if (state.editing) {
          onCommit();
          setEditing(false);
          setEnabled(true);
        } else {
          setEditing(false);
          setEnabled(false);
        }
        return;
      }

      if (!state.editing) return;

      // 1-4 Selection
      if (['1', '2', '3', '4'].includes(e.key)) {
        const { state } = callbacksRef.current.warp;
        setSelectedIdx(getCornerIdx(parseInt(e.key), state.cols, state.rows));
        return;
      }

      // Arrows — mover vértice warp
      if (state.selectedIdx !== null) {
        let dx = 0, dy = 0;
        const step = e.shiftKey ? 10 : 1;
        if (e.key === 'ArrowLeft')  dx = -step;
        if (e.key === 'ArrowRight') dx = step;
        if (e.key === 'ArrowUp')    dy = -step;
        if (e.key === 'ArrowDown')  dy = step;

        if (dx !== 0 || dy !== 0) {
          e.preventDefault();
          onMoveVertex(state.selectedIdx, dx, dy);
          setSelectedIdx(state.selectedIdx);
        }
      }
    };

    const onKeyUp = (e) => {
      const { onYOffset } = callbacksRef.current;
      const key = e.key.toLowerCase();
      if (key === 'q' || key === 'a') {
        onYOffset?.(0, true);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  return null;
}
