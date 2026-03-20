import React, { useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import axios from 'axios';
import * as faceapi from 'face-api.js';
import { GooeyLoader } from './GooeyLoader';
import './BoothApp.css';

// Server URL - Update this if running on a different machine
const SERVER_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3000' 
  : 'http://192.168.1.171:3000';

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
    if (isCapturingRef.current || isProcessingRef.current || uploading) {
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

  // Customização Magistral: A Máscara varre as marcações faciais desenhando o contorno EXATO na parte de baixo (mandíbula/pescoço) e eliminando os ombros,
  // MAS deixa 100% da metade superior (Cabelo, Teto, Parede) incólume (raw) para que a IA Remova Fundo maravilhosamente no Servidor do MAC
  const applyLandmarkMask = async (blob) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = async () => {
          console.log("[LandmarkMask] Processing smart half-mask:", img.width, "x", img.height);

          const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.2 });
          let detection;
          try {
            detection = await faceapi.detectSingleFace(img, options).withFaceLandmarks();
          } catch (err) {
            resolve(blob);
            return;
          }

          if (!detection) {
            resolve(blob);
            return;
          }

          const landmarks = detection.landmarks;
          const jawline = landmarks.getJawOutline();
          const faceBox = detection.detection.box;
          const faceCenterX = faceBox.x + faceBox.width / 2;

          const adjustedJaw = jawline.map((p, i) => {
            let x = p.x;
            let y = p.y;
            const dx = p.x - faceCenterX;
            if (i <= 3 || i >= 13) x += Math.sign(dx) * 12; 
            
            // Adiciona um bom pedaço elegante de pescoço acompanhando o V do queixo
            if (i >= 6 && i <= 10) {
              const intensity = 1 - (Math.abs(8 - i) / 3); 
              y += 40 * intensity; // Estende para baixo exatamente a curvatura natural
            }
            return { x, y };
          });

          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');

          ctx.save();
          ctx.beginPath();

          // 1. COMEÇA O CORTE PRESERVANDO TODO O TOPO DA IMAGEM 
          ctx.moveTo(0, 0);                     // Topo Esquerdo
          ctx.lineTo(img.width, 0);             // Topo Direito
          ctx.lineTo(img.width, adjustedJaw[16].y); // Desce a borda direita até a altura do ponto da mandíbula

          // 2. CONECTA COM A MANDÍBULA e VARRE O CONTORNO INVERTIDO (Deletando todo o corpo abaixo da linha)
          ctx.lineTo(adjustedJaw[16].x, adjustedJaw[16].y);
          for (let i = 15; i >= 0; i--) {
            ctx.lineTo(adjustedJaw[i].x, adjustedJaw[i].y);
          }

          // 3. SOBE A MANDÍBULA DE VOLTA PARA A BORDA ESQUERDA
          ctx.lineTo(0, adjustedJaw[0].y);      
          ctx.closePath();
          ctx.clip(); // Cortamos cirurgicamente apenas abaixo do queixo!

          // O corpo/tórax abaixo da mandíbula desaparece sob invisibilidade. O teto/cabelos ficam 100% puros para a IA.
          ctx.drawImage(img, 0, 0);
          ctx.restore();

          canvas.toBlob((newBlob) => resolve(newBlob), 'image/png');
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(blob);
    });
  };

  const cropToFace = async (imageSrc) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = async () => {
        const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.3 });
        let detection;
        try {
          detection = await faceapi.detectSingleFace(img, options);
        } catch (err) {
          resolve(imageSrc);
          return;
        }

        if (!detection) {
          resolve(imageSrc);
          return;
        }

        const box = detection.box;
        const { x, y, width, height } = box;
        
        // Voltar ao aspecto clássico de 2.0 que não deforma/zooma o rosto
        const expansionFactor = 2.0; 
        const cropSize = Math.max(width, height) * expansionFactor;

        let cropX = (x + width / 2) - cropSize / 2;
        let cropY = (y + height / 2) - cropSize / 2;

        cropX = Math.max(0, Math.min(cropX, img.width - cropSize));
        cropY = Math.max(0, Math.min(cropY, img.height - cropSize));
        const actualCropSize = Math.min(cropSize, img.width - cropX, img.height - cropY);

        const canvas = document.createElement('canvas');
        canvas.width = 400; 
        canvas.height = 400;
        const ctx = canvas.getContext('2d');

        // Draw the full 2.0x crop (Pura, sem clearRect brutal de linha reta)
        ctx.drawImage(
          img,
          cropX, cropY, actualCropSize, actualCropSize, 
          0, 0, 400, 400
        );

        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => resolve(imageSrc);
      img.src = imageSrc;
    });
  };

  const sendPhoto = async () => {
    if (!imgSrc) return;

    console.log("[App] SendPhoto clicked");

    const rawImageToProcess = imgSrc;
    setImgSrc(null);

    isCapturingRef.current = false;

    const COOLDOWN_MS = 2000;
    cooldownTimeRef.current = Date.now() + COOLDOWN_MS;

    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);

    (async () => {
      isProcessingRef.current = true;
      setUploading(true); 
      try {
        console.log("[Upload] 📸 Starting background processing...");

        const croppedImage = await cropToFace(rawImageToProcess);
        
        const res = await fetch(croppedImage);
        let blob = await res.blob();

        try {
          blob = await applyLandmarkMask(blob);
          console.log("[Upload] ✅ Half-open jawline mask applied successfully");
        } catch(e) {
          console.error("Landmark mask failed", e);
        }

        // Envia a foto cortada no Jawline (mas com teto intacto) pro @imgly no servidor!
        const file = new File([blob], "visitor.png", { type: "image/png" });
        const formData = new FormData();
        formData.append('photo', file);

        await axios.post(`${SERVER_URL}/upload`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        console.log("[Upload] ✅ Upload completed!");

      } catch (error) {
        console.error("[Upload] ❌ Error", error);
      } finally {
        isProcessingRef.current = false;
        setUploading(false); // Re-enable controls
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
      <h1 className="title">Dinossauros POA</h1>

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
          className="webcam"
          style={{
            visibility: imgSrc ? 'hidden' : 'visible',
            position: 'absolute',
            top: 0,
            left: 0
          }}
          videoConstraints={{
            width: 500,
            height: 500,
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
              zIndex: 10
            }}
          />
        )}

        {/* Face Feedback Overlay */}
        {!imgSrc && !countingDown && (
          <div className="overlay-instruction" style={{
            color: isFaceValid ? '#4caf50' : 'white',
            fontWeight: 'bold',
            textShadow: '0 2px 4px rgba(0,0,0,0.8)',
            background: 'rgba(0,0,0,0.3)',
            padding: '5px 10px',
            borderRadius: '5px'
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
          height: '400px', // Match camera height
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
