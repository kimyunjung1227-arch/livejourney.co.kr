# GitHub Pages 배포 설정 가이드

## 1단계: GitHub 저장소 설정

1. GitHub 저장소로 이동: https://github.com/kimyunjung1227-arch/livejourney.com
2. **Settings** 탭 클릭
3. 왼쪽 메뉴에서 **Pages** 클릭
4. **Source** 섹션에서:
   - **Deploy from a branch** 선택
   - **Branch**: `gh-pages` 선택 (없으면 master 선택)
   - **Folder**: `/ (root)` 선택
   - 또는 **GitHub Actions** 선택 (권장)

## 2단계: GitHub Actions 사용 (권장)

1. **Settings** → **Pages**에서
2. **Source**를 **"GitHub Actions"**로 선택
3. 저장

## 3단계: 배포 확인

1. **Actions** 탭으로 이동
2. "Deploy to GitHub Pages" 워크플로가 실행되는지 확인
3. 배포 완료 후 5-10분 대기
4. **Settings** → **Pages**에서 배포된 URL 확인
   - 예: `https://kimyunjung1227-arch.github.io/livejourney.com/`

## 문제 해결

### 404 에러가 계속 나는 경우:

1. **Actions** 탭에서 워크플로가 성공했는지 확인
2. 배포가 완료되었는지 확인 (5-10분 소요)
3. 브라우저 캐시 삭제 후 다시 시도
4. URL이 정확한지 확인: `https://kimyunjung1227-arch.github.io/livejourney.com/`

### 배포가 안 되는 경우:

1. **Settings** → **Actions** → **General**에서
   - "Workflow permissions"를 **"Read and write permissions"**로 설정
2. 저장소가 Public인지 확인 (Private 저장소는 GitHub Pro 필요)

## 수동 배포 (대안)

GitHub Actions가 작동하지 않으면:

```bash
cd web
npm install
npm run build
# dist 폴더의 내용을 gh-pages 브랜치에 푸시
```
