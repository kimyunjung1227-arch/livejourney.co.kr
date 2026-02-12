import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  publicDir: 'public',
  // Vercel, 로컬 개발 모두에서 루트(/) 기준으로 동작하도록 설정
  // (예전 GitHub Pages 배포용 '/livejourney.co.kr/' 설정은 제거)
  base: '/',
  server: {
    host: '0.0.0.0',
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: false,
    copyPublicDir: false
  }
})





