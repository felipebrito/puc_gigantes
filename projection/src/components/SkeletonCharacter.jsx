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

    useFrame((state) => {
        const t = state.clock.getElapsedTime();
        let freq = speed;
        let b = bounce;
        let s = stride;

        if (walkStyle === "fast") { freq *= 1.3; b *= 1.2; s *= 1.2; }
        if (walkStyle === "long") { freq *= 0.8; s *= 1.4; }

        const cycle = t * freq;

        if (hipsRef.current) {
            hipsRef.current.position.y = Math.abs(Math.sin(cycle * 2)) * b;
            hipsRef.current.rotation.x = 0.08;
            hipsRef.current.rotation.z = Math.cos(cycle) * 0.015;
        }

        if (legLRef.current) legLRef.current.rotation.z = Math.sin(cycle) * s;
        if (legRRef.current) legRRef.current.rotation.z = Math.sin(cycle + Math.PI) * s;

        if (armLRef.current) armLRef.current.rotation.z = Math.sin(cycle + Math.PI) * (s * 0.5);
        if (armRRef.current) armRRef.current.rotation.z = Math.sin(cycle) * (s * 0.5);
    });

    const skinColor = '#FAD7A0';

    return (
        <group position={position} scale={[scale, scale, 1]}>
            <group ref={hipsRef} position={[0, 0.8, 0]}>

                {/* TORSO (Shirt) */}
                <mesh position={[0, 0.45, 0]}>
                    <planeGeometry args={[0.45, 0.7]} />
                    <meshStandardMaterial map={clothTexture} side={THREE.DoubleSide} />
                </mesh>

                {/* NECK & HEAD (Face) */}
                <group position={[0, 0.75, 0.05]}>
                    {/* Neck */}
                    <mesh position={[0, -0.05, -0.01]}>
                        <planeGeometry args={[0.08, 0.15]} />
                        <meshStandardMaterial color={skinColor} />
                    </mesh>
                    {/* Face */}
                    <mesh position={[0, 0.22, 0.01]}>
                        <planeGeometry args={[0.5, 0.5]} />
                        <meshStandardMaterial map={faceTexture} transparent alphaTest={0.5} side={THREE.DoubleSide} />
                    </mesh>
                </group>

                {/* ARMS */}
                <group ref={armLRef} position={[-0.23, 0.68, -0.02]}>
                    <mesh position={[0, -0.22, 0]}>
                        <planeGeometry args={[0.1, 0.45]} />
                        <meshStandardMaterial map={clothTexture} side={THREE.DoubleSide} />
                    </mesh>
                </group>
                <group ref={armRRef} position={[0.23, 0.68, 0.02]}>
                    <mesh position={[0, -0.22, 0]}>
                        <planeGeometry args={[0.1, 0.45]} />
                        <meshStandardMaterial map={clothTexture} side={THREE.DoubleSide} />
                    </mesh>
                </group>

                {/* LEGS - Offset X to prevent crossing at the center pivot */}
                <group ref={legLRef} position={[-0.13, 0.05, -0.03]}>
                    <mesh position={[0, -0.4, 0]}>
                        <planeGeometry args={[0.15, 0.9]} />
                        <meshStandardMaterial map={clothTexture} side={THREE.DoubleSide} />
                    </mesh>
                </group>
                <group ref={legRRef} position={[0.13, 0.05, 0.03]}>
                    <mesh position={[0, -0.4, 0]}>
                        <planeGeometry args={[0.15, 0.9]} />
                        <meshStandardMaterial map={clothTexture} side={THREE.DoubleSide} />
                    </mesh>
                </group>
            </group>
        </group>
    );
}


