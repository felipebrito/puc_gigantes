import React, { useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import axios from 'axios';
import * as faceapi from 'face-api.js';
import { GooeyLoader } from './GooeyLoader';
import './BoothApp.css';

// Server URL - Update this if running on a different machine
const SERVER_URL = window.location.hostname === 'localhost'
  ? 'https://localhost:3000'
  : `https://${window.location.hostname}:3000`;

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
        setFaceFeedback("Erro ao carregar IA");
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
          // Options: inputSize=512 for better accuracy (default 416), scoreThreshold=0.3 to be more lenient
          const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 512, scoreThreshold: 0.3 });

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
    }, 500); // Check every 500ms to save CPU

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

  // Apply precise face mask using landmarks detected directly on this image
  const applyLandmarkMask = async (blob) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = async () => {
          console.log("[LandmarkMask] Processing:", img.width, "x", img.height);

          // Re-detect face landmarks directly on THIS image (no coordinate transformation needed)
          const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.2 });
          let detection;

          try {
            detection = await faceapi.detectSingleFace(img, options).withFaceLandmarks();
          } catch (err) {
            console.error("[LandmarkMask] Face detection failed:", err);
            resolve(blob);
            return;
          }

          if (!detection) {
            console.warn("[LandmarkMask] No face found on processed image, returning as-is");
            resolve(blob);
            return;
          }

          const landmarks = detection.landmarks;
          const faceBox = detection.detection.box;
          console.log("[LandmarkMask] Face detected on processed image:", faceBox);

          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');

          // Get jawline points (17 points defining lower face contour)
          const jawline = landmarks.getJawOutline();

          // Use RAW jawline points - no expansion to avoid including neck/shoulders
          // Only add small horizontal padding for ears
          const faceCenterX = faceBox.x + faceBox.width / 2;
          const earPadding = 8;

          const adjustedJaw = jawline.map((p, i) => {
            let x = p.x;
            let y = p.y;

            const dx = p.x - faceCenterX;

            // Horizontal padding for EARS (Upper jaw points 0-3 and 13-16)
            // We expand these outwards to include ears
            if (i <= 3 || i >= 13) {
              x += Math.sign(dx) * 12; // Add 12px padding for ears
            }

            // Vertical padding for CHIN (points 6-10) to get neck start (V-Shape)
            // Point 8 is the absolute bottom of chin
            if (i >= 6 && i <= 10) {
              // Gradual extension: more at center (8), less at sides (6, 10)
              const intensity = 1 - (Math.abs(8 - i) / 3); // 1.0 at center, 0.33 at edges
              y += 30 * intensity; // Slightly deeper V (was 25)
            }

            return { x, y };
          });

          // Estimate forehead/hairline position
          const faceHeight = faceBox.height;
          const foreheadY = faceBox.y - (faceHeight * 0.55); // Space for hair

          console.log("[LandmarkMask] Jaw points:", adjustedJaw.length, "foreheadY:", foreheadY);

          // Build face contour path: forehead arc + jawline
          ctx.save();
          ctx.beginPath();

          // Start at jaw left, go up to forehead
          ctx.moveTo(adjustedJaw[0].x, adjustedJaw[0].y);
          ctx.lineTo(adjustedJaw[0].x - 15, foreheadY);

          // Arc across forehead/hair  
          ctx.quadraticCurveTo(
            (adjustedJaw[0].x + adjustedJaw[16].x) / 2, foreheadY - 40,
            adjustedJaw[16].x + 15, foreheadY
          );

          // Down to jaw right
          ctx.lineTo(adjustedJaw[16].x, adjustedJaw[16].y);

          // Follow jawline from right to left (EXACT contour)
          for (let i = 15; i >= 0; i--) {
            ctx.lineTo(adjustedJaw[i].x, adjustedJaw[i].y);
          }

          ctx.closePath();
          ctx.clip();

          // Draw image (only inside face contour)
          ctx.drawImage(img, 0, 0);
          ctx.restore();

          // Keep original 400x400 dimensions (no tight crop to avoid aspect ratio issues)
          console.log("[LandmarkMask] ✅ Face mask applied:", canvas.width, "x", canvas.height);

          canvas.toBlob((newBlob) => {
            resolve(newBlob);
          }, 'image/png');
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
        console.log("[Crop] Image loaded, detecting face from captured image...");

        // Detect face FROM THE IMAGE, not from video
        const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 512, scoreThreshold: 0.3 });
        let detection;

        try {
          detection = await faceapi.detectSingleFace(img, options);
        } catch (err) {
          console.error("[Crop] Face detection failed:", err);
          console.log("[Crop] Returning original image");
          resolve(imageSrc);
          return;
        }

        if (!detection) {
          // No face found, return original
          console.warn("[Crop] No face found, returning original");
          resolve(imageSrc);
          return;
        }

        const box = detection.box;
        const { x, y, width, height } = box;
        console.log("[Crop] Face detected:", { x, y, width, height });

        // Calculate crop area: 
        // - Center on face
        // - Include head + shoulders (expand face box)
        // - Make it square for consistency
        const expansionFactor = 2.0; // Include more area around face (2x the face width/height)
        const cropSize = Math.max(width, height) * expansionFactor;

        // Center crop on face center
        const faceCenterX = x + width / 2;
        const faceCenterY = y + height / 2;

        let cropX = faceCenterX - cropSize / 2;
        let cropY = faceCenterY - cropSize / 2;

        // Ensure crop stays within image bounds
        const imgWidth = img.width;
        const imgHeight = img.height;

        cropX = Math.max(0, Math.min(cropX, imgWidth - cropSize));
        cropY = Math.max(0, Math.min(cropY, imgHeight - cropSize));

        // Adjust if crop exceeds bounds
        const actualCropSize = Math.min(cropSize, imgWidth - cropX, imgHeight - cropY);

        // Create canvas for cropped image
        const canvas = document.createElement('canvas');
        canvas.width = 400; // Output size (square)
        canvas.height = 400;
        const ctx = canvas.getContext('2d');

        // Draw cropped portion, scaled to canvas
        ctx.drawImage(
          img,
          cropX, cropY, actualCropSize, actualCropSize, // Source crop
          0, 0, 400, 400 // Destination (full canvas)
        );

        console.log("[Crop] ✅ Cropping complete");
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = (err) => {
        console.error("[Crop] Image load error:", err);
        resolve(imageSrc);
      };
      img.src = imageSrc;
    });
  };







  const sendPhoto = async () => {
    if (!imgSrc) return;

    console.log("[App] SendPhoto clicked");

    // 1. Immediate Success Feedback to User
    const rawImageToProcess = imgSrc;
    setImgSrc(null);

    // Safety resets
    isCapturingRef.current = false;
    console.log("[DEBUG] sendPhoto: isCapturingRef set to false");

    // Activate Cooldown 
    const COOLDOWN_MS = 2000;
    cooldownTimeRef.current = Date.now() + COOLDOWN_MS;
    console.log(`[DEBUG] Cooldown applied until: ${cooldownTimeRef.current}`);

    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);

    // 2. Background Processing
    (async () => {
      isProcessingRef.current = true;
      setUploading(true); // Disable controls
      try {
        console.log("[Upload] 📸 Starting background processing...");

        // Crop to face FIRST
        const croppedImage = await cropToFace(rawImageToProcess);
        console.log("[Upload] ✅ Face cropping complete");

        // Dynamic import
        console.log("[Upload] Loading background removal library...");
        const { removeBackground } = await import('@imgly/background-removal');

        // Remove Background
        let blob;
        try {
          blob = await removeBackground(croppedImage, {
            model: 'small',
            progress: () => { }
          });

          // Apply precise face mask
          blob = await applyLandmarkMask(blob);
        } catch (bgError) {
          console.error("[Upload] BG Removal failed", bgError);
          const res = await fetch(croppedImage);
          blob = await res.blob();
        }

        // Upload
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

  return (
    <div className="booth-container">
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
