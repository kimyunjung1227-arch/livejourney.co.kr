# 안드로이드 스튜디오 에뮬레이터 화면 크기 문제 해결

## 문제
안드로이드 스튜디오 에뮬레이터에서 앱 화면이 에뮬레이터 화면과 맞지 않는 문제

## 해결 방법

### 1. SafeAreaProvider 추가
`App.js`에 `SafeAreaProvider`를 추가하여 안전 영역을 처리합니다.

### 2. Dimensions API 개선
`window`와 `screen` 차원을 모두 고려하여 안드로이드 에뮬레이터에서도 정확한 화면 크기를 가져옵니다.

### 3. 반응형 유틸리티 사용
모든 화면에서 `useScreenSize()` Hook을 사용하여 동적으로 화면 크기를 감지합니다.

## 사용 예시

```jsx
import { useScreenSize, widthPercentage, getResponsiveFontSize } from '../utils/responsive';
import { SafeAreaView } from 'react-native-safe-area-context';

function MyScreen() {
  const { width, height, screenSize } = useScreenSize();
  
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{
        width: widthPercentage(90),
        padding: getResponsiveSpacing(16),
      }}>
        <Text style={{ fontSize: getResponsiveFontSize(16) }}>
          화면 크기: {screenSize} ({width}x{height})
        </Text>
      </View>
    </SafeAreaView>
  );
}
```

## 주요 개선 사항

1. **안드로이드 에뮬레이터 대응**
   - `window` 크기가 0일 경우 `screen` 크기 사용
   - 실시간 화면 크기 변경 감지

2. **SafeAreaView 사용**
   - 상태바와 네비게이션 바 영역 자동 처리
   - 노치 영역 자동 처리

3. **반응형 크기 계산**
   - 화면 크기에 따라 자동으로 폰트 크기 조정
   - 간격 자동 조정
   - 비율 기반 크기 계산

## 테스트

안드로이드 스튜디오 에뮬레이터에서 다음을 확인하세요:

1. 화면이 에뮬레이터 크기에 맞게 표시되는지
2. 상태바와 네비게이션 바 영역이 올바르게 처리되는지
3. 다양한 화면 크기에서 레이아웃이 올바르게 표시되는지

## 참고

- `Dimensions.get('window')`: 상태바/네비게이션 바 제외한 사용 가능한 화면 크기
- `Dimensions.get('screen')`: 전체 화면 크기 (상태바/네비게이션 바 포함)
- 안드로이드 에뮬레이터에서는 때때로 `window`가 0이 될 수 있으므로 `screen`을 fallback으로 사용














