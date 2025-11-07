# 🗺️ Netlify 배포 시 Kakao 지도 안 나오는 문제 해결

## 🔍 문제 원인

Kakao Map API는 **등록된 도메인에서만** 작동합니다.
- ✅ `localhost:3000` - 등록됨 (로컬에서 작동)
- ❌ `your-app.netlify.app` - 미등록 (배포 시 작동 안 함)

---

## 🛠️ 해결 방법 (2가지)

### 방법 1: Kakao Developers에 Netlify 도메인 등록 (권장)

#### 1단계: Netlify URL 확인
배포 후 받은 URL을 확인하세요:
```
예: https://stalwart-nougat-ad445b.netlify.app
```

#### 2단계: Kakao Developers 접속
1. https://developers.kakao.com 접속
2. 로그인
3. **내 애플리케이션** 선택
4. LiveJourney 앱 선택

#### 3단계: 플랫폼 추가
1. **앱 설정** → **플랫폼** 메뉴
2. **Web 플랫폼 등록** 클릭
3. **사이트 도메인** 입력:
   ```
   https://stalwart-nougat-ad445b.netlify.app
   ```
   (여러분의 실제 Netlify URL로 변경)
4. **저장**

#### 4단계: 재배포
- 설정 변경 후 약 1-2분 대기
- 브라우저 새로고침 (Ctrl + Shift + R)
- 지도가 정상 작동!

---

### 방법 2: Leaflet 지도로 대체 (즉시 해결)

Kakao Map 대신 Leaflet (OpenStreetMap) 사용:
- 도메인 제한 없음
- 무료
- 전 세계 지도 지원

#### 장점
- ✅ 즉시 작동 (도메인 등록 불필요)
- ✅ 무료
- ✅ 안정적

#### 단점
- ❌ Kakao Map보다 한국 지도 정확도 낮음
- ❌ 한글 지명 정보 부족

---

## 🚀 빠른 해결책

### 현재 상황에서 추천하는 방법:

**개발 중:** Kakao Map 사용 (localhost)
**배포 시:** 방법 1 (Kakao 도메인 등록) 또는 방법 2 (Leaflet)

---

## 💡 방법 1 상세 가이드

### Kakao Developers 설정

1. **Kakao Developers 접속**
   - URL: https://developers.kakao.com
   - 카카오 계정으로 로그인

2. **내 애플리케이션 선택**
   - 좌측 상단 "내 애플리케이션" 클릭
   - LiveJourney 앱 선택

3. **Web 플랫폼 등록**
   - 좌측 메뉴에서 "앱 설정" → "플랫폼"
   - "Web 플랫폼 등록" 버튼 클릭
   - 사이트 도메인 입력:
     ```
     https://your-netlify-url.netlify.app
     ```
   - 저장 클릭

4. **확인**
   - 등록된 플랫폼 목록에 표시되는지 확인
   - 상태가 "사용"으로 되어 있는지 확인

5. **재배포 또는 새로고침**
   - 브라우저에서 Ctrl + Shift + R
   - 지도가 정상 작동!

---

## 📋 체크리스트

- [ ] Netlify URL 확인
- [ ] Kakao Developers 로그인
- [ ] Web 플랫폼 등록
- [ ] Netlify URL 입력
- [ ] 저장
- [ ] 1-2분 대기
- [ ] 브라우저 새로고침
- [ ] 지도 작동 확인!

---

## ⚠️ 주의사항

### Netlify URL 변경 시
Netlify에서 재배포하거나 도메인이 변경되면:
- 새로운 URL을 Kakao Developers에 다시 등록해야 함
- 또는 커스텀 도메인 사용 (example.com)

### 여러 URL 등록 가능
- localhost:3000 (개발용)
- your-app.netlify.app (배포용)
- your-custom-domain.com (커스텀 도메인)

---

## 🎯 현재 배포된 앱

배포 URL: https://stalwart-nougat-ad445b.netlify.app

**해야 할 일:**
1. 위 URL을 Kakao Developers에 등록
2. 1-2분 대기
3. 새로고침
4. 지도 작동 확인!

---

## 🆘 문제가 계속되면?

1. **콘솔 확인**
   - F12 → Console 탭
   - Kakao Map 관련 오류 확인

2. **API 키 확인**
   - `.env` 파일의 VITE_KAKAO_MAP_API_KEY 확인
   - 올바른 키인지 확인

3. **캐시 삭제**
   - Ctrl + Shift + R (강력 새로고침)
   - 또는 시크릿 모드로 접속

---

생성일: 2025-01-06



