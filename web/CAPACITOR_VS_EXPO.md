# 🔄 Capacitor vs Expo 비교

## ❌ Capacitor 앱을 Expo Go에서 실행할 수 없습니다

**이유:**
- Capacitor: 웹 앱을 네이티브 앱으로 래핑 (독립적인 앱)
- Expo Go: Expo SDK로 만든 React Native 앱만 실행 가능
- 서로 다른 아키텍처이므로 호환되지 않음

## ✅ 대안 방법들

### 방법 1: 웹 브라우저에서 확인 (가장 간단)

Capacitor 앱은 기본적으로 웹 앱이므로, **브라우저에서 바로 확인**할 수 있습니다:

```bash
cd web
npm run dev
```

→ 브라우저에서 `http://localhost:5173` (또는 표시된 포트) 열기

**장점:**
- ⚡ 가장 빠름
- 🔧 개발 중 빠른 확인
- 📱 반응형 디자인 확인 가능

**단점:**
- 📸 카메라, GPS 등 네이티브 기능은 작동하지 않음

### 방법 2: Android Studio에서 실행 (네이티브 기능 포함)

```bash
cd web
npm run quick:run
```

→ Android Studio에서 실제 디바이스나 에뮬레이터로 실행

**장점:**
- ✅ 모든 네이티브 기능 작동
- 📱 실제 앱처럼 동작
- 🎯 배포 준비 완료

### 방법 3: Expo 앱에서 웹 버전 확인

현재 프로젝트에는 `mobile/` 폴더에 Expo 앱이 있습니다:

```bash
cd mobile
npm run web
```

→ Expo의 웹 모드로 실행 (React Native 웹)

**주의:** 이것은 Expo 앱이지, Capacitor 앱이 아닙니다.

## 📊 비교표

| 방법 | 속도 | 네이티브 기능 | 배포 가능 |
|------|------|--------------|-----------|
| **웹 브라우저** | ⚡⚡⚡ | ❌ | ❌ |
| **Android Studio** | ⚡⚡ | ✅ | ✅ |
| **Expo Go** | ⚡⚡⚡ | ⚠️ 제한적 | ❌ |

## 💡 추천

**개발 중 빠른 확인:**
→ 웹 브라우저 (`npm run dev`)

**네이티브 기능 테스트:**
→ Android Studio (`npm run quick:run`)

**Expo로 확인하고 싶다면:**
→ `mobile/` 폴더의 Expo 앱 사용 (`npm run web` 또는 `npm start`)

---

**결론:** Capacitor 앱은 Expo Go에서 실행할 수 없지만, 웹 브라우저나 Android Studio에서 확인할 수 있습니다!
