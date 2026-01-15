# 🌐 커스텀 도메인 연결 가이드

랜딩페이지를 구매한 도메인과 연결하는 방법을 안내합니다.

---

## 📋 목차

1. [도메인 구매](#1-도메인-구매)
2. [방법 1: Netlify + 커스텀 도메인 (가장 추천)](#방법-1-netlify--커스텀-도메인-가장-추천)
3. [방법 2: GitHub Pages + 커스텀 도메인](#방법-2-github-pages--커스텀-도메인)
4. [방법 3: Vercel + 커스텀 도메인](#방법-3-vercel--커스텀-도메인)
5. [DNS 설정 상세 가이드](#dns-설정-상세-가이드)
6. [문제 해결](#문제-해결)

---

## 1. 도메인 구매

### 추천 도메인 등록업체 (한국)

1. **가비아 (Gabia)** - https://www.gabia.com
   - 한국어 지원
   - 연간 약 15,000원~ (`.com`, `.kr`)
   - DNS 관리 쉬움

2. **후이즈 (Whois)** - https://whois.co.kr
   - 한국어 지원
   - 연간 약 12,000원~
   - 다양한 도메인 확장자

3. **카페24** - https://www.cafe24.com
   - 한국어 지원
   - 호스팅 패키지와 함께 구매 가능

### 해외 도메인 등록업체

1. **Namecheap** - https://www.namecheap.com
   - 저렴한 가격
   - 연간 약 $10~15 (`.com`)
   - 무료 WHOIS 보호

2. **Google Domains** - https://domains.google
   - 간단한 인터페이스
   - 연간 약 $12 (`.com`)

3. **Cloudflare Registrar** - https://www.cloudflare.com/products/registrar/
   - 도메인 비용만 청구 (마진 없음)
   - 무료 DNS 제공

---

## 방법 1: Netlify + 커스텀 도메인 (가장 추천) ⭐

### 장점
- ✅ 설정이 가장 쉬움
- ✅ 자동 HTTPS 인증서 (Let's Encrypt)
- ✅ 무료 SSL/TLS
- ✅ 빠른 CDN
- ✅ DNS 관리도 Netlify에서 가능

### 단계별 가이드

#### 1단계: Netlify에 사이트 배포

이미 배포되어 있다면 다음 단계로 넘어가세요.

```bash
# Netlify CLI로 배포 (또는 웹에서 드래그 앤 드롭)
cd landing-page
netlify deploy --prod
```

또는 Netlify 웹사이트에서:
1. https://app.netlify.com 접속
2. "Add new site" > "Deploy manually"
3. `landing-page` 폴더 드래그 앤 드롭

#### 2단계: Netlify에서 도메인 추가

1. **Netlify Dashboard**에서 사이트 선택
2. 왼쪽 메뉴에서 **"Domain settings"** 클릭
3. **"Add custom domain"** 버튼 클릭
4. 구매한 도메인 입력 (예: `livejourney.com`)
5. **"Verify"** 클릭

#### 3단계: DNS 설정

Netlify가 두 가지 방법을 제시합니다:

##### 옵션 A: Netlify DNS 사용 (추천) 🌟

**장점**: 모든 DNS 관리를 Netlify에서 할 수 있음

1. Netlify에서 **"Use Netlify DNS"** 선택
2. Netlify가 제공하는 **Nameservers** 복사:
   ```
   dns1.p01.nsone.net
   dns2.p01.nsone.net
   dns3.p01.nsone.net
   dns4.p01.nsone.net
   ```
3. 도메인 등록업체로 이동
4. **Nameservers 변경**:
   - 가비아: 도메인 관리 > DNS 설정 > 네임서버 변경
   - 후이즈: 도메인 관리 > 네임서버 설정
   - Namecheap: Domain List > Manage > Nameservers
5. Netlify에서 제공한 Nameservers 입력
6. 저장 후 **24-48시간** 대기 (보통 몇 시간 내 완료)

##### 옵션 B: 기존 DNS 사용

도메인 등록업체의 DNS를 계속 사용하고 싶다면:

1. Netlify에서 **"Use Netlify DNS"** 선택하지 않음
2. Netlify가 제공하는 **DNS 레코드** 확인:
   ```
   Type: A
   Name: @
   Value: 75.2.60.5
   
   Type: A
   Name: @
   Value: 99.83.190.102
   ```
3. 도메인 등록업체의 DNS 관리 페이지로 이동
4. **A 레코드 추가**:
   - 호스트: `@` 또는 비워두기
   - 값: Netlify가 제공한 IP 주소들
5. **CNAME 레코드 추가** (www 서브도메인용):
   - 호스트: `www`
   - 값: `your-site-name.netlify.app`
6. 저장 후 **24-48시간** 대기

#### 4단계: HTTPS 활성화 대기

- Netlify가 자동으로 Let's Encrypt 인증서를 발급합니다
- 보통 **5-10분** 내에 완료됩니다
- "Domain settings"에서 SSL 인증서 상태 확인 가능

#### 5단계: 완료 확인

1. 브라우저에서 `https://yourdomain.com` 접속
2. `https://www.yourdomain.com` 접속
3. 두 URL 모두 정상 작동하는지 확인

---

## 방법 2: GitHub Pages + 커스텀 도메인

### 장점
- ✅ GitHub 저장소와 통합
- ✅ 무료 호스팅
- ✅ 자동 HTTPS

### 단점
- ⚠️ 설정이 Netlify보다 복잡
- ⚠️ 빌드 시간 제한

### 단계별 가이드

#### 1단계: GitHub Pages 배포

1. GitHub 저장소에서 **Settings** > **Pages**
2. Source: `main` 브랜치, `/landing-page` 폴더 선택
3. 저장 후 배포 대기

#### 2단계: CNAME 파일 생성

`landing-page` 폴더에 `CNAME` 파일 생성:

```bash
cd landing-page
echo "yourdomain.com" > CNAME
```

또는 직접 파일 생성:
```
yourdomain.com
```

**중요**: `www` 없이 루트 도메인만 입력!

#### 3단계: Git에 추가 및 푸시

```bash
git add landing-page/CNAME
git commit -m "Add custom domain"
git push
```

#### 4단계: GitHub Pages 설정

1. GitHub 저장소 > **Settings** > **Pages**
2. **Custom domain** 섹션에서 도메인 입력: `yourdomain.com`
3. **Save** 클릭
4. **Enforce HTTPS** 체크박스 선택 (인증서 발급 후)

#### 5단계: DNS 설정

도메인 등록업체의 DNS 관리 페이지에서:

**A 레코드 추가** (4개 모두):
```
Type: A
Name: @
Value: 185.199.108.153

Type: A
Name: @
Value: 185.199.109.153

Type: A
Name: @
Value: 185.199.110.153

Type: A
Name: @
Value: 185.199.111.153
```

**CNAME 레코드 추가** (www 서브도메인):
```
Type: CNAME
Name: www
Value: YOUR_USERNAME.github.io
```

#### 6단계: 완료 대기

- DNS 전파: **24-48시간** (보통 몇 시간)
- HTTPS 인증서: **몇 시간~하루**

---

## 방법 3: Vercel + 커스텀 도메인

### 장점
- ✅ 매우 빠른 배포
- ✅ 자동 HTTPS
- ✅ Next.js 최적화

### 단계별 가이드

#### 1단계: Vercel에 배포

1. https://vercel.com 접속
2. GitHub 계정으로 로그인
3. "Add New Project" 클릭
4. 저장소 선택
5. Root Directory: `landing-page` 설정
6. Deploy

#### 2단계: 도메인 추가

1. 프로젝트 > **Settings** > **Domains**
2. 도메인 입력: `yourdomain.com`
3. **Add** 클릭

#### 3단계: DNS 설정

Vercel이 제공하는 DNS 레코드를 도메인 등록업체에 추가:

**A 레코드**:
```
76.76.21.21
```

또는 **CNAME 레코드**:
```
cname.vercel-dns.com
```

#### 4단계: 완료 대기

- DNS 전파: **24-48시간**
- HTTPS: 자동 활성화

---

## DNS 설정 상세 가이드

### 주요 DNS 레코드 타입

#### A 레코드
- 도메인을 IP 주소로 연결
- 예: `yourdomain.com` → `75.2.60.5`

#### CNAME 레코드
- 도메인을 다른 도메인으로 연결
- 예: `www.yourdomain.com` → `your-site.netlify.app`

#### Nameservers
- DNS를 누가 관리할지 결정
- Netlify DNS 사용 시 Netlify의 Nameservers로 변경

### 도메인 등록업체별 DNS 설정 방법

#### 가비아 (Gabia)

1. https://www.gabia.com 로그인
2. **도메인 관리** > 도메인 선택
3. **DNS 관리** 클릭
4. **레코드 추가**:
   - 레코드 타입: A 또는 CNAME
   - 호스트: `@` (루트) 또는 `www`
   - 값: IP 주소 또는 도메인
5. **저장**

#### 후이즈 (Whois)

1. https://whois.co.kr 로그인
2. **도메인 관리** > 도메인 선택
3. **DNS 설정** 클릭
4. 레코드 추가 후 저장

#### Namecheap

1. https://www.namecheap.com 로그인
2. **Domain List** > 도메인 선택 > **Manage**
3. **Advanced DNS** 탭
4. **Add New Record** 클릭
5. 레코드 추가 후 저장

#### Cloudflare

1. https://dash.cloudflare.com 접속
2. 사이트 추가
3. DNS 레코드 추가
4. Nameservers를 Cloudflare로 변경

---

## 문제 해결

### 문제 1: "DNS 설정이 완료되지 않았습니다"

**원인**: DNS 전파가 아직 완료되지 않음

**해결 방법**:
1. https://dnschecker.org 에서 전파 상태 확인
2. 전 세계 DNS 서버에서 확인되는지 확인
3. 24-48시간 더 대기

### 문제 2: HTTPS 인증서가 발급되지 않음

**원인**: DNS 설정이 완료되지 않았거나 잘못됨

**해결 방법**:
1. DNS 설정이 올바른지 확인
2. Netlify/GitHub Pages에서 "Retry certificate" 클릭
3. 24시간 후에도 안 되면 DNS 레코드 재확인

### 문제 3: www가 작동하지 않음

**원인**: CNAME 레코드가 설정되지 않음

**해결 방법**:
1. DNS에 CNAME 레코드 추가:
   ```
   Type: CNAME
   Name: www
   Value: your-site.netlify.app (또는 YOUR_USERNAME.github.io)
   ```
2. 24시간 대기

### 문제 4: 도메인 연결 후 404 에러

**원인**: 사이트 배포가 완료되지 않았거나 경로 문제

**해결 방법**:
1. Netlify/GitHub Pages에서 배포 상태 확인
2. `index.html` 파일이 올바른 위치에 있는지 확인
3. 브라우저 캐시 삭제 (Ctrl + Shift + R)

### 문제 5: 도메인 등록업체에서 Nameservers 변경이 안 됨

**원인**: 도메인 잠금 또는 보호 설정

**해결 방법**:
1. 도메인 등록업체에서 **Domain Lock** 해제
2. **WHOIS Privacy** 일시 해제 (필요시)
3. 다시 시도

---

## 📊 배포 후 체크리스트

- [ ] 도메인이 정상적으로 연결되었는가?
- [ ] `https://yourdomain.com` 접속 가능한가?
- [ ] `https://www.yourdomain.com` 접속 가능한가?
- [ ] HTTPS 인증서가 활성화되었는가? (자물쇠 아이콘 확인)
- [ ] 모든 페이지가 정상 작동하는가?
- [ ] 모바일에서도 정상 작동하는가?
- [ ] Google Search Console에 사이트 등록했는가?
- [ ] Google Analytics 설정했는가?

---

## 🎯 추천 방법 비교

| 방법 | 난이도 | 속도 | 비용 | 추천도 |
|------|--------|------|------|--------|
| **Netlify** | ⭐ 쉬움 | ⚡ 빠름 | 💰 무료 | ⭐⭐⭐⭐⭐ |
| **GitHub Pages** | ⭐⭐ 보통 | 🐢 보통 | 💰 무료 | ⭐⭐⭐ |
| **Vercel** | ⭐ 쉬움 | ⚡⚡ 매우 빠름 | 💰 무료 | ⭐⭐⭐⭐ |

**결론**: **Netlify를 가장 추천합니다!** 설정이 쉽고 자동화가 잘 되어 있습니다.

---

## 💡 추가 팁

### 1. 서브도메인 사용

`blog.yourdomain.com`, `app.yourdomain.com` 등 서브도메인도 추가 가능:

1. Netlify/GitHub Pages에서 도메인 추가
2. DNS에 CNAME 레코드 추가:
   ```
   Type: CNAME
   Name: blog
   Value: your-site.netlify.app
   ```

### 2. 이메일 전용 도메인

도메인을 웹사이트와 이메일 모두에 사용하려면:
- 웹사이트: A 레코드 또는 CNAME
- 이메일: MX 레코드 추가 (Gmail, Outlook 등)

### 3. Google Analytics 연동

도메인 연결 후 Google Analytics로 방문자 추적:

1. Google Analytics 계정 생성
2. 추적 코드를 `index.html`에 추가
3. 도메인을 속성에 등록

### 4. SEO 최적화

1. Google Search Console에 사이트 등록
2. `sitemap.xml` 제출
3. `robots.txt` 확인

---

## 🆘 도움이 더 필요하신가요?

문제가 계속되면:
1. DNS 설정 스크린샷 공유
2. 에러 메시지 캡처
3. 사용 중인 도메인 등록업체 알려주세요

도와드리겠습니다! 🚀



`








































