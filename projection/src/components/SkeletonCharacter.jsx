import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

const SKIN      = '#C8956C';
const SKIN_DARK = '#9A6540';
// DoubleSide evita culling quando direction = -1 (scale.x negativo)
const DS = THREE.DoubleSide;

export function SkeletonCharacter({
    position    = [0, 0, 0],
    faceUrl,
    clothingUrl = '/textures/suit.png',
    speed       = 5,
    stride      = 0.4,
    bounce      = 0.08,
    scale       = 1,
    walkStyle   = 'normal',
    direction   = 1,
}) {
    const hipsRef = useRef();
    const legLRef = useRef();
    const legRRef = useRef();
    const armLRef = useRef();
    const armRRef = useRef();
    const headRef = useRef();

    const faceTexture = useTexture(faceUrl || '/models/face_test.png', (t) => {
        t.colorSpace = THREE.SRGBColorSpace;
    });
    const clothTexture = useTexture(clothingUrl, (t) => {
        t.colorSpace  = THREE.SRGBColorSpace;
        t.wrapS = t.wrapT = THREE.RepeatWrapping;
        t.repeat.set(1, 1);
    });

    useFrame((state) => {
        const t = state.clock.getElapsedTime();
        let freq = speed * 1.5;
        let b    = bounce;
        let s    = stride;
        if (walkStyle === 'fast') { freq *= 1.2; b *= 1.3; s *= 1.2; }
        if (walkStyle === 'long') { freq *= 0.8; s *= 1.5; }
        const cycle = t * freq;

        // Hips: posição base 0.92 → pés em local y≈0 (chão)
        if (hipsRef.current) {
            hipsRef.current.position.y = 0.92 + Math.abs(Math.sin(cycle * 2)) * b;
            hipsRef.current.rotation.x = 0.04 + Math.sin(cycle * 2) * 0.015;
            hipsRef.current.rotation.y = Math.sin(cycle) * 0.07;
            hipsRef.current.rotation.z = Math.cos(cycle) * 0.015;
        }
        if (legLRef.current) {
            legLRef.current.rotation.x  =  Math.sin(cycle) * s;
            legLRef.current.position.y  =  Math.max(0, Math.cos(cycle)) * 0.03;
        }
        if (legRRef.current) {
            legRRef.current.rotation.x  =  Math.sin(cycle + Math.PI) * s;
            legRRef.current.position.y  =  Math.max(0, Math.cos(cycle + Math.PI)) * 0.03;
        }
        if (armLRef.current) {
            armLRef.current.rotation.x  =  Math.sin(cycle + Math.PI) * (s * 0.65);
            armLRef.current.rotation.z  = -0.2 + Math.sin(cycle * 2) * 0.04;
        }
        if (armRRef.current) {
            armRRef.current.rotation.x  =  Math.sin(cycle) * (s * 0.65);
            armRRef.current.rotation.z  =  0.2 - Math.sin(cycle * 2) * 0.04;
        }
        if (headRef.current) {
            headRef.current.position.y  = 1.06 + Math.sin(cycle * 2 + 0.5) * 0.012;
            headRef.current.rotation.y  = -Math.sin(cycle) * 0.035;
        }
    });

    return (
        <group position={position} scale={[scale * direction, scale, 1]}>
          <group ref={hipsRef}>

            {/* ═══ CABEÇA ════════════════════════════════════════════════ */}
            <group ref={headRef}>
              {/* Foto do visitante — frente da cabeça */}
              <mesh position={[0, 0.09, 0.03]} renderOrder={3}>
                <planeGeometry args={[0.56, 0.56]} />
                <meshBasicMaterial
                  map={faceTexture}
                  transparent side={DS}
                  alphaTest={0.06}
                  depthWrite={false}
                />
              </mesh>
            </group>

            {/* ═══ BRAÇO ESQUERDO — atrás do corpo ═══════════════════════ */}
            <group ref={armLRef} position={[-0.24, 0.78, -0.03]}>
              <mesh position={[0, -0.33, 0]}>
                <planeGeometry args={[0.14, 0.68]} />
                <meshStandardMaterial color={SKIN} side={DS} roughness={0.85} />
              </mesh>
            </group>

            {/* ═══ BRAÇO DIREITO — atrás do corpo ════════════════════════ */}
            <group ref={armRRef} position={[0.24, 0.78, -0.03]}>
              <mesh position={[0, -0.33, 0]}>
                <planeGeometry args={[0.14, 0.68]} />
                <meshStandardMaterial color={SKIN} side={DS} roughness={0.85} />
              </mesh>
            </group>

            {/* ═══ BODY HULL — plano único de pele, sem buracos ══════════
                Cobre ombros (y≈1.04) até inicio das pernas (y≈−0.14)
                Elimina todos os gaps entre pescoço, tronco e shorts      */}
            <mesh position={[0, 0.46, -0.01]} renderOrder={1}>
              <planeGeometry args={[0.46, 1.22]} />
              <meshStandardMaterial color={SKIN} side={DS} roughness={0.85} />
            </mesh>

            {/* ═══ CAMISA / SHIRT — sobre o hull ═════════════════════════ */}
            <mesh position={[0, 0.64, 0]} renderOrder={2}>
              <planeGeometry args={[0.50, 0.78]} />
              <meshStandardMaterial
                map={clothTexture}
                side={DS} transparent alphaTest={0.01} roughness={0.9}
              />
            </mesh>

            {/* ═══ SHORTS — sobre o hull, abaixo da camisa ═══════════════ */}
            <mesh position={[0, 0.14, 0.001]} renderOrder={2}>
              <planeGeometry args={[0.50, 0.32]} />
              <meshStandardMaterial
                map={clothTexture}
                side={DS} transparent alphaTest={0.01} roughness={0.95}
              />
            </mesh>

            {/* ═══ PERNA ESQUERDA — pivô no quadril ══════════════════════ */}
            <group ref={legLRef} position={[-0.11, -0.04, 0.02]}>
              {/* Canela / lower leg (pele exposta abaixo dos shorts) */}
              <mesh position={[0, -0.44, 0]}>
                <planeGeometry args={[0.18, 0.72]} />
                <meshStandardMaterial color={SKIN} side={DS} roughness={0.8} />
              </mesh>
              {/* Pé */}
              <mesh position={[0.04, -0.84, 0]}>
                <planeGeometry args={[0.22, 0.09]} />
                <meshStandardMaterial color={SKIN_DARK} side={DS} roughness={0.9} />
              </mesh>
            </group>

            {/* ═══ PERNA DIREITA ══════════════════════════════════════════ */}
            <group ref={legRRef} position={[0.11, -0.04, 0.02]}>
              <mesh position={[0, -0.44, 0]}>
                <planeGeometry args={[0.18, 0.72]} />
                <meshStandardMaterial color={SKIN} side={DS} roughness={0.8} />
              </mesh>
              <mesh position={[0.04, -0.84, 0]}>
                <planeGeometry args={[0.22, 0.09]} />
                <meshStandardMaterial color={SKIN_DARK} side={DS} roughness={0.9} />
              </mesh>
            </group>

          </group>
        </group>
    );
}
