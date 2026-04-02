import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text, Billboard, useGLTF, Environment, Sky, Html, Grid } from '@react-three/drei';
import { useControls, button } from 'leva';
import * as THREE from 'three';
import io from 'socket.io-client';
import './App.css';

// Socket connection — porta 3001 (HTTP, sem certificado)
const socket = io(window.location.hostname === 'localhost'
  ? 'http://localhost:3001'
  : `http://${window.location.hostname}:3001`);

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

import { SpriteCharacter } from './components/SpriteCharacter';

function Visitor({ id, imageUrl, removeVisitor, moveConfig, spriteConfig }) {
  const ref = useRef();
  // Velocidade de animação proporcional à velocidade de caminhada
  useFrame((_, delta) => {
    if (!ref.current) return;
    ref.current.position.x += moveConfig.speed * delta;
    if ((moveConfig.direction === 1  && ref.current.position.x >  22) ||
        (moveConfig.direction === -1 && ref.current.position.x < -22)) {
      removeVisitor(id);
    }
  });

  return (
    <group position={[moveConfig.startX, -3, moveConfig.z]} ref={ref}>
      <Billboard>
        <SpriteCharacter
          faceUrl={imageUrl}
          scale={moveConfig.scale}
          direction={-moveConfig.direction}
          spriteConfig={spriteConfig}
        />
        {spriteConfig?.showDebug && (
          <Text
            position={[0, (spriteConfig.bodyH ?? 2.2) * moveConfig.scale + 0.2, 0]}
            fontSize={0.13}
            color="yellow"
            outlineWidth={0.015}
            outlineColor="black"
            anchorX="center"
          >
            {`v:${Math.abs(moveConfig.speed).toFixed(1)} s:${moveConfig.scale.toFixed(2)}`}
          </Text>
        )}
      </Billboard>
    </group>
  );
}

function Scene() {
  const [visitors, setVisitors] = useState([]);
  const [connected, setConnected] = useState(false);
  const { camera } = useThree();
  const activePoolRef = useRef([]);
  const spawnRef = useRef(null);

  const spriteConfig = useControls('Personagem Sprite', {
    fps:           { value: 14,   min: 1,    max: 24,  step: 1,    label: 'FPS animação' },
    bodyH:         { value: 2.0,  min: 0.5,  max: 6.0, step: 0.1,  label: 'Altura corpo' },
    headYRatio:    { value: 0.82, min: 0.5,  max: 1.0, step: 0.01, label: 'Posição Y cabeça' },
    headSize:      { value: 0.54, min: 0.1,  max: 1.5, step: 0.02, label: 'Tamanho foto' },
    headXOffset:   { value: 0.0,  min: -0.5, max: 0.5, step: 0.01, label: 'Offset X cabeça' },
    headBob:       { value: true,                                    label: 'Movimento cabeça' },
    headBobAmp:    { value: 0.0,  min: 0.0,  max: 0.2, step: 0.005,label: 'Amplitude bob' },
    scaleMin:      { value: 1.2,  min: 0.3,  max: 3.0, step: 0.1,  label: 'Escala mín' },
    scaleMax:      { value: 1.4,  min: 0.3,  max: 3.0, step: 0.1,  label: 'Escala máx' },
    speedMin:      { value: 0.8,  min: 0.1,  max: 8.0, step: 0.1,  label: 'Vel. mín (u/s)' },
    speedMax:      { value: 1.2,  min: 0.1,  max: 8.0, step: 0.1,  label: 'Vel. máx (u/s)' },
    spawnInterval: { value: 0.1,  min: 0.1,  max: 10,  step: 0.1,  label: 'Intervalo spawn (s)' },
    showDebug:     { value: false,                                   label: 'Labels debug' },
    'Adicionar visitante': button(() => spawnRef.current?.()),
    'Remover todos':       button(() => setVisitors([])),
  });

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
    ? 'http://localhost:3001/visitors'
    : `http://${window.location.hostname}:3001/visitors`;

  useEffect(() => {
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    if (socket.connected) onConnect();

    // Polling periódico equivalente ao PhotoProvider da Unity (a cada 10s)
    const poll = () => {
      fetch(serverUrl)
        .then(res => res.json())
        .then(files => {
          if (files && files.length > 0) {
            setHistory(prev => Array.from(new Set([...prev, ...files])));
            // Atualiza o pool imediatamente com as fotos reais do servidor
            setActivePool(files.slice(0, 8));
            setApiError(false);
          }
        })
        .catch(() => setApiError(true));
    };

    poll();
    const pollInterval = setInterval(poll, 10000);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      clearInterval(pollInterval);
    };
  }, []);

  const [activePool, setActivePool] = useState([]);

  // Sync pool para ref (acessível em callbacks sem re-render)
  useEffect(() => { activePoolRef.current = activePool; }, [activePool]);

  useEffect(() => {
    const rotatePool = () => {
      if (history.length <= 1) return;
      const shuffled = [...history].sort(() => 0.5 - Math.random());
      setActivePool(shuffled.slice(0, 8));
    };
    const interval = setInterval(rotatePool, 15000);
    return () => clearInterval(interval);
  }, [history]);

  const spriteConfigRef = useRef(spriteConfig);
  useEffect(() => { spriteConfigRef.current = spriteConfig; }, [spriteConfig]);
  const lastSpawnRef = useRef(0);

  const makeMoveConfig = useCallback(() => {
    const cfg       = spriteConfigRef.current;
    const direction = Math.random() > 0.5 ? 1 : -1;
    const speed     = (cfg.speedMin + Math.random() * (cfg.speedMax - cfg.speedMin)) * direction;
    const scale     = cfg.scaleMin  + Math.random() * (cfg.scaleMax  - cfg.scaleMin);
    return { direction, speed, scale, startX: -25 * direction, z: 2 + Math.random() * 6 };
  }, []);

  const spawnOne = useCallback((imageUrl) => {
    const pool = activePoolRef.current;
    const url  = imageUrl ?? (pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : null);
    if (!url) { console.warn('[Spawn] Pool vazio — faça uma foto no booth primeiro'); return; }
    setVisitors(prev => [...prev, {
      id: Date.now() + Math.random(),
      imageUrl: url,
      moveConfig: makeMoveConfig(),
    }]);
  }, [makeMoveConfig]);

  // Expõe spawnOne para o botão Leva via ref estável
  useEffect(() => { spawnRef.current = spawnOne; }, [spawnOne]);

  useFrame((state) => {
    const now      = state.clock.elapsedTime;
    const interval = spriteConfigRef.current.spawnInterval ?? 2.0;
    if (visitors.length < MAX_VISITORS &&
        activePoolRef.current.length > 0 &&
        now - lastSpawnRef.current >= interval) {
      lastSpawnRef.current = now;
      const pool  = activePoolRef.current;
      const photo = pool[Math.floor(Math.random() * pool.length)];
      setVisitors(prev => [...prev, {
        id: Date.now() + Math.random(),
        imageUrl: photo,
        moveConfig: makeMoveConfig(),
      }]);
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
      const url = data.imageUrl;
      setHistory(h => [...h, url]);
      setActivePool(prev => Array.from(new Set([...prev, url])).slice(0, 8));
      // Booth → personagem entra imediatamente na cena
      setVisitors(prev => [...prev, {
        id: Date.now() + Math.random(),
        imageUrl: url,
        moveConfig: makeMoveConfig(),
      }]);
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
        {visitors.map(v => (
          <Visitor key={v.id} id={v.id} imageUrl={v.imageUrl} moveConfig={v.moveConfig} removeVisitor={removeVisitor} spriteConfig={spriteConfig} />
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
          {connected ? "● LIVE SCAN" : "○ SCANNING..."} | {visitors.length} PERSONS
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
