import { useRef, useEffect, useState } from 'react'

const CORNER_COLOR = '#ff4444'
const EDGE_COLOR   = '#ff9900'
const INNER_COLOR  = '#ffffff'
const SELECT_COLOR = '#00ffff'

function getColor(c, r, cols, rows) {
  const corner = (c === 0 || c === cols - 1) && (r === 0 || r === rows - 1)
  const edge   = c === 0 || c === cols - 1 || r === 0 || r === rows - 1
  return corner ? CORNER_COLOR : edge ? EDGE_COLOR : INNER_COLOR
}

export function WarpOverlay({ cols, rows, offsetsRef, warp, onMoveVertex, onResetVertex, onCommit }) {
  // Tick to force re-render while dragging
  const [tick, setTick]  = useState(0)
  const dragRef           = useRef(null)
  const callbacksRef      = useRef({ onMoveVertex, onResetVertex, onCommit, warp })

  // Corner indices utility
  const getCornerIdx = (n) => {
    if (n === 1) return 0; // TL
    if (n === 2) return cols - 1; // TR
    if (n === 3) return (cols * rows) - 1; // BR
    if (n === 4) return cols * (rows - 1); // BL
    return null;
  };
  useEffect(() => { callbacksRef.current = { onMoveVertex, onResetVertex, onCommit, warp } })

  const W = window.innerWidth
  const H = window.innerHeight

  function getPos(c, r) {
    const idx = r * cols + c
    const baseX = cols > 1 ? (c / (cols - 1)) * W : W / 2
    const baseY = rows > 1 ? (r / (rows - 1)) * H : H / 2
    return {
      x: baseX + (offsetsRef.current[idx * 2]     || 0),
      y: baseY + (offsetsRef.current[idx * 2 + 1] || 0),
      idx,
    }
  }

  const handlePointerDown = (e, idx) => {
    e.preventDefault()
    dragRef.current = { idx, lastX: e.clientX, lastY: e.clientY }

    const onMove = (ev) => {
      if (!dragRef.current) return
      const dx = ev.clientX - dragRef.current.lastX
      const dy = ev.clientY - dragRef.current.lastY
      dragRef.current.lastX = ev.clientX
      dragRef.current.lastY = ev.clientY
      callbacksRef.current.onMoveVertex(dragRef.current.idx, dx, dy)
      setTick(t => t + 1) // repaint overlay
    }

    const onUp = () => {
      dragRef.current = null
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup',  onUp)
      callbacksRef.current.onCommit?.()
      setTick(t => t + 1)
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerup',  onUp)
  }

  // Build grid lines
  const lines = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols - 1; c++) {
      const a = getPos(c, r); const b = getPos(c + 1, r)
      lines.push(<line key={`h${r}-${c}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y}
        stroke="rgba(255,255,255,0.35)" strokeWidth={1} />)
    }
  }
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows - 1; r++) {
      const a = getPos(c, r); const b = getPos(c, r + 1)
      lines.push(<line key={`v${c}-${r}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y}
        stroke="rgba(255,255,255,0.35)" strokeWidth={1} />)
    }
  }

  // Build handles
  const handles = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const { x, y, idx } = getPos(c, r)
      const color = getColor(c, r, cols, rows)
      const isSelected = warp.state.selectedIdx === idx;
      handles.push(
        <g key={`n${idx}`}>
          {/* Selection Highlight */}
          {isSelected && (
             <circle cx={x} cy={y} r={18} fill="none" stroke={SELECT_COLOR} strokeWidth={2} strokeDasharray="4 2">
                <animateTransform attributeName="transform" type="rotate" from={`0 ${x} ${y}`} to={`360 ${x} ${y}`} dur="3s" repeatCount="indefinite" />
             </circle>
          )}
          {/* Outer ring */}
          <circle cx={x} cy={y} r={12} fill="rgba(0,0,0,0.4)" stroke={isSelected ? SELECT_COLOR : color} strokeWidth={isSelected ? 3 : 1.5} />
          {/* Inner dot */}
          <circle cx={x} cy={y} r={5}  fill={color} fillOpacity={0.9}
            style={{ cursor: 'grab', touchAction: 'none' }}
            onPointerDown={(e) => {
        callbacksRef.current.warp.setSelectedIdx(idx);
        handlePointerDown(e, idx);
      }}
            onDoubleClick={() => callbacksRef.current.onResetVertex(idx)}
          />
        </g>
      )
    }
  }

  return (
    <svg
      style={{
        position: 'absolute', top: 0, left: 0,
        width: '100%', height: '100%',
        pointerEvents: 'none',
        userSelect: 'none',
      }}
    >
      {/* Grid lines */}
      <g>{lines}</g>

      {/* Handles (pointer-events only on these) */}
      <g style={{ pointerEvents: 'all' }}>{handles}</g>

      {/* HUD banner */}
      <rect x={10} y={10} width={500} height={60} rx={8} fill="rgba(0,0,0,0.8)" stroke="rgba(255,255,255,0.2)" />
      <text x={25} y={32} fontFamily="monospace" fontSize={14} fontWeight="bold" fill="#00ffff">
        [C] MODO CALIBRAÇÃO {warp.state.editing ? "ATIVO" : "DESATIVADO"}
      </text>
      <text x={25} y={54} fontFamily="system-ui" fontSize={12} fill="#aaa">
        [1-4] Selecionar cantos | [Setas] Mover ponto | [S] Salvar
      </text>
    </svg>
  )
}
