/**
 * 간단한 메모리 캐시 유틸리티 (초기/중반 단계용)
 * 후반 단계에서는 Redis로 교체 권장
 */

class SimpleCache {
  constructor() {
    this.cache = new Map();
    this.defaultTTL = 5 * 60 * 1000; // 기본 5분
  }

  /**
   * 캐시에 데이터 저장
   * @param {string} key - 캐시 키
   * @param {any} value - 저장할 데이터
   * @param {number} ttl - TTL (밀리초), 기본값 5분
   */
  set(key, value, ttl = this.defaultTTL) {
    const expiresAt = Date.now() + ttl;
    this.cache.set(key, {
      value,
      expiresAt
    });
  }

  /**
   * 캐시에서 데이터 조회
   * @param {string} key - 캐시 키
   * @returns {any|null} - 캐시된 데이터 또는 null
   */
  get(key) {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    // 만료 확인
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  /**
   * 캐시에서 데이터 삭제
   * @param {string} key - 캐시 키
   */
  delete(key) {
    this.cache.delete(key);
  }

  /**
   * 특정 패턴의 키 모두 삭제
   * @param {string} pattern - 키 패턴 (예: 'posts:*')
   */
  deletePattern(pattern) {
    const regex = new RegExp(pattern.replace('*', '.*'));
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * 모든 캐시 삭제
   */
  clear() {
    this.cache.clear();
  }

  /**
   * 만료된 항목 정리 (주기적으로 호출)
   */
  cleanup() {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * 캐시 통계
   */
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// 싱글톤 인스턴스
const cache = new SimpleCache();

// 주기적으로 만료된 항목 정리 (10분마다)
setInterval(() => {
  cache.cleanup();
}, 10 * 60 * 1000);

module.exports = cache;


