import React, { useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import axios from 'axios';
import * as faceapi from 'face-api.js';
import { GooeyLoader } from './GooeyLoader';
import './BoothApp.css';

// Server URL - Update this if running on a different machine
const SERVER_URL = window.location.hostname === 'localhost' 
  ? 'https://localhost:3000' 
  : 'https://192.168.1.171:3000';

function App() {
  const webcamRef = useRef(null);
  const [imgSrc, setImgSrc] = useState(null);
  const [countingDown, setCountingDown] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [flash, setFlash] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loadingModels, setLoadingModels] = useState(true);
  const [faceFeedback, setFaceFeedback] = useState("Carregando IA...");
  const [isFaceValid, setIsFaceValid] = useState(false);
  const [serverOnline, setServerOnline] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false); // NEW: Non-blocking success state

  // Refs to prevent race conditions and immediate re-triggering
  const isCapturingRef = useRef(false);
  const cooldownTimeRef = useRef(0); // Timestamp when cooldown expires
  const isProcessingRef = useRef(false); // Track if we are crunching numbers
  const uploadingRef = useRef(false); // Mirror of uploading state — avoids stale closure in setInterval
  const timerRef = useRef(null); // Track the active countdown interval

  // Check connection on load
  React.useEffect(() => {
    // ... (existing fetch) ...
    fetch(SERVER_URL)
      .then(() => setServerOnline(true))
      .catch(() => setServerOnline(false));

    // Load Face API Models
    const loadModels = async () => {
      try {
        console.log("Loading FaceAPI Models...");
        // Reverted to raw relative absolute path so Capacitor maps it correctly to public/
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
          faceapi.nets.faceExpressionNet.loadFromUri('/models'),
          faceapi.nets.faceLandmark68Net.loadFromUri('/models') // For precise face contour
        ]);
        console.log("FaceAPI Models Loaded Successfully");
        setLoadingModels(false);
        setFaceFeedback("Posicione seu rosto");
      } catch (e) {
        console.error("Error loading models", e);
        setFaceFeedback("Erro IA: " + (e.message || String(e)));
      }
    };
    loadModels();
  }, []);

  // Face Detection Loop
  React.useEffect(() => {
    if (loadingModels || countingDown || imgSrc) return;
    console.log("[Effect] Restarting detection loop with:", { loadingModels, countingDown, imgSrc });

    const interval = setInterval(async () => {
      // Diagnostic Log - UNCOMMENTED FOR DEBUGGING
      console.log("[Loop] Tick. Refs:", {
        capturing: isCapturingRef.current,
        processing: isProcessingRef.current,
        cooldownTime: cooldownTimeRef.current,
        remaining: Math.max(0, cooldownTimeRef.current - Date.now()),
        videoReady: webcamRef.current?.video?.readyState
      });

      // Check refs to bail out early if we are locked/cooling down OR processing a previous photo
      if (isCapturingRef.current || isProcessingRef.current || Date.now() < cooldownTimeRef.current) return;

      if (webcamRef.current && webcamRef.current.video && webcamRef.current.video.readyState === 4) {
        const video = webcamRef.current.video;

        // Detect face
        let detection;
        try {
          // Options: inputSize=224 for significantly lighter tablet execution, scoreThreshold=0.3 to be lenient
          const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.3 });

          // Try with expressions
          detection = await faceapi.detectSingleFace(video, options).withFaceExpressions();
        } catch (err) {
          // ... (keep fallback) ...
          return;
        }

        if (!detection) {
          setFaceFeedback("Rosto não encontrado");
          setIsFaceValid(false);
          return;
        }

        const box = detection.box || (detection.detection && detection.detection.box);
        if (!box) {
          // ...
          return;
        }

        const { x, y, width, height } = box;
        const videoW = video.videoWidth;
        const videoH = video.videoHeight;

        const centerX = x + width / 2;
        const isCenteredX = Math.abs(centerX - videoW / 2) < videoW * 0.15; // 15% tolerance
        const isCloseEnough = width > videoW * 0.2;

        if (!isCloseEnough) {
          setFaceFeedback("Aproxime-se mais");
          setIsFaceValid(false);
        } else if (!isCenteredX) {
          setFaceFeedback("Centralize o rosto");
          setIsFaceValid(false);
        } else {
          setFaceFeedback("Perfeito! Sorria!");
          setIsFaceValid(true);

          // Smile Trigger
          if (detection.expressions && detection.expressions.happy > 0.7) {
            // Ensure we aren't already capturing or in cooldown
            if (!isCapturingRef.current && Date.now() > cooldownTimeRef.current && !countingDown && !imgSrc) {
              console.log("[DEBUG] Smile detected! Triggering capture.");
              setFaceFeedback("Sorriso detectado! 📸");
              startCapture();
            } else {
              // Optional sparse logging to avoid spam
              if (Math.random() < 0.05) {
                console.log("[DEBUG] Smile ignored. Locked/Cooling:", {
                  capturing: isCapturingRef.current,
                  cooldown: cooldownRef.current,
                  countingDown,
                  hasImg: !!imgSrc
                });
              }
            }
          }
        }
      }
    }, 1000); // Relax checks to every 1000ms to save CPU & Battery on Tablets

    return () => clearInterval(interval);
  }, [loadingModels, countingDown, imgSrc]);

  // Capture functionality
  // Capture functionality
  const startCapture = () => {
    if (isCapturingRef.current || isProcessingRef.current || uploadingRef.current) {
      console.warn("[DEBUG] startCapture blocked: Busy (Capturing/Processing/Uploading)");
      return;
    }
    console.log("[DEBUG] startCapture initiated");
    isCapturingRef.current = true;

    // Safety: Clear any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setCountingDown(true);
    setCountdown(3);

    let localCount = 3;
    timerRef.current = setInterval(() => {
      localCount -= 1;
      console.log("[DEBUG] Countdown tick:", localCount);
      setCountdown(localCount);

      if (localCount <= 0) {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        triggerCapture();
      }
    }, 1000);
  };

  const triggerCapture = useCallback(() => {
    console.log("[DEBUG] triggerCapture executed");

    // Clear timer if it's still running
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // 1. Get raw screenshot
    const imageSrc = webcamRef.current.getScreenshot();

    // Flash effect
    setFlash(true);
    setTimeout(() => setFlash(false), 200);

    // Show raw image immediately
    setImgSrc(imageSrc);
    setCountingDown(false);

    // Release capture lock
    console.log("[DEBUG] Capture lock released");
    isCapturingRef.current = false;
  }, [webcamRef]);

  const retake = () => {
    console.log("[DEBUG] Retake clicked - resetting state");

    // Clear any pending countdown
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setCountingDown(false);

    setImgSrc(null);
    isCapturingRef.current = false; // FORCE RESET
    console.log("[DEBUG] isCapturingRef set to false");
    // Cooldown prevents immediate re-trigger by smile
    const COOLDOWN_MS = 2000;
    cooldownTimeRef.current = Date.now() + COOLDOWN_MS;
    console.log(`[DEBUG] Cooldown applied until: ${cooldownTimeRef.current}`);
  };

  // Crop preciso: usa jawPoints[8] (ponta exata do queixo) em vez de max(jawPoints)
  // que pode pegar pontos laterais da mandíbula mais baixos que o queixo real.
  // Detecta o rosto no video (não na screenshot) para evitar problemas de EXIF/rotação
  const detectFaceBox = async () => {
    const video = webcamRef.current?.video;
    if (!video) return null;
    const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.3 });
    const det = await faceapi.detectSingleFace(video, options).withFaceLandmarks();
    if (!det) return null;
    const { x, y, width, height } = det.detection.box;
    const jawPoints = det.landmarks.getJawOutline();
    const chinY = Math.max(...jawPoints.map(p => p.y));
    const vw = video.videoWidth, vh = video.videoHeight;
    // Normaliza para 0-1 relativo ao video
    return {
      left:   Math.max(0, (x - width  * 0.5) / vw),
      top:    Math.max(0, (y - height * 0.8) / vh),
      right:  Math.min(1, (x + width  * 1.5) / vw),
      bottom: Math.min(1, chinY / vh),
      vw, vh
    };
  };

  const sendPhoto = async () => {
    if (!imgSrc) return;
    const raw = imgSrc;
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
        console.log('[Upload] iniciando, detectando rosto...');
        const faceBox = await detectFaceBox();
        console.log('[Upload] faceBox:', faceBox);
        console.log('[Upload] convertendo imagem...');
        const byteString = atob(raw.split(',')[1]);
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
        const blob = new Blob([ab], { type: 'image/jpeg' });
        const formData = new FormData();
        formData.append('photo', new File([blob], 'visitor.jpg', { type: 'image/jpeg' }));
        if (faceBox) formData.append('faceBox', JSON.stringify(faceBox));
        console.log('[Upload] enviando para servidor...');
        await axios.post(`${SERVER_URL}/upload`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
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
      document.documentElement.requestFullscreen().catch((err) => {
        console.log("Error attempting to enable full-screen mode:", err.message);
      });
    }
  };

  return (
    <div className="booth-container" onClick={goFullscreen}>
      {/* Success Overlay */}
      {showSuccess && (
        <div style={{
          position: 'absolute',
          top: '20%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(0, 255, 0, 0.8)',
          color: 'white',
          padding: '20px 40px',
          borderRadius: '10px',
          fontSize: '2rem',
          fontWeight: 'bold',
          zIndex: 9999,
          pointerEvents: 'none', // click-through
          animation: 'fadeInOut 3s ease-in-out'
        }}>
          ✅ Foto Enviada!
        </div>
      )}

      {!serverOnline && (
        <div style={{ background: 'orange', color: 'black', padding: '10px', marginBottom: '20px', borderRadius: '8px' }}>
          ⚠️ Conexão insegura bloqueada!
          <br />
          <a href={SERVER_URL} target="_blank" rel="noopener noreferrer" style={{ fontWeight: 'bold' }}>
            CLIQUE AQUI e aceite o certificado (Avançado -&gt; Ir para...)
          </a>
          <br />
          Depois recarregue esta página.
        </div>
      )}

      <div className="camera-wrapper" style={{ display: uploading ? 'none' : 'block' }}>
        {/* Always keep Webcam mounted to avoid re-init delays */}
        <Webcam
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          mirrored={true}
          className="webcam"
          style={{
            visibility: imgSrc ? 'hidden' : 'visible',
            position: 'absolute',
            top: 0,
            left: 0
          }}
          videoConstraints={{
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: "user"
          }}
        />

        {imgSrc && (
          <img
            src={imgSrc}
            alt="captured"
            className="webcam"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              zIndex: 10,
              transform: 'scaleX(-1)' // Mirroring the frozen photo
            }}
          />
        )}

        {/* Face Feedback Overlay */}
        {!imgSrc && !countingDown && (
          <div className="overlay-instruction" style={{
            color: isFaceValid ? '#afff4d' : 'white',
          }}>
            {faceFeedback}
          </div>
        )}

        {countingDown && <div className="countdown">{countdown > 0 ? countdown : ''}</div>}
      </div>

      {uploading && (
        <div className="processing-overlay" style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%', // Match camera height
          width: '100%'
        }}>
          <GooeyLoader
            primaryColor="var(--primary)"
            secondaryColor="#ffffff"
          />
          <h2 style={{ marginTop: '2rem', color: 'var(--light)', fontSize: '1.2rem', fontWeight: '300' }}>
            Processando sua foto mágica...
          </h2>
          <p style={{ color: '#888', fontSize: '0.9rem' }}>Aguarde um momento</p>
        </div>
      )}

      {!uploading && (
        <div className="controls">
          {uploading ? (
            <GooeyLoader
              primaryColor="var(--primary)"
              secondaryColor="#ffffff"
            />
          ) : (
            <>
              {!imgSrc && !countingDown && (
                <button
                  className="btn"
                  onClick={startCapture}
                  disabled={!isFaceValid && !loadingModels}
                  style={{
                    opacity: isFaceValid ? 1 : 0.5,
                    cursor: isFaceValid ? 'pointer' : 'not-allowed'
                  }}
                >
                  Tirar Foto
                </button>
              )}

              {imgSrc && (
                <>
                  <button className="btn btn-secondary" onClick={retake}>
                    Tentar De Novo
                  </button>
                  <button className="btn" onClick={sendPhoto}>
                    Enviar
                  </button>
                </>
              )}
            </>
          )}
        </div>
      )}

      <div className={`flash ${flash ? 'active' : ''}`} />
    </div>
  );
}

export default App;
