import { useEffect, useRef } from 'react'

// ---- Shaders ----
const VS = `
attribute vec2 a_pos;
attribute vec2 a_uv;
varying vec2 v_uv;
void main() {
  gl_Position = vec4(a_pos, 0.0, 1.0);
  v_uv = a_uv;
}`

const FS = `
precision mediump float;
uniform sampler2D u_tex;
varying vec2 v_uv;
void main() {
  gl_FragColor = texture2D(u_tex, v_uv);
}`

function compileShader(gl, type, src) {
  const sh = gl.createShader(type)
  gl.shaderSource(sh, src)
  gl.compileShader(sh)
  return sh
}

function buildMesh(cols, rows, subdiv, offsets, W, H) {
  const pos = []
  const uvs = []
  
  const lerp = (a, b, t) => a + (b - a) * t;

  for (let r = 0; r < rows - 1; r++) {
    for (let c = 0; c < cols - 1; c++) {
      // Control points for this cell
      const i00 = (r * cols + c) * 2;
      const i10 = (r * cols + (c + 1)) * 2;
      const i01 = ((r + 1) * cols + c) * 2;
      const i11 = ((r + 1) * cols + (c + 1)) * 2;

      const o00 = [offsets[i00] || 0, offsets[i00 + 1] || 0];
      const o10 = [offsets[i10] || 0, offsets[i10 + 1] || 0];
      const o01 = [offsets[i01] || 0, offsets[i01 + 1] || 0];
      const i_11 = [offsets[i11] || 0, offsets[i11 + 1] || 0];

      for (let sy = 0; sy < subdiv; sy++) {
        for (let sx = 0; sx < subdiv; sx++) {
          const vtx = (sc, sr) => {
            // Cell-relative 0..1
            const uLocal = sc / subdiv;
            const vLocal = sr / subdiv;

            // Global U, V
            const u = (c + uLocal) / (cols - 1);
            const v = (r + vLocal) / (rows - 1);

            // Bilinear interpolation of offsets
            const ox = lerp(lerp(o00[0], o10[0], uLocal), lerp(o01[0], i_11[0], uLocal), vLocal);
            const oy = lerp(lerp(o00[1], o10[1], uLocal), lerp(o01[1], i_11[1], uLocal), vLocal);

            const nx = u * 2 - 1;
            const ny = 1 - v * 2;
            const finalOx = (ox / W) * 2;
            const finalOy = -(oy / H) * 2;

            return [nx + finalOx, ny + finalOy, u, 1 - v];
          };

          const p0 = vtx(sx, sy);
          const p1 = vtx(sx + 1, sy);
          const p2 = vtx(sx, sy + 1);
          const p3 = vtx(sx + 1, sy + 1);

          // Triangle 1
          pos.push(p0[0], p0[1], p1[0], p1[1], p2[0], p2[1]);
          uvs.push(p0[2], p0[3], p1[2], p1[3], p2[2], p2[3]);
          // Triangle 2
          pos.push(p1[0], p1[1], p3[0], p3[1], p2[0], p2[1]);
          uvs.push(p1[2], p1[3], p3[2], p3[3], p2[2], p2[3]);
        }
      }
    }
  }
  return { pos: new Float32Array(pos), uvs: new Float32Array(uvs), count: pos.length / 2 };
}

export function WarpCanvas({ sourceCanvasRef, cols, rows, subdiv, offsetsRef, visible }) {
  const canvasRef = useRef()
  // Keep a live props ref so the animation loop always reads current values
  const propsRef = useRef({ cols, rows, subdiv, offsetsRef, visible })
  useEffect(() => { propsRef.current = { cols, rows, subdiv, offsetsRef, visible } })

  useEffect(() => {
    const canvas = canvasRef.current
    const gl = canvas.getContext('webgl', { alpha: false })
    if (!gl) return

    const vs = compileShader(gl, gl.VERTEX_SHADER, VS)
    const fs = compileShader(gl, gl.FRAGMENT_SHADER, FS)
    const prog = gl.createProgram()
    gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog)
    gl.useProgram(prog)
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)

    const posLoc = gl.getAttribLocation(prog, 'a_pos')
    const uvLoc  = gl.getAttribLocation(prog, 'a_uv')
    const texLoc = gl.getUniformLocation(prog, 'u_tex')

    const posBuf = gl.createBuffer()
    const uvBuf  = gl.createBuffer()

    const tex = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, tex)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

    let raf
    const frame = () => {
      raf = requestAnimationFrame(frame)
      const { cols, rows, subdiv, offsetsRef, visible } = propsRef.current
      const src = sourceCanvasRef.current
      if (!src || !visible) return

      const W = canvas.width
      const H = canvas.height
      gl.viewport(0, 0, W, H)

      // Upload source canvas as texture
      gl.bindTexture(gl.TEXTURE_2D, tex)
      try { gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src) }
      catch { return }

      // Build mesh from live offsets ref
      const { pos, uvs, count } = buildMesh(cols, rows, subdiv, offsetsRef.current, W, H)

      gl.bindBuffer(gl.ARRAY_BUFFER, posBuf)
      gl.bufferData(gl.ARRAY_BUFFER, pos, gl.DYNAMIC_DRAW)
      gl.enableVertexAttribArray(posLoc)
      gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0)

      gl.bindBuffer(gl.ARRAY_BUFFER, uvBuf)
      gl.bufferData(gl.ARRAY_BUFFER, uvs, gl.STATIC_DRAW)
      gl.enableVertexAttribArray(uvLoc)
      gl.vertexAttribPointer(uvLoc, 2, gl.FLOAT, false, 0, 0)

      gl.uniform1i(texLoc, 0)
      gl.clearColor(0, 0, 0, 1)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.drawArrays(gl.TRIANGLES, 0, count)
    }
    frame()

    return () => {
      cancelAnimationFrame(raf)
      gl.deleteBuffer(posBuf); gl.deleteBuffer(uvBuf)
      gl.deleteTexture(tex); gl.deleteProgram(prog)
    }
  }, [sourceCanvasRef]) // init once

  // Resize canvas when window resizes
  useEffect(() => {
    const resize = () => {
      if (!canvasRef.current) return
      canvasRef.current.width  = window.innerWidth
      canvasRef.current.height = window.innerHeight
    }
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])

  return (
    <canvas
      ref={canvasRef}
      width={window.innerWidth}
      height={window.innerHeight}
      style={{
        position: 'absolute', top: 0, left: 0,
        width: '100%', height: '100%',
        pointerEvents: 'none',
        display: visible ? 'block' : 'none',
      }}
    />
  )
}
