import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Billboard, Image } from '@react-three/drei';
import * as THREE from 'three';
import io from 'socket.io-client';
import './App.css';

// Socket connection
const socket = io(window.location.hostname === 'localhost'
  ? 'https://localhost:3000'
  : `https://${window.location.hostname}:3000`);

// --- Components ---

function Dinosaur() {
  const mesh = useRef();

  useFrame((state) => {
    // Breathing animation
    const t = state.clock.getElapsedTime();
    mesh.current.scale.y = 1 + Math.sin(t * 2) * 0.05;
    mesh.current.rotation.y = Math.sin(t * 0.5) * 0.1;
  });

  return (
    <mesh ref={mesh} position={[0, 2.5, -5]}>
      <boxGeometry args={[3, 5, 3]} />
      <meshStandardMaterial color="#44aa44" />
      <Text position={[0, 3, 0]} fontSize={0.5} color="white">
        T-REX (Placeholder)
      </Text>
    </mesh>
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
    socket.on('connect', () => {
      console.log("Connected");
      setConnected(true);
      setLastLog("Conectado");
    });
    socket.on('disconnect', () => {
      setConnected(false);
      setLastLog("Desconectado");
    });

    socket.on('connect_error', (err) => {
      console.error("Connection Error:", err);
      setConnected(false);
      setLastLog(`Erro: ${err.message}`);
    });

    socket.on('new_visitor', (data) => {
      console.log("New Visitor!", data);
      setLastLog(`Visitante: ${data.id}`);
      setVisitors(prev => [...prev, data]);
    });

    return () => {
      socket.off('new_visitor');
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
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

  // 2. Random Spawner Loop
  useFrame((state) => {
    // Only spawn if below limit and we have photos
    if (visitors.length < MAX_VISITORS && historicalPhotos.current.length > 0) {
      // Small chance to spawn per frame (approx every 1-2 seconds)
      if (Math.random() < 0.02) {
        const randomPhoto = historicalPhotos.current[Math.floor(Math.random() * historicalPhotos.current.length)];
        const newVisitor = {
          id: Date.now() + Math.random(),
          imageUrl: randomPhoto
        };
        setVisitors(prev => [...prev, newVisitor]);
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
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#333" />
      </mesh>

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
        <Text position={[-5, 5, 0]} fontSize={0.3} color={connected ? "green" : "red"}>
          Status: {connected ? "ON" : "OFF"} | {lastLog}
        </Text>
      </group>
    </>
  );
}

export default function App() {
  return (
    <Canvas camera={{ position: [0, 5, 15], fov: 60 }} shadows>
      <color attach="background" args={['#87CEEB']} />
      <fog attach="fog" args={['#87CEEB', 10, 50]} />
      <Scene />
    </Canvas>
  );
}
