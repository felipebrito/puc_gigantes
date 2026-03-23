import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // basicSsl() // Desativado para evitar problemas de Mixed Content e Certificado em ambiente Local
  ],
  server: {
    host: '0.0.0.0', // Expose explicitly to IPv4 network
    port: 5300,
    strictPort: true
  }
})
