import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import './utils/clearStorage'
import { requestNotificationPermission } from './utils/browserNotifications'
import { logger } from './utils/logger'

// Kakao Map API 대기 (index.html에서 script로 로드됨, 동적 로드 제거로 Referer/타이밍 이슈 방지)
const loadKakaoMapAPI = () => {
  return new Promise((resolve, reject) => {
    const tryResolve = () => {
      if (window.kakao && window.kakao.maps) {
        logger.log('✅ Kakao Map API 로드됨');
        window.kakao.maps.load(() => {
          logger.log('✅ Kakao Map API 초기화 완료');
          resolve(window.kakao);
        });
        return true;
      }
      return false;
    };

    if (tryResolve()) return;

    logger.log('📡 Kakao Map API 대기 중... (index.html 스크립트)');
    const deadline = Date.now() + 8000;
    const t = setInterval(() => {
      if (tryResolve()) {
        clearInterval(t);
        return;
      }
      if (Date.now() >= deadline) {
        clearInterval(t);
        logger.error('❌ Kakao Map API 로드 시간 초과. VITE_KAKAO_MAP_API_KEY와 카카오 콘솔 웹 도메인을 확인하세요.');
        reject(new Error('Kakao Map API 로드 시간 초과'));
      }
    }, 150);
  });
};

// GitHub Pages 리다이렉트 처리 (404.html에서 리다이렉트된 경우)
const handleGitHubPagesRedirect = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const redirectPath = urlParams.get('redirect');
  
  if (redirectPath) {
    // 리다이렉트 경로로 이동
    const newPath = redirectPath + window.location.search.replace(/[?&]redirect=[^&]*/, '').replace(/^\?/, '?') + window.location.hash;
    window.history.replaceState({}, '', newPath);
  }
};

// 앱 초기화 (Kakao는 백그라운드 로드, 앱은 즉시 표시)
const initApp = () => {
  handleGitHubPagesRedirect();

  // Kakao Map은 백그라운드에서 로드 (기다리지 않음 → 로드 시간 초과로 앱이 막히지 않음)
  loadKakaoMapAPI()
    .then(() => logger.log('🗺️ Kakao Map API 준비 완료'))
    .catch(() => logger.warn('⚠️ Kakao Map 로드 실패 또는 지연 (지도 화면에서만 제한됨)'));

  // 앱 즉시 렌더링
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
  logger.log('✅ 앱 렌더링 완료');

  setTimeout(() => {
    const user = localStorage.getItem('user');
    if (user) {
      requestNotificationPermission().then((ok) => {
        if (ok) logger.log('✅ 브라우저 알림 권한 허용됨');
      });
    }
  }, 2000);
};

// 앱 시작
initApp();





