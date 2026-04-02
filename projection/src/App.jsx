import React, { useState, useEffect, useRef, useMemo, useCallback, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Text, Billboard, useGLTF, Environment, Sky, Html, Grid, useTexture, Stats } from '@react-three/drei';
import { GUI } from 'lil-gui';
import * as THREE from 'three';
import { EffectComposer, DepthOfField, BrightnessContrast, HueSaturation, Vignette, Bloom, Noise } from '@react-three/postprocessing';
import io from 'socket.io-client';
import './App.css';

// Warp imports
import { useWarpState } from './hooks/useWarpState';
import { WarpCanvas } from './components/WarpCanvas';
import { WarpOverlay } from './components/WarpOverlay';
import { WarpShortcuts } from './components/WarpShortcuts';
import { BackgroundVideo } from './components/BackgroundVideo';

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

function Visitor({ id, imageUrl, removeVisitor, moveConfig, spriteConfigRef }) {
  const ref = useRef();
  useFrame((_, delta) => {
    if (!ref.current) return;
    ref.current.position.x += moveConfig.speed * delta;
    if ((moveConfig.direction === 1 && ref.current.position.x > 22) ||
      (moveConfig.direction === -1 && ref.current.position.x < -22)) {
      removeVisitor(id);
    }
  });

  return (
    <group position={[moveConfig.startX, -3 + (spriteConfigRef.current.spritesYOffset || 0) + (moveConfig.verticalJitter || 0), moveConfig.z]} ref={ref}>
      <Billboard>
        <SpriteCharacter
          faceUrl={imageUrl}
          scale={moveConfig.scale}
          direction={-moveConfig.direction}
          phaseOffset={moveConfig.phaseOffset ?? 0}
          spriteConfigRef={spriteConfigRef}
        />
        {spriteConfigRef?.current?.showDebug && (
          <Text
            position={[0, (spriteConfigRef.current.bodyH ?? 2.2) * moveConfig.scale + 0.2, 0]}
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

const PRESET_KEY = 'gigantes_preset_last';

const CONFIG_VERSION = 4;

const DEFAULT_CONFIG = {
  _v: CONFIG_VERSION,
  // Sprite
  fps: 14, bodyH: 2.0, headYRatio: 0.82, headSize: 0.54, headXOffset: 0.0,
  headBob: true, headBobAmp: 0.005,
  scaleMin: 1.2, scaleMax: 1.4,
  speedMin: 0.8, speedMax: 1.2,
  spawnInterval: 2.5, showDebug: false,
  spritesYOffset: 0.0,
  // Cores
  enableColors: false, brightness: 0, contrast: 0, hue: 0, saturation: 0,
  // Bloom
  enableBloom: false, bloomIntensity: 0.5, bloomLuminanceThreshold: 0.9,
  // Vignette
  enableVignette: false, vignetteDarkness: 0.5, vignetteOffset: 0.3,
  // Noise
  enableNoise: false, noiseOpacity: 0.15,
  // DoF
  enableDof: false, dofTargetZ: 0, dofFocalLength: 0.02, dofBokehScale: 2,
  // Warp (persisted in its own hook but synced for presets)
  warpEnabled: false,
  warpCols: 4,
  warpRows: 4,
  warpSubdiv: 12,
  enableBgVideo: false,
  bgVideoUrl: 'https://vjs.zencdn.net/v/oceans.mp4',
  bgVideoOpacity: 1.0,
  showDino: true,
  showFloor: true,
  showText: false,

  warpOffsets: [],
};

function loadSavedConfig() {
  try {
    const raw = localStorage.getItem(PRESET_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Saneamento de URL: Se for a URL antiga que costuma quebrar, reseta para a nova estável
      if (parsed.bgVideoUrl && parsed.bgVideoUrl.includes('commondatastorage')) {
        parsed.bgVideoUrl = DEFAULT_CONFIG.bgVideoUrl;
      }
      // Discard saves from older versions
      if (parsed._v === CONFIG_VERSION) return { ...DEFAULT_CONFIG, ...parsed };
      console.log('[Gigantes] Preset desatualizado — usando padrões');
    }
  } catch { }
  return { ...DEFAULT_CONFIG };
}

function Scene({ setSourceCanvas, warp, cfg, setCfg }) {
  const { camera, gl } = useThree();
  
  const [visitors, setVisitors] = useState([]);
  const [connected, setConnected] = useState(false);

  // Pass canvas ref up
  useEffect(() => {
    if (gl.domElement) setSourceCanvas(gl.domElement);
  }, [gl, setSourceCanvas]);
  const activePoolRef = useRef([]);

  // Sincroniza estado do Warp com o config global (CFG)
  const warpRef = useRef(warp);
  useEffect(() => { warpRef.current = warp; }, [warp]);

  // Sincroniza estado do Warp com o config global (CFG) - Versão estável com Ref
  const warpSync = useCallback(() => {
    const w = warpRef.current;
    setCfg(prev => ({
      ...prev,
      warpEnabled: w.state.enabled,
      warpCols: w.state.cols,
      warpRows: w.state.rows,
      warpOffsets: [...w.offsetsRef.current]
    }));
  }, []);

  // Exponha para o App poder chamar via atalho S
  useEffect(() => {
    window.__warpSync = warpSync;
    return () => { delete window.__warpSync; };
  }, [warpSync]);

  const spawnRef = useRef(null);

  const cfgRef = useRef(cfg);
  useEffect(() => { cfgRef.current = cfg; }, [cfg]);

  // Build lil-gui panel once
  useEffect(() => {
    const gui = new GUI({ title: 'Configurações' });
    const proxy = { ...cfgRef.current, editingWarp: !!warpRef.current?.state?.editing };

    // Atualiza o proxy local quando o cfg externo muda (vindo de presets ou shortcuts)
    const updateProxyFromCfg = (newCfg) => {
      Object.assign(proxy, newCfg);
      gui.controllersRecursive().forEach(c => c.updateDisplay());
    };

    // Expomos a atualização para uso externo
    window.__guiUpdate = updateProxyFromCfg;

    const sync = (key) => (v) => {
      proxy[key] = v;
      cfgRef.current = { ...cfgRef.current, [key]: v };
      setCfg(prev => ({ ...prev, [key]: v }));
    };

    const sprite = gui.addFolder('Personagem Sprite');
    sprite.add(proxy, 'fps', 1, 24, 1).name('FPS animação').onChange(sync('fps'));
    sprite.add(proxy, 'bodyH', 0.5, 6.0, 0.1).name('Altura corpo').onChange(sync('bodyH'));
    sprite.add(proxy, 'headYRatio', 0.5, 1.0, 0.01).name('Posição Y cabeça').onChange(sync('headYRatio'));
    sprite.add(proxy, 'headSize', 0.1, 1.5, 0.01).name('Tamanho foto').onChange(sync('headSize'));
    sprite.add(proxy, 'headXOffset', -0.5, 0.5, 0.01).name('Offset X cabeça').onChange(sync('headXOffset'));
    sprite.add(proxy, 'headBob').name('Movimento cabeça').onChange(sync('headBob'));
    sprite.add(proxy, 'headBobAmp', 0.0, 0.02, 0.0001).name('Amplitude bob').onChange(sync('headBobAmp'));
    sprite.add(proxy, 'scaleMin', 0.3, 3.0, 0.05).name('Escala mín').onChange(sync('scaleMin'));
    sprite.add(proxy, 'scaleMax', 0.3, 3.0, 0.05).name('Escala máx').onChange(sync('scaleMax'));
    sprite.add(proxy, 'speedMin', 0.1, 8.0, 0.1).name('Vel. mín (u/s)').onChange(sync('speedMin'));
    sprite.add(proxy, 'speedMax', 0.1, 8.0, 0.1).name('Vel. máx (u/s)').onChange(sync('speedMax'));
    sprite.add(proxy, 'spawnInterval', 0.5, 10, 0.5).name('Intervalo spawn (s)').onChange(sync('spawnInterval'));
    sprite.add(proxy, 'spritesYOffset', -5, 5, 0.01).name('Altura Visitantes (Y)').onChange(sync('spritesYOffset'));
    sprite.add(proxy, 'showDebug').name('Labels debug').onChange(sync('showDebug'));
    sprite.add({ adicionar: () => spawnRef.current?.() }, 'adicionar').name('▶ Adicionar visitante');
    sprite.add({ remover: () => setCfg(prev => { setVisitors([]); return prev; }) }, 'remover').name('✕ Remover todos');

    const fx = gui.addFolder('Pós-Processamento');

    const cores = fx.addFolder('Cores');
    cores.add(proxy, 'enableColors').name('Ativar').onChange(sync('enableColors'));
    cores.add(proxy, 'brightness', -1, 1, 0.001).name('Brilho').onChange(sync('brightness'));
    cores.add(proxy, 'contrast', -1, 1, 0.001).name('Contraste').onChange(sync('contrast'));
    cores.add(proxy, 'hue', -Math.PI, Math.PI, 0.001).name('Matiz').onChange(sync('hue'));
    cores.add(proxy, 'saturation', -1, 1, 0.001).name('Saturação').onChange(sync('saturation'));

    const bloom = fx.addFolder('Bloom');
    bloom.add(proxy, 'enableBloom').name('Ativar').onChange(sync('enableBloom'));
    bloom.add(proxy, 'bloomIntensity', 0, 5, 0.01).name('Intensidade').onChange(sync('bloomIntensity'));
    bloom.add(proxy, 'bloomLuminanceThreshold', 0, 1, 0.001).name('Threshold').onChange(sync('bloomLuminanceThreshold'));

    const vignette = fx.addFolder('Vignette');
    vignette.add(proxy, 'enableVignette').name('Ativar').onChange(sync('enableVignette'));
    vignette.add(proxy, 'vignetteDarkness', 0, 1, 0.001).name('Escurecimento').onChange(sync('vignetteDarkness'));
    vignette.add(proxy, 'vignetteOffset', 0, 1, 0.001).name('Offset').onChange(sync('vignetteOffset'));

    const noise = fx.addFolder('Noise (Film Grain)');
    noise.add(proxy, 'enableNoise').name('Ativar').onChange(sync('enableNoise'));
    noise.add(proxy, 'noiseOpacity', 0, 1, 0.001).name('Opacidade').onChange(sync('noiseOpacity'));

    const dof = fx.addFolder('Profundidade (DoF)');
    dof.add(proxy, 'enableDof').name('Ativar').onChange(sync('enableDof'));

    const bg = gui.addFolder('🏞️ Cenas / Ambiente');
    bg.add(proxy, 'enableBgVideo').name('Vídeo de Fundo').onChange(sync('enableBgVideo'));
    bg.add(proxy, 'bgVideoUrl').name('URL do Vídeo').onFinishChange(sync('bgVideoUrl'));
    bg.add(proxy, 'bgVideoOpacity', 0, 1, 0.01).name('Opacidade').onChange(sync('bgVideoOpacity'));
    bg.add(proxy, 'showDino').name('Mostrar Dinossauro').onChange(sync('showDino'));
    bg.add(proxy, 'showFloor').name('Mostrar Chão/Grid').onChange(sync('showFloor'));
    bg.add(proxy, 'showText').name('Mostrar Título').onChange(sync('showText'));

    dof.add(proxy, 'dofTargetZ', -20, 15, 0.1).name('Z Target (foco)').onChange(sync('dofTargetZ'));
    dof.add(proxy, 'dofFocalLength', 0, 0.1, 0.0001).name('Focal Length').onChange(sync('dofFocalLength'));
    dof.add(proxy, 'dofBokehScale', 0, 30, 0.01).name('Bokeh Scale').onChange(sync('dofBokehScale'));

    // Presets
    const presets = gui.addFolder('Presets');
    const presetProxy = { nome: 'preset1' };
    presets.add(presetProxy, 'nome').name('Nome do preset');
    presets.add({
      salvar: () => {
        const key = `gigantes_preset_${presetProxy.nome}`;
        localStorage.setItem(key, JSON.stringify(cfgRef.current));
        alert(`Preset "${presetProxy.nome}" salvo!`);
      }
    }, 'salvar').name('💾 Salvar preset');
    presets.add({
      carregar: () => {
        const key = `gigantes_preset_${presetProxy.nome}`;
        const raw = localStorage.getItem(key);
        if (!raw) { alert(`Preset "${presetProxy.nome}" não encontrado.`); return; }
        const parsed = JSON.parse(raw);
        Object.assign(proxy, parsed);
        gui.controllersRecursive().forEach(c => c.updateDisplay());
        setCfg({ ...DEFAULT_CONFIG, ...parsed });
      }
    }, 'carregar').name('📂 Carregar preset');
    presets.add({
      exportar: () => {
        const blob = new Blob([JSON.stringify(cfgRef.current, null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `${presetProxy.nome}.json`;
        a.click();
      }
    }, 'exportar').name('⬇️ Exportar JSON');
    presets.add({
      resetar: () => {
        Object.assign(proxy, DEFAULT_CONFIG);
        gui.controllersRecursive().forEach(c => c.updateDisplay());
        setCfg({ ...DEFAULT_CONFIG });
      }
    }, 'resetar').name('↩️ Resetar padrão');

    // --- Warp GUI ---
    const dist = gui.addFolder('📀 Distorção');

    dist.add(proxy, 'warpEnabled').name('Ativar Warp').onChange(v => {
      warpRef.current.setEnabled(v);
      warpSync();
    });

    dist.add(proxy, 'editingWarp').name('✏️ Editar Grid').onChange(v => {
      warpRef.current.setEditing(v);
    });

    dist.add(proxy, 'warpCols', 2, 10, 1).name('Colunas').onChange(v => {
      warpRef.current.setGrid(v, proxy.warpRows);
      warpSync();
    });
    dist.add(proxy, 'warpRows', 2, 10, 1).name('Linhas').onChange(v => {
      warpRef.current.setGrid(proxy.warpCols, v);
      warpSync();
    });
    dist.add(proxy, 'warpSubdiv', 1, 30, 1).name('Refinamento (Smooth)').onChange(sync('warpSubdiv'));


    dist.add({
      reset: () => {
        if (confirm('Resetar todo o grid?')) {
          warpRef.current.resetAll();
          warpSync();
        }
      }
    }, 'reset').name('↩ Resetar Grid');

    return () => gui.destroy();
  }, []);

  // Sincroniza estado do Warp APENAS se houver dados válidos no cfg
  useEffect(() => {
    if (cfg.warpOffsets && cfg.warpOffsets.length > 0) {
      const isSame = cfg.warpCols === warp.state.cols &&
        cfg.warpRows === warp.state.rows &&
        JSON.stringify(cfg.warpOffsets) === JSON.stringify(warp.offsetsRef.current);

      if (!isSame) {
        console.log('[Warp] Sincronizando com preset...');
        warp.setEnabled(cfg.warpEnabled);
        if (cfg.warpCols !== warp.state.cols || cfg.warpRows !== warp.state.rows) {
          warp.setGrid(cfg.warpCols, cfg.warpRows);
        }
        warp.offsetsRef.current = [...cfg.warpOffsets];
        warp.commitOffsets();
        // Atualiza a GUI para refletir mudanças do preset carregado
        if (window.__guiUpdate) window.__guiUpdate(cfg);
      }
    }
  }, [cfg.warpOffsets, cfg.warpCols, cfg.warpRows, cfg.warpEnabled]);

  // Aliases para manter compatibilidade com o resto do código
  const spriteConfig = cfg;
  const effectsConfig = cfg;

  // Fixa a câmera na posição cinematográfica
  useEffect(() => {
    camera.position.set(0, 0, 45);
    camera.lookAt(0, 0, 0);
  }, [camera]);

  const [history, setHistory] = useState([]);
  const [apiError, setApiError] = useState(false);
  const MAX_VISITORS = 10;

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
            // Preload textures so first spawn has no flicker
            files.forEach(url => useTexture.preload(url));
            setActivePool(files.slice(0, 10));
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

  const visitorsRef = useRef([]);
  useEffect(() => { visitorsRef.current = visitors; }, [visitors]);

  useEffect(() => {
    const rotatePool = () => {
      if (history.length === 0) return;
      // Mantém as 10 fotos mais recentes (history preserva ordem de chegada)
      setActivePool(history.slice(-10));
    };
    const interval = setInterval(rotatePool, 15000);
    return () => clearInterval(interval);
  }, [history]);

  const spriteConfigRef = cfgRef;
  const lastSpawnRef = useRef(0);

  const makeMoveConfig = useCallback(() => {
    const cfg = spriteConfigRef.current;
    const direction = Math.random() > 0.5 ? 1 : -1;
    const speed = (cfg.speedMin + Math.random() * (cfg.speedMax - cfg.speedMin)) * direction;
    const scale = cfg.scaleMin + Math.random() * (cfg.scaleMax - cfg.scaleMin);
    const verticalJitter = (Math.random() - 0.5) * 0.4; // Pequena varredura para não encavalar
    return { 
      direction, speed, scale, startX: -5 * direction, 
      z: 2 + Math.random() * 6, 
      phaseOffset: Math.random() * Math.PI * 2,
      verticalJitter
    };
  }, []);

  const spawnOne = useCallback((imageUrl) => {
    const pool = activePoolRef.current;
    const url = imageUrl ?? (pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : null);
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
    const now = state.clock.elapsedTime;
    const interval = spriteConfigRef.current.spawnInterval ?? 2.0;
    if (visitorsRef.current.length < MAX_VISITORS &&
      activePoolRef.current.length > 0 &&
      now - lastSpawnRef.current >= interval) {
      const pool = activePoolRef.current;
      const onScreen = new Set(visitorsRef.current.map(v => v.imageUrl));
      const available = pool.filter(url => !onScreen.has(url));
      if (available.length === 0) return; // todas as fotos do pool já estão na tela
      lastSpawnRef.current = now;
      const photo = available[Math.floor(Math.random() * available.length)];
      setVisitors(prev => [...prev, {
        id: Date.now() + Math.random(),
        imageUrl: photo,
        moveConfig: makeMoveConfig(),
      }]);
    }
  });

  const removeVisitor = (id) => {
    setVisitors(prev => prev.filter(v => v.id !== id));
  };

  useEffect(() => {
    const handleNewVisitor = (data) => {
      const url = data.imageUrl;
      useTexture.preload(url); // preload antes de spawnar
      setHistory(h => [...h, url]);
      // Pool = últimas 10 fotos (mais recente entra, mais antiga sai)
      setActivePool(prev => {
        const updated = Array.from(new Set([...prev, url]));
        return updated.slice(-10);
      });
      // Só spawna se a foto ainda não estiver na tela
      if (!visitorsRef.current.some(v => v.imageUrl === url)) {
        setVisitors(prev => [...prev, {
          id: Date.now() + Math.random(),
          imageUrl: url,
          moveConfig: makeMoveConfig(),
        }]);
      }
    };
    socket.on('new_visitor', handleNewVisitor);
    return () => socket.off('new_visitor', handleNewVisitor);
  }, []);

  const dofTargetVector = useMemo(() => new THREE.Vector3(0, 0, effectsConfig.dofTargetZ), [effectsConfig.dofTargetZ]);

  return (
    <>
      <ambientLight intensity={1.5} />
      <directionalLight position={[10, 20, 10]} intensity={2.0} castShadow />

      {!cfg.enableBgVideo && <Sky sunPosition={[100, 20, 100]} turbidity={0.1} rayleigh={0.5} />}
      <Environment preset="park" background={false} />

      {cfg.showFloor && (
        <>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -3.01, 0]} receiveShadow>
            <planeGeometry args={[1000, 1000]} />
            <meshStandardMaterial color="#444444" roughness={1} />
          </mesh>
          <Grid infiniteGrid sectionSize={2} cellSize={1} position={[0, -3, 0]} cellColor="#666" sectionColor="#fff" />
        </>
      )}

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

      {cfg.showDino && (
        <React.Suspense fallback={<mesh position={[0, 0, -10]}><boxGeometry args={[2, 6, 2]} /><meshBasicMaterial color="red" /></mesh>}>
          <group scale={3.0} position={[0, -3, -15]}>
            <Dinosaur />
          </group>
        </React.Suspense>
      )}

      <React.Suspense fallback={null}>
        {visitors.map(v => (
          <Visitor key={v.id} id={v.id} imageUrl={v.imageUrl} moveConfig={v.moveConfig} removeVisitor={removeVisitor} spriteConfigRef={cfgRef} />
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

      <EffectComposer disableNormalPass>
        <BrightnessContrast
          brightness={cfg.enableColors ? cfg.brightness : 0}
          contrast={cfg.enableColors ? cfg.contrast : 0}
        />
        <HueSaturation
          hue={cfg.enableColors ? cfg.hue : 0}
          saturation={cfg.enableColors ? cfg.saturation : 0}
        />
        <Bloom
          intensity={cfg.enableBloom ? cfg.bloomIntensity : 0}
          luminanceThreshold={cfg.bloomLuminanceThreshold}
          luminanceSmoothing={0.025}
        />
        <Vignette
          eskil={false}
          offset={cfg.vignetteOffset}
          darkness={cfg.enableVignette ? cfg.vignetteDarkness : 0}
        />
        <Noise
          opacity={cfg.enableNoise ? cfg.noiseOpacity : 0}
          premultiply
        />
        <DepthOfField
          target={dofTargetVector}
          focalLength={cfg.dofFocalLength}
          bokehScale={cfg.enableDof ? cfg.dofBokehScale : 0}
          height={480}
        />
      </EffectComposer>

      {cfg.showText && (
        <Billboard position={[0, 2.5, -15]}>
          <Text fontSize={0.5} color="white" outlineWidth={0.05} outlineColor="black">GIGANTES DE PORTO ALEGRE</Text>
          <Text position={[0, -0.3, 0]} fontSize={0.15} color={connected ? "#4caf50" : "#f44336"}>
            {connected ? "● LIVE SCAN" : "○ SCANNING..."} | {visitors.length} PERSONS
          </Text>
        </Billboard>
      )}
    </>
  );
}

export default function App() {
  const [sourceCanvas, setSourceCanvas] = useState(null);
  const sourceCanvasRef = useRef(null);
  useEffect(() => { sourceCanvasRef.current = sourceCanvas; }, [sourceCanvas]);

  const [cfg, setCfg] = useState(loadSavedConfig);

  // Auto-save on any change
  useEffect(() => {
    try { localStorage.setItem(PRESET_KEY, JSON.stringify(cfg)); } catch { }
  }, [cfg]);

  const warp = useWarpState();

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000', overflow: 'hidden', position: 'relative' }}>
      <WarpShortcuts
        warp={warp}
        onCommit={() => {
          warp.commitOffsets();
          // Força o sync com o config para salvar no PRESET_KEY também
          if (window.__warpSync) window.__warpSync();
        }}
        onMoveVertex={warp.moveVertexLive}
      />
      {/* Main R3F Canvas - hidden if warp is active and NOT editing (production) */}
      <div style={{
        width: '100%', height: '100%',
        opacity: (warp.state.enabled && !warp.state.editing) ? 0 : 1,
        pointerEvents: (warp.state.enabled && !warp.state.editing) ? 'none' : 'auto'
      }}>
        <Canvas
          shadows
          gl={{ preserveDrawingBuffer: true }} // Required to read as texture
          camera={{ fov: 10, position: [0, 0, 40], near: 0.1, far: 1000 }}
        >
          <Stats />
          <color attach="background" args={['#000']} />
          {/* Vídeo de fundo condicional para evitar overhead e hooks pendentes */}
          {cfg.enableBgVideo && (
            <Suspense fallback={null}>
              <BackgroundVideo
                url={cfg.bgVideoUrl}
                opacity={cfg.bgVideoOpacity}
              />
            </Suspense>
          )}
          <Scene setSourceCanvas={setSourceCanvas} warp={warp} cfg={cfg} setCfg={setCfg} />
        </Canvas>
      </div>

      {/* Warp Layer */}
      {warp.state.enabled && (
        <WarpCanvas
          sourceCanvasRef={sourceCanvasRef}
          cols={warp.state.cols}
          rows={warp.state.rows}
          subdiv={cfg.warpSubdiv || 12}
          offsetsRef={warp.offsetsRef}
          visible={warp.state.enabled}
        />
      )}

      {/* Edit Overlay */}
      {warp.state.editing && (
        <WarpOverlay
          cols={warp.state.cols}
          rows={warp.state.rows}
          offsetsRef={warp.offsetsRef}
          warp={warp}
          onMoveVertex={warp.moveVertexLive}
          onResetVertex={warp.resetVertex}
          onCommit={warp.commitOffsets}
        />
      )}
    </div>
  );
}
