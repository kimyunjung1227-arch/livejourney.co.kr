# 📱 반응형 디자인 가이드

다양한 핸드폰 화면 크기에 대응하는 반응형 디자인 시스템입니다.

## 🎯 지원하는 화면 크기

### 작은 화면 (xs)
- iPhone SE (1세대, 2세대)
- iPhone 12/13 mini
- 화면 너비: ~375px 이하

### 중간 화면 (sm)
- iPhone 12/13/14
- Galaxy S 시리즈 (일부)
- 화면 너비: 376px ~ 390px

### 표준 화면 (md)
- iPhone 12/13/14 Pro
- Galaxy Note 시리즈
- 화면 너비: 391px ~ 414px

### 큰 화면 (lg)
- iPhone 12/13/14 Pro Max
- Galaxy S Ultra 시리즈
- 화면 너비: 415px ~ 428px

### 초대형 화면 (xl)
- Galaxy Fold (펼침)
- iPad Mini
- 화면 너비: 769px ~ 1024px

### 태블릿 (xxl)
- iPad
- 화면 너비: 1024px 이상

## 🚀 사용 방법

### 웹 (React)

```jsx
import { useScreenSize, getResponsiveFontSize, getResponsiveSpacing } from '../utils/responsive';

function MyComponent() {
  const { screenSize, width, height, isSmall, isLarge } = useScreenSize();
  
  return (
    <div style={{
      fontSize: getResponsiveFontSize(16),
      padding: getResponsiveSpacing(16),
      width: isSmall ? '100%' : '80%',
    }}>
      화면 크기: {screenSize}
    </div>
  );
}
```

### 모바일 (React Native)

```jsx
import { useScreenSize, getResponsiveFontSize, getResponsiveSpacing, widthPercentage } from '../utils/responsive';
import { StyleSheet } from 'react-native';

function MyComponent() {
  const { screenSize, width, isSmall } = useScreenSize();
  
  const styles = StyleSheet.create({
    container: {
      padding: getResponsiveSpacing(16),
      width: widthPercentage(90),
    },
    text: {
      fontSize: getResponsiveFontSize(16),
    },
  });
  
  return (
    <View style={styles.container}>
      <Text style={styles.text}>화면 크기: {screenSize}</Text>
    </View>
  );
}
```

## 📐 주요 함수

### `useScreenSize()` Hook
화면 크기를 실시간으로 감지하는 React Hook입니다.

**반환값:**
- `screenSize`: 현재 화면 크기 ('xs', 'sm', 'md', 'lg', 'xl', 'xxl')
- `width`: 화면 너비 (px)
- `height`: 화면 높이 (px)
- `isSmall`: 작은 화면 여부 (boolean)
- `isMedium`: 중간 화면 여부 (boolean)
- `isLarge`: 큰 화면 여부 (boolean)
- `isTablet`: 태블릿 여부 (boolean)
- `deviceType`: 디바이스 타입 ('phone-portrait', 'tablet-landscape', 'foldable')

### `getResponsiveFontSize(baseSize, scale)`
화면 크기에 따라 폰트 크기를 자동으로 조정합니다.

**파라미터:**
- `baseSize`: 기본 폰트 크기 (px)
- `scale`: 추가 스케일 팩터 (기본값: 1)

**예시:**
```jsx
// 작은 화면: 14.4px, 표준: 16px, 큰 화면: 16.8px
fontSize: getResponsiveFontSize(16)

// 1.2배 스케일 적용
fontSize: getResponsiveFontSize(16, 1.2)
```

### `getResponsiveSpacing(baseSpacing)`
화면 크기에 따라 간격을 자동으로 조정합니다.

**파라미터:**
- `baseSpacing`: 기본 간격 (px)

**예시:**
```jsx
// 작은 화면: 13.6px, 표준: 16px, 큰 화면: 17.6px
padding: getResponsiveSpacing(16)
```

### `widthPercentage(percentage)` (모바일만)
화면 너비의 비율로 크기를 계산합니다.

**예시:**
```jsx
width: widthPercentage(90) // 화면 너비의 90%
```

### `heightPercentage(percentage)` (모바일만)
화면 높이의 비율로 크기를 계산합니다.

**예시:**
```jsx
height: heightPercentage(50) // 화면 높이의 50%
```

## 🎨 CSS 미디어 쿼리 (웹)

웹에서는 CSS 미디어 쿼리도 자동으로 적용됩니다:

```css
/* 작은 화면 (375px 이하) */
@media (max-width: 375px) {
  .screen-header {
    font-size: 14px;
    padding: 12px 14px;
  }
}

/* 큰 화면 (428px 이상) */
@media (min-width: 415px) {
  .screen-header {
    padding: 18px 16px;
  }
}
```

## 💡 베스트 프랙티스

### 1. 유연한 레이아웃 사용
```jsx
// ❌ 고정 크기
<div style={{ width: 300, height: 200 }}>

// ✅ 반응형 크기
<div style={{ width: '90%', maxWidth: 400 }}>
```

### 2. clamp() 함수 활용
```css
/* 폰트 크기를 최소/최대값으로 제한 */
font-size: clamp(14px, 4vw, 18px);
```

### 3. SafeAreaView 사용 (모바일)
```jsx
import { SafeAreaView } from 'react-native';

<SafeAreaView style={{ flex: 1 }}>
  {/* 컨텐츠 */}
</SafeAreaView>
```

### 4. 동적 뷰포트 높이 (웹)
```css
height: 100dvh; /* 동적 뷰포트 높이 - 주소창 고려 */
```

## 📱 테스트 권장 기기

### iOS
- iPhone SE (375px)
- iPhone 12/13/14 (390px)
- iPhone 12/13/14 Pro (393px)
- iPhone 12/13/14 Pro Max (428px)

### Android
- Galaxy S21/S22 (360px)
- Galaxy S23/S24 (393px)
- Galaxy S Ultra (412px)
- Galaxy Fold (펼침: 768px)

## 🔧 커스터마이징

브레이크포인트를 변경하려면 `utils/responsive.js` 파일을 수정하세요:

```javascript
export const BREAKPOINTS = {
  xs: 375,  // 작은 화면
  sm: 390,  // 중간 화면
  md: 414,  // 표준 화면
  lg: 428,  // 큰 화면
  xl: 768,  // 초대형
  xxl: 1024, // 태블릿
};
```

## 📚 참고 자료

- [CSS clamp() 함수](https://developer.mozilla.org/en-US/docs/Web/CSS/clamp)
- [React Native Dimensions](https://reactnative.dev/docs/dimensions)
- [Safe Area Insets](https://developer.mozilla.org/en-US/docs/Web/CSS/env)














