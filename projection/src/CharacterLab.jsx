import React, { useState, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, Environment } from '@react-three/drei';
import { GUI } from 'lil-gui';
import { SkeletonCharacter } from './components/SkeletonCharacter';

export default function CharacterLab() {
    const [params, setParams] = useState({
        clothing: '/textures/suit.png',
        walkStyle: 'normal',
        walk: true,
        speed: 3,
        scale: 1,
    });

    useEffect(() => {
        const gui = new GUI({ title: 'Character Lab' });
        const proxy = { ...params };
        const sync = (key) => (v) => setParams(prev => ({ ...prev, [key]: v }));
        gui.add(proxy, 'clothing', {
            'Suit (Grey)': '/textures/suit.png',
            'Dress (Beige)': '/textures/dress.png',
            'Casual (Denim)': '/textures/casual.png',
        }).name('Roupa').onChange(sync('clothing'));
        gui.add(proxy, 'walkStyle', ['normal', 'long', 'fast']).name('Estilo').onChange(sync('walkStyle'));
        gui.add(proxy, 'walk').name('Andar').onChange(sync('walk'));
        gui.add(proxy, 'speed', 0, 10, 0.1).name('Velocidade').onChange(sync('speed'));
        gui.add(proxy, 'scale', 0.5, 2, 0.01).name('Escala').onChange(sync('scale'));
        return () => gui.destroy();
    }, []);

    const { clothing, walkStyle, walk, speed, scale } = params;

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
