import { useState, useRef, useCallback, useEffect } from 'react'

const WARP_KEY = 'gigantes_warp_v1'

export function makeDefaultOffsets(cols, rows) {
  return new Array(cols * rows * 2).fill(0)
}

function interpOffsets(src, srcCols, srcRows, dstCols, dstRows) {
  const dst = []
  for (let r = 0; r < dstRows; r++) {
    for (let c = 0; c < dstCols; c++) {
      const u = dstCols > 1 ? c / (dstCols - 1) : 0.5
      const v = dstRows > 1 ? r / (dstRows - 1) : 0.5
      const fc = u * (srcCols - 1)
      const fr = v * (srcRows - 1)
      const c0 = Math.max(0, Math.min(Math.floor(fc), srcCols - 2))
      const r0 = Math.max(0, Math.min(Math.floor(fr), srcRows - 2))
      const c1 = c0 + 1
      const r1 = r0 + 1
      const tc = fc - c0
      const tr = fr - r0
      const i00 = (r0 * srcCols + c0) * 2
      const i10 = (r0 * srcCols + c1) * 2
      const i01 = (r1 * srcCols + c0) * 2
      const i11 = (r1 * srcCols + c1) * 2
      const lerp = (a, b, t) => a + (b - a) * t
      dst.push(
        lerp(lerp(src[i00] ?? 0, src[i10] ?? 0, tc), lerp(src[i01] ?? 0, src[i11] ?? 0, tc), tr),
        lerp(lerp(src[i00 + 1] ?? 0, src[i10 + 1] ?? 0, tc), lerp(src[i01 + 1] ?? 0, src[i11 + 1] ?? 0, tc), tr),
      )
    }
  }
  return dst
}

function loadState() {
  try {
    const raw = localStorage.getItem(WARP_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      return { ...parsed, editing: false } // ensure editing is always false on load
    }
  } catch {}
  return { enabled: false, editing: false, cols: 4, rows: 4, offsets: makeDefaultOffsets(4, 4) }
}

function saveState(s) {
  try { localStorage.setItem(WARP_KEY, JSON.stringify(s)) } catch {}
}

export function useWarpState() {
  const [state, setState] = useState(loadState)

  const setEditing = useCallback((editing) => {
    setState(prev => ({ ...prev, editing, selectedIdx: (editing ? (prev.selectedIdx ?? 0) : null) }))
  }, [])

  const setSelectedIdx = useCallback((selectedIdx) => {
    setState(prev => ({ ...prev, selectedIdx }))
  }, [])

  // Live ref for animation loop (no re-render on drag)
  const offsetsRef = useRef([...state.offsets])

  useEffect(() => { offsetsRef.current = [...state.offsets] }, [state.offsets])

  const update = useCallback((fn) => {
    setState(prev => {
      const next = fn(prev)
      if (next.offsets !== prev.offsets) {
        offsetsRef.current = [...next.offsets]
      }
      saveState(next)
      return next
    })
  }, [])

  const setEnabled = useCallback((enabled) => {
    // Usa setState direto para NÃO resetar offsetsRef com os edits não commitados
    setState(prev => {
      const next = { ...prev, enabled }
      saveState(next)
      return next
    })
  }, [])

  const setGrid = useCallback((cols, rows) => {
    update(s => ({
      ...s, cols, rows,
      offsets: interpOffsets(s.offsets, s.cols, s.rows, cols, rows),
    }))
  }, [update])

  // Called on every pointermove or arrow key press — updates ref only, no re-render
  const moveVertexLive = useCallback((idx, dx, dy) => {
    if (idx === null || idx === undefined || idx < 0) return
    offsetsRef.current[idx * 2] = (offsetsRef.current[idx * 2] || 0) + dx
    offsetsRef.current[idx * 2 + 1] = (offsetsRef.current[idx * 2 + 1] || 0) + dy
  }, [])

  // Called on pointerup — commits ref to state & persists
  const commitOffsets = useCallback(() => {
    const offsets = [...offsetsRef.current]
    setState(prev => {
      const next = { ...prev, offsets }
      saveState(next)
      return next
    })
  }, [])

  const resetVertex = useCallback((idx) => {
    offsetsRef.current[idx * 2] = 0
    offsetsRef.current[idx * 2 + 1] = 0
    commitOffsets()
  }, [commitOffsets])

  const resetAll = useCallback(() => {
    update(s => {
      const offsets = makeDefaultOffsets(s.cols, s.rows)
      offsetsRef.current = offsets
      return { ...s, offsets }
    })
  }, [update])

  return { state, offsetsRef, setEnabled, setEditing, setSelectedIdx, setGrid, moveVertexLive, commitOffsets, resetVertex, resetAll }
}
