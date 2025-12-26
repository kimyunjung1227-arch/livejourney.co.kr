import { Platform } from 'react-native';

// 색상 상수 (웹 Tailwind와 완전히 동일)
export const COLORS = {
  // Primary (웹과 동일 - Live Blue)
  primary: '#00BCD4',           // Live Blue - 신뢰, 실시간, 스마트
  primaryDark: '#0097A7',       // Hover/Active 용 약간 더 딥한 블루
  primaryLight: '#E0F7FA',      // 배경/하이라이트용 소프트 블루
  
  // Background (웹과 동일)
  background: '#F9FAFB',
  backgroundLight: '#FFFFFF', // background-light
  backgroundDark: '#181410', // background-dark
  
  // Text (웹과 동일)
  text: '#181411', // text-light
  textDark: '#f8f7f5', // text-dark
  textPrimaryLight: '#212121', // text-primary-light
  textSecondaryLight: '#757575', // text-secondary-light
  textPrimaryDark: '#f8f7f5', // text-primary-dark
  textSecondaryDark: '#8d755e', // text-secondary-dark
  textSubtle: '#8a7560', // text-subtle-light
  textSubtleDark: '#a1988e', // text-subtle-dark
  textSecondary: '#757575',
  textWhite: '#FFFFFF',
  
  // Border (웹과 동일)
  border: '#E0E0E0',
  borderLight: '#e6e0db', // border-light
  borderDark: '#3c3329', // border-dark
  
  // Card (웹과 동일)
  cardLight: '#ffffff', // card-light
  cardDark: '#2a2218', // card-dark
  
  // Surface (웹과 동일)
  surface: '#ffffff', // surface
  
  // Text Headings/Body (웹과 동일)
  textHeadings: '#212529', // text-headings
  textBody: '#6C757D', // text-body
  
  // Subtle (웹과 동일)
  subtleLight: '#eadbcd', // subtle-light
  subtleDark: '#4a3c2b', // subtle-dark
  
  // Placeholder (웹과 동일)
  placeholderLight: '#a17145', // placeholder-light
  placeholderDark: '#a1917f', // placeholder-dark
  
  // Status
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',
  
  // Social (웹과 동일)
  google: '#4285F4',
  kakao: '#FEE500',
  kakaoText: '#000000',
  naver: '#03C75A',
  
  // 다양한 보조 컬러 팔레트 (웹과 동일)
  accent: '#FFC107',           // Journey Yellow
  accentDark: '#FFA000',
  accentSoft: '#FFF8E1',
  
  secondary1: '#9C27B0',       // Purple
  secondary1Dark: '#7B1FA2',
  secondary1Soft: '#F3E5F5',
  
  secondary2: '#4CAF50',       // Green
  secondary2Dark: '#388E3C',
  secondary2Soft: '#E8F5E9',
  
  secondary3: '#E91E63',       // Pink
  secondary3Dark: '#C2185B',
  secondary3Soft: '#FCE4EC',
  
  secondary4: '#FF5722',       // Deep Orange
  secondary4Dark: '#E64A19',
  secondary4Soft: '#FBE9E7',
  
  secondary5: '#00ACC1',       // Cyan
  secondary5Dark: '#00838F',
  secondary5Soft: '#E0F7FA',
  
  secondary6: '#5C6BC0',       // Indigo
  secondary6Dark: '#3F51B5',
  secondary6Soft: '#E8EAF6',
  
  secondary7: '#26A69A',       // Teal
  secondary7Dark: '#00695C',
  secondary7Soft: '#E0F2F1',
};

// 간격 상수 (기본값 - 반응형은 필요시 getResponsiveSpacing 사용)
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// 기본 폰트 패밀리 (웹과 동일하게 Noto Sans KR 우선, 없으면 시스템 폰트)
// 나중에 expo-font로 Noto Sans KR을 로드하면 이 값을 업데이트하면 됩니다
export const FONT_FAMILY = Platform.select({
  ios: 'System', // iOS는 시스템 폰트 사용 (나중에 expo-font로 Noto Sans KR 추가 가능)
  android: 'System', // Android는 시스템 폰트 사용 (나중에 expo-font로 Noto Sans KR 추가 가능)
  default: 'System',
});

// 타이포그래피 (기본값 - 반응형은 필요시 getResponsiveFontSize 사용)
// 폰트: 웹과 동일하게 Noto Sans KR 우선 사용 (현재는 시스템 폰트, 나중에 expo-font로 변경 가능)
export const TYPOGRAPHY = {
  h1: {
    fontSize: 32,
    fontWeight: 'bold',
    lineHeight: 40,
    fontFamily: FONT_FAMILY,
  },
  h2: {
    fontSize: 24,
    fontWeight: 'bold',
    lineHeight: 32,
    fontFamily: FONT_FAMILY,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 28,
    fontFamily: FONT_FAMILY,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: FONT_FAMILY,
  },
  bodySmall: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: FONT_FAMILY,
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: FONT_FAMILY,
  },
};

// 테두리 반경
export const BORDER_RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

