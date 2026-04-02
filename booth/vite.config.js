import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react()
  ],
  server: {
    host: '0.0.0.0', // Expose explicitly to IPv4 network
    port: 5300,
    strictPort: true,
    https: {
      key:  fs.readFileSync(path.resolve(__dirname, '../server/server.key')),
      cert: fs.readFileSync(path.resolve(__dirname, '../server/server.cert')),
    }
  }
})
