import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text, Billboard, Image, useGLTF, Environment, Sky, Cloud, Html, Grid } from '@react-three/drei';
import { useControls } from 'leva';
import * as THREE from 'three';
import io from 'socket.io-client';
import './App.css';

// Socket connection
const socket = io(window.location.hostname === 'localhost'
  ? 'https://localhost:3000'
  : `https://${window.location.hostname}:3000`);

// --- Components ---

function Dinosaur() {
  const { scene } = useGLTF('/models/dreadnoughtus/source/untitled.glb');
  const mesh = useRef();

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (mesh.current) {
      mesh.current.rotation.y = Math.sin(t * 0.1) * 0.1;
      mesh.current.position.y = Math.sin(t * 0.5) * 0.02;
    }
  });

  return (
    <primitive
      ref={mesh}
      object={scene}
      position={[0, 0, 0]}
      scale={[0.4, 0.4, 0.4]} // Increased to match 6m scale
      rotation={[0, 0, 0]}
    />
  );
}

import { SkeletonCharacter } from './components/SkeletonCharacter';

const CLOTHING_TEXTURES = [
  '/textures/suit.png',
  '/textures/dress.png',
  '/textures/casual.png'
];

const WALK_STYLES = ['normal', 'long', 'fast'];

function Visitor({ id, imageUrl, removeVisitor, customZ = 0 }) {
  const ref = useRef();

  const config = useMemo(() => {
    const direction = Math.random() > 0.5 ? 1 : -1;
    return {
      direction,
      speed: (1.0 + Math.random() * 1.5) * direction,
      startX: -25 * direction,
      z: 2 + (Math.random() * 6) + customZ,
      scale: 1.05 + Math.random() * 0.15, // Targeting ~1.75m height
      walkStyle: WALK_STYLES[Math.floor(Math.random() * WALK_STYLES.length)],
      clothingUrl: CLOTHING_TEXTURES[Math.floor(Math.random() * CLOTHING_TEXTURES.length)]
    };
  }, [customZ]);

  useFrame((state, delta) => {
    if (!ref.current) return;
    ref.current.position.x += config.speed * delta;
    if ((config.direction === 1 && ref.current.position.x > 20) ||
      (config.direction === -1 && ref.current.position.x < -20)) {
      removeVisitor(id);
    }
  });

  return (
    <group position={[config.startX, -3, config.z]} ref={ref}>
      <Billboard>
        <SkeletonCharacter
          faceUrl={imageUrl}
          clothingUrl={config.clothingUrl}
          walkStyle={config.walkStyle}
          scale={config.scale}
          speed={Math.abs(config.speed) * 2.5}
        />
      </Billboard>
    </group>
  );
}

function Scene() {
  const [visitors, setVisitors] = useState([]);
  const [connected, setConnected] = useState(false);
  const { camera } = useThree();

  const { viewMode } = useControls('Câmera Presets', {
    viewMode: {
      options: {
        '🎬 Cinemática': 'Cinematic',
        '📐 Escala (Lado)': 'SideScale',
        '📏 Comparação': 'Comparison',
        '🚁 Drone': 'Top',
        '🦖 Foco Dino': 'DinoFocus',
        '🕹️ Controle Livre': 'Free'
      }
    }
  });

  const orbitRef = useRef();

  const cameraTargets = useMemo(() => ({
    Cinematic: { pos: [0, 0, 45], target: [0, 0, 0] },
    SideScale: { pos: [8, 0, 35], target: [5, 0, 0] },
    Comparison: { pos: [0, -0.5, 40], target: [0, 0, 0] },
    Top: { pos: [0, 40, 5], target: [0, 0, 0] },
    DinoFocus: { pos: [5, 5, 30], target: [5, 3, -8] }
  }), []);

  const [history, setHistory] = useState([]);
  const [apiError, setApiError] = useState(false);
  const MAX_VISITORS = 15;

  const serverUrl = window.location.hostname === 'localhost'
    ? 'https://localhost:3000/visitors'
    : `https://${window.location.hostname}:3000/visitors`;

  useEffect(() => {
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    if (socket.connected) onConnect();

    fetch(serverUrl)
      .then(res => res.json())
      .then(files => {
        if (files && files.length > 0) {
          setHistory(files);
          setActivePool(files.slice(0, 10));
          setApiError(false);
        }
      })
      .catch(() => setApiError(true));

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, []);

  const [activePool, setActivePool] = useState(["/models/face_test.png"]);

  useEffect(() => {
    const rotatePool = () => {
      if (history.length <= 1) return;
      const shuffled = [...history].sort(() => 0.5 - Math.random());
      setActivePool(shuffled.slice(0, 8));
    };
    const interval = setInterval(rotatePool, 15000);
    return () => clearInterval(interval);
  }, [history]);

  useFrame((state) => {
    if (visitors.length < MAX_VISITORS && activePool.length > 0) {
      if (Math.random() < 0.02) {
        const randomPhoto = activePool[Math.floor(Math.random() * activePool.length)];
        const isOnScreen = visitors.some(v => v.imageUrl === randomPhoto);
        if (!isOnScreen || activePool.length < 3) {
          setVisitors(prev => [...prev, {
            id: Date.now() + Math.random(),
            imageUrl: randomPhoto,
            zOffset: (Math.random() - 0.5) * 0.1
          }]);
        }
      }
    }

    if (viewMode !== 'Free' && cameraTargets[viewMode]) {
      const { pos, target } = cameraTargets[viewMode];
      state.camera.position.lerp(new THREE.Vector3(...pos), 0.05);
      orbitRef.current?.target.lerp(new THREE.Vector3(...target), 0.05);
      orbitRef.current?.update();
    }
  });

  const removeVisitor = (id) => {
    setVisitors(prev => prev.filter(v => v.id !== id));
  };

  useEffect(() => {
    const handleNewVisitor = (data) => {
      setVisitors(prev => [...prev, { ...data, zOffset: (Math.random() - 0.5) * 0.1 }]);
      setHistory(h => [...h, data.imageUrl]);
    };
    socket.on('new_visitor', handleNewVisitor);
    return () => socket.off('new_visitor', handleNewVisitor);
  }, []);

  return (
    <>
      <ambientLight intensity={1.5} />
      <directionalLight position={[10, 20, 10]} intensity={2.0} castShadow />

      <Sky sunPosition={[100, 20, 100]} turbidity={0.1} rayleigh={0.5} />
      <Environment preset="park" background={false} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -3.01, 0]} receiveShadow>
        <planeGeometry args={[1000, 1000]} />
        <meshStandardMaterial color="#444444" roughness={1} />
      </mesh>

      <Grid infiniteGrid sectionSize={2} cellSize={1} position={[0, -3, 0]} cellColor="#666" sectionColor="#fff" />

      <group position={[-8, -3, 0]}>
        <mesh position={[0, 3, 0]}>
          <boxGeometry args={[0.2, 6, 0.2]} />
          <meshStandardMaterial color="#ffcc00" emissive="#332200" />
        </mesh>
        {[0, 1, 2, 3, 4, 5, 6].map((h) => (
          <group key={h} position={[0.5, h, 0]}>
            <Text fontSize={0.35} color="white" anchorX="left" outlineWidth={0.02}>{h}m</Text>
            <mesh position={[-0.2, 0, 0]}>
              <boxGeometry args={[0.4, 0.05, 0.05]} />
              <meshBasicMaterial color="#ffcc00" />
            </mesh>
          </group>
        ))}
      </group>

      <React.Suspense fallback={<mesh position={[0, 0, -10]}><boxGeometry args={[2, 6, 2]} /><meshBasicMaterial color="red" /></mesh>}>
        <group scale={3.0} position={[0, -3, -15]}>
          <Dinosaur />
        </group>
      </React.Suspense>

      <React.Suspense fallback={null}>
        <Visitor id="test-ref" imageUrl="/models/face_test.png" removeVisitor={() => { }} />
        {visitors.map(v => (
          <Visitor key={v.id} id={v.id} imageUrl={v.imageUrl} removeVisitor={removeVisitor} customZ={v.zOffset} />
        ))}
      </React.Suspense>

      {apiError && (
        <Html position={[0, 0, 0]} center>
          <div style={{ background: 'rgba(50, 0, 0, 0.9)', padding: '20px', borderRadius: '10px', color: 'white' }}>
            🛑 ERRO DE CONEXÃO
            <button onClick={() => window.open(serverUrl, '_blank')} style={{ display: 'block', marginTop: '10px' }}>
              AUTORIZAR CERTIFICADO
            </button>
          </div>
        </Html>
      )}

      <OrbitControls
        ref={orbitRef}
        enablePan={viewMode === 'Free'}
        enableRotate={viewMode === 'Free'}
        enableZoom={viewMode === 'Free'}
      />

      <Billboard position={[0, 2.5, -15]}>
        <Text fontSize={0.5} color="white" outlineWidth={0.05} outlineColor="black">GIGANTES DE PORTO ALEGRE</Text>
        <Text position={[0, -0.3, 0]} fontSize={0.15} color={connected ? "#4caf50" : "#f44336"}>
          {connected ? "● LIVE SCAN" : "○ SCANNING..."} | {visitors.length + 1} PERSONS
        </Text>
      </Billboard>
    </>
  );
}

export default function App() {
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000' }}>
      <Canvas
        shadows
        camera={{ fov: 10, position: [0, 0, 40], near: 0.1, far: 1000 }}
      >
        <color attach="background" args={['#87CEEB']} />
        <Scene />
      </Canvas>
    </div>
  );
}
