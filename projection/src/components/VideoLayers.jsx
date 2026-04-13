import { useVideoTexture } from '@react-three/drei';
import { useThree, useFrame } from '@react-three/fiber';
import { useRef, useEffect } from 'react';

const LUMA_VERT = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// mode 0 — luminância padrão (Rec.601)
// mode 1 — canal R apenas
// mode 2 — canal G apenas
// mode 3 — média RGB simples
// mode 4 — luminância invertida (matte negativo)
const LUMA_FRAG = `
  uniform sampler2D fgMap;
  uniform sampler2D lumaMap;
  uniform float opacity;
  uniform int lumaMode;
  varying vec2 vUv;
  void main() {
    vec4 fg = texture2D(fgMap, vUv);
    vec4 luma = texture2D(lumaMap, vUv);
    float alpha;
    if (lumaMode == 1)      alpha = luma.r;
    else if (lumaMode == 2) alpha = luma.g;
    else if (lumaMode == 3) alpha = (luma.r + luma.g + luma.b) / 3.0;
    else if (lumaMode == 4) alpha = 1.0 - dot(luma.rgb, vec3(0.299, 0.587, 0.114));
    else                    alpha = dot(luma.rgb, vec3(0.299, 0.587, 0.114));
    gl_FragColor = vec4(fg.rgb, alpha * opacity);
  }
`;

export function VideoLayers({ bgUrl, fgUrl, lumaUrl, opacity = 1.0, lumaMode = 0 }) {
  const { viewport, camera } = useThree();

  const bgTexture   = useVideoTexture(bgUrl,  { unsuspend: 'canplay', muted: true, loop: true, start: true });
  // FG e LUMA iniciam manualmente juntos
  const fgTexture   = useVideoTexture(fgUrl,  { unsuspend: 'canplay', muted: true, loop: true, start: false });
  const lumaTexture = useVideoTexture(lumaUrl, { unsuspend: 'canplay', muted: true, loop: true, start: false });

  const fgMatRef = useRef();
  const syncedRef = useRef(false);

  // Inicia FG e LUMA no mesmo tick — sem seek contínuo
  useEffect(() => {
    const fg   = fgTexture?.image;
    const luma = lumaTexture?.image;
    if (!fg || !luma || syncedRef.current) return;

    const tryStart = () => {
      if (fg.readyState < 3 || luma.readyState < 3) return; // aguarda ambos
      syncedRef.current = true;
      fg.currentTime   = 0;
      luma.currentTime = 0;
      // Play no mesmo microtask
      Promise.all([fg.play(), luma.play()]).catch(() => {});
    };

    // Ressincroniza no loop: quando FG reinicia, LUMA volta ao zero também
    const onFgLoop = () => { luma.currentTime = 0; };
    fg.addEventListener('loop', onFgLoop);

    // Tenta iniciar agora ou quando ambos estiverem prontos
    tryStart();
    fg.addEventListener('canplaythrough', tryStart);
    luma.addEventListener('canplaythrough', tryStart);

    return () => {
      fg.removeEventListener('canplaythrough', tryStart);
      luma.removeEventListener('canplaythrough', tryStart);
      fg.removeEventListener('loop', onFgLoop);
    };
  }, [fgTexture?.image, lumaTexture?.image]);

  // Atualiza uniforms — sem seek aqui
  useFrame(() => {
    if (fgMatRef.current) {
      fgMatRef.current.uniforms.fgMap.value    = fgTexture;
      fgMatRef.current.uniforms.lumaMap.value  = lumaTexture;
      fgMatRef.current.uniforms.opacity.value  = opacity;
      fgMatRef.current.uniforms.lumaMode.value = lumaMode;
    }
  });

  const targetZ = -45;
  const vp = viewport.getCurrentViewport(camera, [0, 0, targetZ]);

  return (
    <>
      {/* BG — independente */}
      <mesh
        position={[0, 0, targetZ]}
        scale={[vp.width, vp.height, 1]}
        renderOrder={-1}
        frustumCulled={false}
      >
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial
          map={bgTexture}
          transparent
          opacity={opacity}
          toneMapped={false}
          depthWrite={false}
        />
      </mesh>

      {/* FG + luma matte */}
      <mesh
        position={[0, 0, targetZ + 0.2]}
        scale={[vp.width, vp.height, 1]}
        renderOrder={10}
        frustumCulled={false}
      >
        <planeGeometry args={[1, 1]} />
        <shaderMaterial
          ref={fgMatRef}
          transparent
          depthWrite={false}
          depthTest={false}
          uniforms={{
            fgMap:    { value: fgTexture },
            lumaMap:  { value: lumaTexture },
            opacity:  { value: opacity },
            lumaMode: { value: lumaMode },
          }}
          vertexShader={LUMA_VERT}
          fragmentShader={LUMA_FRAG}
        />
      </mesh>
    </>
  );
}
