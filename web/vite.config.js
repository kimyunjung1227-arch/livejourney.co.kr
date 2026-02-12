import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  publicDir: 'public',
  // GitHub Pages 서브 경로(/livejourney.co.kr/)에서 동작하도록 설정
  base: '/livejourney.co.kr/',
  server: {
    host: '0.0.0.0',
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    assetsDir: '',
    sourcemap: false,
    minify: false
  }
})





