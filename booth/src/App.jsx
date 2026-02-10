import React, { useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import axios from 'axios';
import * as faceapi from 'face-api.js';
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

  // Check connection on load
  React.useEffect(() => {
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
          faceapi.nets.faceLandmark68Net.loadFromUri('/models') // REQUIRED for eye detection
        ]);
        console.log("FaceAPI Models Loaded Successfully");
        setLoadingModels(false);
        setFaceFeedback("Posicione seu rosto");
      } catch (e) {
        console.error("Error loading models", e);
        setFaceFeedback("Erro ao carregar IA");
        // Try to continue anyway? No, validation won't work.
      }
    };
    loadModels();
  }, []);

  // Face Detection Loop
  React.useEffect(() => {
    if (loadingModels || countingDown || imgSrc) return;

    const interval = setInterval(async () => {
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
          console.warn("Detection error, retrying without expressions", err);
          try {
            // Fallback: Just detect face
            const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 512, scoreThreshold: 0.3 });
            detection = await faceapi.detectSingleFace(video, options);
          } catch (err2) {
            console.error("Detection totally failed", err2);
            return;
          }
        }

        if (!detection) {
          setFaceFeedback("Rosto não encontrado");
          setIsFaceValid(false);
          return;
        }

        // Safe Access & Debugging
        // detecSingleFace().withFaceExpressions() returns Check: { detection: FaceDetection, expressions: ... }
        // OR standard FaceDetection extended.
        const box = detection.box || (detection.detection && detection.detection.box);

        if (!box) {
          console.warn("Detection object has no box:", detection);
          setFaceFeedback("Erro na detecção");
          setIsFaceValid(false);
          return;
        }

        const { x, y, width, height } = box;
        const videoW = video.videoWidth;
        const videoH = video.videoHeight;

        const centerX = x + width / 2;
        const centerY = y + height / 2;

        // Check centering (relative to video center)
        // Video center is videoW / 2
        // We want face to be in the center horizontally
        const isCenteredX = Math.abs(centerX - videoW / 2) < videoW * 0.15; // 15% tolerance

        // Check size (User must be close enough)
        // Face width should be at least 20% of video width?
        const isCloseEnough = width > videoW * 0.2;

        // Check vertical position (Should not be too low or too high?)
        // Let's rely mostly on simple presence + size for "validation" to avoid being annoying.

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
            setFaceFeedback("Sorriso detectado! 📸");
            // Debounce / Trigger
            if (!countingDown && !imgSrc) {
              startCapture();
            }
          }
        }

      }
    }, 200); // Check every 200ms

    return () => clearInterval(interval);
  }, [loadingModels, countingDown, imgSrc]);

  // Capture functionality
  const startCapture = () => {
    setCountingDown(true);
    setCountdown(3);

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev === 1) {
          clearInterval(interval);
          triggerCapture();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const triggerCapture = useCallback(() => {
    // 1. Get raw screenshot
    const imageSrc = webcamRef.current.getScreenshot();

    // Flash effect
    setFlash(true);
    setTimeout(() => setFlash(false), 200);

    // Show raw image immediately
    setImgSrc(imageSrc);
    setCountingDown(false);
  }, [webcamRef]);

  const removeShoulders = async (blob) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          console.log("[RemoveShoulders] Processing, original size:", img.width, "x", img.height);

          // Draw to canvas to access pixel data
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = img.width;
          tempCanvas.height = img.height;
          const tempCtx = tempCanvas.getContext('2d');
          tempCtx.drawImage(img, 0, 0);

          const imageData = tempCtx.getImageData(0, 0, img.width, img.height);
          const pixels = imageData.data;

          // Helper: Check if color is similar to reference
          const colorDistance = (r1, g1, b1, r2, g2, b2) => {
            return Math.sqrt(Math.pow(r1 - r2, 2) + Math.pow(g1 - g2, 2) + Math.pow(b1 - b2, 2));
          };

          // Sample skin color from center-top area (forehead/face)
          const sampleX = Math.floor(img.width / 2);
          const sampleY = Math.floor(img.height * 0.2); // 20% from top (face area)

          let skinR = 0, skinG = 0, skinB = 0;
          let skinSamples = 0;

          // Sample 20x20 area around center-top
          for (let dy = -10; dy <= 10; dy++) {
            for (let dx = -10; dx <= 10; dx++) {
              const x = sampleX + dx;
              const y = sampleY + dy;
              if (x >= 0 && x < img.width && y >= 0 && y < img.height) {
                const idx = (y * img.width + x) * 4;
                const alpha = pixels[idx + 3];
                if (alpha > 10) { // Non-transparent
                  skinR += pixels[idx];
                  skinG += pixels[idx + 1];
                  skinB += pixels[idx + 2];
                  skinSamples++;
                }
              }
            }
          }

          if (skinSamples === 0) {
            console.log("[RemoveShoulders] No skin reference found, returning original");
            resolve(blob);
            return;
          }

          // Average skin color
          skinR = Math.floor(skinR / skinSamples);
          skinG = Math.floor(skinG / skinSamples);
          skinB = Math.floor(skinB / skinSamples);

          console.log("[RemoveShoulders] Reference skin color: rgb(" + skinR + "," + skinG + "," + skinB + ")");

          // Scan from bottom up, find where skin STOPS
          let cropBottomY = img.height;

          for (let y = img.height - 1; y >= 0; y--) {
            let skinPixelsInRow = 0;
            let totalPixelsInRow = 0;

            // Check horizontal line
            for (let x = 0; x < img.width; x++) {
              const idx = (y * img.width + x) * 4;
              const alpha = pixels[idx + 3];

              if (alpha > 10) { // Non-transparent
                totalPixelsInRow++;
                const r = pixels[idx];
                const g = pixels[idx + 1];
                const b = pixels[idx + 2];

                // Check if this pixel is skin-colored (within threshold)
                const dist = colorDistance(r, g, b, skinR, skinG, skinB);
                if (dist < 80) { // Threshold for skin similarity
                  skinPixelsInRow++;
                }
              }
            }

            // If less than 40% of row is skin-colored, we've hit clothing/non-skin
            if (totalPixelsInRow > 0 && (skinPixelsInRow / totalPixelsInRow) < 0.4) {
              cropBottomY = y;
              console.log("[RemoveShoulders] Skin boundary detected at Y:", y,
                "skin%:", Math.floor((skinPixelsInRow / totalPixelsInRow) * 100));
              break;
            }
          }

          // Find top of content
          let topY = 0;
          for (let y = 0; y < img.height; y++) {
            for (let x = 0; x < img.width; x++) {
              const idx = (y * img.width + x) * 4;
              if (pixels[idx + 3] > 10) {
                topY = y;
                break;
              }
            }
            if (topY > 0) break;
          }

          const cropHeight = cropBottomY - topY;
          console.log("[RemoveShoulders] Cropping from Y", topY, "to", cropBottomY, "height:", cropHeight);

          // Create final canvas
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = cropHeight;
          const ctx = canvas.getContext('2d');

          // Draw only skin area
          ctx.drawImage(
            tempCanvas,
            0, topY, img.width, cropHeight,
            0, 0, img.width, cropHeight
          );

          console.log("[RemoveShoulders] ✅ Final size:", canvas.width, "x", canvas.height);

          // Convert back to blob
          canvas.toBlob((newBlob) => {
            resolve(newBlob);
          }, 'image/png');
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(blob);
    });
  };

  const retake = () => {
    setImgSrc(null);
  };

  const cropToFace = async (imageSrc) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = async () => {
        console.log("[Crop] Image loaded, detecting face WITH landmarks...");

        // Detect face WITH landmarks (eyes, nose, mouth)
        const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 512, scoreThreshold: 0.3 });
        let detection;

        try {
          detection = await faceapi.detectSingleFace(img, options).withFaceLandmarks();
        } catch (err) {
          console.error("[Crop] Face detection failed:", err);
          console.log("[Crop] Returning original image");
          resolve(imageSrc);
          return;
        }

        if (!detection) {
          console.warn("[Crop] No face found, returning original");
          resolve(imageSrc);
          return;
        }

        const landmarks = detection.landmarks;
        const box = detection.detection.box;

        if (!landmarks) {
          console.warn("[Crop] No landmarks found, using simple box crop");
          // Fallback to simple crop
          const { x, y, width, height } = box;
          const canvas = document.createElement('canvas');
          const size = Math.max(width, height) * 1.5;
          canvas.width = 300;
          canvas.height = 300;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, x - size / 4, y - size / 4, size, size, 0, 0, 300, 300);
          resolve(canvas.toDataURL('image/png'));
          return;
        }

        // Get eye positions
        const leftEye = landmarks.getLeftEye();
        const rightEye = landmarks.getRightEye();

        // Calculate eye center
        const leftEyeCenter = {
          x: leftEye.reduce((sum, p) => sum + p.x, 0) / leftEye.length,
          y: leftEye.reduce((sum, p) => sum + p.y, 0) / leftEye.length
        };
        const rightEyeCenter = {
          x: rightEye.reduce((sum, p) => sum + p.x, 0) / rightEye.length,
          y: rightEye.reduce((sum, p) => sum + p.y, 0) / rightEye.length
        };

        const eyesCenterX = (leftEyeCenter.x + rightEyeCenter.x) / 2;
        const eyesCenterY = (leftEyeCenter.y + rightEyeCenter.y) / 2;

        console.log("[Crop] Eyes center at:", eyesCenterX, eyesCenterY);

        // Reference images show:
        // - Eyes positioned in upper third (around 30-35% from top)
        // - Tight crop around face
        // - Output should be ~300x400px portrait

        const outputWidth = 300;
        const outputHeight = 400;

        // Position eyes at 30% from top
        const eyesYPositionRatio = 0.30;

        // Calculate crop area
        // If eyes are at 30% from top of output (120px in 400px image)
        // Then top of crop should be eyesCenterY - 120
        const cropTop = eyesCenterY - (outputHeight * eyesYPositionRatio);
        const cropBottom = cropTop + outputHeight;

        // Center horizontally on eyes
        const cropLeft = eyesCenterX - (outputWidth / 2);
        const cropRight = cropLeft + outputWidth;

        console.log("[Crop] Crop area:", {
          left: cropLeft,
          top: cropTop,
          width: outputWidth,
          height: outputHeight
        });

        // Create canvas
        const canvas = document.createElement('canvas');
        canvas.width = outputWidth;
        canvas.height = outputHeight;
        const ctx = canvas.getContext('2d');

        // Draw cropped portion
        ctx.drawImage(
          img,
          cropLeft, cropTop, outputWidth, outputHeight, // Source
          0, 0, outputWidth, outputHeight // Destination
        );

        console.log("[Crop] ✅ Cropping complete, size:", outputWidth, "x", outputHeight);
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

    // 1. Immediate Success Feedback to User
    const rawImageToProcess = imgSrc; // Capture current image
    setImgSrc(null); // Reset UI for next person immediately
    alert("Enviado! Sua foto aparecerá em breve.");

    // 2. Background Processing (Fire and Forget from UI perspective)
    (async () => {
      try {
        console.log("[Upload] 📸 Starting background processing...");

        // NEW: Crop to face FIRST
        const croppedImage = await cropToFace(rawImageToProcess);
        console.log("[Upload] ✅ Face cropping complete");

        // Dynamic import
        console.log("[Upload] Loading background removal library...");
        const { removeBackground } = await import('@imgly/background-removal');
        console.log("[Upload] Library loaded");

        // Remove Background from CROPPED image
        let blob;
        try {
          console.log("[Upload] Removing background...");
          blob = await removeBackground(croppedImage, {
            model: 'small', // Use small model for speed
            progress: (key, current, total) => { /* quiet */ }
          });
          console.log("[Upload] Background removed");

          // Step 3: Remove shoulders (crop bottom 25%)
          blob = await removeShoulders(blob);
          console.log("[Upload] ✅ Shoulders removed");

        } catch (bgError) {
          console.error("[Upload] BG Removal failed, uploading cropped without BG removal", bgError);
          const res = await fetch(croppedImage);
          blob = await res.blob();
        }

        // Upload
        console.log("[Upload] Uploading file...");
        const file = new File([blob], "visitor.png", { type: "image/png" });
        const formData = new FormData();
        formData.append('photo', file);

        const response = await axios.post(`${SERVER_URL}/upload`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        console.log("[Upload] ✅ Upload completed successfully!", response.data);

      } catch (error) {
        console.error("[Upload] ❌ Background upload totally failed", error);
      }
    })();
  };

  return (
    <div className="booth-container">
      <h1 className="title">Dinossauros POA</h1>

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

      <div className="camera-wrapper">
        {imgSrc ? (
          <img src={imgSrc} alt="captured" className="webcam" />
        ) : (
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            className="webcam"
            videoConstraints={{
              width: 500,
              height: 500,
              facingMode: "user"
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

      <div className="controls">
        {!imgSrc && !countingDown && (
          <button
            className="btn"
            onClick={startCapture}
            disabled={!isFaceValid && !loadingModels}
            style={{ opacity: isFaceValid ? 1 : 0.5, cursor: isFaceValid ? 'pointer' : 'not-allowed' }}
          >
            Tirar Foto
          </button>
        )}

        {imgSrc && (
          <>
            <button className="btn btn-secondary" onClick={retake} disabled={uploading}>
              Tentar De Novo
            </button>
            <button className="btn" onClick={sendPhoto} disabled={uploading}>
              {uploading ? 'Enviando...' : 'Enviar'}
            </button>
          </>
        )}
      </div>

      <div className={`flash ${flash ? 'active' : ''}`} />
    </div>
  );
}

export default App;
