import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  publicDir: 'public',
  base: '/app/', // GitHub Pages를 위한 base 경로 설정
  server: {
    host: '0.0.0.0',
    port: 3000,
    open: true
  }
})





