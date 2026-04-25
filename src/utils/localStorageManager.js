/**
 * localStorage 관리 유틸리티
 */

// localStorage 사용 용량 확인 (bytes)
export const getLocalStorageSize = () => {
  let total = 0;
  try {
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        const value = localStorage[key];
        if (value) {
          total += value.length + key.length;
        }
      }
    }
  } catch (error) {
    console.error('localStorage 크기 계산 오류:', error);
  }
  return total;
};

// localStorage 사용 용량 확인 (MB)
export const getLocalStorageSizeMB = () => {
  return (getLocalStorageSize() / (1024 * 1024)).toFixed(2);
};

// 오래된 Mock 데이터 정리
export const cleanOldMockData = () => {
  try {
    const posts = JSON.parse(localStorage.getItem('uploadedPosts') || '[]');
    
    // local-로 시작하는 mock 데이터만 필터링 (실제 사용자 업로드는 유지)
    const mockPosts = posts.filter(p => p.id && p.id.toString().startsWith('mock-'));
    const userPosts = posts.filter(p => !p.id || !p.id.toString().startsWith('mock-'));
    
    console.log(`📊 Mock 데이터: ${mockPosts.length}개, 사용자 데이터: ${userPosts.length}개`);
    
    if (mockPosts.length > 50) {
      // Mock 데이터가 50개 이상이면 최근 30개만 유지 (더 적극적으로 정리)
      const recentMockPosts = mockPosts.slice(0, 30);
      const newPosts = [...userPosts, ...recentMockPosts];
      localStorage.setItem('uploadedPosts', JSON.stringify(newPosts));
      console.log(`✅ Mock 데이터 정리 완료: ${mockPosts.length}개 → ${recentMockPosts.length}개`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Mock 데이터 정리 실패:', error);
    return false;
  }
};

// 오래된 사용자 게시물 정리 (30일 이상 지난 게시물)
export const cleanOldUserPosts = (daysToKeep = 30) => {
  try {
    const posts = JSON.parse(localStorage.getItem('uploadedPosts') || '[]');
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    const recentPosts = posts.filter(post => {
      if (!post.createdAt) return true; // 날짜 정보가 없으면 유지
      const postDate = new Date(post.createdAt);
      return postDate >= cutoffDate;
    });
    
    if (recentPosts.length < posts.length) {
      localStorage.setItem('uploadedPosts', JSON.stringify(recentPosts));
      console.log(`✅ 오래된 게시물 정리 완료: ${posts.length}개 → ${recentPosts.length}개 (${posts.length - recentPosts.length}개 삭제)`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('오래된 게시물 정리 실패:', error);
    return false;
  }
};

// 게시물 수 제한 (최대 개수 유지)
export const limitPostsCount = (maxCount = 100) => {
  try {
    const posts = JSON.parse(localStorage.getItem('uploadedPosts') || '[]');
    
    if (posts.length > maxCount) {
      // 최신 게시물만 유지 (날짜 기준 정렬)
      const sortedPosts = posts.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        return dateB - dateA; // 최신순
      });
      
      const limitedPosts = sortedPosts.slice(0, maxCount);
      localStorage.setItem('uploadedPosts', JSON.stringify(limitedPosts));
      console.log(`✅ 게시물 수 제한 적용: ${posts.length}개 → ${limitedPosts.length}개`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('게시물 수 제한 실패:', error);
    return false;
  }
};

// 모든 Mock 데이터 삭제 (비상용)
export const clearAllMockData = () => {
  try {
    const posts = JSON.parse(localStorage.getItem('uploadedPosts') || '[]');
    const userPosts = posts.filter(p => !p.id || !p.id.toString().startsWith('mock-'));
    localStorage.setItem('uploadedPosts', JSON.stringify(userPosts));
    console.log(`🗑️ 모든 Mock 데이터 삭제 완료`);
    return true;
  } catch (error) {
    console.error('Mock 데이터 삭제 실패:', error);
    return false;
  }
};

// localStorage에 안전하게 저장 (용량 초과 시 자동 정리)
export const safeSetItem = (key, value) => {
  try {
    localStorage.setItem(key, value);
    return { success: true };
  } catch (error) {
    if (error.name === 'QuotaExceededError') {
      console.warn('⚠️ localStorage 용량 초과! 자동 정리 시작...');
      console.log(`현재 사용량: ${getLocalStorageSizeMB()} MB`);
      
      // 1차: 오래된 Mock 데이터 정리
      console.log('1️⃣ Mock 데이터 정리 중...');
      cleanOldMockData();
      
      try {
        localStorage.setItem(key, value);
        console.log('✅ Mock 데이터 정리 후 저장 성공!');
        return { success: true };
      } catch (retryError) {
        // 2차: 오래된 사용자 게시물 정리 (30일 이상)
        console.warn('2️⃣ 오래된 게시물 정리 중...');
        cleanOldUserPosts(30);
        
        try {
          localStorage.setItem(key, value);
          console.log('✅ 오래된 게시물 정리 후 저장 성공!');
          return { success: true };
        } catch (retry2Error) {
          // 3차: 게시물 수 제한 (최대 100개)
          console.warn('3️⃣ 게시물 수 제한 적용 중...');
          limitPostsCount(100);
          
          try {
            localStorage.setItem(key, value);
            console.log('✅ 게시물 수 제한 후 저장 성공!');
            return { success: true };
          } catch (retry3Error) {
            // 4차: 모든 Mock 데이터 삭제
            console.warn('4️⃣ 모든 Mock 데이터 삭제 중...');
            clearAllMockData();
            
            try {
              localStorage.setItem(key, value);
              console.log('✅ 모든 Mock 데이터 삭제 후 저장 성공!');
              return { success: true };
            } catch (retry4Error) {
              // 5차: 게시물 수를 50개로 더 줄임
              console.warn('5️⃣ 게시물 수를 50개로 제한 중...');
              limitPostsCount(50);
              
              try {
                localStorage.setItem(key, value);
                console.log('✅ 게시물 수 50개 제한 후 저장 성공!');
                return { success: true };
              } catch (finalError) {
                console.error('❌ localStorage 저장 최종 실패:', finalError);
                console.log(`최종 사용량: ${getLocalStorageSizeMB()} MB`);
                return { 
                  success: false, 
                  error: 'QUOTA_EXCEEDED',
                  message: 'localStorage 용량이 부족합니다. 브라우저 데이터를 삭제하거나 오래된 게시물을 수동으로 삭제해주세요.'
                };
              }
            }
          }
        }
      }
    }
    
    return { 
      success: false, 
      error: error.name,
      message: error.message 
    };
  }
};

// localStorage 상태 로깅
export const logLocalStorageStatus = () => {
  try {
    const sizeMB = getLocalStorageSizeMB();
    const postsString = localStorage.getItem('uploadedPosts') || '[]';
    const postsSizeMB = (postsString.length / (1024 * 1024)).toFixed(2);
    const posts = JSON.parse(postsString);
    const mockCount = posts.filter(p => p.id && p.id.toString().startsWith('mock-')).length;
    const userCount = posts.filter(p => !p.id || !p.id.toString().startsWith('mock-')).length;
    
    console.log('📊 localStorage 상태:');
    console.log(`   - 전체 사용 용량: ${sizeMB} MB`);
    console.log(`   - uploadedPosts 용량: ${postsSizeMB} MB`);
    console.log(`   - Mock 데이터: ${mockCount}개`);
    console.log(`   - 사용자 데이터: ${userCount}개`);
    console.log(`   - 전체 게시물: ${posts.length}개`);
    
    // 가장 큰 항목 찾기
    let largestKey = '';
    let largestSize = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        const size = localStorage[key].length;
        if (size > largestSize) {
          largestSize = size;
          largestKey = key;
        }
      }
    }
    console.log(`   - 가장 큰 항목: ${largestKey} (${(largestSize / (1024 * 1024)).toFixed(2)} MB)`);
  } catch (error) {
    console.error('localStorage 상태 로깅 오류:', error);
  }
};

// 다른 화면 코드 호환: 안전하게 업로드 게시물 읽기
export const getUploadedPostsSafe = () => {
  try {
    const raw = localStorage.getItem('uploadedPosts');
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

// 다른 화면 코드 호환: 레거시 형태의 uploadedPosts 정리(없으면 no-op)
export const cleanLegacyUploadedPosts = () => {
  try {
    const posts = getUploadedPostsSafe();
    // 기본 정규화: id 필드 없는 경우 보존하되 stringify 가능한 형태로만 유지
    const normalized = posts.filter((p) => p && typeof p === 'object');
    localStorage.setItem('uploadedPosts', JSON.stringify(normalized));
    return true;
  } catch {
    return false;
  }
};





















