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

const LUMA_FRAG = `
  uniform sampler2D fgMap;
  uniform sampler2D lumaMap;
  uniform float opacity;
  varying vec2 vUv;
  void main() {
    vec4 fg = texture2D(fgMap, vUv);
    vec4 luma = texture2D(lumaMap, vUv);
    float alpha = dot(luma.rgb, vec3(0.299, 0.587, 0.114));
    gl_FragColor = vec4(fg.rgb, alpha * opacity);
  }
`;

// Sincroniza video B com video A (referência)
function useSyncedVideo(refVideo, targetTexture) {
  useFrame(() => {
    if (!refVideo || !targetTexture?.image) return;
    const ref = refVideo;
    const target = targetTexture.image;
    if (!ref.duration || !target.duration) return;
    const diff = Math.abs(ref.currentTime - target.currentTime);
    if (diff > 0.1) target.currentTime = ref.currentTime;
  });
}

export function VideoLayers({ bgUrl, fgUrl, lumaUrl, opacity = 1.0 }) {
  const { viewport, camera } = useThree();

  const bgTexture  = useVideoTexture(bgUrl,   { unsuspend: 'canplay', muted: true, loop: true, start: true });
  const fgTexture  = useVideoTexture(fgUrl,   { unsuspend: 'canplay', muted: true, loop: true, start: false });
  const lumaTexture = useVideoTexture(lumaUrl, { unsuspend: 'canplay', muted: true, loop: true, start: false });

  const fgMatRef = useRef();

  // Inicia FG e LUMA em sincronia com BG assim que BG estiver pronto
  useEffect(() => {
    const bgVideo = bgTexture?.image;
    const fgVideo = fgTexture?.image;
    const lumaVideo = lumaTexture?.image;
    if (!bgVideo || !fgVideo || !lumaVideo) return;

    const startSync = () => {
      fgVideo.currentTime = bgVideo.currentTime;
      lumaVideo.currentTime = bgVideo.currentTime;
      fgVideo.play().catch(() => {});
      lumaVideo.play().catch(() => {});
    };

    if (!bgVideo.paused) {
      startSync();
    } else {
      bgVideo.addEventListener('play', startSync, { once: true });
      return () => bgVideo.removeEventListener('play', startSync);
    }
  }, [bgTexture, fgTexture, lumaTexture]);

  // Re-sincroniza a cada loop do BG
  useEffect(() => {
    const bgVideo = bgTexture?.image;
    const fgVideo = fgTexture?.image;
    const lumaVideo = lumaTexture?.image;
    if (!bgVideo || !fgVideo || !lumaVideo) return;
    const onLoop = () => {
      fgVideo.currentTime = 0;
      lumaVideo.currentTime = 0;
    };
    bgVideo.addEventListener('seeked', onLoop);
    return () => bgVideo.removeEventListener('seeked', onLoop);
  }, [bgTexture, fgTexture, lumaTexture]);

  // Atualiza uniforms do shader a cada frame
  useFrame(() => {
    if (fgMatRef.current) {
      fgMatRef.current.uniforms.fgMap.value = fgTexture;
      fgMatRef.current.uniforms.lumaMap.value = lumaTexture;
      fgMatRef.current.uniforms.opacity.value = opacity;
    }
  });

  const targetZ = -45;
  const vp = viewport.getCurrentViewport(camera, [0, 0, targetZ]);

  return (
    <>
      {/* BG layer */}
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

      {/* FG layer com luma matte */}
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
            fgMap:   { value: fgTexture },
            lumaMap: { value: lumaTexture },
            opacity: { value: opacity },
          }}
          vertexShader={LUMA_VERT}
          fragmentShader={LUMA_FRAG}
        />
      </mesh>
    </>
  );
}
