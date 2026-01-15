# 🆕 웹 앱 새 저장소 생성 가이드

웹 앱(`web` 폴더)만 별도의 새 GitHub 저장소에 올리는 방법입니다.

## 📋 단계별 가이드

### 1단계: GitHub에서 새 저장소 생성

1. **GitHub 접속**
   - https://github.com/new 접속
   - 또는 GitHub → "+" → "New repository"

2. **저장소 정보 입력**
   - **Repository name**: `livejourney-web` (또는 원하는 이름)
   - **Description**: "LiveJourney Web App - 실시간 여행 정보 공유 플랫폼"
   - **Visibility**: Public 또는 Private 선택
   - ⚠️ **중요**: "Initialize this repository with a README" 체크하지 않기!

3. **"Create repository" 클릭**

---

### 2단계: web 폴더에서 새 저장소 초기화

터미널에서 다음 명령어를 실행하세요:

```bash
# web 폴더로 이동
cd web

# Git 저장소 초기화
git init

# 모든 파일 추가
git add .

# 첫 커밋
git commit -m "Initial commit: LiveJourney Web App"

# 새 저장소를 원격 저장소로 추가
# ⚠️ YOUR_USERNAME과 REPO_NAME을 실제 값으로 변경하세요!
git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git

# 기본 브랜치를 main으로 설정
git branch -M main

# GitHub에 푸시
git push -u origin main
```

---

### 3단계: 실제 명령어 예시

예를 들어, 저장소 이름이 `livejourney-web`이고 사용자명이 `kimyunjung1227-arch`라면:

```bash
cd web
git init
git add .
git commit -m "Initial commit: LiveJourney Web App"
git remote add origin https://github.com/kimyunjung1227-arch/livejourney-web.git
git branch -M main
git push -u origin main
```

---

## ✅ 확인 사항

### 업로드되는 파일:
- ✅ `src/` - 모든 소스 코드
- ✅ `public/` - 정적 파일
- ✅ `package.json` - 의존성 정보
- ✅ `vite.config.js` - 빌드 설정
- ✅ `tailwind.config.js` - 스타일 설정
- ✅ `README.md` - 프로젝트 설명
- ✅ 기타 설정 파일들

### 업로드되지 않는 파일:
- ❌ `node_modules/` - 의존성 (npm install로 설치)
- ❌ `dist/` - 빌드 결과물
- ❌ `android/`, `ios/` - 네이티브 폴더
- ❌ `.env` - 환경 변수 (민감한 정보)

---

## 🔄 이후 업데이트 방법

변경사항이 있을 때마다:

```bash
cd web
git add .
git commit -m "Update: 변경 내용 설명"
git push
```

---

## 📝 README 업데이트 (선택사항)

새 저장소의 README를 더 상세하게 만들고 싶다면:

```markdown
# 🗺️ LiveJourney Web App

실시간 여행 정보 공유 플랫폼의 웹 애플리케이션입니다.

## ✨ 주요 기능

- 📸 실시간 정보 공유
- 🗺️ 지도 기반 탐색
- 🤖 AI 자동 분류
- 🏆 뱃지 시스템
- 🔍 스마트 검색

## 🚀 빠른 시작

\`\`\`bash
npm install
npm run dev
\`\`\`

## 🛠 기술 스택

- React 18
- Vite
- Tailwind CSS
- React Router
\`\`\`
```

---

## ⚠️ 주의사항

1. **환경 변수 파일은 업로드하지 않습니다**
   - `.env` 파일은 `.gitignore`에 포함되어 있습니다
   - API 키 등 민감한 정보는 별도로 관리하세요

2. **node_modules는 업로드하지 않습니다**
   - 저장소를 클론한 후 `npm install`로 설치합니다

3. **빌드 결과물은 업로드하지 않습니다**
   - `dist/` 폴더는 빌드 시 자동 생성됩니다

---

## 🎉 완료!

이제 웹 앱이 별도의 저장소에 올라갔습니다!

**저장소 링크**: `https://github.com/YOUR_USERNAME/REPO_NAME`

이 링크를 공유하면 다른 사람들이 웹 앱 소스코드를 확인할 수 있습니다.
















