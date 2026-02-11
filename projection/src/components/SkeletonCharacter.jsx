import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

export function SkeletonCharacter({
    position = [0, 0, 0],
    faceUrl,
    clothingUrl = "/textures/suit.png",
    speed = 5,
    stride = 0.4,
    bounce = 0.08,
    scale = 1,
    walkStyle = "normal"
}) {
    const hipsRef = useRef();
    const legLRef = useRef();
    const legRRef = useRef();
    const armLRef = useRef();
    const armRRef = useRef();

    const faceTexture = useTexture(faceUrl || "/models/face_test.png", (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
    });

    const clothTexture = useTexture(clothingUrl, (texture) => {
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(1.5, 2.5); // Tiling to show fabric detail
    });

    const headRef = useRef();

    useFrame((state) => {
        const t = state.clock.getElapsedTime();
        let freq = speed * 1.5; // Slightly faster frequency for natural feel
        let b = bounce;
        let s = stride;

        if (walkStyle === "fast") { freq *= 1.2; b *= 1.3; s *= 1.2; }
        if (walkStyle === "long") { freq *= 0.8; s *= 1.5; }

        const cycle = t * freq;

        if (hipsRef.current) {
            // Pelvic bounce and tilt
            hipsRef.current.position.y = Math.abs(Math.sin(cycle * 2)) * b;
            hipsRef.current.rotation.x = 0.1 + Math.sin(cycle * 2) * 0.02; // Slight forward lean oscillation
            hipsRef.current.rotation.y = Math.sin(cycle) * 0.1; // Pelvic rotation
            hipsRef.current.rotation.z = Math.cos(cycle) * 0.02;
        }

        if (legLRef.current) {
            legLRef.current.rotation.x = Math.sin(cycle) * s;
            // Knee bend simulation (not perfect for 2D but adds weight)
            legLRef.current.position.y = Math.max(0, Math.cos(cycle)) * 0.05;
        }
        if (legRRef.current) {
            legRRef.current.rotation.x = Math.sin(cycle + Math.PI) * s;
            legRRef.current.position.y = Math.max(0, Math.cos(cycle + Math.PI)) * 0.05;
        }

        if (armLRef.current) {
            armLRef.current.rotation.x = Math.sin(cycle + Math.PI) * (s * 0.8);
            armLRef.current.rotation.z = -0.1 + Math.sin(cycle * 2) * 0.02;
        }
        if (armRRef.current) {
            armRRef.current.rotation.x = Math.sin(cycle) * (s * 0.8);
            armRRef.current.rotation.z = 0.1 - Math.sin(cycle * 2) * 0.02;
        }

        if (headRef.current) {
            headRef.current.rotation.y = -Math.sin(cycle) * 0.05; // Head looks slightly forward
            headRef.current.position.y = 0.75 + Math.sin(cycle * 2 + 0.5) * 0.02; // Independent bob
        }
    });

    const skinColor = '#FAD7A0';

    return (
        <group position={position} scale={[scale, scale, 1]}>
            <group ref={hipsRef} position={[0, 0.8, 0]}>

                {/* TORSO - slightly back */}
                <mesh position={[0, 0.45, -0.01]}>
                    <planeGeometry args={[0.48, 0.7]} />
                    <meshStandardMaterial map={clothTexture} transparent alphaTest={0.5} roughness={0.8} />
                </mesh>

                {/* HEAD & NECK */}
                <group ref={headRef} position={[0, 0.75, 0]}>
                    {/* Neck */}
                    <mesh position={[0, -0.05, -0.02]}>
                        <planeGeometry args={[0.08, 0.15]} />
                        <meshStandardMaterial color={skinColor} />
                    </mesh>
                    {/* Face - in front */}
                    <mesh position={[0, 0.22, 0.05]}>
                        <planeGeometry args={[0.5, 0.5]} />
                        <meshStandardMaterial
                            map={faceTexture}
                            transparent
                            alphaTest={0.5}
                            depthWrite={false}
                        />
                    </mesh>
                </group>

                {/* ARMS - offset depth */}
                <group ref={armLRef} position={[-0.25, 0.7, -0.03]}>
                    <mesh position={[0, -0.22, 0]}>
                        <planeGeometry args={[0.12, 0.48]} />
                        <meshStandardMaterial map={clothTexture} roughness={0.8} />
                    </mesh>
                </group>
                <group ref={armRRef} position={[0.25, 0.7, 0.03]}>
                    <mesh position={[0, -0.22, 0]}>
                        <planeGeometry args={[0.12, 0.48]} />
                        <meshStandardMaterial map={clothTexture} roughness={0.8} />
                    </mesh>
                </group>

                {/* LEGS - offset depth */}
                <group ref={legLRef} position={[-0.14, 0.05, -0.04]}>
                    <mesh position={[0, -0.4, 0]}>
                        <planeGeometry args={[0.18, 0.9]} />
                        <meshStandardMaterial map={clothTexture} roughness={0.9} />
                    </mesh>
                </group>
                <group ref={legRRef} position={[0.14, 0.05, 0.04]}>
                    <mesh position={[0, -0.4, 0]}>
                        <planeGeometry args={[0.18, 0.9]} />
                        <meshStandardMaterial map={clothTexture} roughness={0.9} />
                    </mesh>
                </group>
            </group>
        </group>
    );
}


