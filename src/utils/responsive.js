/**
 * 반응형 디자인 유틸리티
 * 다양한 핸드폰 화면 크기에 대응
 */

import React from 'react';

// 화면 크기 브레이크포인트 (px)
export const BREAKPOINTS = {
  // 작은 화면 (iPhone SE, iPhone 12/13 mini 등)
  xs: 375,
  // 중간 화면 (iPhone 12/13/14, Galaxy S 시리즈 등)
  sm: 390,
  // 표준 화면 (iPhone 12/13/14 Pro, Galaxy Note 시리즈 등)
  md: 414,
  // 큰 화면 (iPhone 12/13/14 Pro Max, Galaxy S Ultra 등)
  lg: 428,
  // 초대형 화면 (Galaxy Fold, iPad Mini 등)
  xl: 768,
  // 태블릿 (iPad 등)
  xxl: 1024,
};

// 화면 크기 감지
export const getScreenSize = () => {
  if (typeof window === 'undefined') return 'md';
  
  const width = window.innerWidth;
  
  if (width < BREAKPOINTS.xs) return 'xs';
  if (width < BREAKPOINTS.sm) return 'sm';
  if (width < BREAKPOINTS.md) return 'md';
  if (width < BREAKPOINTS.lg) return 'lg';
  if (width < BREAKPOINTS.xl) return 'xl';
  return 'xxl';
};

// 화면 너비 가져오기
export const getScreenWidth = () => {
  if (typeof window === 'undefined') return 375;
  return window.innerWidth;
};

// 화면 높이 가져오기 (동적 뷰포트 높이)
export const getScreenHeight = () => {
  if (typeof window === 'undefined') return 812;
  // 동적 뷰포트 높이 사용 (주소창 고려)
  return window.innerHeight || window.visualViewport?.height || 812;
};

// 화면 비율 계산
export const getAspectRatio = () => {
  const width = getScreenWidth();
  const height = getScreenHeight();
  return width / height;
};

// 디바이스 타입 감지
export const getDeviceType = () => {
  const width = getScreenWidth();
  const height = getScreenHeight();
  const ratio = width / height;
  
  // 세로가 더 긴 경우 (일반 핸드폰)
  if (ratio < 0.7) return 'phone-portrait';
  // 가로가 더 긴 경우 (폴더블 펼침, 태블릿)
  if (ratio > 1.2) return 'tablet-landscape';
  // 거의 정사각형 (폴더블 접힘)
  if (ratio > 0.9 && ratio < 1.1) return 'foldable';
  
  return 'phone-portrait';
};

// 반응형 폰트 크기 계산
export const getResponsiveFontSize = (baseSize, scale = 1) => {
  const screenSize = getScreenSize();
  const width = getScreenWidth();
  
  // 화면 크기에 따른 스케일 팩터
  const scaleFactors = {
    xs: 0.9,   // 작은 화면: 90%
    sm: 0.95,  // 작은-중간: 95%
    md: 1.0,   // 표준: 100%
    lg: 1.05,  // 큰 화면: 105%
    xl: 1.1,   // 초대형: 110%
    xxl: 1.15, // 태블릿: 115%
  };
  
  const scaleFactor = scaleFactors[screenSize] || 1.0;
  const widthScale = Math.min(width / 375, 1.2); // 최대 120%까지
  
  return Math.round(baseSize * scaleFactor * scale * widthScale);
};

// 반응형 간격 계산
export const getResponsiveSpacing = (baseSpacing) => {
  const screenSize = getScreenSize();
  const width = getScreenWidth();
  
  const scaleFactors = {
    xs: 0.85,
    sm: 0.9,
    md: 1.0,
    lg: 1.1,
    xl: 1.2,
    xxl: 1.3,
  };
  
  const scaleFactor = scaleFactors[screenSize] || 1.0;
  const widthScale = Math.min(width / 375, 1.2);
  
  return Math.round(baseSpacing * scaleFactor * widthScale);
};

// 반응형 픽셀 변환 (vw/vh 기반)
export const vw = (value) => {
  if (typeof window === 'undefined') return `${value}px`;
  const width = window.innerWidth;
  return `${(value / 100) * width}px`;
};

export const vh = (value) => {
  if (typeof window === 'undefined') return `${value}px`;
  const height = window.innerHeight || window.visualViewport?.height || 812;
  return `${(value / 100) * height}px`;
};

// 최소/최대 크기 제한
export const clamp = (value, min, max) => {
  return Math.min(Math.max(value, min), max);
};

// 화면 크기별 클래스명 생성
export const getResponsiveClass = (baseClass) => {
  const screenSize = getScreenSize();
  return `${baseClass} ${baseClass}-${screenSize}`;
};

// 특정 화면 크기 이상일 때만 적용
export const isScreenSize = (minSize) => {
  const screenSize = getScreenSize();
  const sizes = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl'];
  const currentIndex = sizes.indexOf(screenSize);
  const minIndex = sizes.indexOf(minSize);
  return currentIndex >= minIndex;
};

// React Hook: 화면 크기 감지
export const useScreenSize = () => {
  const [screenSize, setScreenSize] = React.useState(getScreenSize());
  const [dimensions, setDimensions] = React.useState({
    width: getScreenWidth(),
    height: getScreenHeight(),
  });

  React.useEffect(() => {
    const handleResize = () => {
      setScreenSize(getScreenSize());
      setDimensions({
        width: getScreenWidth(),
        height: getScreenHeight(),
      });
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    
    // Visual Viewport API 지원 시 (모바일 브라우저 주소창 고려)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleResize);
      }
    };
  }, []);

  return {
    screenSize,
    width: dimensions.width,
    height: dimensions.height,
    isSmall: screenSize === 'xs' || screenSize === 'sm',
    isMedium: screenSize === 'md',
    isLarge: screenSize === 'lg' || screenSize === 'xl',
    isTablet: screenSize === 'xxl',
    deviceType: getDeviceType(),
  };
};

