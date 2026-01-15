# 🚀 GitHub Pages 배포 가이드

LiveJourney를 GitHub Pages에 배포하여 카페 회원들이 사용할 수 있도록 설정하는 방법입니다.

## 📋 사전 준비

1. **GitHub 저장소 생성** (이미 있으면 스킵)
   - GitHub에 새 저장소 생성: `livejourney.com` (또는 원하는 이름)
   - 저장소를 Public으로 설정 (GitHub Pages 무료 사용을 위해)

2. **코드 업로드**
   ```bash
   git remote add origin https://github.com/사용자명/저장소명.git
   git push -u origin master
   ```

## ⚙️ GitHub Pages 설정

### 1단계: GitHub 저장소 설정

1. GitHub 저장소로 이동: `https://github.com/사용자명/저장소명`
2. **Settings** 탭 클릭
3. 왼쪽 메뉴에서 **Pages** 클릭
4. **Source** 섹션에서:
   - **"GitHub Actions"** 선택 (권장)
   - 또는 **"Deploy from a branch"** → Branch: `gh-pages` 선택
5. **Save** 클릭

### 2단계: Actions 권한 설정

1. **Settings** → **Actions** → **General** 이동
2. **"Workflow permissions"** 섹션에서:
   - **"Read and write permissions"** 선택
3. **Save** 클릭

### 3단계: 환경 변수 설정 (선택 사항)

**Settings** → **Secrets and variables** → **Actions**에서 다음 변수를 추가할 수 있습니다:

- `VITE_API_URL`: 백엔드 API URL (예: `https://your-backend.railway.app`)
- `VITE_KAKAO_MAP_API_KEY`: 카카오 맵 API 키
- `VITE_KMA_API_KEY`: 기상청 API 키

> **참고**: 환경 변수를 설정하지 않으면 기본값이 사용됩니다.

## 🚀 배포 시작

### 자동 배포 (권장)

1. 코드를 `master` 브랜치에 푸시하면 자동으로 배포됩니다:
   ```bash
   git add .
   git commit -m "Deploy to GitHub Pages"
   git push origin master
   ```

2. **Actions** 탭에서 배포 진행 상황 확인
3. 배포 완료 후 5-10분 대기
4. 배포된 URL 확인: **Settings** → **Pages** → 배포된 URL

### 수동 배포

1. GitHub 저장소의 **Actions** 탭 이동
2. **"Deploy to GitHub Pages"** 워크플로 선택
3. **"Run workflow"** 버튼 클릭
4. 배포 완료 대기

## 🌐 배포된 사이트 접속

배포가 완료되면 다음 URL로 접속할 수 있습니다:

```
https://사용자명.github.io/저장소명/
```

예: `https://kimyunjung1227-arch.github.io/app/`

## ✅ 배포 확인

1. **Actions** 탭에서 워크플로가 성공했는지 확인 (초록색 체크 표시)
2. 배포된 URL로 접속하여 앱이 정상 작동하는지 확인
3. 모든 페이지가 정상적으로 로드되는지 확인

## 🔧 문제 해결

### 404 에러가 발생하는 경우

1. **Settings** → **Pages**에서 Source가 올바르게 설정되었는지 확인
2. **Actions** 탭에서 배포가 성공했는지 확인
3. 브라우저 캐시 삭제 후 다시 시도
4. `web/public/404.html` 파일이 있는지 확인

### 배포가 실패하는 경우

1. **Actions** 탭에서 실패한 워크플로 클릭
2. 에러 메시지 확인
3. 일반적인 원인:
   - Node.js 버전 불일치
   - 빌드 에러
   - 환경 변수 누락

### 네비게이션이 작동하지 않는 경우

- `web/vite.config.js`의 `base` 경로가 저장소 이름과 일치하는지 확인
- 저장소 이름이 `livejourney.com`이면 `base: '/livejourney.com/'`로 설정

## 📱 카페 회원들에게 공유하기

배포가 완료되면 카페에 다음 정보를 공유하세요:

```
🎉 LiveJourney 웹 앱이 배포되었습니다!

📱 접속 주소: https://사용자명.github.io/저장소명/

✨ 주요 기능:
- 실시간 여행 정보 공유
- 지도 기반 탐색
- AI 자동 태그 생성
- 뱃지 시스템

💡 모바일에서 접속하면 앱처럼 사용할 수 있습니다!
```

## 🔄 업데이트 배포

코드를 수정한 후 다시 배포하려면:

```bash
git add .
git commit -m "업데이트 내용"
git push origin master
```

자동으로 배포가 시작됩니다!

## 📞 도움이 필요하신가요?

- GitHub Actions 로그 확인: **Actions** 탭
- GitHub Pages 설정 확인: **Settings** → **Pages**
- 문제가 계속되면 GitHub Issues에 문의하세요
