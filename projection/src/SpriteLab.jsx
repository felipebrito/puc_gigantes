import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Grid } from '@react-three/drei';
import { SpriteCharacter } from './components/SpriteCharacter';

export default function SpriteLab() {
    return (
        <div style={{ width: '100vw', height: '100vh', background: '#111' }}>
            <div style={{ position: 'absolute', top: 20, left: 20, color: 'white', zIndex: 10, fontFamily: 'sans-serif' }}>
                <h1>🎬 Chroma Key Lab</h1>
                <p>Testing Video Sprites + Chroma Shader</p>
            </div>

            <Canvas camera={{ position: [0, 1, 10], fov: 25 }} shadows>
                <ambientLight intensity={1.0} />
                <Environment preset="city" />

                <Grid infiniteGrid fadeDistance={20} sectionColor="#444" cellColor="#222" />
                <OrbitControls target={[0, 0, 0]} />

                <SpriteCharacter
                    videoUrl="/models/Walk_Cycle_Generation_Request.mp4"
                    faceUrl="/models/face_test.png"
                    position={[0, 0, 0]}
                />
            </Canvas>
        </div>
    );
}
