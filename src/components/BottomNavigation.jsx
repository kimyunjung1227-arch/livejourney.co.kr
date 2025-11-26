import React, { useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const BottomNavigation = React.memo(() => {
  const navigate = useNavigate();
  const location = useLocation();

  // 현재 활성화된 탭 확인 (useCallback)
  const isActive = useCallback((path) => {
    if (path === '/main') {
      return location.pathname === '/main' || location.pathname === '/';
    }
    if (path === '/search') {
      return location.pathname.startsWith('/search') || location.pathname.startsWith('/region');
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
        paddingBottom: 'env(safe-area-inset-bottom, 0px)'
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
        className="flex flex-col items-center gap-1 text-text-subtle-light dark:text-text-subtle-dark"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white hover:bg-primary/90 transition-colors">
          <span className="material-symbols-outlined !text-2xl">add</span>
        </div>
        <span className="text-xs font-bold text-text-subtle-light dark:text-text-subtle-dark">업로드</span>
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





























