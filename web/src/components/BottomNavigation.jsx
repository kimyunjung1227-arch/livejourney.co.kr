import React, { useCallback, useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const BottomNavigation = React.memo(() => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollTop = useRef(0);
  const scrollTimeout = useRef(null);

  // 스크롤 방향 감지 및 네비게이션 바 표시/숨김
  useEffect(() => {
    const handleScroll = () => {
      // 스크롤 컨테이너 찾기 (screen-content 또는 page-wrapper)
      const scrollContainer = document.querySelector('.screen-content') || 
                              document.querySelector('.page-wrapper') ||
                              document.documentElement ||
                              document.body;
      
      const currentScrollTop = scrollContainer.scrollTop || window.pageYOffset || document.documentElement.scrollTop;
      const scrollDifference = Math.abs(currentScrollTop - lastScrollTop.current);
      
      // 최소 스크롤 거리 (너무 작은 움직임은 무시)
      if (scrollDifference < 5) {
        return;
      }

      // 아래로 스크롤 (scrollTop 증가) = 숨기기
      if (currentScrollTop > lastScrollTop.current && currentScrollTop > 50) {
        setIsVisible(false);
      } 
      // 위로 스크롤 (scrollTop 감소) = 보이기
      else if (currentScrollTop < lastScrollTop.current) {
        setIsVisible(true);
      }
      
      // 맨 위에 있을 때는 항상 보이기
      if (currentScrollTop <= 10) {
        setIsVisible(true);
      }

      lastScrollTop.current = currentScrollTop;
    };

    // 스크롤 이벤트 리스너 등록 (throttle 적용)
    let ticking = false;
    const throttledHandleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    // 페이지 변경 시 스크롤 위치 초기화
    lastScrollTop.current = 0;
    setIsVisible(true);

    // 여러 스크롤 컨테이너에 이벤트 리스너 추가
    const addScrollListeners = () => {
      const scrollContainers = document.querySelectorAll('.screen-content, .page-wrapper');
      scrollContainers.forEach(container => {
        container.addEventListener('scroll', throttledHandleScroll, { passive: true });
      });
      window.addEventListener('scroll', throttledHandleScroll, { passive: true });
    };

    addScrollListeners();

    // MutationObserver로 동적으로 추가되는 스크롤 컨테이너도 감지
    const observer = new MutationObserver(() => {
      addScrollListeners();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    return () => {
      const scrollContainers = document.querySelectorAll('.screen-content, .page-wrapper');
      scrollContainers.forEach(container => {
        container.removeEventListener('scroll', throttledHandleScroll);
      });
      window.removeEventListener('scroll', throttledHandleScroll);
      observer.disconnect();
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
    };
  }, [location.pathname]);

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

  return (
    <nav 
      className="flex-shrink-0 flex h-20 items-center justify-around border-t border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark"
      style={{
        position: 'fixed',
        bottom: 0,
        left: '50%',
        transform: `translateX(-50%) ${isVisible ? 'translateY(0)' : 'translateY(100%)'}`,
        width: '100%',
        maxWidth: '414px',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.05)',
        zIndex: 50,
        transition: 'transform 0.3s ease-in-out',
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





























