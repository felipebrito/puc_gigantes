import React, { useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import axios from 'axios';
import * as faceapi from 'face-api.js';
import { GooeyLoader } from './GooeyLoader';
import './BoothApp.css';

const SERVER_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? 'http://localhost:3001'
  : `https://${window.location.hostname}:3000`;

// Detecta modo pelo query param: /?calibrate
const IS_CALIBRATE = window.location.search.includes('calibrate');

// Lê configuração salva
function loadCfg(key, fallback) {
  const v = localStorage.getItem('booth-' + key);
  if (v === null) return fallback;
  if (typeof fallback === 'boolean') return v !== 'false';
  return parseFloat(v);
}

function App() {
  const webcamRef = useRef(null);
  const [imgSrc, setImgSrc]           = useState(null);
  const [flash, setFlash]             = useState(false);
  const [uploading, setUploading]     = useState(false);
  const [loadingModels, setLoadingModels] = useState(true);
  const [faceFeedback, setFaceFeedback] = useState('Carregando IA...');
  const [isFaceValid, setIsFaceValid] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Configurações de câmera (persistidas por tablet)
  const [zoom,       setZoom]       = useState(() => loadCfg('zoom',       1));
  const [offsetX,    setOffsetX]    = useState(() => loadCfg('offsetX',    0));
  const [offsetY,    setOffsetY]    = useState(() => loadCfg('offsetY',    0));
  const [brightness, setBrightness] = useState(() => loadCfg('brightness', 1));
  const [contrast,   setContrast]   = useState(() => loadCfg('contrast',   1));
  const [saturate,   setSaturate]   = useState(() => loadCfg('saturate',   1));
  const [isMirrored, setIsMirrored] = useState(() => loadCfg('mirrored',   true));

  const saveCfg = (key, val) => localStorage.setItem('booth-' + key, val);

  const isCapturingRef  = useRef(false);
  const cooldownTimeRef = useRef(0);
  const isProcessingRef = useRef(false);
  const uploadingRef    = useRef(false);
  const timerRef        = useRef(null);
  const sendPhotoRef    = useRef(null);

  // Persist settings on change
  React.useEffect(() => { saveCfg('zoom',       zoom);       }, [zoom]);
  React.useEffect(() => { saveCfg('offsetX',    offsetX);    }, [offsetX]);
  React.useEffect(() => { saveCfg('offsetY',    offsetY);    }, [offsetY]);
  React.useEffect(() => { saveCfg('brightness', brightness); }, [brightness]);
  React.useEffect(() => { saveCfg('contrast',   contrast);   }, [contrast]);
  React.useEffect(() => { saveCfg('saturate',   saturate);   }, [saturate]);
  React.useEffect(() => { saveCfg('mirrored',   isMirrored); }, [isMirrored]);

  // Load face API models
  React.useEffect(() => {
    (async () => {
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
          faceapi.nets.faceExpressionNet.loadFromUri('/models'),
          faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
        ]);
        setLoadingModels(false);
        setFaceFeedback('Posicione seu rosto');
      } catch (e) {
        setFaceFeedback('Erro IA: ' + (e.message || String(e)));
      }
    })();
  }, []);

  // Face detection loop
  React.useEffect(() => {
    if (loadingModels || imgSrc) return;
    const interval = setInterval(async () => {
      if (isCapturingRef.current || isProcessingRef.current || Date.now() < cooldownTimeRef.current) return;
      const video = webcamRef.current?.video;
      if (!video || video.readyState !== 4) return;

      let detection;
      try {
        const opts = new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.3 });
        detection = await faceapi.detectSingleFace(video, opts).withFaceExpressions();
      } catch { return; }

      if (!detection) { setFaceFeedback('Rosto não encontrado'); setIsFaceValid(false); return; }

      const box = detection.box || detection.detection?.box;
      if (!box) return;

      const { x, width } = box;
      const vw = video.videoWidth;
      const centerX = x + width / 2;
      const isCenteredX = Math.abs(centerX - vw / 2) < vw * 0.15;
      const isCloseEnough = width > vw * 0.2;

      if (!isCloseEnough) {
        setFaceFeedback('Aproxime-se mais'); setIsFaceValid(false);
      } else if (!isCenteredX) {
        setFaceFeedback('Centralize o rosto'); setIsFaceValid(false);
      } else {
        setFaceFeedback('Perfeito! Sorria! 😄'); setIsFaceValid(true);
        if (detection.expressions?.happy > 0.7 && !isCapturingRef.current && Date.now() > cooldownTimeRef.current) {
          startCapture();
        }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [loadingModels, imgSrc]);

  const startCapture = () => {
    if (isCapturingRef.current || isProcessingRef.current || uploadingRef.current) return;
    isCapturingRef.current = true;
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    triggerCapture();
  };

  const triggerCapture = useCallback(() => {
    const imageSrc = webcamRef.current.getScreenshot();
    setFlash(true); setTimeout(() => setFlash(false), 200);
    setImgSrc(imageSrc);
    isCapturingRef.current = false;

    // Inicia timer para enviar automaticamente após 3 segundos
    timerRef.current = setTimeout(() => {
      if (sendPhotoRef.current) {
        sendPhotoRef.current(imageSrc);
      }
    }, 3000);
  }, [webcamRef]);

  const retake = () => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    setImgSrc(null);
    isCapturingRef.current = false;
    cooldownTimeRef.current = Date.now() + 2000;
  };

  const detectFaceBox = async () => {
    const video = webcamRef.current?.video;
    if (!video) return null;
    const opts = new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.3 });
    const det = await faceapi.detectSingleFace(video, opts).withFaceLandmarks();
    if (!det) return null;
    const { x, y, width, height } = det.detection.box;
    const chinY = det.landmarks.getJawOutline()[8].y;
    const vw = video.videoWidth, vh = video.videoHeight;
    return {
      left:   Math.max(0, (x - width  * 0.25) / vw),
      top:    Math.max(0, (y - height * 0.6)  / vh),
      right:  Math.min(1, (x + width  * 1.25) / vw),
      bottom: Math.min(1, (chinY + height * 0.5) / vh),
      vw, vh,
    };
  };

  React.useEffect(() => {
    sendPhotoRef.current = sendPhoto;
  });

  const sendPhoto = async (overrideImgSrc) => {
    const raw = typeof overrideImgSrc === 'string' ? overrideImgSrc : imgSrc;
    if (!raw) return;
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    setImgSrc(null);
    isCapturingRef.current = false;
    cooldownTimeRef.current = Date.now() + 2000;
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
    (async () => {
      isProcessingRef.current = true;
      uploadingRef.current = true;
      setUploading(true);
      try {
        const faceBox = await detectFaceBox();
        const byteString = atob(raw.split(',')[1]);
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
        const blob = new Blob([ab], { type: 'image/jpeg' });
        const formData = new FormData();
        formData.append('photo', new File([blob], 'visitor.jpg', { type: 'image/jpeg' }));
        if (faceBox) formData.append('faceBox', JSON.stringify(faceBox));
        formData.append('cameraSettings', JSON.stringify({ zoom, offsetX, offsetY, brightness, contrast, saturate, isMirrored }));
        await axios.post(`${SERVER_URL}/upload`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      } catch (e) {
        console.error('[Upload] ❌', e);
      } finally {
        isProcessingRef.current = false;
        uploadingRef.current = false;
        setUploading(false);
      }
    })();
  };

  const goFullscreen = () => {
    if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  };

  const cameraTransform = `${isMirrored ? 'scaleX(-1)' : 'scaleX(1)'} scale(${zoom}) translate(${offsetX}%, ${offsetY}%)`;
  const cameraFilter    = `brightness(${brightness}) contrast(${contrast}) saturate(${saturate})`;

  // ─── Calibration mode ──────────────────────────────────────────────────────
  if (IS_CALIBRATE) {
    return (
      <div className="calibrate-container">
        {/* Left: live camera preview */}
        <div className="calibrate-camera">
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            className="webcam"
            style={{ transform: cameraTransform, filter: cameraFilter }}
            videoConstraints={{ width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' }}
          />
          <div className="face-guide" />
          <div className="overlay-instruction" style={{ color: isFaceValid ? '#afff4d' : 'white' }}>
            {loadingModels ? 'Carregando IA...' : faceFeedback}
          </div>
        </div>

        {/* Right: settings panel */}
        <div className="calibrate-panel">
          <h2>⚙️ Calibragem de Câmera</h2>
          <p className="calibrate-hint">Ajuste o enquadramento ao vivo. Configurações salvas automaticamente.</p>

          <div className="cal-section">ENQUADRAMENTO</div>
          <Slider label="Zoom" value={zoom}       min={1}   max={4}   step={0.05} format={v => v.toFixed(2) + '×'} onChange={v => setZoom(v)} />
          <Slider label="Horizontal" value={offsetX}  min={-50} max={50}  step={1}    format={v => v + '%'}           onChange={v => setOffsetX(v)} />
          <Slider label="Vertical"   value={offsetY}  min={-50} max={50}  step={1}    format={v => v + '%'}           onChange={v => setOffsetY(v)} />

          <div className="cal-section">IMAGEM</div>
          <Slider label="Brilho"     value={brightness} min={0.5} max={2} step={0.05} format={v => v.toFixed(2)} onChange={v => setBrightness(v)} />
          <Slider label="Contraste"  value={contrast}   min={0.5} max={2} step={0.05} format={v => v.toFixed(2)} onChange={v => setContrast(v)} />
          <Slider label="Saturação"  value={saturate}   min={0}   max={2} step={0.05} format={v => v.toFixed(2)} onChange={v => setSaturate(v)} />

          <label className="cal-flip">
            <input type="checkbox" checked={isMirrored} onChange={e => setIsMirrored(e.target.checked)} />
            <span>Espelhar câmera (Flip)</span>
          </label>

          <div className="cal-actions">
            <button className="cal-btn-reset" onClick={() => {
              setZoom(1); setOffsetX(0); setOffsetY(0);
              setBrightness(1); setContrast(1); setSaturate(1); setIsMirrored(true);
            }}>↩ Reset</button>
            <a className="cal-btn-go" href="/">✓ Ir para Kiosk</a>
          </div>
        </div>
      </div>
    );
  }

  // ─── Kiosk mode ─────────────────────────────────────────────────────────────
  return (
    <div className="kiosk-container" onClick={goFullscreen}>

      {/* Camera — fullscreen */}
      <Webcam
        audio={false}
        ref={webcamRef}
        screenshotFormat="image/jpeg"
        className="kiosk-camera"
        style={{
          visibility: imgSrc ? 'hidden' : 'visible',
          transform: cameraTransform,
          filter: cameraFilter,
        }}
        videoConstraints={{ width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' }}
      />

      {/* Captured photo preview */}
      {imgSrc && (
        <img
          src={imgSrc}
          alt="captured"
          className="kiosk-camera"
          style={{ position: 'absolute', top: 0, left: 0, zIndex: 5, transform: cameraTransform, filter: cameraFilter }}
        />
      )}

      {/* Vignette blur outside oval */}
      {!imgSrc && <div className="kiosk-vignette" />}

      {/* Face guide oval */}
      {!imgSrc && <div className={`face-guide${isFaceValid ? ' valid' : ''}`} />}

      {/* Feedback text */}
      {!imgSrc && (
        <div className="kiosk-feedback" style={{ color: isFaceValid ? '#afff4d' : 'rgba(255,255,255,0.9)' }}>
          {loadingModels ? '⏳ Carregando...' : faceFeedback}
        </div>
      )}

      {/* Photo review buttons */}
      {imgSrc && !uploading && (
        <div className="kiosk-review">
          <button className="kiosk-btn secondary" onClick={retake}>🔄 Tentar de Novo</button>
        </div>
      )}

      {/* Upload spinner */}
      {uploading && (
        <div className="kiosk-uploading">
          <GooeyLoader primaryColor="#0091ff" secondaryColor="#ffffff" />
          <p>Processando sua foto...</p>
        </div>
      )}

      {/* Success toast */}
      {showSuccess && <div className="kiosk-toast">✅ Foto enviada!</div>}

      {/* Flash */}
      <div className={`flash ${flash ? 'active' : ''}`} />
    </div>
  );
}

// Slider helper
function Slider({ label, value, min, max, step, format, onChange }) {
  return (
    <div className="cal-slider">
      <div className="cal-slider-header">
        <span>{label}</span>
        <span className="cal-slider-value">{format(value)}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
      />
    </div>
  );
}

export default App;
