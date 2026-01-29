import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Billboard, Image, useGLTF, Environment, Sky, Cloud } from '@react-three/drei';
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

function Visitor({ id, imageUrl, removeVisitor }) {
  const ref = useRef();

  // Random configurations on mount
  const config = useMemo(() => {
    const direction = Math.random() > 0.5 ? 1 : -1; // 1 = Left to Right, -1 = Right to Left
    return {
      direction,
      speed: (2 + Math.random() * 3) * direction, // Random Speed between 2-5
      startX: -20 * direction, // Start off-screen
      z: -5 + Math.random() * 10, // Depth variation (-5 to 5)
      wobbleOffset: Math.random() * 100,
      scale: 1.5 + Math.random() * 1 // Random size
    };
  }, []);

  useFrame((state, delta) => {
    if (!ref.current) return;

    // Move
    ref.current.position.x += config.speed * delta;

    // Bobbing "walking" effect
    const t = state.clock.getElapsedTime();
    ref.current.position.y = 1 + Math.abs(Math.sin(t * 10 + config.wobbleOffset)) * 0.5;

    // Remove if out of bounds (direction dependent)
    if ((config.direction === 1 && ref.current.position.x > 20) ||
      (config.direction === -1 && ref.current.position.x < -20)) {
      removeVisitor(id); // Recycle this visitor (removed from state, will be re-added by main loop)
    }
  });

  return (
    <Billboard position={[config.startX, 1, config.z]} ref={ref}>
      <Image
        url={imageUrl}
        scale={[config.scale, config.scale, 1]}
        transparent
        opacity={1}
      />
    </Billboard>
  );
}

function Scene() {
  const [visitors, setVisitors] = useState([]);
  const [connected, setConnected] = useState(false);
  const [lastLog, setLastLog] = useState("Aguardando...");

  useEffect(() => {
    const onConnect = () => {
      console.log("Connected");
      setConnected(true);
      setLastLog("Conectado");
    };

    const onDisconnect = () => {
      setConnected(false);
      setLastLog("Desconectado");
    };

    const onConnectError = (err) => {
      console.error("Connection Error:", err);
      setConnected(false);
      setLastLog(`Erro: ${err.message}`);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);

    // If already connected by the time this runs
    if (socket.connected) {
      onConnect();
    }

    // Note: new_visitor is handled in another effect now, so we don't manage it here to avoid conflicts

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);
    };
  }, []);

  /* Auto-Spawn Logic */
  const historicalPhotos = useRef([]);
  const MAX_VISITORS = 15;

  // 1. Fetch old photos on mount
  useEffect(() => {
    fetch(window.location.hostname === 'localhost'
      ? 'https://localhost:3000/visitors'
      : `https://${window.location.hostname}:3000/visitors`)
      .then(res => res.json())
      .then(files => {
        historicalPhotos.current = files;
        console.log("Loaded historical photos:", files.length);
      })
      .catch(err => console.error("Failed to load history", err));
  }, []);



  /* --- ROTATION LOGIC --- */
  // Instead of using ALL photos at once, we select a small "Active Pool" (e.g., 5-6 photos)
  // This pool rotates every few seconds so we don't overwhelm the screen with 100 diff faces at once.
  const [activePool, setActivePool] = useState([]);

  // Rotate the pool every 15 seconds
  useEffect(() => {
    const rotatePool = () => {
      if (historicalPhotos.current.length === 0) return;

      // Shuffle and pick top 6
      const shuffled = [...historicalPhotos.current].sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, 6);
      setActivePool(selected);
      console.log("Rotated Active Pool:", selected.length);
    };

    const interval = setInterval(rotatePool, 15000);
    return () => clearInterval(interval);
  }, []); // Run loop forever

  // Ensure we have an initial pool once photos load
  useEffect(() => {
    if (activePool.length === 0 && historicalPhotos.current.length > 0) {
      const top6 = historicalPhotos.current.slice(0, 6);
      setActivePool(top6);
    }
  }, [visitors.length]); // Check occasionally

  // 2. Random Spawner Loop (Uses Active Pool ONLY)
  useFrame((state) => {
    // Only spawn if below limit and we have a pool
    if (visitors.length < MAX_VISITORS && activePool.length > 0) {

      if (Math.random() < 0.02) {
        const randomPhoto = activePool[Math.floor(Math.random() * activePool.length)];

        // Anti-Clone: Don't spawn if already on screen
        const isAlreadyOnScreen = visitors.some(v => v.imageUrl === randomPhoto);

        if (!isAlreadyOnScreen) {
          const newVisitor = {
            id: Date.now() + Math.random(),
            imageUrl: randomPhoto
          };
          setVisitors(prev => [...prev, newVisitor]);
        }
      }
    }
  });

  const removeVisitor = (id) => {
    setVisitors(prev => prev.filter(v => v.id !== id));
  };

  // Update historical list when new visitor arrives via socket
  useEffect(() => {
    const handleNewVisitor = (data) => {
      console.log("New Visitor Live!", data);
      setLastLog(`Novo: ${data.id}`);

      // Add to screen immediately
      setVisitors(prev => [...prev, data]);

      // Add to rotation list
      historicalPhotos.current.push(data.imageUrl);
    };

    socket.on('new_visitor', handleNewVisitor);
    return () => socket.off('new_visitor', handleNewVisitor);
  }, []);

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} castShadow />

      {/* Environment */}
      {/* Environment */}
      <Sky sunPosition={[100, 20, 100]} turbidity={0.1} rayleigh={0.5} mieCoefficient={0.005} mieDirectionalG={0.8} />
      <Environment preset="forest" background={false} />

      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#5D4037" roughness={0.8} />
      </mesh>

      {/* Clouds */}
      <Cloud position={[-4, 5, -10]} speed={0.2} opacity={0.5} />
      <Cloud position={[4, 5, -15]} speed={0.2} opacity={0.5} />

      <Dinosaur />

      <React.Suspense fallback={null}>
        {visitors.map(v => (
          <Visitor
            key={v.id}
            id={v.id}
            imageUrl={v.imageUrl}
            removeVisitor={removeVisitor}
          />
        ))}
      </React.Suspense>

      <OrbitControls />
      <gridHelper args={[100, 100]} />

      {/* Debug UI */}
      <group position={[0, 0, 0]}>
        <Text position={[-8, 4, 0]} fontSize={0.3} color={connected ? "green" : "red"} anchorX="left">
          Status: {connected ? "ON" : "OFF"} | {lastLog} | Target: {socket.io.uri}
        </Text>
      </group>
    </>
  );
}

export default function App() {
  return (
    <Canvas camera={{ position: [0, 5, 15], fov: 60 }} shadows>
      <color attach="background" args={['#87CEEB']} />
      <fog attach="fog" args={['#87CEEB', 15, 60]} />
      <Scene />
    </Canvas>
  );
}
