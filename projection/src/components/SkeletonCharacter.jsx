import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

// Skin tone palette — warm medium
const SKIN      = '#C8956C';
const SKIN_DARK = '#A0724A'; // slightly darker for depth contrast

export function SkeletonCharacter({
    position   = [0, 0, 0],
    faceUrl,
    clothingUrl = '/textures/suit.png',
    speed       = 5,
    stride      = 0.4,
    bounce      = 0.08,
    scale       = 1,
    walkStyle   = 'normal',
    direction   = 1,   // 1 = right, -1 = left (mirrors character)
}) {
    const hipsRef = useRef();
    const legLRef = useRef();
    const legRRef = useRef();
    const armLRef = useRef();
    const armRRef = useRef();
    const headRef = useRef();

    const faceTexture = useTexture(faceUrl || '/models/face_test.png', (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
    });

    // One shared clothing texture — used for torso + shorts + thighs
    const clothTexture = useTexture(clothingUrl, (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        // Slight repeat so fabric looks like fabric, not a scaled logo
        tex.repeat.set(1.2, 1.2);
    });

    useFrame((state) => {
        const t = state.clock.getElapsedTime();

        let freq = speed * 1.5;
        let b    = bounce;
        let s    = stride;

        if (walkStyle === 'fast') { freq *= 1.2; b *= 1.3; s *= 1.2; }
        if (walkStyle === 'long') { freq *= 0.8; s *= 1.5; }

        const cycle = t * freq;

        // ── Hips: bounce + tilt + rotation ──────────────────────────────
        if (hipsRef.current) {
            // Base y = 0.92 keeps feet just above ground (local y ≈ 0)
            hipsRef.current.position.y = 0.92 + Math.abs(Math.sin(cycle * 2)) * b;
            hipsRef.current.rotation.x =  0.05 + Math.sin(cycle * 2) * 0.02;
            hipsRef.current.rotation.y = Math.sin(cycle) * 0.08;
            hipsRef.current.rotation.z = Math.cos(cycle) * 0.02;
        }

        // ── Legs ─────────────────────────────────────────────────────────
        if (legLRef.current) {
            legLRef.current.rotation.x  =  Math.sin(cycle)          * s;
            legLRef.current.position.y  =  Math.max(0, Math.cos(cycle))          * 0.04;
        }
        if (legRRef.current) {
            legRRef.current.rotation.x  =  Math.sin(cycle + Math.PI) * s;
            legRRef.current.position.y  =  Math.max(0, Math.cos(cycle + Math.PI)) * 0.04;
        }

        // ── Arms (opposite phase to legs) ─────────────────────────────────
        if (armLRef.current) {
            armLRef.current.rotation.x  =  Math.sin(cycle + Math.PI) * (s * 0.7);
            armLRef.current.rotation.z  = -0.18 + Math.sin(cycle * 2) * 0.03;
        }
        if (armRRef.current) {
            armRRef.current.rotation.x  =  Math.sin(cycle)           * (s * 0.7);
            armRRef.current.rotation.z  =  0.18 - Math.sin(cycle * 2) * 0.03;
        }

        // ── Head: subtle bob ─────────────────────────────────────────────
        if (headRef.current) {
            headRef.current.position.y  = 1.05 + Math.sin(cycle * 2 + 0.5) * 0.015;
            headRef.current.rotation.y  = -Math.sin(cycle) * 0.04;
        }
    });

    return (
        // direction flips scale.x → mirrors character to face walk direction
        <group position={position} scale={[scale * direction, scale, 1]}>

            {/* ── HIPS (animated root — do NOT set initial y, useFrame owns it) ── */}
            <group ref={hipsRef}>

                {/* ── HEAD ────────────────────────────────────────────────── */}
                <group ref={headRef}>
                    {/* Neck */}
                    <mesh position={[0, -0.10, 0]}>
                        <planeGeometry args={[0.10, 0.16]} />
                        <meshStandardMaterial color={SKIN} roughness={0.8} />
                    </mesh>

                    {/* Face photo — centered at head, slight z offset to render on top */}
                    <mesh position={[0, 0.09, 0.01]}>
                        <planeGeometry args={[0.54, 0.54]} />
                        <meshStandardMaterial
                            map={faceTexture}
                            transparent
                            alphaTest={0.08}
                            depthWrite={false}
                            roughness={0.6}
                        />
                    </mesh>
                </group>

                {/* ── SHOULDERS (skin strip across top of torso) ──────────── */}
                <mesh position={[0, 0.88, 0.005]}>
                    <planeGeometry args={[0.66, 0.18]} />
                    <meshStandardMaterial color={SKIN} roughness={0.8} />
                </mesh>

                {/* ── TORSO / SHIRT ─────────────────────────────────────── */}
                <mesh position={[0, 0.52, 0]}>
                    <planeGeometry args={[0.50, 0.72]} />
                    <meshStandardMaterial
                        map={clothTexture}
                        transparent alphaTest={0.01}
                        roughness={0.9}
                    />
                </mesh>

                {/* ── SHORTS / HIP BAND ────────────────────────────────── */}
                <mesh position={[0, 0.10, 0.004]}>
                    <planeGeometry args={[0.50, 0.28]} />
                    <meshStandardMaterial
                        map={clothTexture}
                        transparent alphaTest={0.01}
                        roughness={0.95}
                    />
                </mesh>

                {/* ── LEFT ARM ─────────────────────────────────────────── */}
                {/* pivot at shoulder */}
                <group ref={armLRef} position={[-0.30, 0.80, -0.01]}>
                    {/* Upper arm */}
                    <mesh position={[0, -0.20, 0]}>
                        <planeGeometry args={[0.14, 0.40]} />
                        <meshStandardMaterial color={SKIN} roughness={0.8} />
                    </mesh>
                    {/* Forearm */}
                    <mesh position={[0, -0.50, 0]}>
                        <planeGeometry args={[0.11, 0.30]} />
                        <meshStandardMaterial color={SKIN_DARK} roughness={0.8} />
                    </mesh>
                    {/* Hand */}
                    <mesh position={[0, -0.70, 0]}>
                        <planeGeometry args={[0.12, 0.11]} />
                        <meshStandardMaterial color={SKIN} roughness={0.7} />
                    </mesh>
                </group>

                {/* ── RIGHT ARM ─────────────────────────────────────────── */}
                <group ref={armRRef} position={[0.30, 0.80, 0.01]}>
                    <mesh position={[0, -0.20, 0]}>
                        <planeGeometry args={[0.14, 0.40]} />
                        <meshStandardMaterial color={SKIN} roughness={0.8} />
                    </mesh>
                    <mesh position={[0, -0.50, 0]}>
                        <planeGeometry args={[0.11, 0.30]} />
                        <meshStandardMaterial color={SKIN_DARK} roughness={0.8} />
                    </mesh>
                    <mesh position={[0, -0.70, 0]}>
                        <planeGeometry args={[0.12, 0.11]} />
                        <meshStandardMaterial color={SKIN} roughness={0.7} />
                    </mesh>
                </group>

                {/* ── LEFT LEG ─────────────────────────────────────────── */}
                {/* pivot at hip joint */}
                <group ref={legLRef} position={[-0.12, -0.05, -0.02]}>
                    {/* Thigh (clothing shorts) */}
                    <mesh position={[0, -0.18, 0]}>
                        <planeGeometry args={[0.22, 0.36]} />
                        <meshStandardMaterial
                            map={clothTexture}
                            transparent alphaTest={0.01}
                            roughness={0.9}
                        />
                    </mesh>
                    {/* Lower leg (skin — exposed below shorts) */}
                    <mesh position={[0, -0.52, 0]}>
                        <planeGeometry args={[0.17, 0.36]} />
                        <meshStandardMaterial color={SKIN} roughness={0.8} />
                    </mesh>
                    {/* Foot */}
                    <mesh position={[0.05, -0.75, 0]}>
                        <planeGeometry args={[0.22, 0.09]} />
                        <meshStandardMaterial color={SKIN_DARK} roughness={0.9} />
                    </mesh>
                </group>

                {/* ── RIGHT LEG ─────────────────────────────────────────── */}
                <group ref={legRRef} position={[0.12, -0.05, 0.02]}>
                    <mesh position={[0, -0.18, 0]}>
                        <planeGeometry args={[0.22, 0.36]} />
                        <meshStandardMaterial
                            map={clothTexture}
                            transparent alphaTest={0.01}
                            roughness={0.9}
                        />
                    </mesh>
                    <mesh position={[0, -0.52, 0]}>
                        <planeGeometry args={[0.17, 0.36]} />
                        <meshStandardMaterial color={SKIN} roughness={0.8} />
                    </mesh>
                    <mesh position={[0.05, -0.75, 0]}>
                        <planeGeometry args={[0.22, 0.09]} />
                        <meshStandardMaterial color={SKIN_DARK} roughness={0.9} />
                    </mesh>
                </group>

            </group>
        </group>
    );
}
