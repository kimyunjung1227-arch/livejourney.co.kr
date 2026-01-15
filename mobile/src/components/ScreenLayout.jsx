/**
 * 웹과 동일한 레이아웃 구조 컴포넌트
 * screen-layout, screen-content, screen-body 구조를 React Native로 구현
 */
import React, { useRef, useCallback } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../constants/styles';
import { useTabBar } from '../contexts/TabBarContext';

export const ScreenLayout = ({ children, style }) => {
  return (
    <SafeAreaView style={[styles.screenLayout, style]} edges={['top']}>
      {children}
    </SafeAreaView>
  );
};

export const ScreenContent = ({ children, style, scrollable = true, refreshControl, onScroll, enableTabBarControl = true }) => {
  const { hideTabBar, showTabBar } = useTabBar();
  const scrollY = useRef(0);

  // 네비게이션 바 제어를 위한 기본 스크롤 핸들러
  const handleTabBarScroll = useCallback((event) => {
    if (!enableTabBarControl) return;
    
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
  }, [enableTabBarControl, hideTabBar, showTabBar]);

  // 사용자 정의 onScroll과 기본 핸들러를 결합
  const handleScroll = useCallback((event) => {
    handleTabBarScroll(event);
    if (onScroll) {
      onScroll(event);
    }
  }, [handleTabBarScroll, onScroll]);

  if (scrollable) {
    return (
      <ScrollView 
        style={[styles.screenContent, style]}
        contentContainerStyle={styles.screenContentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={refreshControl}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {children}
      </ScrollView>
    );
  }
  
  return (
    <View style={[styles.screenContent, style]}>
      {children}
    </View>
  );
};

export const ScreenHeader = ({ children, style }) => {
  return (
    <View style={[styles.screenHeader, style]}>
      {children}
    </View>
  );
};

export const ScreenBody = ({ children, style }) => {
  return (
    <View style={[styles.screenBody, style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  screenLayout: {
    flex: 1,
    width: '100%',
    backgroundColor: '#f8fafc', // 웹과 동일: background: #f8fafc
  },
  screenContent: {
    flex: 1,
  },
  screenContentContainer: {
    flexGrow: 1,
    paddingBottom: 100, // 하단 네비게이션 바(80px) + 여유 공간(20px)
  },
  screenHeader: {
    backgroundColor: 'transparent', // 웹과 동일: background: transparent
    // 웹에서는 border와 shadow가 없음
  },
  screenBody: {
    paddingBottom: 100, // 하단 네비게이션 바(80px) + 여유 공간(20px) (웹: paddingBottom: '100px')
    flex: 1, // 랜딩페이지: flex: 1
  },
});

