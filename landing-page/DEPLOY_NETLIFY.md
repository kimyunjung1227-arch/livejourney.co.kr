# 🚀 Netlify 배포 가이드

## 방법 1: 드래그 앤 드롭 (가장 쉬움)

1. **Netlify 웹사이트 접속**
   - https://app.netlify.com 접속
   - 계정이 없다면 GitHub/Google 계정으로 가입

2. **새 사이트 추가**
   - "Add new site" 버튼 클릭
   - "Deploy manually" 선택

3. **파일 업로드**
   - `landing-page` 폴더 전체를 드래그 앤 드롭
   - 또는 폴더 안의 모든 파일을 선택해서 드래그 앤 드롭

4. **배포 완료!**
   - 몇 초 후 고유한 URL이 생성됩니다
   - 예: `https://amazing-site-123456.netlify.app`

5. **도메인 변경 (선택사항)**
   - Site settings > Domain management
   - "Change site name" 클릭
   - 원하는 이름으로 변경: `your-name.netlify.app`

---

## 방법 2: GitHub 연동 (자동 배포)

### 1단계: GitHub 저장소 생성

```bash
cd landing-page
git init
git add .
git commit -m "Initial landing page"

# GitHub에서 새 저장소 생성 후
git remote add origin https://github.com/YOUR_USERNAME/livejourney-landing.git
git branch -M main
git push -u origin main
```

### 2단계: Netlify에서 GitHub 연동

1. Netlify에서 "Add new site" > "Import an existing project"
2. "GitHub" 선택
3. 저장소 선택: `livejourney-landing`
4. Build settings:
   - **Base directory**: (비워두기)
   - **Build command**: (비워두기)
   - **Publish directory**: `.` (현재 디렉토리)
5. "Deploy site" 클릭

### 3단계: 자동 배포 확인

이제부터 `git push`를 할 때마다 자동으로 배포됩니다!

```bash
# 변경사항 적용
git add .
git commit -m "Update content"
git push

# Netlify가 자동으로 새 버전 배포!
```

---

## 방법 3: Netlify CLI (개발자용)

### 1단계: Netlify CLI 설치

```bash
npm install -g netlify-cli
```

### 2단계: 로그인

```bash
netlify login
```

### 3단계: 배포

```bash
cd landing-page

# 초기 배포
netlify deploy

# 프로덕션 배포
netlify deploy --prod
```

---

## ⚙️ 고급 설정

### 커스텀 도메인 연결

1. Netlify Dashboard에서 사이트 선택
2. "Domain settings" 클릭
3. "Add custom domain" 클릭
4. 도메인 입력 (예: `livejourney.com`)
5. DNS 설정 안내를 따라 진행

### 환경 변수 설정

1. Site settings > Environment variables
2. "Add a variable" 클릭
3. 키-값 쌍 입력 (예: `API_URL`, `GA_TRACKING_ID`)

### HTTPS 설정

- Netlify는 자동으로 Let's Encrypt SSL 인증서를 제공합니다
- 도메인 연결 후 자동 활성화

### 폼 제출 처리 (Netlify Forms)

`index.html`의 폼에 `data-netlify="true"` 추가:

```html
<form data-netlify="true" name="contact">
  <!-- 폼 필드 -->
</form>
```

제출된 폼은 Netlify Dashboard에서 확인 가능!

---

## 🔧 문제 해결

### 404 에러가 발생할 때

`netlify.toml` 파일이 있는지 확인:

```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### 빌드가 실패할 때

1. Netlify 로그 확인
2. 파일 경로가 올바른지 확인
3. Build settings에서 Publish directory 확인

### 변경사항이 반영되지 않을 때

1. 브라우저 캐시 삭제 (Ctrl + Shift + R)
2. Netlify에서 "Trigger deploy" > "Clear cache and deploy"

---

## 📊 배포 후 체크리스트

- [ ] 사이트가 정상적으로 로드되는가?
- [ ] 모든 링크가 작동하는가?
- [ ] 모바일에서 제대로 보이는가?
- [ ] 이메일 폼이 작동하는가?
- [ ] HTTPS가 활성화되어 있는가?
- [ ] Google Analytics가 작동하는가?
- [ ] 페이지 로딩 속도가 빠른가?

---

## 🎉 배포 완료!

축하합니다! 랜딩 페이지가 전세계에 공개되었습니다.

**다음 단계:**
1. 소셜 미디어에 공유
2. Google Search Console에 사이트맵 제출
3. 분석 도구로 방문자 추적
4. A/B 테스팅으로 전환율 최적화

---

**💡 팁:** Netlify는 무료로 다음을 제공합니다:
- 100GB 대역폭/월
- 자동 HTTPS
- 지속적 배포 (CD)
- 폼 제출 처리
- 서버리스 함수

더 많은 트래픽이 필요하면 Pro 플랜($19/월)으로 업그레이드하세요.

















