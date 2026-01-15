# 🚀 GitHub Pages 배포 가이드

## 문제 해결

GitHub Pages에서 제대로 보이지 않는 경우 다음을 확인하세요:

---

## ✅ 1단계: 파일 확인

GitHub 저장소에 다음 파일들이 모두 올라갔는지 확인:

```
landing-page/
├── index.html          ✓ 필수
├── styles.css          ✓ 필수
├── script.js           ✓ 필수
├── robots.txt
├── sitemap.xml
└── netlify.toml
```

## ✅ 2단계: GitHub Pages 설정

### A. 저장소에서 Settings 클릭

### B. 왼쪽 메뉴에서 "Pages" 클릭

### C. Source 설정:
- **Branch**: `main` (또는 `master`) 선택
- **Folder**: `/landing-page` 선택 ⚠️ 중요!
- **Save** 클릭

### D. 배포 대기 (1-2분)

---

## ✅ 3단계: URL 확인

배포 완료 후 URL이 생성됩니다:
```
https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/
```

---

## 🔧 문제 해결

### 문제 1: CSS가 적용되지 않음

**원인**: 경로 문제

**해결 방법**:
`index.html`에서 CSS 경로 확인:
```html
<link rel="stylesheet" href="./styles.css">
```

또는 절대 경로 사용:
```html
<link rel="stylesheet" href="/styles.css">
```

### 문제 2: 404 에러

**원인**: 폴더 설정 문제

**해결 방법**:
1. GitHub Pages Settings에서
2. Folder를 `/landing-page`로 설정했는지 확인
3. 또는 `landing-page/` 폴더 내용을 저장소 루트로 이동

### 문제 3: 페이지가 비어있음

**원인**: 빌드 실패

**해결 방법**:
1. Actions 탭에서 배포 상태 확인
2. 에러가 있다면 로그 확인
3. 파일 이름과 경로 확인 (대소문자 구분)

---

## 🎯 추천 방법 1: 루트 배포 (가장 쉬움)

### 1. landing-page 폴더 내용을 저장소 루트로 이동

```bash
# Windows PowerShell
cd C:\Users\wnd12\Desktop\mvp1

# landing-page 내용을 루트로 복사
Copy-Item -Path landing-page\index.html -Destination . -Force
Copy-Item -Path landing-page\styles.css -Destination . -Force
Copy-Item -Path landing-page\script.js -Destination . -Force
Copy-Item -Path landing-page\robots.txt -Destination . -Force
Copy-Item -Path landing-page\sitemap.xml -Destination . -Force
```

### 2. Git에 추가

```bash
git add index.html styles.css script.js robots.txt sitemap.xml
git commit -m "Add landing page to root"
git push
```

### 3. GitHub Pages 설정

- Branch: `main`
- Folder: **`/ (root)`** 선택
- Save

### 4. 접속

```
https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/
```

---

## 🎯 추천 방법 2: docs 폴더 사용

### 1. docs 폴더 생성 및 파일 복사

```bash
# docs 폴더 생성
mkdir docs

# landing-page 내용을 docs로 복사
Copy-Item -Path landing-page\* -Destination docs\ -Recurse -Force
```

### 2. Git에 추가

```bash
git add docs/
git commit -m "Add landing page to docs folder"
git push
```

### 3. GitHub Pages 설정

- Branch: `main`
- Folder: **`/docs`** 선택
- Save

---

## 🎯 추천 방법 3: Netlify (가장 추천)

GitHub Pages가 복잡하다면 Netlify 사용:

### 1. Netlify 접속
https://app.netlify.com

### 2. "Add new site" > "Deploy manually"

### 3. `landing-page` 폴더를 드래그 앤 드롭

### 4. 완료!
즉시 URL이 생성되고 작동합니다.

---

## 🔍 디버깅 체크리스트

- [ ] `index.html` 파일이 올바른 위치에 있나?
- [ ] `styles.css` 파일이 같은 폴더에 있나?
- [ ] `script.js` 파일이 같은 폴더에 있나?
- [ ] GitHub Pages 설정에서 올바른 폴더 선택했나?
- [ ] 배포가 완료될 때까지 기다렸나? (1-2분)
- [ ] 브라우저 캐시를 삭제했나? (Ctrl+Shift+R)

---

## 💡 가장 빠른 해결 방법

1. **Netlify 사용** (1분 완성)
   - 회원가입 → 드래그 앤 드롭 → 완료!

2. **GitHub Pages - 루트 배포**
   - landing-page 내용을 루트로 복사
   - GitHub Pages 설정: root 폴더
   - 완료!

---

## 🆘 여전히 안 되면?

1. 저장소 URL 알려주세요
2. 에러 메시지 캡처해주세요
3. GitHub Pages 설정 스크린샷 보내주세요

도와드리겠습니다! 🚀




























































