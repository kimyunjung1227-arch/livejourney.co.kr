# ✅ 업로드 체크리스트

웹 앱을 GitHub에 올릴 때 포함해야 할 파일과 제외해야 할 파일입니다.

## 📦 반드시 포함해야 할 파일/폴더

### 핵심 파일
- ✅ `package.json` - 프로젝트 의존성 정의
- ✅ `package-lock.json` - 정확한 버전 고정
- ✅ `vite.config.js` - 빌드 설정
- ✅ `tailwind.config.js` - 스타일 설정
- ✅ `postcss.config.js` - CSS 처리 설정
- ✅ `index.html` - 엔트리 포인트
- ✅ `README.md` - 프로젝트 설명

### 소스 코드
- ✅ `src/` 폴더 전체 - 모든 소스 코드
  - `src/pages/` - 모든 화면 컴포넌트
  - `src/components/` - 공통 컴포넌트
  - `src/utils/` - 유틸리티 함수
  - `src/api/` - API 호출 코드
  - `src/contexts/` - Context API
  - `src/index.css` - 전역 스타일
  - `src/main.jsx` - 앱 진입점
  - `src/App.jsx` - 메인 컴포넌트

### 정적 파일
- ✅ `public/` 폴더 전체
  - `public/favicon.svg`
  - `public/logo.svg`
  - `public/livejourney-logo.png`
  - `public/manifest.json`
  - `public/_redirects`

### 설정 파일
- ✅ `capacitor.config.json` - Capacitor 설정
- ✅ `netlify.toml` - Netlify 배포 설정 (있을 경우)
- ✅ `vercel.json` - Vercel 배포 설정 (있을 경우)
- ✅ `.gitignore` - Git 제외 파일 목록

### 문서 파일
- ✅ `README.md` - 프로젝트 설명
- ✅ `API_INTEGRATION_GUIDE.md` - API 가이드 (있는 경우)
- ✅ `KAKAO_MAP_API_SETUP.md` - 지도 설정 가이드 (있는 경우)

---

## ❌ 제외해야 할 파일/폴더

### 의존성 및 빌드 결과물
- ❌ `node_modules/` - npm install로 자동 설치
- ❌ `dist/` - 빌드 결과물 (npm run build로 생성)
- ❌ `.vite/` - Vite 캐시

### 환경 변수 (민감한 정보)
- ❌ `.env` - 환경 변수 (API 키 등)
- ❌ `.env.local`
- ❌ `.env.*.local`

### 네이티브 빌드 파일
- ❌ `android/` - Android 빌드 파일
- ❌ `ios/` - iOS 빌드 파일
- ❌ `.capacitor/` - Capacitor 캐시

### 개발 도구 파일
- ❌ `.vscode/` - VS Code 설정
- ❌ `.idea/` - IntelliJ 설정
- ❌ `clear-all-data.html` - 개발용 (선택사항)
- ❌ `clear-cache.html` - 개발용 (선택사항)

### OS 파일
- ❌ `.DS_Store` - macOS
- ❌ `Thumbs.db` - Windows
- ❌ `desktop.ini` - Windows

### 로그 파일
- ❌ `*.log`
- ❌ `npm-debug.log*`
- ❌ `yarn-debug.log*`

---

## 🔍 현재 상태 확인

현재 `.gitignore` 파일이 올바르게 설정되어 있으면, 위의 제외 항목들은 자동으로 제외됩니다.

확인 방법:
```bash
cd web
git status
```

업로드될 파일 목록이 나옵니다.

---

## 📋 최종 체크리스트

업로드 전 확인:

1. ✅ `.gitignore` 파일이 있는가?
2. ✅ `package.json` 파일이 있는가?
3. ✅ `src/` 폴더가 포함되는가?
4. ✅ `public/` 폴더가 포함되는가?
5. ✅ `README.md` 파일이 있는가?
6. ❌ `node_modules/` 폴더가 제외되는가?
7. ❌ `.env` 파일이 제외되는가?
8. ❌ `dist/` 폴더가 제외되는가?

---

## 🚀 다른 사람이 사용하는 방법

1. **저장소 클론**
   ```bash
   git clone https://github.com/YOUR_USERNAME/REPO_NAME.git
   cd REPO_NAME
   ```

2. **의존성 설치**
   ```bash
   npm install
   ```

3. **개발 서버 실행**
   ```bash
   npm run dev
   ```

4. **브라우저에서 확인**
   - http://localhost:5173 접속

---

## ⚙️ 환경 변수 (선택사항)

환경 변수 파일(`.env`)은 업로드하지 않지만, 필요한 경우 `.env.example` 파일을 만들어 참고용으로 올릴 수 있습니다.

```env
# .env.example (업로드 가능)
VITE_KAKAO_MAP_API_KEY=your_api_key_here
VITE_API_URL=http://localhost:5000
```

**참고**: 현재 코드에는 Kakao Map API 키의 기본값이 포함되어 있어, 환경 변수 없이도 동작합니다.
















