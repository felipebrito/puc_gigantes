import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import CharacterLab from './CharacterLab.jsx'

const isLab = window.location.search.includes('lab') || window.location.search.includes('debug');
console.log("🚀 PROJECTION APP LOADING... Mode:", isLab ? "LAB" : "APP");

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {isLab ? <CharacterLab /> : <App />}
  </StrictMode>,
)
