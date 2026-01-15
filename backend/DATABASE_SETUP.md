# 데이터베이스 설정 가이드

## MongoDB 설정

### 1. 로컬 MongoDB 설치 및 실행

#### Windows
```bash
# MongoDB 설치 후 서비스 시작
net start MongoDB
```

#### macOS (Homebrew)
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

#### Linux (Ubuntu)
```bash
sudo systemctl start mongod
sudo systemctl enable mongod
```

### 2. MongoDB Atlas (클라우드) 사용

1. [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)에 가입
2. 클러스터 생성
3. 데이터베이스 사용자 생성
4. 네트워크 액세스 설정 (IP 화이트리스트)
5. 연결 문자열 복사

### 3. 환경 변수 설정

`.env` 파일 생성 (또는 `env.example` 복사):

```bash
# 로컬 MongoDB
MONGODB_URI=mongodb://localhost:27017/livejourney

# 또는 MongoDB Atlas
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/livejourney?retryWrites=true&w=majority
```

### 4. 데이터베이스 연결 확인

서버 시작 시 콘솔에서 확인:
```
✅ MongoDB 연결 성공: localhost
```

또는 헬스 체크 엔드포인트:
```bash
curl http://localhost:5000/health
```

## 데이터베이스 모델

### 주요 컬렉션

1. **users** - 사용자 정보
2. **posts** - 게시물
3. **feedback** - 피드백 (얼리어답터용)
4. **points** - 포인트 내역
5. **rewards** - 리워드

### 피드백 모델 구조

```javascript
{
  type: 'bug' | 'feature' | 'improvement' | 'question' | 'other',
  category: 'ui' | 'functionality' | 'performance' | 'content' | 'other',
  title: String,
  description: String,
  status: 'pending' | 'reviewing' | 'in-progress' | 'resolved' | 'rejected',
  priority: 'low' | 'medium' | 'high' | 'critical',
  userId: ObjectId (선택),
  username: String,
  email: String,
  createdAt: Date
}
```

## 배포 전 체크리스트

- [ ] MongoDB 연결 확인
- [ ] 환경 변수 설정 완료
- [ ] 데이터베이스 인덱스 생성 확인
- [ ] 백업 계획 수립
- [ ] 연결 풀 설정 확인
