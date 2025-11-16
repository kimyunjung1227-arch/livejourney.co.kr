/**
 * API 응답 캐싱 미들웨어
 * 초기/중반 단계에서 사용
 */

const cache = require('../utils/cache');

/**
 * 캐시 미들웨어 생성
 * @param {number} ttl - 캐시 TTL (밀리초), 기본값 5분
 * @param {Function} keyGenerator - 캐시 키 생성 함수 (선택사항)
 */
const cacheMiddleware = (ttl = 5 * 60 * 1000, keyGenerator = null) => {
  return (req, res, next) => {
    // GET 요청만 캐싱
    if (req.method !== 'GET') {
      return next();
    }

    // 캐시 키 생성
    const cacheKey = keyGenerator 
      ? keyGenerator(req)
      : `cache:${req.originalUrl}:${JSON.stringify(req.query)}`;

    // 캐시 확인
    const cached = cache.get(cacheKey);
    if (cached) {
      console.log(`⚡ 캐시 히트: ${cacheKey}`);
      return res.json(cached);
    }

    // 원본 응답 함수 저장
    const originalJson = res.json.bind(res);

    // 응답을 가로채서 캐시에 저장
    res.json = function(data) {
      cache.set(cacheKey, data, ttl);
      console.log(`💾 캐시 저장: ${cacheKey}`);
      return originalJson(data);
    };

    next();
  };
};

/**
 * 특정 경로의 캐시 삭제
 * @param {string} pattern - 캐시 키 패턴 (예: 'cache:/api/posts:*')
 */
const clearCache = (pattern) => {
  cache.deletePattern(pattern);
  console.log(`🗑️ 캐시 삭제: ${pattern}`);
};

module.exports = {
  cacheMiddleware,
  clearCache
};


