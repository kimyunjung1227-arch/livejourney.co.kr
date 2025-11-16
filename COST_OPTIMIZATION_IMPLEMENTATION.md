# 💰 비용 최소화 구현 가이드

초기 단계에서 바로 적용할 수 있는 최적화 코드 구현 방법입니다.

---

## 📋 목차

1. [캐싱 구현](#1-캐싱-구현)
2. [이미지 최적화](#2-이미지-최적화)
3. [데이터베이스 쿼리 최적화](#3-데이터베이스-쿼리-최적화)
4. [API 응답 최적화](#4-api-응답-최적화)

---

## 1. 캐싱 구현

### 1.1 메모리 캐시 유틸리티 사용

이미 생성된 `backend/utils/cache.js`를 사용합니다.

### 1.2 게시물 목록 API에 캐싱 적용

```javascript
// backend/routes/posts.js 수정 예시
const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const { cacheMiddleware } = require('../middleware/cacheMiddleware');

// 게시물 목록 조회 (5분 캐싱)
router.get('/', 
  cacheMiddleware(5 * 60 * 1000), // 5분 캐싱
  async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const skip = (page - 1) * limit;

      // 쿼리 최적화: lean() 사용으로 Mongoose 오버헤드 제거
      const posts = await Post.find({ isPublic: true, isBlocked: false })
        .populate('user', 'username profileImage')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(); // lean()으로 성능 향상

      const total = await Post.countDocuments({ isPublic: true, isBlocked: false });

      res.json({
        success: true,
        posts,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('게시물 목록 조회 오류:', error);
      res.status(500).json({
        success: false,
        error: '게시물 목록을 불러오는 중 오류가 발생했습니다.'
      });
    }
  }
);

module.exports = router;
```

### 1.3 캐시 무효화 (게시물 생성/수정/삭제 시)

```javascript
// backend/routes/posts.js에 추가
const { clearCache } = require('../middleware/cacheMiddleware');

// 게시물 생성
router.post('/', async (req, res) => {
  try {
    // ... 게시물 생성 로직 ...
    
    // 캐시 무효화
    clearCache('cache:/api/posts:*');
    
    res.json({ success: true, post });
  } catch (error) {
    // ...
  }
});

// 게시물 수정
router.put('/:id', async (req, res) => {
  try {
    // ... 게시물 수정 로직 ...
    
    // 캐시 무효화
    clearCache('cache:/api/posts:*');
    
    res.json({ success: true, post });
  } catch (error) {
    // ...
  }
});

// 게시물 삭제
router.delete('/:id', async (req, res) => {
  try {
    // ... 게시물 삭제 로직 ...
    
    // 캐시 무효화
    clearCache('cache:/api/posts:*');
    
    res.json({ success: true });
  } catch (error) {
    // ...
  }
});
```

---

## 2. 이미지 최적화

### 2.1 Sharp 라이브러리 설치

```bash
cd backend
npm install sharp
```

### 2.2 업로드 라우트에 이미지 최적화 적용

```javascript
// backend/routes/upload.js 수정
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { optimizeImage } = require('../utils/imageOptimizer');

// ... 기존 multer 설정 ...

// 단일 이미지 업로드 (최적화 적용)
router.post('/image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: '이미지 파일이 필요합니다.'
      });
    }

    // 이미지 최적화
    const originalPath = req.file.path;
    const imageBuffer = fs.readFileSync(originalPath);
    
    const optimizedBuffer = await optimizeImage(imageBuffer, {
      maxWidth: 1200,
      maxHeight: 1200,
      quality: 80,
      format: 'jpeg'
    });

    // 최적화된 이미지로 교체
    fs.writeFileSync(originalPath, optimizedBuffer);

    const imageUrl = `/uploads/images/${req.file.filename}`;

    res.json({
      success: true,
      imageUrl,
      message: '이미지 업로드 및 최적화 완료',
      originalSize: imageBuffer.length,
      optimizedSize: optimizedBuffer.length,
      savedPercent: ((imageBuffer.length - optimizedBuffer.length) / imageBuffer.length * 100).toFixed(1)
    });
  } catch (error) {
    console.error('이미지 업로드 오류:', error);
    res.status(500).json({
      success: false,
      error: '이미지 업로드 중 오류가 발생했습니다.'
    });
  }
});

module.exports = router;
```

### 2.3 클라이언트 사이드 이미지 압축 (선택사항)

```javascript
// web/src/utils/imageCompression.js (이미 존재할 수 있음)
export const compressImage = async (file, maxWidth = 1200, quality = 0.8) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // 비율 유지하며 리사이징
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // JPEG로 변환 (WebP 지원 시 WebP 사용)
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('이미지 압축 실패'));
            }
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};
```

---

## 3. 데이터베이스 쿼리 최적화

### 3.1 인덱스 확인 및 추가

```javascript
// backend/models/Post.js에 이미 인덱스가 설정되어 있음
// 추가로 필요한 인덱스가 있다면:

// 예: 지역별 인기 게시물 조회용
postSchema.index({ location: 1, likes: -1, createdAt: -1 });

// 예: 카테고리별 최신 게시물 조회용
postSchema.index({ category: 1, createdAt: -1 });
```

### 3.2 쿼리 최적화 예시

```javascript
// ❌ 나쁜 예: N+1 문제
router.get('/:id', async (req, res) => {
  const post = await Post.findById(req.params.id);
  const user = await User.findById(post.user); // 별도 쿼리
  // ...
});

// ✅ 좋은 예: populate 사용
router.get('/:id', async (req, res) => {
  const post = await Post.findById(req.params.id)
    .populate('user', 'username profileImage')
    .lean(); // lean()으로 성능 향상
  // ...
});

// ✅ 더 좋은 예: 필요한 필드만 선택
router.get('/:id', async (req, res) => {
  const post = await Post.findById(req.params.id)
    .populate('user', 'username profileImage')
    .select('images location note category likes comments createdAt')
    .lean();
  // ...
});
```

### 3.3 페이지네이션 최적화

```javascript
// 커서 기반 페이지네이션 (인덱스 활용)
router.get('/cursor', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const cursor = req.query.cursor; // 마지막 게시물의 createdAt

    const query = { isPublic: true, isBlocked: false };
    if (cursor) {
      query.createdAt = { $lt: new Date(cursor) };
    }

    const posts = await Post.find(query)
      .populate('user', 'username profileImage')
      .sort({ createdAt: -1 })
      .limit(limit + 1) // 하나 더 가져와서 다음 페이지 여부 확인
      .lean();

    const hasNextPage = posts.length > limit;
    if (hasNextPage) {
      posts.pop(); // 마지막 항목 제거
    }

    const nextCursor = posts.length > 0 
      ? posts[posts.length - 1].createdAt.toISOString()
      : null;

    res.json({
      success: true,
      posts,
      pagination: {
        hasNextPage,
        nextCursor
      }
    });
  } catch (error) {
    // ...
  }
});
```

---

## 4. API 응답 최적화

### 4.1 응답 크기 최적화

```javascript
// 불필요한 필드 제거
const formatPost = (post) => {
  return {
    id: post._id,
    images: post.images,
    location: post.location,
    note: post.note,
    category: post.category,
    likes: post.likes,
    commentCount: post.comments?.length || 0,
    createdAt: post.createdAt,
    user: {
      id: post.user?._id,
      username: post.user?.username,
      profileImage: post.user?.profileImage
    }
    // 불필요한 필드 제외: aiLabels, reports, isBlocked 등
  };
};

router.get('/', async (req, res) => {
  const posts = await Post.find()
    .populate('user', 'username profileImage')
    .lean();
  
  // 응답 포맷팅
  const formattedPosts = posts.map(formatPost);
  
  res.json({
    success: true,
    posts: formattedPosts
  });
});
```

### 4.2 압축 미들웨어 확인

```javascript
// backend/server.js에 이미 compression 미들웨어가 있음
app.use(compression()); // ✅ 이미 적용됨
```

### 4.3 정적 파일 캐싱

```javascript
// backend/server.js 수정
app.use('/uploads', express.static(uploadDir, {
  maxAge: '1d', // 1일 캐싱
  etag: true,   // ETag 지원
  lastModified: true
}));
```

---

## 5. 환경 변수 최적화

### 5.1 .env 파일 최적화

```bash
# backend/.env

# 서버 설정
PORT=5000
NODE_ENV=production

# MongoDB (Atlas Free Tier 사용)
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/livejourney?retryWrites=true&w=majority

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# 파일 업로드 크기 제한 (10MB → 5MB로 축소)
MAX_FILE_SIZE=5242880

# 프론트엔드 URL
FRONTEND_URL=https://your-app.netlify.app

# 불필요한 API 키는 주석 처리 (비용 절감)
# GOOGLE_VISION_API_KEY=  # 사용 안 함
```

---

## 6. 모니터링 및 로깅 최적화

### 6.1 프로덕션 환경에서 상세 로깅 비활성화

```javascript
// backend/server.js
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev')); // 개발 환경에서만 상세 로깅
} else {
  app.use(morgan('combined')); // 프로덕션에서는 간단한 로깅
}
```

### 6.2 에러 로깅 최적화

```javascript
// 불필요한 스택 트레이스 제거 (프로덕션)
app.use((error, req, res, next) => {
  console.error('에러 발생:', error.message); // 메시지만 로깅
  
  res.status(error.status || 500).json({
    success: false,
    error: error.message || '서버 오류가 발생했습니다.',
    // 프로덕션에서는 stack 제외
    ...(process.env.NODE_ENV !== 'production' && { stack: error.stack })
  });
});
```

---

## 7. 배포 시 체크리스트

### 초기 단계 배포 전 확인사항

- [ ] MongoDB Atlas Free Tier 설정 완료
- [ ] 서버 무료 티어 (Render/Railway) 설정 완료
- [ ] 이미지 최적화 적용 (Sharp 설치)
- [ ] 캐싱 미들웨어 적용
- [ ] 불필요한 API 키 제거
- [ ] 파일 크기 제한 설정 (5MB 이하)
- [ ] 정적 파일 캐싱 설정
- [ ] 압축 미들웨어 활성화
- [ ] 프로덕션 환경 변수 설정
- [ ] 에러 로깅 최적화

---

## 8. 비용 모니터링

### 8.1 MongoDB Atlas 모니터링

- Atlas 대시보드에서 스토리지 사용량 확인
- 쿼리 성능 모니터링
- 인덱스 사용률 확인

### 8.2 서버 모니터링

- CPU/메모리 사용량 확인
- 응답 시간 모니터링
- 에러율 추적

### 8.3 무료 티어 한도 확인

- MongoDB Atlas: 512MB 스토리지
- Render: 512MB RAM, 15분 슬리프
- Netlify: 월 100GB 대역폭

---

## 📝 참고사항

1. **Sharp 라이브러리**: 이미지 최적화에 필수적이지만, 없어도 앱은 동작합니다.
2. **캐싱**: 초기에는 메모리 캐시로 충분하지만, 서버 재시작 시 캐시가 초기화됩니다.
3. **인덱스**: 너무 많은 인덱스는 쓰기 성능을 저하시킬 수 있으므로 필요한 것만 추가하세요.
4. **모니터링**: 무료 티어 한도를 초과하지 않도록 주기적으로 확인하세요.

---

## 🔗 관련 파일

- `backend/utils/cache.js` - 메모리 캐시 유틸리티
- `backend/utils/imageOptimizer.js` - 이미지 최적화 유틸리티
- `backend/middleware/cacheMiddleware.js` - 캐싱 미들웨어
- `COST_OPTIMIZATION_STRATEGY.md` - 전체 전략 문서


