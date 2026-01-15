import React, { useCallback, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const BottomNavigation = React.memo(() => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // 현재 활성화된 탭 확인 (useCallback)
  const isActive = useCallback((path) => {
    if (path === '/main') {
      return location.pathname === '/main' || 
             location.pathname === '/' ||
             location.pathname.startsWith('/magazine');
    }
    if (path === '/search') {
      return location.pathname.startsWith('/search') || location.pathname.startsWith('/region');
    }
    if (path === '/upload') {
      return location.pathname === '/upload';
    }
    if (path === '/map') {
      return location.pathname === '/map';
    }
    if (path === '/profile') {
      return location.pathname.startsWith('/profile') || 
             location.pathname.startsWith('/settings') ||
             location.pathname.startsWith('/personal-info') ||
             location.pathname.startsWith('/password-change') ||
             location.pathname.startsWith('/account-') ||
             location.pathname.startsWith('/feed-update') ||
             location.pathname.startsWith('/notices') ||
             location.pathname.startsWith('/faq') ||
             location.pathname.startsWith('/inquiry') ||
             location.pathname.startsWith('/terms') ||
             location.pathname.startsWith('/coupons') ||
             location.pathname.startsWith('/points') ||
             location.pathname.startsWith('/exchange-success') ||
             location.pathname.startsWith('/badges');
    }
    return false;
  }, [location.pathname]);

  // 스크롤 감지 및 네비게이션 바 표시/숨김 처리
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          // 모든 가능한 스크롤 컨테이너에서 스크롤 위치 확인
          const windowScrollY = window.scrollY || document.documentElement.scrollTop || 0;
          
          // screen-content나 page-wrapper 같은 컨테이너의 스크롤도 확인
          const screenContent = document.querySelector('.screen-content');
          const pageWrapper = document.querySelector('.page-wrapper');
          const containerScrollY = screenContent?.scrollTop || pageWrapper?.scrollTop || 0;
          
          // 가장 큰 스크롤 값을 사용
          const currentScrollY = Math.max(windowScrollY, containerScrollY);

          // 아래로 스크롤 (20px 이상) - 네비게이션 바 숨김
          if (currentScrollY > lastScrollY && currentScrollY > 20) {
            setIsVisible(false);
          } 
          // 위로 스크롤 - 네비게이션 바 표시
          else if (currentScrollY < lastScrollY) {
            setIsVisible(true);
          }
          // 맨 위에 있을 때는 항상 표시
          else if (currentScrollY <= 20) {
            setIsVisible(true);
          }

          setLastScrollY(currentScrollY);
          ticking = false;
        });
        ticking = true;
      }
    };

    // 모든 스크롤 가능한 컨테이너에 이벤트 리스너 추가
    const scrollContainers = [
      window,
      document,
      document.querySelector('.screen-content'),
      document.querySelector('.page-wrapper'),
      document.querySelector('.screen-body')
    ].filter(Boolean);

    scrollContainers.forEach(container => {
      container.addEventListener('scroll', handleScroll, { passive: true });
    });

    // 초기 상태 설정
    handleScroll();

    return () => {
      scrollContainers.forEach(container => {
        container.removeEventListener('scroll', handleScroll);
      });
    };
  }, [lastScrollY]);

  return (
    <nav 
      className="flex-shrink-0 flex h-20 items-center justify-around border-t border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        width: '100%',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.05)',
        zIndex: 50,
        transform: isVisible ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform 0.3s ease-in-out'
      }}
    >
      <button 
        onClick={() => navigate('/main')}
        className={`flex flex-col items-center gap-1 ${
          isActive('/main') ? 'text-primary' : 'text-text-subtle-light dark:text-text-subtle-dark hover:text-primary transition-colors'
        }`}
      >
        <span className="material-symbols-outlined">home</span>
        <span className="text-xs font-bold">홈</span>
      </button>
      <button 
        onClick={() => navigate('/search')}
        className={`flex flex-col items-center gap-1 ${
          isActive('/search') ? 'text-primary' : 'text-text-subtle-light dark:text-text-subtle-dark hover:text-primary transition-colors'
        }`}
      >
        <span className="material-symbols-outlined">search</span>
        <span className="text-xs font-bold">검색</span>
      </button>
      <button 
        onClick={() => navigate('/upload')}
        className="flex flex-col items-center gap-1 relative"
        style={{
          background: '#00BCD4',
          borderRadius: '50%',
          width: '56px',
          height: '56px',
          justifyContent: 'center',
          alignItems: 'center',
          boxShadow: '0 4px 12px rgba(0, 188, 212, 0.3)',
          marginTop: '-8px'
        }}
      >
        <span className="material-symbols-outlined" style={{ color: 'white', fontSize: '28px' }}>add</span>
      </button>
      <button 
        onClick={() => navigate('/map')}
        className={`flex flex-col items-center gap-1 ${
          isActive('/map') ? 'text-primary' : 'text-text-subtle-light dark:text-text-subtle-dark hover:text-primary transition-colors'
        }`}
      >
        <span className="material-symbols-outlined">map</span>
        <span className="text-xs font-bold">지도</span>
      </button>
      <button 
        onClick={() => navigate('/profile')}
        className={`flex flex-col items-center gap-1 ${
          isActive('/profile') ? 'text-primary' : 'text-text-subtle-light dark:text-text-subtle-dark hover:text-primary transition-colors'
        }`}
      >
        <span className="material-symbols-outlined">person</span>
        <span className="text-xs font-bold">프로필</span>
      </button>
    </nav>
  );
});

BottomNavigation.displayName = 'BottomNavigation';

export default BottomNavigation;





























