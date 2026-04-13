import { useVideoTexture } from '@react-three/drei';
import { useThree } from '@react-three/fiber';

export function VideoLayers({ bgUrl, fgUrl, opacity = 1.0 }) {
  const { viewport, camera } = useThree();

  const bgTexture = useVideoTexture(bgUrl, { unsuspend: 'canplay', muted: true, loop: true, start: true });
  const fgTexture = useVideoTexture(fgUrl, { unsuspend: 'canplay', muted: true, loop: true, start: true });

  const targetZ = -45;
  const vp = viewport.getCurrentViewport(camera, [0, 0, targetZ]);

  return (
    <>
      {/* BG — independente */}
      <mesh position={[0, 0, targetZ]} scale={[vp.width, vp.height, 1]} renderOrder={-1} frustumCulled={false}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial map={bgTexture} transparent opacity={opacity} toneMapped={false} depthWrite={false} />
      </mesh>

      {/* FG com alpha nativo do WebM VP9 */}
      <mesh position={[0, 0, targetZ + 0.2]} scale={[vp.width, vp.height, 1]} renderOrder={10} frustumCulled={false}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial map={fgTexture} transparent opacity={opacity} toneMapped={false} depthWrite={false} depthTest={false} />
      </mesh>
    </>
  );
}
