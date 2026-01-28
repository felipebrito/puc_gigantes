import React, { useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import axios from 'axios';
import './BoothApp.css';

// Server URL - Update this if running on a different machine
const SERVER_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:3000'
  : `http://${window.location.hostname}:3000`;

function App() {
  const webcamRef = useRef(null);
  const [imgSrc, setImgSrc] = useState(null);
  const [countingDown, setCountingDown] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [flash, setFlash] = useState(false);
  const [uploading, setUploading] = useState(false);

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
    const imageSrc = webcamRef.current.getScreenshot();

    // flash effect
    setFlash(true);
    setTimeout(() => setFlash(false), 200);
    setTimeout(() => {
      setImgSrc(imageSrc);
      setCountingDown(false);
    }, 300);

  }, [webcamRef]);

  const retake = () => {
    setImgSrc(null);
  };

  const sendPhoto = async () => {
    if (!imgSrc) return;
    setUploading(true);

    try {
      // Convert base64 to blob
      const res = await fetch(imgSrc);
      const blob = await res.blob();
      const file = new File([blob], "visitor.jpg", { type: "image/jpeg" });

      const formData = new FormData();
      formData.append('photo', file);

      await axios.post(`${SERVER_URL}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      alert("Enviado para a pré-história!");
      setImgSrc(null); // Reset for next person
    } catch (error) {
      console.error("Upload failed", error);
      alert("Erro ao enviar. Verifique a conexão com o servidor.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="booth-container">
      <h1 className="title">Dinossauros POA</h1>

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

        {countingDown && <div className="countdown">{countdown > 0 ? countdown : ''}</div>}
      </div>

      <div className="controls">
        {!imgSrc && !countingDown && (
          <button className="btn" onClick={startCapture}>
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
