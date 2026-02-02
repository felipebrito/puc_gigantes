import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text, Billboard, Image, useGLTF, Environment, Sky, Cloud, Html } from '@react-three/drei';
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
    // Basic oscillation
    const t = state.clock.getElapsedTime();
    if (mesh.current) {
      mesh.current.rotation.y = Math.sin(t * 0.1) * 0.1;
      // Breathing effect
      mesh.current.position.y = -2 + Math.sin(t * 0.5) * 0.05;
    }
  });

  return (
    <primitive
      ref={mesh}
      object={scene}
      position={[0, -2, -10]}
      scale={[0.5, 0.5, 0.5]}
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

function Visitor({ id, imageUrl, removeVisitor }) {
  const ref = useRef();

  useEffect(() => {
    console.log("👤 Visitor Mounted:", id, imageUrl);
  }, []);

  const config = useMemo(() => {
    const direction = Math.random() > 0.5 ? 1 : -1;
    return {
      direction,
      speed: (1.2 + Math.random() * 2) * direction,
      startX: -30 * direction,
      z: 3 + Math.random() * 10, // MOVED MUCH CLOSER (CORRIDOR BETWEEN CAMERA AND DINO)
      scale: 0.9 + Math.random() * 0.4,
      walkStyle: WALK_STYLES[Math.floor(Math.random() * WALK_STYLES.length)],
      clothingUrl: CLOTHING_TEXTURES[Math.floor(Math.random() * CLOTHING_TEXTURES.length)]
    };
  }, []);

  useFrame((state, delta) => {
    if (!ref.current) return;
    ref.current.position.x += config.speed * delta;
    if ((config.direction === 1 && ref.current.position.x > 30) ||
      (config.direction === -1 && ref.current.position.x < -30)) {
      removeVisitor(id);
    }
  });

  return (
    <group position={[config.startX, -2.05, config.z]} ref={ref}>
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

  // CAMERA PRESETS
  const { viewMode } = useControls('Câmera Presets', {
    viewMode: {
      options: {
        '🎬 Cinemática': 'Cinematic',
        '⬅️ Lado': 'Side',
        '🚁 Drone': 'Top',
        '🕹️ Controle Livre': 'Free'
      }
    }
  });

  const orbitRef = useRef();

  useEffect(() => {
    if (viewMode === 'Cinematic') {
      camera.position.lerp(new THREE.Vector3(0, 2, 18), 0.1);
      if (orbitRef.current) orbitRef.current.target.lerp(new THREE.Vector3(0, 1, 0), 0.1);
    } else if (viewMode === 'Side') {
      camera.position.lerp(new THREE.Vector3(20, 2, 8), 0.1);
      if (orbitRef.current) orbitRef.current.target.lerp(new THREE.Vector3(0, 1, 8), 0.1);
    } else if (viewMode === 'Top') {
      camera.position.lerp(new THREE.Vector3(0, 25, 10), 0.1);
      if (orbitRef.current) orbitRef.current.target.lerp(new THREE.Vector3(0, 0, 10), 0.1);
    }
  }, [viewMode, camera]);

  useEffect(() => {
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    if (socket.connected) onConnect();
    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, []);

  /* Auto-Spawn Logic */
  const [history, setHistory] = useState([]);
  const [apiError, setApiError] = useState(false);
  const MAX_VISITORS = 15;

  const serverUrl = window.location.hostname === 'localhost'
    ? 'https://localhost:3000/visitors'
    : `https://${window.location.hostname}:3000/visitors`;

  const fetchHistory = () => {
    fetch(serverUrl)
      .then(res => res.json())
      .then(files => {
        if (files && files.length > 0) {
          console.log("📸 History Loaded:", files.length, "images");
          setHistory(files);
          setActivePool(files.slice(0, 10));
          setApiError(false);
        }
      })
      .catch(err => {
        console.warn(`🛑 API ERROR: Cannot fetch visitors from ${serverUrl}`);
        setApiError(true);
        setHistory(["/models/face_test.png"]);
      });
  };

  useEffect(() => {
    fetchHistory();
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
            imageUrl: randomPhoto
          }]);
        }
      }
    }

    // Smooth transitions for camera if not in Free mode
    if (viewMode !== 'Free') {
      if (viewMode === 'Cinematic') {
        state.camera.position.lerp(new THREE.Vector3(0, 2, 18), 0.05);
        orbitRef.current?.target.lerp(new THREE.Vector3(0, 1, 0), 0.05);
      } else if (viewMode === 'Side') {
        state.camera.position.lerp(new THREE.Vector3(15, 3, 10), 0.05);
        orbitRef.current?.target.lerp(new THREE.Vector3(0, 1, 10), 0.05);
      } else if (viewMode === 'Top') {
        state.camera.position.lerp(new THREE.Vector3(0, 30, 10), 0.05);
        orbitRef.current?.target.lerp(new THREE.Vector3(0, 0, 10), 0.05);
      }
      orbitRef.current?.update();
    }
  });

  const removeVisitor = (id) => {
    setVisitors(prev => prev.filter(v => v.id !== id));
  };

  useEffect(() => {
    const handleNewVisitor = (data) => {
      setVisitors(prev => [...prev, data]);
      setHistory(h => [...h, data.imageUrl]);
    };
    socket.on('new_visitor', handleNewVisitor);
    return () => socket.off('new_visitor', handleNewVisitor);
  }, []);

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 10, 10]} intensity={1.5} castShadow />

      <Sky sunPosition={[100, 10, 100]} turbidity={0.1} rayleigh={0.5} />
      <Environment preset="forest" />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.1, 0]} receiveShadow>
        <planeGeometry args={[500, 500]} />
        <meshStandardMaterial color="#4A3728" roughness={0.9} />
      </mesh>

      <Cloud position={[-15, 10, -30]} speed={0.1} opacity={0.3} />
      <Cloud position={[15, 12, -35]} speed={0.1} opacity={0.3} />

      <group scale={1.8}>
        <Dinosaur />
      </group>

      <React.Suspense fallback={null}>
        <Visitor id="test-ref" imageUrl="/models/face_test.png" removeVisitor={() => { }} />
        {visitors.map(v => (
          <Visitor key={v.id} id={v.id} imageUrl={v.imageUrl} removeVisitor={removeVisitor} />
        ))}
      </React.Suspense>

      {apiError && (
        <Html position={[0, 4, 0]} center>
          <div style={{
            background: 'rgba(255,0,0,0.8)',
            padding: '15px 25px',
            borderRadius: '10px',
            color: 'white',
            textAlign: 'center',
            fontFamily: 'sans-serif',
            cursor: 'pointer',
            border: '2px solid white',
            boxShadow: '0 0 20px rgba(0,0,0,0.5)'
          }}
            onClick={() => window.open(serverUrl, '_blank')}
          >
            <h3 style={{ margin: 0 }}>🛑 ERRO DE CONEXÃO API</h3>
            <p style={{ margin: '10px 0 0', fontSize: '12px' }}>Clique aqui e autorize o certificado para ver as fotos.</p>
          </div>
        </Html>
      )}

      <OrbitControls
        ref={orbitRef}
        target={[0, 1, 0]}
        maxPolarAngle={Math.PI / 2}
        minDistance={5}
        maxDistance={60}
        enabled={viewMode === 'Free'}
      />

      <Billboard position={[0, 12, -20]}>
        <Text fontSize={0.4} color={connected ? "#4caf50" : "#f44336"}>
          {connected ? "LIVE" : "CONECTANDO..."} | {visitors.length + 1} PESSOAS
        </Text>
      </Billboard>
    </>
  );
}

export default function App() {
  return (
    <Canvas
      shadows
      camera={{ position: [0, 2, 18], fov: 40 }}
    >
      <color attach="background" args={['#87CEEB']} />
      <fog attach="fog" args={['#87CEEB', 20, 100]} />
      <Scene />
    </Canvas>
  );
}
