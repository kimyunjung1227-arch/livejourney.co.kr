// localStorage 초기화 유틸리티
// 앱을 완전히 처음 설치한 상태로 되돌립니다

export const clearAllStorage = () => {
  // 업로드된 게시물 제거
  localStorage.removeItem('uploadedPosts');
  
  // 알림 제거
  localStorage.removeItem('notifications');
  
  // 기타 캐시된 데이터 제거
  localStorage.removeItem('recentSearches');
  
  console.log('✅ 스토리지가 초기화되었습니다 - 완전히 새로운 앱처럼!');
};

// 앱 시작시 초기화 (개발 모드에서만, 최초 1회)
// 주석 처리: 사용자가 업로드한 데이터를 유지하기 위해
// if (!sessionStorage.getItem('app_initialized')) {
//   clearAllStorage();
//   sessionStorage.setItem('app_initialized', 'true');
//   console.log('🎉 LiveJourney를 처음 시작합니다!');
// }

// 수동 초기화가 필요할 때만 사용
// 브라우저 콘솔에서: import('./utils/clearStorage').then(m => m.clearAllStorage())
console.log('💡 데이터를 초기화하려면 브라우저 콘솔에서 localStorage.clear() 실행');




























































