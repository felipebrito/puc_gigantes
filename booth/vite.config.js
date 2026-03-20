import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react()
  ],
  server: {
    host: '0.0.0.0', // Expose explicitly to IPv4 network
    port: 5300,
    strictPort: true
  }
})
