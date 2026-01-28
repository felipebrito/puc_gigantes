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
  const speed = useRef(2 + Math.random() * 2); // Random speed
  const [wobbleOffset] = useState(Math.random() * 100);

  useFrame((state, delta) => {
    if (!ref.current) return;

    // Move right
    ref.current.position.x += speed.current * delta;

    // Bobbing "walking" effect
    const t = state.clock.getElapsedTime();
    ref.current.position.y = 1 + Math.abs(Math.sin(t * 10 + wobbleOffset)) * 0.5;

    // Remove if out of bounds
    if (ref.current.position.x > 15) {
      removeVisitor(id);
    }
  });

  return (
    <Billboard position={[-15, 1, 0]} ref={ref}>
      <Image
        url={imageUrl}
        scale={[2, 2, 1]}
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

  const removeVisitor = (id) => {
    setVisitors(prev => prev.filter(v => v.id !== id));
  };

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
