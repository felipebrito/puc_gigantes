import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import CharacterLab from './CharacterLab.jsx'
import SpriteLab from './SpriteLab.jsx'

const isLab = window.location.search.includes('lab') || window.location.search.includes('debug');
const isChroma = window.location.search.includes('chroma') || window.location.search.includes('sprite');
console.log("🚀 PROJECTION APP LOADING... Mode:", isLab ? "LAB" : (isChroma ? "CHROMA" : "APP"));

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {isChroma ? <SpriteLab /> : (isLab ? <CharacterLab /> : <App />)}
  </StrictMode>,
)
