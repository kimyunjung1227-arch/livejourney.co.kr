import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import BottomNavigation from '../components/BottomNavigation';
import { getUnreadCount } from '../utils/notifications';

const ProfileScreen = () => {
  const navigate = useNavigate();
  const { user: authUser, logout } = useAuth();
  const [user, setUser] = useState(null);
  const [myPosts, setMyPosts] = useState([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState([]);

  useEffect(() => {
    // localStorage에서 사용자 정보 로드
    const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
    setUser(savedUser);

    // 내가 업로드한 게시물 로드
    const uploadedPosts = JSON.parse(localStorage.getItem('uploadedPosts') || '[]');
    const userId = savedUser.id;
    const userPosts = uploadedPosts.filter(post => post.userId === userId);
    
    console.log('📊 프로필 화면 - 내 게시물 로드');
    console.log('  전체 게시물:', uploadedPosts.length);
    console.log('  내 게시물:', userPosts.length);
    console.log('  사용자 ID:', userId);
    
    setMyPosts(userPosts);

    // 알림 개수 업데이트
    setUnreadNotificationCount(getUnreadCount());

    // 알림 이벤트 리스너
    const handleNotificationUpdate = () => {
      setUnreadNotificationCount(getUnreadCount());
    };

    // 게시물 업데이트 이벤트 리스너
    const handlePostsUpdate = () => {
      const updatedPosts = JSON.parse(localStorage.getItem('uploadedPosts') || '[]');
      const updatedUserPosts = updatedPosts.filter(post => post.userId === userId);
      console.log('🔄 게시물 업데이트:', updatedUserPosts.length);
      setMyPosts(updatedUserPosts);
    };

    window.addEventListener('notificationUpdate', handleNotificationUpdate);
    window.addEventListener('newPostsAdded', handlePostsUpdate);
    window.addEventListener('storage', handlePostsUpdate);
    
    return () => {
      window.removeEventListener('notificationUpdate', handleNotificationUpdate);
      window.removeEventListener('newPostsAdded', handlePostsUpdate);
      window.removeEventListener('storage', handlePostsUpdate);
    };
  }, []);

  const handleLogout = () => {
    // 로그아웃 플래그 설정
    sessionStorage.setItem('justLoggedOut', 'true');
    
    // 로그아웃 처리
    logout();
    
    // 시작 화면으로 이동
    navigate('/', { replace: true });
  };

  const toggleEditMode = () => {
    if (isEditMode) {
      // 편집 모드 종료
      setSelectedPhotos([]);
    }
    setIsEditMode(!isEditMode);
  };

  const togglePhotoSelection = (postId) => {
    if (selectedPhotos.includes(postId)) {
      setSelectedPhotos(selectedPhotos.filter(id => id !== postId));
    } else {
      setSelectedPhotos([...selectedPhotos, postId]);
    }
  };

  const deleteSelectedPhotos = () => {
    if (selectedPhotos.length === 0) {
      alert('삭제할 사진을 선택해주세요.');
      return;
    }

    if (!confirm(`선택한 ${selectedPhotos.length}개의 사진을 삭제하시겠습니까?`)) {
      return;
    }

    // localStorage에서 선택된 사진 삭제
    const allPosts = JSON.parse(localStorage.getItem('uploadedPosts') || '[]');
    const filteredPosts = allPosts.filter(post => !selectedPhotos.includes(post.id));
    localStorage.setItem('uploadedPosts', JSON.stringify(filteredPosts));

    // 내 게시물 목록 업데이트
    const userId = user.id;
    const updatedMyPosts = filteredPosts.filter(post => post.userId === userId);
    setMyPosts(updatedMyPosts);

    // 편집 모드 종료
    setSelectedPhotos([]);
    setIsEditMode(false);

    alert(`${selectedPhotos.length}개의 사진이 삭제되었습니다.`);
  };

  if (!user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-text-secondary-light dark:text-text-secondary-dark">로딩 중...</p>
        </div>
      </div>
    );
  }

  const badgeCount = user.badges?.length || 0;

  return (
    <div className="flex h-full w-full flex-col bg-background-light dark:bg-background-dark">
      <div className="flex-1 overflow-y-auto overflow-x-hidden pb-20">
        {/* 헤더 */}
        <header className="sticky top-0 z-10 bg-white dark:bg-gray-900 flex items-center p-4 justify-between">
          <button 
            onClick={() => navigate(-1)}
            className="text-text-primary-light dark:text-text-primary-dark"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="text-text-primary-light dark:text-text-primary-dark text-base font-semibold">프로필</h1>
          <button 
            onClick={() => navigate('/settings')}
            className="text-text-primary-light dark:text-text-primary-dark"
          >
            <span className="material-symbols-outlined">settings</span>
          </button>
        </header>

        {/* 프로필 정보 */}
        <div className="bg-white dark:bg-gray-900 px-6 py-6">
          <div className="flex items-center gap-4 mb-4">
            {/* 프로필 사진 */}
            <div className="flex-shrink-0">
              {user.profileImage ? (
                <img 
                  src={user.profileImage} 
                  alt="Profile" 
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-teal-100 dark:bg-teal-900 flex items-center justify-center">
                  <span className="material-symbols-outlined text-teal-600 dark:text-teal-400 text-4xl">person</span>
                </div>
              )}
            </div>

            {/* 사용자 정보 */}
            <div className="flex-1">
              <h2 className="text-text-primary-light dark:text-text-primary-dark text-lg font-bold mb-1">
                {user.username || '모사모'}
              </h2>
              <p className="text-text-secondary-light dark:text-text-secondary-dark text-sm">
                Lv. 1 Traveler
              </p>
            </div>
          </div>

          {/* 프로필 편집 버튼 */}
          <button
            onClick={() => {
              console.log('🔧 프로필 편집 버튼 클릭 → /profile/edit으로 이동');
              navigate('/profile/edit');
            }}
            className="w-full bg-gray-100 dark:bg-gray-800 text-text-primary-light dark:text-text-primary-dark py-2.5 px-4 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            프로필 편집
          </button>
        </div>

        {/* 획득한 뱃지 섹션 */}
        <div className="bg-white dark:bg-gray-900 px-6 py-6">
          <div className="flex items-center gap-2 mb-6">
            <span className="material-symbols-outlined text-primary text-xl">workspace_premium</span>
            <h3 className="text-text-primary-light dark:text-text-primary-dark text-base font-bold">
              획득한 뱃지
            </h3>
          </div>

          {badgeCount === 0 ? (
            <div className="text-center py-6">
              <div className="relative inline-block mb-4">
                <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <span className="material-symbols-outlined text-gray-300 dark:text-gray-600 text-5xl">workspace_premium</span>
                </div>
                <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white text-xs font-bold">
                  0
                </span>
              </div>
              <p className="text-text-primary-light dark:text-text-primary-dark text-sm font-medium mb-1">
                아직 획득한 뱃지가 없어요
              </p>
              <p className="text-text-secondary-light dark:text-text-secondary-dark text-xs mb-4">
                여행 기록을 남기고 뱃지를 획득해보세요!
              </p>
              <button
                onClick={() => navigate('/upload')}
                className="w-full bg-primary text-white py-3 px-6 rounded-xl font-semibold hover:bg-primary/90 transition-colors shadow-lg flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">add_circle</span>
                첫 여행 기록하기
              </button>
            </div>
          ) : (
            <button
              onClick={() => navigate('/badges')}
              className="w-full text-left"
            >
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <span className="text-text-primary-light dark:text-text-primary-dark font-medium">뱃지 모아보기</span>
                <div className="flex items-center gap-2">
                  <span className="text-primary font-bold">{badgeCount}</span>
                  <span className="material-symbols-outlined text-text-secondary-light dark:text-text-secondary-dark">
                    chevron_right
                  </span>
                </div>
              </div>
            </button>
          )}
        </div>

        {/* 포인트 관리 */}
        <div className="bg-white dark:bg-gray-900 px-6 py-4 border-t border-gray-100 dark:border-gray-800">
          <button
            onClick={() => navigate('/points')}
            className="w-full flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors rounded-lg p-2 -m-2"
          >
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl">paid</span>
              <span className="text-text-primary-light dark:text-text-primary-dark font-medium text-base">
                {user.points?.toLocaleString() || '10000'} P
              </span>
            </div>
            <span className="text-text-primary-light dark:text-text-primary-dark text-sm">포인트 관리</span>
          </button>
        </div>

        {/* 쿠폰함 */}
        <div className="bg-white dark:bg-gray-900 px-6 py-4 border-t border-gray-100 dark:border-gray-800">
          <button
            onClick={() => navigate('/coupons')}
            className="w-full flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl">confirmation_number</span>
              <span className="text-text-primary-light dark:text-text-primary-dark font-medium">내 쿠폰함</span>
            </div>
            <span className="text-text-primary-light dark:text-text-primary-dark text-sm">확인하기</span>
          </button>
        </div>

        {/* 내가 올린 사진 */}
        <div className="bg-white dark:bg-gray-900 px-6 py-6 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-text-primary-light dark:text-text-primary-dark text-base font-bold">
              내가 올린 사진
            </h3>
            {myPosts.length > 0 && (
              <div className="flex items-center gap-2">
                {isEditMode && selectedPhotos.length > 0 && (
                  <button 
                    onClick={deleteSelectedPhotos}
                    className="text-red-500 text-sm font-semibold"
                  >
                    삭제 ({selectedPhotos.length})
                  </button>
                )}
                <button 
                  onClick={toggleEditMode}
                  className={`text-sm font-semibold ${isEditMode ? 'text-primary' : 'text-text-secondary-light dark:text-text-secondary-dark'}`}
                >
                  {isEditMode ? '완료' : '편집'}
                </button>
              </div>
            )}
          </div>

          {myPosts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-text-secondary-light dark:text-text-secondary-dark text-sm mb-4">
                아직 올린 사진이 없어요
              </p>
              <button
                onClick={() => navigate('/upload')}
                className="bg-primary text-white py-2 px-6 rounded-full text-sm font-semibold hover:bg-primary/90 transition-colors"
              >
                사진 올리기
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {myPosts.map((post, index) => (
                <div
                  key={post.id || index}
                  onClick={() => {
                    if (isEditMode) {
                      togglePhotoSelection(post.id);
                    } else {
                      navigate(`/post/${post.id}`);
                    }
                  }}
                  className="cursor-pointer relative"
                >
                  <div className="aspect-square relative overflow-hidden rounded-lg mb-2">
                    <img
                      src={post.imageUrl || post.images?.[0]}
                      alt={post.location}
                      className={`w-full h-full object-cover transition-all duration-300 ${
                        isEditMode ? 'hover:opacity-70' : 'hover:scale-110'
                      }`}
                    />
                    {isEditMode && (
                      <div className="absolute top-2 right-2">
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                          selectedPhotos.includes(post.id)
                            ? 'bg-primary border-primary'
                            : 'bg-white border-gray-300'
                        }`}>
                          {selectedPhotos.includes(post.id) && (
                            <span className="material-symbols-outlined text-white text-sm">check</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-text-secondary-light dark:text-text-secondary-dark text-sm">location_on</span>
                    <p className="text-text-secondary-light dark:text-text-secondary-dark text-xs truncate">
                      {post.location || '서울'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      <BottomNavigation />
    </div>
  );
};

export default ProfileScreen;



