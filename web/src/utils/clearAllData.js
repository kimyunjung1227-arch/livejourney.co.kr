/**
 * 모든 로컬 데이터 삭제 유틸리티
 * 배포 전 테스트 데이터 정리용
 */

export const clearAllPosts = () => {
  try {
    localStorage.removeItem('uploadedPosts');
    console.log('✅ 모든 게시물 데이터가 삭제되었습니다.');
    return { success: true, message: '모든 게시물 데이터가 삭제되었습니다.' };
  } catch (error) {
    console.error('❌ 데이터 삭제 실패:', error);
    return { success: false, message: '데이터 삭제에 실패했습니다.' };
  }
};

export const clearAllData = () => {
  try {
    // 게시물 데이터
    localStorage.removeItem('uploadedPosts');
    
    // 기타 저장된 데이터들도 삭제 (필요시 추가)
    localStorage.removeItem('savedRoutes');
    localStorage.removeItem('userPreferences');
    localStorage.removeItem('visitedPosts');
    
    console.log('✅ 모든 로컬 데이터가 삭제되었습니다.');
    return { success: true, message: '모든 로컬 데이터가 삭제되었습니다.' };
  } catch (error) {
    console.error('❌ 데이터 삭제 실패:', error);
    return { success: false, message: '데이터 삭제에 실패했습니다.' };
  }
};

export const getStorageInfo = () => {
  try {
    const posts = JSON.parse(localStorage.getItem('uploadedPosts') || '[]');
    const routes = JSON.parse(localStorage.getItem('savedRoutes') || '[]');
    
    const postsSize = new Blob([localStorage.getItem('uploadedPosts') || '']).size;
    const routesSize = new Blob([localStorage.getItem('savedRoutes') || '']).size;
    const totalSize = postsSize + routesSize;
    
    return {
      postsCount: posts.length,
      routesCount: routes.length,
      postsSizeKB: (postsSize / 1024).toFixed(2),
      routesSizeKB: (routesSize / 1024).toFixed(2),
      totalSizeKB: (totalSize / 1024).toFixed(2)
    };
  } catch (error) {
    console.error('❌ 저장소 정보 조회 실패:', error);
    return {
      postsCount: 0,
      routesCount: 0,
      postsSizeKB: '0',
      routesSizeKB: '0',
      totalSizeKB: '0'
    };
  }
};
