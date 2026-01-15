# 웹과 앱 통일 가이드

웹을 기반으로 앱의 디자인, 기능, 구조를 완전히 통일했습니다.

## ✅ 완료된 작업

### 1. BottomNavigation 통일
- 웹과 동일한 높이 (h-20 = 80px)
- 웹과 동일한 아이콘 크기 (24px)
- 웹과 동일한 간격 (gap-1)
- 업로드 버튼 원형 디자인 통일

### 2. 색상 시스템 통일
- 웹의 Tailwind 색상을 앱에 완전히 적용
- `COLORS` 상수에 웹의 모든 색상 추가
- text-primary-light, text-secondary-light 등 모든 변형 포함

### 3. 레이아웃 구조 통일
- `ScreenLayout` 컴포넌트 생성 (웹의 screen-layout)
- `ScreenContent` 컴포넌트 생성 (웹의 screen-content)
- `ScreenHeader` 컴포넌트 생성 (웹의 screen-header)
- `ScreenBody` 컴포넌트 생성 (웹의 screen-body)

### 4. MainScreen 구조 통일
- 웹과 동일한 레이아웃 구조 적용
- 헤더, 검색창, 컨텐츠 영역 구조 통일

## 📱 사용 방법

### 레이아웃 컴포넌트 사용

```jsx
import { ScreenLayout, ScreenContent, ScreenHeader, ScreenBody } from '../components/ScreenLayout';

function MyScreen() {
  return (
    <ScreenLayout>
      <ScreenContent>
        <ScreenHeader>
          {/* 헤더 내용 */}
        </ScreenHeader>
        
        <ScreenBody>
          {/* 메인 컨텐츠 */}
        </ScreenBody>
      </ScreenContent>
    </ScreenLayout>
  );
}
```

### RefreshControl 사용

```jsx
<ScreenContent 
  refreshControl={
    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
  }
>
  {/* 컨텐츠 */}
</ScreenContent>
```

## 🎨 색상 사용

웹과 동일한 색상 시스템:

```jsx
import { COLORS } from '../constants/styles';

// 웹의 text-primary-light
COLORS.textPrimaryLight

// 웹의 text-subtle-light
COLORS.textSubtle

// 웹의 border-light
COLORS.borderLight

// 웹의 background-light
COLORS.backgroundLight
```

## 📋 다음 단계

다른 화면들도 동일하게 통일해야 합니다:

1. SearchScreen
2. ProfileScreen
3. UploadScreen
4. MapScreen
5. PostDetailScreen
6. RegionDetailScreen
7. 기타 모든 화면

각 화면에 `ScreenLayout`, `ScreenContent`, `ScreenHeader`, `ScreenBody`를 적용하면 웹과 동일한 구조가 됩니다.

## 🔄 통일 체크리스트

각 화면에서 확인할 사항:

- [ ] ScreenLayout, ScreenContent, ScreenHeader, ScreenBody 사용
- [ ] 웹과 동일한 색상 사용 (COLORS 상수)
- [ ] 웹과 동일한 간격 사용 (SPACING 상수)
- [ ] 웹과 동일한 폰트 크기 사용 (TYPOGRAPHY 상수)
- [ ] 웹과 동일한 레이아웃 구조
- [ ] 웹과 동일한 버튼 스타일
- [ ] 웹과 동일한 카드 디자인













































































