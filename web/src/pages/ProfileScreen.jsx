import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import BottomNavigation from '../components/BottomNavigation';
import { getUnreadCount } from '../utils/notifications';
import { getEarnedBadges } from '../utils/badgeSystem';
import { getUserLevel } from '../utils/levelSystem';
import { filterRecentPosts } from '../utils/timeUtils';
import { getUserDailyTitle } from '../utils/dailyTitleSystem';

const ProfileScreen = () => {
  const navigate = useNavigate();
  const { user: authUser, logout } = useAuth();
  const [user, setUser] = useState(null);
  const [myPosts, setMyPosts] = useState([]);
  const [earnedBadges, setEarnedBadges] = useState([]);
  const [representativeBadge, setRepresentativeBadge] = useState(null);
  const [showBadgeSelector, setShowBadgeSelector] = useState(false);
  const [levelInfo, setLevelInfo] = useState(null);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [activeTab, setActiveTab] = useState('my'); // 'my' | 'map' | 'timeline'
  const [dailyTitle, setDailyTitle] = useState(null);

  useEffect(() => {
    // localStorage에서 사용자 정보 로드
    const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
    setUser(savedUser);

    // 24시간 타이틀 로드
    if (savedUser?.id) {
      const title = getUserDailyTitle(savedUser.id);
      if (title) {
        console.log('👑 오늘의 타이틀:', title.name);
      }
      setDailyTitle(title);
    }

    // 획득한 뱃지 로드
    const badges = getEarnedBadges();
    setEarnedBadges(badges);
    console.log('🏆 프로필 화면 - 획득한 뱃지 로드:', badges.length);

    // 대표 뱃지 로드
    const savedRepBadge = localStorage.getItem('representativeBadge');
    if (savedRepBadge) {
      const repBadge = JSON.parse(savedRepBadge);
      setRepresentativeBadge(repBadge);
    }

    // 레벨 정보 로드
    const userLevelInfo = getUserLevel();
    setLevelInfo(userLevelInfo);
    console.log('📊 레벨 정보:', userLevelInfo);

    // 내가 업로드한 게시물 로드 (영구 보관 - 필터링 없음!)
    const uploadedPosts = JSON.parse(localStorage.getItem('uploadedPosts') || '[]');
    
    const userId = savedUser.id;
    const userPosts = uploadedPosts.filter(post => post.userId === userId);
    
    console.log('📊 프로필 화면 - 내 게시물 로드 (영구 보관)');
    console.log('  전체 게시물:', uploadedPosts.length);
    console.log('  내 게시물 (모두):', userPosts.length);
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
      // 프로필에서는 필터링 없이 모든 내 게시물 표시
      const updatedUserPosts = updatedPosts.filter(post => post.userId === userId);
      console.log('🔄 게시물 업데이트 (영구 보관):', updatedUserPosts.length);
      setMyPosts(updatedUserPosts);
    };

    // 뱃지 업데이트 이벤트 리스너
    const handleBadgeUpdate = () => {
      const updatedBadges = getEarnedBadges();
      setEarnedBadges(updatedBadges);
      console.log('🏆 뱃지 업데이트:', updatedBadges.length);
    };

    // 레벨 업데이트 이벤트 리스너
    const handleLevelUpdate = () => {
      const updatedLevelInfo = getUserLevel();
      setLevelInfo(updatedLevelInfo);
      console.log('📊 레벨 업데이트:', updatedLevelInfo);
    };

    window.addEventListener('notificationUpdate', handleNotificationUpdate);
    window.addEventListener('newPostsAdded', handlePostsUpdate);
    window.addEventListener('storage', handlePostsUpdate);
    window.addEventListener('badgeEarned', handleBadgeUpdate);
    window.addEventListener('levelUp', handleLevelUpdate);
    
    return () => {
      window.removeEventListener('notificationUpdate', handleNotificationUpdate);
      window.removeEventListener('newPostsAdded', handlePostsUpdate);
      window.removeEventListener('storage', handlePostsUpdate);
      window.removeEventListener('badgeEarned', handleBadgeUpdate);
      window.removeEventListener('levelUp', handleLevelUpdate);
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

  // 대표 뱃지 선택
  const selectRepresentativeBadge = (badge) => {
    localStorage.setItem('representativeBadge', JSON.stringify(badge));
    setRepresentativeBadge(badge);
    setShowBadgeSelector(false);
    
    // user 정보 업데이트
    const updatedUser = { ...user, representativeBadge: badge };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
    
    console.log('✅ 대표 뱃지 선택:', badge.name);
  };

  // 대표 뱃지 제거
  const removeRepresentativeBadge = () => {
    localStorage.removeItem('representativeBadge');
    setRepresentativeBadge(null);
    
    const updatedUser = { ...user, representativeBadge: null };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
    
    console.log('❌ 대표 뱃지 제거');
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

  const badgeCount = earnedBadges.length;

  return (
    <div className="screen-layout bg-background-light dark:bg-background-dark">
      <div className="screen-content">
        {/* 헤더 */}
        <header className="screen-header bg-white dark:bg-gray-900 flex items-center p-4 justify-between">
          <button 
            onClick={() => navigate('/main')}
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

        {/* 메인 컨텐츠 */}
        <div className="screen-body">
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
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-text-primary-light dark:text-text-primary-dark text-lg font-bold">
                  {user.username || '모사모'}
                </h2>
                {/* 대표 뱃지 */}
                {representativeBadge && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-primary/20 to-orange-400/20 rounded-full border-2 border-primary/30">
                    <span style={{ fontSize: '16px' }}>{representativeBadge.icon}</span>
                    <span className="text-xs font-bold text-primary">{representativeBadge.name}</span>
                  </div>
                )}
              </div>
              <p className="text-text-secondary-light dark:text-text-secondary-dark text-sm">
                {levelInfo ? `Lv. ${levelInfo.level} ${levelInfo.title}` : 'Lv. 1 여행 입문자'}
              </p>
              {/* 경험치 바 */}
              {levelInfo && levelInfo.level < 100 && (
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                      EXP {levelInfo.expInCurrentLevel.toLocaleString()} / {levelInfo.expNeededForNextLevel.toLocaleString()}
                    </span>
                    <span className="text-xs font-bold text-primary">
                      {levelInfo.progress}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-primary to-orange-400 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${levelInfo.progress}%` }}
                    ></div>
                  </div>
                </div>
              )}
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
            <div className="space-y-3">
              {/* 대표 뱃지 선택 버튼 */}
              <button
                onClick={() => setShowBadgeSelector(true)}
                className="w-full text-left"
              >
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary/10 to-orange-400/10 rounded-xl border-2 border-primary/30 hover:border-primary/50 transition-all">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary text-2xl">military_tech</span>
                    <div>
                      <p className="text-text-primary-light dark:text-text-primary-dark font-bold text-sm">대표 뱃지</p>
                      <p className="text-text-secondary-light dark:text-text-secondary-dark text-xs">
                        {representativeBadge ? representativeBadge.name : '뱃지를 선택해주세요'}
                      </p>
                    </div>
                  </div>
                  {representativeBadge && (
                    <div className="flex items-center gap-2">
                      <span style={{ fontSize: '28px' }}>{representativeBadge.icon}</span>
                    </div>
                  )}
                </div>
              </button>

              {/* 뱃지 모아보기 */}
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
            </div>
          )}
        </div>

        {/* 여행 기록 탭 */}
        <div className="bg-white dark:bg-gray-900 px-6 py-6 border-t border-gray-100 dark:border-gray-800">
          {/* 탭 전환 */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveTab('my')}
              className={`flex-1 py-3 px-2 rounded-xl font-semibold transition-all text-sm whitespace-nowrap ${
                activeTab === 'my'
                  ? 'bg-primary text-white shadow-lg'
                  : 'bg-gray-100 dark:bg-gray-800 text-text-secondary-light dark:text-text-secondary-dark hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              📸 내 사진
            </button>
            <button
              onClick={() => setActiveTab('map')}
              className={`flex-1 py-3 px-2 rounded-xl font-semibold transition-all text-sm whitespace-nowrap ${
                activeTab === 'map'
                  ? 'bg-primary text-white shadow-lg'
                  : 'bg-gray-100 dark:bg-gray-800 text-text-secondary-light dark:text-text-secondary-dark hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              🗺️ 여행지도
            </button>
            <button
              onClick={() => setActiveTab('timeline')}
              className={`flex-1 py-3 px-2 rounded-xl font-semibold transition-all text-sm whitespace-nowrap ${
                activeTab === 'timeline'
                  ? 'bg-primary text-white shadow-lg'
                  : 'bg-gray-100 dark:bg-gray-800 text-text-secondary-light dark:text-text-secondary-dark hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              📅 타임라인
            </button>
          </div>

          {/* 여행 통계 */}
          {myPosts.length > 0 && (
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-primary dark:text-orange-300">{myPosts.length}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">총 사진</div>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-300">
                  {new Set(myPosts.map(p => p.location)).size}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">방문 지역</div>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-300">
                  {new Set(myPosts.map(p => p.category)).size}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">카테고리</div>
              </div>
            </div>
          )}

          {/* 편집 버튼 (내 사진 탭에서만) */}
          {activeTab === 'my' && myPosts.length > 0 && (
            <div className="flex items-center justify-end mb-4">
                {isEditMode && selectedPhotos.length > 0 && (
                  <button 
                    onClick={deleteSelectedPhotos}
                  className="text-red-500 text-sm font-semibold mr-2"
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

          {/* 내 사진 탭 */}
          {activeTab === 'my' && myPosts.length === 0 && (
            <div className="text-center py-8">
              <span className="material-symbols-outlined text-6xl text-gray-300 dark:text-gray-600 mb-4 block">
                add_photo_alternate
              </span>
              <p className="text-text-secondary-light dark:text-text-secondary-dark text-base font-medium mb-2">
                아직 올린 사진이 없어요
              </p>
              <p className="text-gray-400 dark:text-gray-500 text-sm mb-4">
                첫 번째 여행 사진을 공유해보세요!
              </p>
              <button
                onClick={() => navigate('/upload')}
                className="bg-primary text-white py-3 px-6 rounded-full font-semibold hover:bg-primary/90 transition-colors shadow-lg inline-flex items-center gap-2"
              >
                <span className="material-symbols-outlined">add_a_photo</span>
                첫 사진 올리기
              </button>
            </div>
          )}

          {activeTab === 'my' && myPosts.length > 0 && (
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

          {/* 여행 지도 탭 */}
          {activeTab === 'map' && (
            <div>
              {myPosts.length === 0 ? (
                <div className="text-center py-12">
                  <span className="material-symbols-outlined text-6xl text-gray-300 dark:text-gray-600 mb-4 block">
                    map
                  </span>
                  <p className="text-text-secondary-light dark:text-text-secondary-dark text-base font-medium mb-2">
                    아직 여행 기록이 없어요
                  </p>
                  <p className="text-gray-400 dark:text-gray-500 text-sm">
                    사진을 올리면 여기에 지도로 표시돼요!
                  </p>
                </div>
              ) : (
                <div>
                  {/* 지도 영역 */}
                  <div id="travel-map" className="w-full h-96 rounded-xl overflow-hidden mb-4 bg-gray-100 dark:bg-gray-800">
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <div className="text-center">
                        <span className="material-symbols-outlined text-5xl mb-2 block">location_on</span>
                        <p className="text-sm">지도를 불러오는 중...</p>
            </div>
                    </div>

          {/* 오늘의 타이틀 영역 */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-text-primary-light dark:text-text-primary-dark">
                오늘의 타이틀
              </h2>
            </div>
            {dailyTitle ? (
              <div className="flex items-center gap-3 px-3 py-3 rounded-2xl bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/40 dark:to-orange-900/40 border border-amber-300 dark:border-amber-600 shadow-sm">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white dark:bg-gray-900 shadow-md">
                  <span className="text-xl">{dailyTitle.icon || '👑'}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-amber-900 dark:text-amber-200">
                    {dailyTitle.name}
                  </span>
                  <span className="text-xs text-amber-800/80 dark:text-amber-200/80">
                    {dailyTitle.description || '오늘 하루 동안 유지되는 명예 타이틀입니다.'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="px-3 py-3 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-dashed border-gray-300 dark:border-gray-600 text-xs text-gray-500 dark:text-gray-400">
                아직 획득한 오늘의 타이틀이 없습니다. 오늘 현장 정보를 공유하면 특별한 타이틀을 받을 수 있어요.
              </div>
            )}
          </div>
                  </div>

                  {/* 지역별 사진 수 */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">📍 방문한 지역</h3>
                    {Object.entries(
                      myPosts.reduce((acc, post) => {
                        const location = post.location || '기타';
                        acc[location] = (acc[location] || 0) + 1;
                        return acc;
                      }, {})
                    )
                      .sort((a, b) => b[1] - a[1])
                      .map(([location, count]) => (
                        <div
                          key={location}
                          className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                          onClick={() => {
                            setActiveTab('my');
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary text-xl">location_on</span>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{location}</span>
                          </div>
                          <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded-full">
                            {count}장
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 타임라인 탭 */}
          {activeTab === 'timeline' && (
            <div>
              {myPosts.length === 0 ? (
                <div className="text-center py-12">
                  <span className="material-symbols-outlined text-6xl text-gray-300 dark:text-gray-600 mb-4 block">
                    event_note
                  </span>
                  <p className="text-text-secondary-light dark:text-text-secondary-dark text-base font-medium mb-2">
                    아직 여행 기록이 없어요
                  </p>
                  <p className="text-gray-400 dark:text-gray-500 text-sm">
                    사진을 올리면 타임라인으로 정리돼요!
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(
                    myPosts.reduce((acc, post) => {
                      const date = new Date(post.createdAt || Date.now());
                      const dateKey = date.toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      });
                      if (!acc[dateKey]) acc[dateKey] = [];
                      acc[dateKey].push(post);
                      return acc;
                    }, {})
                  )
                    .sort((a, b) => new Date(b[1][0].createdAt) - new Date(a[1][0].createdAt))
                    .map(([date, posts]) => (
                      <div key={date}>
                        {/* 날짜 헤더 */}
                        <div className="flex items-center gap-3 mb-3">
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary text-xl">calendar_today</span>
                            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300">{date}</h3>
                          </div>
                          <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700"></div>
                          <span className="text-xs text-gray-500 dark:text-gray-400">{posts.length}장</span>
                        </div>

                        {/* 사진 그리드 */}
                        <div className="grid grid-cols-3 gap-2 mb-4">
                          {posts.map((post, index) => (
                            <div
                              key={post.id || index}
                              onClick={() => navigate(`/post/${post.id}`)}
                              className="cursor-pointer group"
                            >
                              <div className="aspect-square relative overflow-hidden rounded-lg">
                                <img
                                  src={post.imageUrl || post.images?.[0]}
                                  alt={post.location}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-all duration-300"
                                />
                                {/* 카테고리 아이콘 */}
                                <div className="absolute top-2 left-2">
                                  <div className="text-2xl drop-shadow-lg">
                                    {post.category === 'blooming' && '🌸'}
                                    {post.category === 'snow' && '❄️'}
                                    {post.category === 'autumn' && '🍁'}
                                    {post.category === 'festival' && '🎉'}
                                    {post.category === 'crowd' && '👥'}
                                    {post.category === 'general' && '📷'}
                                  </div>
                                </div>
                              </div>
                              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 truncate">
                                {post.location}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}
        </div>
        </div>

        {/* 대표 뱃지 선택 모달 */}
        {showBadgeSelector && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl">
            {/* 헤더 */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-lg font-bold">🏆 대표 뱃지 선택</h2>
              <button 
                onClick={() => setShowBadgeSelector(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* 뱃지 리스트 */}
            <div className="p-4 max-h-[60vh] overflow-y-auto">
              {representativeBadge && (
                <button
                  onClick={removeRepresentativeBadge}
                  className="w-full mb-3 p-3 bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-800 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                >
                  <div className="flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-red-500">close</span>
                    <span className="text-red-500 font-semibold text-sm">대표 뱃지 제거</span>
                  </div>
                </button>
              )}

              <div className="grid grid-cols-2 gap-3">
                {earnedBadges.map((badge, index) => (
                  <button
                    key={index}
                    onClick={() => selectRepresentativeBadge(badge)}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      representativeBadge?.name === badge.name
                        ? 'bg-gradient-to-br from-primary/20 to-orange-400/20 border-primary shadow-lg'
                        : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-primary/50'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <span style={{ fontSize: '48px' }}>{badge.icon}</span>
                      <p className="text-sm font-bold text-center">{badge.name}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        badge.difficulty === '상' ? 'bg-purple-500 text-white' :
                        badge.difficulty === '중' ? 'bg-blue-500 text-white' :
                        'bg-green-500 text-white'
                      }`}>
                        {badge.difficulty}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
        )}
      </div>

      <BottomNavigation />
    </div>
  );
};

export default ProfileScreen;







