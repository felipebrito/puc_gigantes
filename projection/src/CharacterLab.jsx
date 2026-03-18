import React, { useState, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, Environment } from '@react-three/drei';
import { useControls } from 'leva';
import { SkeletonCharacter } from './components/SkeletonCharacter';

export default function CharacterLab() {
    const { clothing, walkStyle, walk, speed, scale } = useControls('Character Lab', {
        clothing: {
            options: {
                'Suit (Grey)': '/textures/suit.png',
                'Dress (Beige)': '/textures/dress.png',
                'Casual (Denim)': '/textures/casual.png'
            }
        },
        walkStyle: { options: ['normal', 'long', 'fast'] },
        walk: true,
        speed: { value: 3, min: 0, max: 10 },
        scale: { value: 1, min: 0.5, max: 2 }
    });

    return (
        <div style={{ width: '100vw', height: '100vh', background: '#111' }}>
            <div style={{ position: 'absolute', top: 20, left: 20, color: 'white', zIndex: 10, fontFamily: 'sans-serif' }}>
                <h1>🧪 Character Lab (Human Rig)</h1>
                <p>Testing New Skeleton & Walk Cycles</p>
            </div>

            <Canvas camera={{ position: [0, 2, 5], fov: 50 }} shadows>
                <ambientLight intensity={0.7} />
                <pointLight position={[10, 10, 10]} intensity={1.5} />
                <Environment preset="city" />

                <Grid infiniteGrid fadeDistance={20} sectionColor="#444" cellColor="#222" />
                <OrbitControls target={[0, 1, 0]} />

                <LabScene
                    clothingUrl={clothing}
                    walkStyle={walkStyle}
                    walk={walk}
                    speed={speed}
                    scale={scale}
                />
            </Canvas>
        </div>
    );
}

function LabScene({ clothingUrl, walkStyle, walk, speed, scale }) {
    const group = useRef();

    useFrame((state, delta) => {
        if (walk && group.current) {
            group.current.position.x += speed * delta;
            if (group.current.position.x > 5) group.current.position.x = -5;
        }
    });

    return (
        <group ref={group}>
            <SkeletonCharacter
                position={[0, 0, 0]}
                clothingUrl={clothingUrl}
                walkStyle={walkStyle}
                scale={scale}
                speed={speed * 2}
            />
        </group>
    );
}
