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
          faceapi.nets.faceExpressionNet.loadFromUri('/models')
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

  const retake = () => {
    setImgSrc(null);
  };

  const cropToFace = async (imageSrc) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = async () => {
        const video = webcamRef.current.video;

        // Detect face again for cropping
        const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 512, scoreThreshold: 0.3 });
        const detection = await faceapi.detectSingleFace(video, options);

        if (!detection) {
          // No face found, return original
          console.warn("No face found for cropping, returning original");
          resolve(imageSrc);
          return;
        }

        const box = detection.box;
        const { x, y, width, height } = box;

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

        resolve(canvas.toDataURL('image/png'));
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
        console.log("Starting background processing...");

        // NEW: Crop to face FIRST
        const croppedImage = await cropToFace(rawImageToProcess);
        console.log("Face cropping complete");

        // Dynamic import
        const { removeBackground } = await import('@imgly/background-removal');

        // Remove Background from CROPPED image
        let blob;
        try {
          blob = await removeBackground(croppedImage, {
            model: 'small', // Use small model for speed
            progress: (key, current, total) => { /* quiet */ }
          });
        } catch (bgError) {
          console.error("BG Removal failed, uploading cropped without BG removal", bgError);
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
        console.log("Upload completed successfully in background");

      } catch (error) {
        console.error("Background upload totally failed", error);
        // We can't alert the user anymore as they might have walked away
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
