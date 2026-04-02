import { useEffect, useRef } from 'react'

export function WarpShortcuts({ warp, onCommit, onMoveVertex }) {
  const callbacksRef = useRef({ warp, onCommit, onMoveVertex })
  useEffect(() => { callbacksRef.current = { warp, onCommit, onMoveVertex } })

  useEffect(() => {
    const getCornerIdx = (n, cols, rows) => {
      if (n === 1) return 0; // TL
      if (n === 2) return cols - 1; // TR
      if (n === 3) return (cols * rows) - 1; // BR
      if (n === 4) return cols * (rows - 1); // BL
      return null;
    };

    const onKeyDown = (e) => {
      const { warp, onMoveVertex, onCommit } = callbacksRef.current;
      if (!warp) return;
      const { state, setSelectedIdx, setEditing, setEnabled } = warp;
      
      const key = e.key.toLowerCase();

      // C - Toggle Calibragem
      if (key === 'c') {
        const target = !state.editing;
        setEnabled(true);
        setEditing(target);
        return;
      }

      if (!state.editing) return;

      // 1-4 Selection
      if (['1', '2', '3', '4'].includes(e.key)) {
        const { state } = callbacksRef.current.warp;
        setSelectedIdx(getCornerIdx(parseInt(e.key), state.cols, state.rows));
        return;
      }

      // S - Save
      if (key === 's') {
        onCommit();
        alert('Calibração salva!');
        return;
      }

      // Arrows
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
          // Note: App will re-render via state updates if needed, 
          // but moveVertexLive only updates the ref.
          // We need a way to trigger a re-render for the overlay lines.
          // Since this is in Shortcuts, we'll need to pass setTick or similar 
          // if we want immediate visual feedback on the SVG lines.
          // Or just use setSelectedIdx(state.selectedIdx) to force a component update.
          setSelectedIdx(state.selectedIdx); 
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return null;
}
