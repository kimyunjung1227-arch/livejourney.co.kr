## LiveJourney 전체 배포 가이드 (MongoDB + Render + Vercel)

이 문서는 **지금 코드 그대로** 실제 서버에 올려서,  
다른 사람들도 사진을 올리고 데이터가 MongoDB에 저장되도록 만드는 최소 단계만 정리한 가이드입니다.

각 단계는 **순서대로** 진행하면 됩니다.

---

## 1. MongoDB Atlas 준비 (데이터베이스)

1. **https://www.mongodb.com/atlas** 에 가입 후 무료 클러스터 생성
2. `Database` → `Connect` → `Add a Database User`
   - Username: 원하는 이름 (예: `livejourney`)
   - Password: 복잡한 비밀번호 생성 후 메모
3. `Network Access` → `Add IP Address`
   - 테스트용으로 `0.0.0.0/0` 추가 (나중에 줄이면 됨)
4. 다시 `Connect` → `Connect your application`
   - 다음과 비슷한 **Connection String** 을 복사:

   ```text
   mongodb+srv://livejourney:<PASSWORD>@cluster0.xxxxxx.mongodb.net/livejourney?retryWrites=true&w=majority
   ```

5. `<PASSWORD>` 를 실제 비밀번호로 바꿔서 어딘가에 메모해 둡니다.  
   이 값이 나중에 `MONGODB_URI` 환경 변수로 들어갑니다.

---

## 2. Render 에 백엔드 배포 (Node/Express 서버)

### 2-1. GitHub 에 코드 올리기

1. 로컬에서 이 프로젝트 루트(`mvp1`)를 GitHub 저장소에 푸시합니다.
2. Render 가 GitHub 저장소를 읽을 수 있어야 합니다.

### 2-2. Render 서비스 생성

1. **https://render.com** 에 가입 → `New +` → **Blueprint** 선택
2. GitHub 에 올린 리포지토리를 선택하면, 루트에 있는 `render.yaml` 을 자동으로 인식합니다.
3. `render.yaml` 내용에 따라 `livejourney-backend` 웹 서비스가 생성됩니다.

### 2-3. 백엔드 환경 변수 설정

Render 의 `livejourney-backend` 서비스에서 **Environment → Environment Variables** 에 아래 값들을 채웁니다.

- **필수**
  - `MONGODB_URI` → 1단계에서 복사한 Atlas 연결 문자열
  - `FRONTEND_URL` → 나중에 Vercel 에서 받은 프론트엔드 URL (처음에는 임시로 `http://localhost:5173` 넣어도 됨)
  - `JWT_SECRET` → 아무 랜덤 문자열 (예: `livejourney-jwt-secret-2025`)
  - `SESSION_SECRET` → 아무 랜덤 문자열 (예: `livejourney-session-secret-2025`)
  - `CLOUDINARY_CLOUD_NAME` → Cloudinary 대시보드의 Cloud name
  - `CLOUDINARY_API_KEY` → Cloudinary API Key
  - `CLOUDINARY_API_SECRET` → Cloudinary API Secret

- **선택 (있으면 입력, 없으면 비워둬도 됨)**
  - `GEMINI_API_KEY` → 구글 Gemini 키 (AI 태그 생성용)
  - `KAKAO_CLIENT_ID`, `KAKAO_CLIENT_SECRET`
  - `NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET`
  - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`

값을 입력했으면 **Deploy** 를 눌러 배포를 완료합니다.

### 2-4. 백엔드 정상 동작 확인

1. Render 서비스의 URL 을 확인합니다. 예:

   ```text
   https://livejourney-backend.onrender.com
   ```

2. 브라우저에서 다음 주소로 접속:

   ```text
   https://livejourney-backend.onrender.com/api/health
   ```

3. 응답 JSON 에 `status: "ok"` 이고 `mongodb: "connected"` 가 나오면 백엔드 + DB 연결 성공입니다.

---

## 3. Vercel 에 프론트엔드 배포 (React/Vite)

### 3-1. 프로젝트 Import

1. **https://vercel.com** 에 가입
2. `Add New` → `Project` → 같은 GitHub 저장소 선택
3. **Root Directory** 를 `web` 으로 지정
4. Build 설정:
   - Build Command: `npm run build`
   - Output Directory: `dist`

### 3-2. 프론트엔드 환경 변수 설정

Vercel 의 `Environment Variables` 에 다음을 추가합니다.

- `VITE_API_URL` → Render 백엔드의 API 주소

```text
VITE_API_URL = https://livejourney-backend.onrender.com/api
```

설정 후 **Deploy** 를 실행합니다.

배포가 끝나면 예를 들어 이런 URL 이 나옵니다:

```text
https://livejourney-web.vercel.app
```

---

## 4. CORS / 도메인 맞추기 (중요)

이제 백엔드가 프론트엔드 도메인을 정확히 알도록 `FRONTEND_URL` 을 다시 맞춰 줍니다.

1. Render 의 `livejourney-backend` 서비스로 이동
2. `Environment` → `FRONTEND_URL` 값을 다음으로 변경:

```text
FRONTEND_URL = https://livejourney-web.vercel.app
```

3. **Save** 후 서비스를 다시 Deploy 합니다.

이제 브라우저에서 프론트엔드에서 보내는 모든 `axios` 요청(`VITE_API_URL`) 이 CORS 에러 없이 백엔드로 전달됩니다.

---

## 5. 실제 동작 테스트 (다른 사용자 포함)

1. Vercel URL (예: `https://livejourney-web.vercel.app`) 에 접속
2. 회원가입/로그인 → 사진/동영상 업로드 → 설명/태그 입력
3. 새 브라우저나 시크릿 모드, 혹은 다른 기기에서 같은 URL 로 접속
4. **방금 올린 게시물이 보이는지** 확인
   - 보이면: MongoDB 에 데이터가 저장되고, 모든 사용자가 같은 데이터를 공유하는 상태입니다.

---

## 6. 커뮤니티에 가볍게 배포할 때 팁

- **테스트용 안내 문구**  
  메인 화면이나 프로필에 “지금은 베타 테스트 중입니다” 와 같은 한 줄을 넣어두면 좋습니다.
- **에러 확인 위치**
  - 백엔드: Render → Logs
  - 프론트엔드: Vercel → Logs
  - 브라우저: 개발자 도구(F12) → Console / Network
- **속도 관련**
  - Render 무료 플랜은 **첫 요청 때 약간 느린 Cold Start** 가 있습니다.  
    피드백 받을 때 “첫 접속은 3~5초 느릴 수 있다” 정도만 알려주면 됩니다.

---

## 7. 한 번에 볼 수 있는 환경 변수 요약표

### Render (백엔드)

| Key                    | 예시 값 / 설명                                      |
|------------------------|----------------------------------------------------|
| NODE_ENV               | `production` (render.yaml 에 이미 설정)           |
| PORT                   | `10000` (render.yaml 에 이미 설정)               |
| MONGODB_URI            | Atlas 연결 문자열                                  |
| JWT_SECRET             | `livejourney-jwt-secret-2025` 등 랜덤 문자열       |
| SESSION_SECRET         | `livejourney-session-secret-2025` 등 랜덤 문자열   |
| FRONTEND_URL           | `https://livejourney-web.vercel.app`              |
| CLOUDINARY_CLOUD_NAME  | Cloudinary 대시보드 값                             |
| CLOUDINARY_API_KEY     | Cloudinary API Key                                 |
| CLOUDINARY_API_SECRET  | Cloudinary API Secret                              |
| GEMINI_API_KEY         | (선택) Gemini API 키                               |
| KAKAO_CLIENT_ID        | (선택) 카카오 앱 키                                |
| KAKAO_CLIENT_SECRET    | (선택)                                             |
| NAVER_CLIENT_ID        | (선택)                                             |
| NAVER_CLIENT_SECRET    | (선택)                                             |
| GOOGLE_CLIENT_ID       | (선택)                                             |
| GOOGLE_CLIENT_SECRET   | (선택)                                             |

### Vercel (프론트엔드)

| Key          | 예시 값                                           |
|--------------|---------------------------------------------------|
| VITE_API_URL | `https://livejourney-backend.onrender.com/api`    |

---

이 파일(`START_DEPLOYMENT.md`)을 위에서부터 차례로 따라가면  
