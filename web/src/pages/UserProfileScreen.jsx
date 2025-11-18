import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import BottomNavigation from '../components/BottomNavigation';
import { getUserDailyTitle } from '../utils/dailyTitleSystem';

const UserProfileScreen = () => {
  const navigate = useNavigate();
  const { userId } = useParams();
  
  const [user, setUser] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [dailyTitle, setDailyTitle] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      navigate(-1);
      return;
    }

    // 해당 사용자의 정보 찾기 (게시물에서)
    const uploadedPosts = JSON.parse(localStorage.getItem('uploadedPosts') || '[]');
    const userPost = uploadedPosts.find(p => p.userId === userId);
    
    if (userPost) {
      const foundUser = {
        id: userId,
        username: userPost.user || userPost.userId || '사용자',
        profileImage: null
      };
      setUser(foundUser);
    } else {
      // 사용자 정보를 찾을 수 없으면 기본값
      setUser({
        id: userId,
        username: '사용자',
        profileImage: null
      });
    }

    // 24시간 타이틀 로드
    const title = getUserDailyTitle(userId);
    if (title) {
      setDailyTitle(title);
    }

    // 해당 사용자의 게시물 로드
    const posts = uploadedPosts.filter(post => post.userId === userId);
    setUserPosts(posts);
    
    setLoading(false);
  }, [userId, navigate]);

  if (loading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-text-secondary-light dark:text-text-secondary-dark">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="screen-layout bg-background-light dark:bg-background-dark">
      <div className="screen-content">
        {/* 헤더 */}
        <header className="screen-header bg-white dark:bg-gray-900 flex items-center p-4 justify-between">
          <button 
            onClick={() => navigate(-1)}
            className="text-text-primary-light dark:text-text-primary-dark"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="text-text-primary-light dark:text-text-primary-dark text-base font-semibold">프로필</h1>
          <div className="w-10"></div>
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
                <h2 className="text-text-primary-light dark:text-text-primary-dark text-lg font-bold">
                  {user.username || '사용자'}
                </h2>
                {dailyTitle && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-primary/20 to-orange-400/20 rounded-full border-2 border-primary/30 mt-1 w-fit">
                    <span style={{ fontSize: '16px' }}>{dailyTitle.icon}</span>
                    <span className="text-xs font-bold text-primary">{dailyTitle.name}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 통계 정보 */}
          <div className="bg-white dark:bg-gray-900 px-6 py-4 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-around">
              <div className="text-center">
                <div className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">
                  {userPosts.length}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">게시물</div>
              </div>
            </div>
          </div>

          {/* 여행 기록 탭 */}
          <div className="bg-white dark:bg-gray-900 px-6 py-6 border-t border-gray-100 dark:border-gray-800">
            {userPosts.length === 0 ? (
              <div className="text-center py-8">
                <span className="material-symbols-outlined text-6xl text-gray-300 dark:text-gray-600 mb-4 block">
                  photo_library
                </span>
                <p className="text-text-secondary-light dark:text-text-secondary-dark">
                  아직 업로드한 사진이 없습니다
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {userPosts.map((post, index) => {
                  const likedPosts = JSON.parse(localStorage.getItem('likedPosts') || '{}');
                  const isLiked = likedPosts[post.id] || false;
                  const likeCount = post.likes || post.likeCount || 0;
                  
                  return (
                    <div
                      key={post.id || index}
                      onClick={() => {
                        navigate(`/post/${post.id}`, { 
                          state: { 
                            post: post,
                            allPosts: userPosts,
                            currentPostIndex: index
                          } 
                        });
                      }}
                      className="cursor-pointer"
                    >
                      {/* 이미지 */}
                      <div className="aspect-square relative overflow-hidden rounded-lg mb-2">
                        {post.videos && post.videos.length > 0 ? (
                          <video
                            src={post.videos[0]}
                            className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                            muted
                            loop
                            playsInline
                          />
                        ) : (
                          <img
                            src={post.imageUrl || post.images?.[0] || post.image}
                            alt={post.location}
                            className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                          />
                        )}
                        
                        {/* 우측 하단 하트 아이콘 */}
                        <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-white/80 backdrop-blur-sm rounded-full px-2 py-1">
                          <span className={`material-symbols-outlined text-sm ${isLiked ? 'text-red-500 fill' : 'text-gray-600'}`}>
                            favorite
                          </span>
                          <span className="text-xs font-semibold text-gray-700">{likeCount}</span>
                        </div>
                      </div>
                      
                      {/* 이미지 밖 하단 텍스트 */}
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-text-primary-light dark:text-text-primary-dark line-clamp-2">
                          {post.note || post.location || '여행 기록'}
                        </p>
                        {post.tags && post.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {post.tags.slice(0, 3).map((tag, tagIndex) => (
                              <span key={tagIndex} className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                                #{typeof tag === 'string' ? tag.replace('#', '') : tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        <BottomNavigation />
      </div>
    </div>
  );
};

export default UserProfileScreen;

