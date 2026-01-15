# 🔗 링크 공유 가이드

LiveJourney 프로젝트를 공유하는 여러 가지 방법입니다.

## 📦 공유 가능한 링크 종류

### 1. ✅ GitHub 저장소 링크 (이미 완료!)
- **링크**: https://github.com/kimyunjung1227-arch/LiveJourney
- **설명**: 소스코드를 확인하고 다운로드할 수 있는 링크
- **상태**: 이미 푸시 완료 ✅

### 2. 🌐 랜딩 페이지 링크 (추천 - 가장 쉬움!)
실제 작동하는 웹사이트 링크를 공유하고 싶다면 랜딩 페이지를 배포하세요.

**배포 방법:**
1. https://app.netlify.com/drop 접속
2. `landing-page` 폴더 전체를 드래그 앤 드롭
3. 몇 초 후 자동으로 링크 생성 (예: `https://your-site.netlify.app`)

**배포할 폴더:** `landing-page/` 폴더 전체

### 3. 💻 웹 앱 링크 (선택사항)
실제 작동하는 웹 애플리케이션을 공유하고 싶다면:

**방법 A: Netlify 배포**
1. 먼저 빌드: `cd web && npm run build`
2. https://app.netlify.com/drop 접속
3. `web/dist` 폴더를 드래그 앤 드롭

**방법 B: Vercel 배포**
1. https://vercel.com 접속
2. GitHub 저장소 연결
3. Root Directory: `web` 설정
4. Build Command: `npm run build`
5. Output Directory: `dist`

**배포할 폴더:** `web/dist/` 폴더 (빌드 후)

---

## 🎯 추천 방법

### 빠른 공유를 원한다면:
→ **랜딩 페이지 배포** (`landing-page` 폴더를 Netlify에 업로드)
- 가장 쉬움
- 파일 업로드만으로 완료
- 실제 작동하는 웹사이트 링크 제공

### 개발자에게 소스코드를 공유하고 싶다면:
→ **GitHub 저장소 링크 공유** (이미 완료!)
- https://github.com/kimyunjung1227-arch/LiveJourney

### 실제 작동하는 앱을 보여주고 싶다면:
→ **웹 앱 배포** (`web/dist` 폴더를 Netlify/Vercel에 업로드)
- 실제 기능이 작동하는 앱 링크
- 사용자가 직접 체험 가능

---

## 📋 배포 체크리스트

### 랜딩 페이지 배포:
- [ ] `landing-page` 폴더 준비
- [ ] Netlify에 드래그 앤 드롭
- [ ] 생성된 링크 복사
- [ ] 공유!

### 웹 앱 배포:
- [ ] `cd web`
- [ ] `npm install` (의존성 설치)
- [ ] `npm run build` (빌드)
- [ ] `web/dist` 폴더를 Netlify에 업로드
- [ ] 생성된 링크 복사
- [ ] 공유!

---

## 🔍 현재 상태

- ✅ GitHub 저장소: 이미 푸시 완료
- ⏳ 랜딩 페이지: 배포 필요 (선택사항)
- ⏳ 웹 앱: 배포 필요 (선택사항)

---

## 💡 팁

**가장 빠른 방법:**
랜딩 페이지를 배포하는 것이 가장 빠르고 쉬운 방법입니다!
`landing-page` 폴더만 Netlify에 드래그 앤 드롭하면 됩니다.
















