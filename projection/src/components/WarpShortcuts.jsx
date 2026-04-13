import { useEffect, useRef } from 'react'

export function WarpShortcuts({ warp, onCommit, onMoveVertex, onYOffset }) {
  const callbacksRef = useRef({ warp, onCommit, onMoveVertex, onYOffset })
  useEffect(() => { callbacksRef.current = { warp, onCommit, onMoveVertex, onYOffset } })

  useEffect(() => {
    const getCornerIdx = (n, cols, rows) => {
      if (n === 1) return 0; // TL
      if (n === 2) return cols - 1; // TR
      if (n === 3) return (cols * rows) - 1; // BR
      if (n === 4) return cols * (rows - 1); // BL
      return null;
    };

    const onKeyDown = (e) => {
      const { warp, onMoveVertex, onCommit, onYOffset } = callbacksRef.current;
      if (!warp) return;
      const { state, setSelectedIdx, setEditing, setEnabled } = warp;

      const key = e.key.toLowerCase();

      // C - Toggle Calibragem: entra em (enabled+editing), sai em (disabled+not-editing)
      if (key === 'c') {
        if (!state.editing) {
          setEnabled(true);
          setEditing(true);
        } else {
          setEditing(false);
          setEnabled(false);
        }
        return;
      }

      // M - Toggle GUI
      if (key === 'm') {
        const gui = window.__gui;
        if (gui) {
          gui._closed ? gui.open() : gui.close();
        }
        return;
      }

      // A / S — ajusta Y dos visitantes
      if (key === 'a' || key === 's') {
        const step = e.shiftKey ? 0.2 : 0.05;
        const delta = key === 'a' ? step : -step;
        onYOffset?.(delta);
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
      // Ao soltar ↑ ou ↓ fora do warp editing, salva
      if (e.key === 'a' || e.key === 's') {
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
