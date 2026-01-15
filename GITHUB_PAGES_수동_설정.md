# ⚙️ GitHub Pages 수동 설정 가이드

GitHub Actions에서 자동 활성화가 실패하는 경우, 다음 단계를 따라 수동으로 설정하세요.

## 🔧 필수 설정 (반드시 해야 함)

### 1단계: GitHub Pages 활성화

1. **GitHub 저장소로 이동**
   - https://github.com/kimyunjung1227-arch/app

2. **Settings 탭 클릭**
   - 저장소 상단의 "Settings" 메뉴 클릭

3. **Pages 메뉴 클릭**
   - 왼쪽 사이드바에서 "Pages" 클릭

4. **Source 설정**
   - **"Source"** 섹션에서:
     - **"GitHub Actions"** 선택 ⭐ (중요!)
     - **Save** 클릭

### 2단계: Actions 권한 설정

1. **Settings → Actions → General** 이동

2. **"Workflow permissions"** 섹션에서:
   - **"Read and write permissions"** 선택 ⭐ (중요!)
   - **Save** 클릭

### 3단계: 저장소가 Public인지 확인

- GitHub Pages는 **Public 저장소**에서만 무료로 사용 가능합니다
- Private 저장소는 GitHub Pro가 필요합니다

## ✅ 설정 확인

설정이 완료되면:

1. **Settings → Pages**에서 다음이 표시되어야 합니다:
   - Source: **"GitHub Actions"**
   - Status: **"Your site is ready to be published"** 또는 배포 진행 중

2. **Actions 탭**에서 워크플로가 실행되는지 확인

## 🚀 배포 시작

설정이 완료되면:

```bash
git push origin master
```

또는 GitHub에서:
- **Actions** 탭 → **"Deploy to GitHub Pages"** → **"Run workflow"** 클릭

## 📍 배포 완료 후

배포가 완료되면 (5-10분 소요):
```
https://kimyunjung1227-arch.github.io/app/
```

## ❓ 문제 해결

### "Resource not accessible by integration" 에러

이 에러는 다음을 확인하세요:

1. ✅ **Settings → Pages**에서 Source가 **"GitHub Actions"**로 설정되었는지
2. ✅ **Settings → Actions → General**에서 **"Read and write permissions"**가 설정되었는지
3. ✅ 저장소가 **Public**인지 확인

### 여전히 안 되는 경우

1. **Settings → Pages**에서 Source를 **"Deploy from a branch"**로 변경
2. Branch: `gh-pages` 선택
3. Save 후 다시 **"GitHub Actions"**로 변경

---

**중요**: 이 설정은 **최초 1회만** 하면 됩니다. 이후에는 자동으로 배포됩니다.
