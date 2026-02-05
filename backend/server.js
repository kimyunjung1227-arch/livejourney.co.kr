require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const session = require('express-session');
const passport = require('./middleware/passport');

// DB 연결
const connectDB = require('./config/database');

// Express 앱 생성
const app = express();
const PORT = process.env.PORT || 5000; // .env 파일의 포트 사용

// ============================================
// 미들웨어 설정
// ============================================

// 보안 헤더
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS 설정
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// 압축
app.use(compression());

// 로깅 (개발 환경에서만)
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Body 파서 (파일 크기 제한 증가)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 세션 설정 (소셜 로그인용)
app.use(session({
  secret: process.env.SESSION_SECRET || 'livejourney-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24시간
  }
}));

// Passport 초기화
app.use(passport.initialize());
app.use(passport.session());

// 업로드 디렉토리 생성 및 정적 파일 제공
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
app.use('/uploads', express.static(uploadDir));

// ============================================
// 라우트 설정
// ============================================

// 헬스 체크
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    mongodb: require('mongoose').connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// API 헬스 체크 (Render용)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'API Server is running',
    timestamp: new Date().toISOString(),
    mongodb: require('mongoose').connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// API 라우트
const postsRouter = require('./routes/posts');
const usersRouter = require('./routes/users');
const authRouter = require('./routes/auth');
const pointsRouter = require('./routes/points');
const rewardsRouter = require('./routes/rewards');
const uploadRouter = require('./routes/upload');
const searchRouter = require('./routes/search');
const mapRouter = require('./routes/map');
const locationsRouter = require('./routes/locations');
const policiesRouter = require('./routes/policies');
const feedbackRouter = require('./routes/feedback');

app.use('/api/posts', postsRouter);
app.use('/api/users', usersRouter);
app.use('/api/auth', authRouter);
app.use('/api/points', pointsRouter);
app.use('/api/rewards', rewardsRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/search', searchRouter);
app.use('/api/map', mapRouter);
app.use('/api/locations', locationsRouter);
app.use('/api/policies', policiesRouter);
app.use('/api/feedback', feedbackRouter);

// API 문서 (루트 경로)
app.get('/', (req, res) => {
  res.json({
    message: 'LiveJourney API Server',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      posts: '/api/posts',
      users: '/api/users',
      auth: '/api/auth',
      points: '/api/points',
      rewards: '/api/rewards',
      upload: '/api/upload',
      search: '/api/search',
      map: '/api/map',
      feedback: '/api/feedback'
    },
    documentation: '/api/docs'
  });
});

// ============================================
// 에러 핸들링
// ============================================

// 404 핸들러
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: '요청한 리소스를 찾을 수 없습니다.',
    path: req.path
  });
});

// 에러 핸들러
app.use((error, req, res, next) => {
  console.error('에러 발생:', error);

  // Multer 에러
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      error: '파일 크기가 너무 큽니다. 최대 10MB까지 업로드 가능합니다.'
    });
  }

  // Mongoose 에러
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: '입력 데이터가 유효하지 않습니다.',
      details: error.message
    });
  }

  if (error.name === 'CastError') {
    return res.status(400).json({
      success: false,
      error: '잘못된 ID 형식입니다.'
    });
  }

  // JWT 에러
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: '유효하지 않은 토큰입니다.'
    });
  }

  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: '토큰이 만료되었습니다.'
    });
  }

  // 기본 에러 응답
  res.status(error.status || 500).json({
    success: false,
    error: error.message || '서버 오류가 발생했습니다.',
    ...(process.env.NODE_ENV !== 'production' && { stack: error.stack })
  });
});

// ============================================
// 서버 시작
// ============================================

const startServer = async () => {
  try {
    // MongoDB 연결 시도
    try {
      await connectDB();
      console.log('📦 MongoDB 연결 성공!');
    } catch (dbError) {
      console.warn('⚠️ MongoDB 연결 실패 - Mock 모드로 실행');
      console.warn('   로컬에서는 localStorage를 사용합니다.');
    }

    // 서버 시작 (MongoDB 연결 여부와 관계없이)
    app.listen(PORT, () => {
      const mongoStatus = require('mongoose').connection.readyState === 1 ? 'MongoDB 연결됨' : 'Mock 모드 (localStorage)';

      console.log(`
╔════════════════════════════════════════╗
║   🚀 백엔드 서버 시작 완료!           ║
╚════════════════════════════════════════╝

📍 포트: ${PORT}
🌐 URL: http://localhost:${PORT}
🔧 상태: http://localhost:${PORT}/health
🌍 환경: ${process.env.NODE_ENV || 'development'}
📦 데이터: ${mongoStatus}

✨ 모든 준비 완료!
      `);
    });
  } catch (error) {
    console.error('❌ 서버 시작 실패:', error);
    process.exit(1);
  }
};

// 서버 시작
startServer();

// 프로세스 종료 처리
process.on('SIGTERM', async () => {
  console.log('\n서버를 종료합니다...');
  await require('mongoose').connection.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('\n서버를 종료합니다...');
  await require('mongoose').connection.close();
  process.exit(0);
});

// 처리되지 않은 Promise 거부 처리
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

module.exports = app;



















