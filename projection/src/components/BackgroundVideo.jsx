import { useVideoTexture } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';

export function BackgroundVideo({ url, opacity = 1.0 }) {
  const meshRef = useRef();
  const { viewport, camera } = useThree();
  
  // useVideoTexture handles the video element, autoplay, muted, etc.
  const texture = useVideoTexture(url, {
    unsuspend: 'canplay',
    muted: true,
    loop: true,
    start: true,
  });

  const targetZ = -45;
  // Calcula o tamanho exato da tela na profundidade Z desejada
  const vp = viewport.getCurrentViewport(camera, [0, 0, targetZ]);

  if (!url) return null;

  return (
    <mesh 
      ref={meshRef} 
      position={[0, 0, targetZ]} 
      scale={[vp.width, vp.height, 1]} // Escala dinâmica para bater nas bordas da tela
      renderOrder={-1}
      frustumCulled={false}
    >
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial 
        map={texture}
        transparent 
        opacity={opacity} 
        toneMapped={false}
        depthWrite={false}
      />
    </mesh>
  );
}
