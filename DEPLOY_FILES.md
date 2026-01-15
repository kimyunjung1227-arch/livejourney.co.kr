# 📦 배포 필수 파일 목록

GitHub Pages 배포에 필요한 파일들만 정리했습니다.

## ✅ 필수 파일 (반드시 포함)

### 1. 웹 앱 소스 코드
```
web/                    # 전체 폴더 (모든 소스 코드)
```

### 2. GitHub Actions 설정
```
.github/workflows/deploy.yml
```

### 3. Git 설정
```
.gitignore
```

## 📝 선택 파일 (있으면 좋음)

```
README.md
GITHUB_DEPLOY_GUIDE.md
카페_공유_가이드.md
```

## 🚀 빠른 배포 방법

### 방법 1: 배치 파일 사용 (가장 쉬움)

**`배포하기.bat`** 파일을 더블클릭하면 자동으로:
1. 필수 파일 확인
2. Git에 추가
3. 커밋 및 푸시

### 방법 2: Git 명령어 사용

```bash
# 필수 파일만 추가
git add web/ .github/ .gitignore

# 선택 파일 추가 (있는 경우)
git add README.md GITHUB_DEPLOY_GUIDE.md 카페_공유_가이드.md

# 커밋
git commit -m "Deploy to GitHub Pages"

# 푸시
git push origin master
```

### 방법 3: 전체 올리기

```bash
git add .
git commit -m "Deploy to GitHub Pages"
git push origin master
```

> `.gitignore`가 자동으로 불필요한 파일을 제외합니다.

## ❌ 올리지 말아야 할 파일들

다음은 자동으로 제외됩니다:
- `node_modules/` - npm install로 자동 설치
- `dist/` - GitHub Actions가 자동 빌드
- `.env` - 환경 변수 (보안)
- `web/android/`, `web/ios/` - 네이티브 빌드 파일

## 📋 배포 전 체크리스트

- [ ] `web/package.json` 파일 존재
- [ ] `web/vite.config.js` 파일 존재 (base: `/app/`)
- [ ] `web/public/404.html` 파일 존재
- [ ] `.github/workflows/deploy.yml` 파일 존재
- [ ] `.gitignore` 파일 존재

## ⚙️ GitHub 설정 (최초 1회)

1. **Settings** → **Pages** → Source: **"GitHub Actions"** 선택
2. **Settings** → **Actions** → **General** → **"Read and write permissions"** 선택

## 🌐 배포 완료 후

배포 URL: `https://kimyunjung1227-arch.github.io/app/`

---

**더 자세한 가이드**: [배포_가이드.md](./배포_가이드.md)
