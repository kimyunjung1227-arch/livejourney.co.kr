import { useRef, useCallback } from 'react';
import { useTabBar } from '../contexts/TabBarContext';

/**
 * 스크롤에 따라 네비게이션 바를 숨기고 보이게 하는 훅
 * FlatList나 직접 ScrollView를 사용하는 경우에 사용
 */
export const useScrollTabBar = (enabled = true) => {
  const { hideTabBar, showTabBar } = useTabBar();
  const scrollY = useRef(0);

  const handleScroll = useCallback((event) => {
    if (!enabled) return;
    
    const currentScrollY = event.nativeEvent.contentOffset.y;
    const scrollingDown = currentScrollY > scrollY.current;
    const scrollingUp = currentScrollY < scrollY.current;
    const scrollDelta = Math.abs(currentScrollY - scrollY.current);
    
    // 스크롤 방향에 따라 네비게이션 바 숨기기/보이기
    if (scrollDelta > 5) { // 최소 스크롤 거리
      if (scrollingDown && currentScrollY > 50) {
        // 아래로 스크롤하면 네비게이션 바 숨기기
        hideTabBar();
      } else if (scrollingUp) {
        // 위로 스크롤하면 네비게이션 바 보이기
        showTabBar();
      }
    }
    
    scrollY.current = currentScrollY;
  }, [enabled, hideTabBar, showTabBar]);

  return handleScroll;
};
