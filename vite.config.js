import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const buildId = (() => {
  try {
    // CI에서 BUILD_ID가 있으면 그걸 사용
    const envId = typeof process !== 'undefined' && process.env && process.env.BUILD_ID
      ? String(process.env.BUILD_ID).trim()
      : ''
    if (envId) return envId
  } catch {}
  // 로컬/기타 환경: 타임스탬프 기반
  return `${Date.now()}`
})()

export default defineConfig({
  define: {
    'import.meta.env.VITE_BUILD_ID': JSON.stringify(buildId),
  },
  plugins: [
    react(),
    {
      name: 'inject-build-meta',
      transformIndexHtml(html) {
        return html.replace(/__BUILD_ID__/g, buildId)
      },
    },
  ],
  publicDir: 'public',
  // livejourney.co.kr(커스텀 도메인)에서는 루트(/)에서 앱을 서빙해야 캐시/경로 이슈가 줄어듭니다.
  // (project pages 하위 경로로 배포할 때만 '/app/' 같은 base를 사용)
  base: '/',
  server: {
    host: '0.0.0.0',
    port: 3000,
    open: true
  }
})





