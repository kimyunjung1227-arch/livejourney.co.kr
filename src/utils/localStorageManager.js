/**
 * localStorage 관리 유틸리티
 */

// localStorage 사용 용량 확인 (bytes)
export const getLocalStorageSize = () => {
  let total = 0;
  for (let key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      total += localStorage[key].length + key.length;
    }
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
    
    if (mockPosts.length > 100) {
      // Mock 데이터가 100개 이상이면 최근 50개만 유지
      const recentMockPosts = mockPosts.slice(0, 50);
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
      
      // 1차: 오래된 Mock 데이터 정리
      cleanOldMockData();
      
      try {
        localStorage.setItem(key, value);
        console.log('✅ Mock 데이터 정리 후 저장 성공!');
        return { success: true };
      } catch (retryError) {
        // 2차: 모든 Mock 데이터 삭제
        console.warn('⚠️ 추가 정리 필요... 모든 Mock 데이터 삭제');
        clearAllMockData();
        
        try {
          localStorage.setItem(key, value);
          console.log('✅ 모든 Mock 데이터 삭제 후 저장 성공!');
          return { success: true };
        } catch (finalError) {
          console.error('❌ localStorage 저장 실패:', finalError);
          return { 
            success: false, 
            error: 'QUOTA_EXCEEDED',
            message: 'localStorage 용량이 부족합니다. 앱의 일부 데이터를 삭제해주세요.'
          };
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
  const sizeMB = getLocalStorageSizeMB();
  const posts = JSON.parse(localStorage.getItem('uploadedPosts') || '[]');
  const mockCount = posts.filter(p => p.id && p.id.toString().startsWith('mock-')).length;
  const userCount = posts.filter(p => !p.id || !p.id.toString().startsWith('mock-')).length;
  
  console.log('📊 localStorage 상태:');
  console.log(`   - 사용 용량: ${sizeMB} MB`);
  console.log(`   - Mock 데이터: ${mockCount}개`);
  console.log(`   - 사용자 데이터: ${userCount}개`);
  console.log(`   - 전체 게시물: ${posts.length}개`);
};





















