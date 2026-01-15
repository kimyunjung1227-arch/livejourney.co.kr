# ⚡ 빠른 다운로드 설정 (5분 안에!)

웹 앱과 APK를 다운로드할 수 있도록 빠르게 설정하는 방법입니다.

## 🚀 단계별 가이드

### 1단계: APK 빌드 및 준비

```powershell
# web 폴더로 이동
cd C:\Users\wnd12\Desktop\mvp1\web

# APK 빌드 (자동으로 public 폴더에 복사됨)
.\BUILD_APK.bat
```

### 2단계: 웹 빌드 및 배포

#### 방법 A: GitHub Pages (자동 배포)

1. **코드 푸시**
   ```powershell
   git add .
   git commit -m "Add download page and APK"
   git push
   ```

2. **자동 배포**
   - GitHub Actions가 자동으로 빌드 및 배포합니다
   - 1-2분 후 완료

3. **확인**
   - https://kimyunjung1227-arch.github.io/app/download.html

#### 방법 B: Netlify (수동 배포)

1. **로컬 빌드**
   ```powershell
   npm run build
   ```

2. **Netlify에 배포**
   - Netlify 대시보드 접속
   - "Deploy manually" 선택
   - `dist` 폴더 드래그 앤 드롭

3. **확인**
   - `https://your-site.netlify.app/download.html`

---

## 📱 다운로드 링크

배포 완료 후:

- **웹 앱**: `https://your-site.com/`
- **다운로드 페이지**: `https://your-site.com/download.html`
- **APK 직접 다운로드**: `https://your-site.com/app-debug.apk`

---

## 🔄 업데이트할 때

### APK 업데이트

1. **APK 재빌드**
   ```powershell
   .\BUILD_APK.bat
   ```

2. **배포**
   - Git에 푸시하거나
   - Netlify에 재배포

### 웹 앱만 업데이트

```powershell
npm run build
# Git 푸시 또는 Netlify 재배포
```

---

## ✅ 확인 사항

- [ ] APK 파일이 `public/app-debug.apk`에 있나요?
- [ ] 다운로드 페이지가 `public/download.html`에 있나요?
- [ ] 빌드 후 `dist` 폴더에 두 파일이 모두 포함되나요?

---

## 🎉 완료!

이제 사용자들이 웹과 앱을 모두 다운로드할 수 있습니다!













