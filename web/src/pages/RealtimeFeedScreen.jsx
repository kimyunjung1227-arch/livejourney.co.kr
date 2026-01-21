import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNavigation from '../components/BottomNavigation';
import { filterRecentPosts } from '../utils/timeUtils';
import { getTimeAgo } from '../utils/timeUtils';
import { logger } from '../utils/logger';
import { getEarnedBadgesForUser } from '../utils/badgeSystem';

const RealtimeFeedScreen = () => {
  const navigate = useNavigate();
  const [realtimeData, setRealtimeData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRealtimeData = () => {
      try {
        const allPosts = JSON.parse(localStorage.getItem('uploadedPosts') || '[]');
        logger.log(`📸 전체 게시물: ${allPosts.length}개`);
        
        if (!Array.isArray(allPosts)) {
          logger.error('게시물 데이터가 배열이 아닙니다:', allPosts);
          setRealtimeData([]);
          setLoading(false);
          return;
        }
        
        // 최근 2일 이내 게시물만 필터링
        const posts = filterRecentPosts(allPosts, 2);
        logger.log(`📊 실시간 여행 피드 게시물 (2일 이내): ${posts.length}개`);
        
        // 시간순으로 정렬 (최신순)
        const sortedPosts = [...posts].sort((a, b) => {
          const timeA = a.timestamp || a.createdAt || a.time || 0;
          const timeB = b.timestamp || b.createdAt || b.time || 0;
          const timestampA = typeof timeA === 'number' ? timeA : new Date(timeA).getTime();
          const timestampB = typeof timeB === 'number' ? timeB : new Date(timeB).getTime();
          return timestampB - timestampA;
        });
        
        const formatted = sortedPosts.map((post) => {
          const dynamicTime = getTimeAgo(post.timestamp || post.createdAt || post.time);
          
          return {
            id: post.id,
            images: post.images || [],
            videos: post.videos || [],
            image: (post.images && post.images.length > 0) ? post.images[0] : 
                   (post.videos && post.videos.length > 0) ? post.videos[0] : 
                   (post.image || ''),
            title: post.location,
            location: post.location,
            detailedLocation: post.detailedLocation || post.location,
            placeName: post.placeName || post.location,
            time: dynamicTime,
            timeLabel: dynamicTime,
            timestamp: post.timestamp || post.createdAt || post.time,
            user: post.user || '여행자',
            userId: post.userId,
            badge: post.categoryName || '여행러버',
            category: post.category,
            categoryName: post.categoryName,
            content: post.note || `${post.location}의 아름다운 순간!`,
            note: post.note,
            tags: post.tags || [],
            coordinates: post.coordinates,
            likes: post.likes || 0,
            comments: post.comments || [],
            questions: post.questions || [],
            qnaList: [],
            aiLabels: post.aiLabels,
            post: post
          };
        });
        
        setRealtimeData(formatted);
        setLoading(false);
      } catch (error) {
        logger.error('실시간 여행 피드 로드 실패:', error);
        setRealtimeData([]);
        setLoading(false);
      }
    };

    loadRealtimeData();

    // 게시물 업데이트 이벤트 리스너
    const handlePostsUpdate = () => {
      loadRealtimeData();
    };

    window.addEventListener('postsUpdated', handlePostsUpdate);
    return () => {
      window.removeEventListener('postsUpdated', handlePostsUpdate);
    };
  }, []);

  const handleItemClick = (item) => {
    // 원본 post 데이터를 포함하여 전달
    const postData = item.post || item;
    // userId가 제대로 포함되도록 보장
    if (!postData.userId && item.userId) {
      postData.userId = item.userId;
    }
    if (!postData.user && item.user) {
      postData.user = item.user;
    }
    
    const allPosts = realtimeData.map(d => {
      const post = d.post || d;
      // 각 post에도 userId 보장
      if (!post.userId && d.userId) {
        post.userId = d.userId;
      }
      if (!post.user && d.user) {
        post.user = d.user;
      }
      return post;
    });
    
    const currentIndex = allPosts.findIndex(p => (p.id || p.post?.id) === item.id);
    navigate(`/post/${item.id}`, {
      state: {
        post: postData,
        allPosts: allPosts,
        currentPostIndex: currentIndex >= 0 ? currentIndex : 0
      }
    });
  };

  return (
    <div className="screen-layout bg-background-light dark:bg-background-dark">
      <div className="screen-content">
        <div className="screen-header flex-shrink-0 flex flex-col bg-white dark:bg-gray-900 border-b border-zinc-200 dark:border-zinc-800 shadow-sm relative z-50">
          <div className="flex items-center justify-between p-4">
            <button 
              onClick={() => navigate(-1)}
              className="flex size-12 shrink-0 items-center justify-center text-content-light dark:text-content-dark hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-2xl">arrow_back</span>
            </button>
            <h1 className="text-text-primary-light dark:text-text-primary-dark text-[22px] font-bold leading-tight tracking-[-0.015em]">
              지금 여기는
            </h1>
            <div className="w-10"></div>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto overflow-x-hidden screen-body">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 px-4">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : realtimeData.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 p-4">
              {realtimeData.map((item, index) => {
                const likedPosts = JSON.parse(localStorage.getItem('likedPosts') || '{}');
                const isLiked = likedPosts[item.id] || false;
                const likeCount = item.likes || 0;
                
                // 사용자 뱃지 로드
                const postUserId = item.userId || item.user || 'default';
                const userBadges = getEarnedBadgesForUser(postUserId) || [];
                const representativeBadgeJson = localStorage.getItem(`representativeBadge_${postUserId}`);
                const representativeBadge = representativeBadgeJson ? JSON.parse(representativeBadgeJson) : null;
                
                return (
                  <div
                    key={item.id || index}
                    onClick={() => handleItemClick(item)}
                    className="cursor-pointer group"
                    style={{
                      animation: `fadeInSlide 0.5s ease-out ${index * 0.05}s both`
                    }}
                  >
                    {/* 이미지 */}
                    <div className="relative w-full aspect-[4/5] overflow-hidden rounded-lg mb-3">
                      {item.videos && item.videos.length > 0 ? (
                        <video
                          src={item.videos[0]}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          autoPlay
                          loop
                          muted
                          playsInline
                          onMouseEnter={(e) => e.target.play()}
                          onMouseLeave={(e) => e.target.pause()}
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        <img
                          src={item.image || item.images?.[0] || 'https://images.unsplash.com/photo-1524222717473-730000096953?w=800&auto=format&fit=crop&q=80'}
                          alt={item.location}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          onError={(e) => {
                            e.currentTarget.src = 'https://images.unsplash.com/photo-1524222717473-730000096953?w=800&auto=format&fit=crop&q=80';
                          }}
                        />
                      )}
                      
                      {/* 우측 하단 좋아요 버튼 - 단순화 */}
                      <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-md">
                        <span className={`material-symbols-outlined text-base ${isLiked ? 'text-red-500 fill' : 'text-gray-600'}`}>
                          favorite
                        </span>
                        <span className="text-sm font-semibold text-gray-700">{likeCount}</span>
                      </div>
                    </div>
                    
                    {/* 이미지 밖 하단 텍스트 */}
                    <div className="space-y-1.5">
                      {/* 사용자 정보 및 뱃지 */}
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-semibold text-text-primary-light dark:text-text-primary-dark">
                            {item.user || '여행자'}
                          </span>
                          {userBadges.length > 0 && (
                            <div className="flex items-center gap-1">
                              {userBadges.slice(0, 3).map((badge, badgeIndex) => (
                                <div 
                                  key={`${badge.name}-${badgeIndex}`}
                                  className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full transition-all ${
                                    badge.name === representativeBadge?.name
                                      ? 'bg-primary/20 border border-primary'
                                      : 'bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600'
                                  }`}
                                  title={badge.description || badge.name}
                                >
                                  <span className="text-xs">{badge.icon || '🏆'}</span>
                                  {badge.name === representativeBadge?.name && (
                                    <span className="text-[10px] font-semibold text-primary max-w-[60px] truncate">
                                      {badge.name}
                                    </span>
                                  )}
                                </div>
                              ))}
                              {userBadges.length > 3 && (
                                <div className="flex items-center gap-0.5 px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-full">
                                  <span className="text-[10px] font-semibold text-gray-700 dark:text-gray-300">
                                    +{userBadges.length - 3}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* 지역 상세 정보 */}
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-text-primary-light dark:text-text-primary-dark">
                            {item.detailedLocation || item.placeName || item.location || '여행지'}
                          </p>
                          {/* 업로드 시간 - 지역 옆에 */}
                          {item.time && (
                            <p className="text-[11px] text-text-secondary-light dark:text-text-secondary-dark">
                              {item.time}
                            </p>
                          )}
                        </div>
                        {item.detailedLocation && item.detailedLocation !== item.location && (
                          <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-0.5">
                            {item.location}
                          </p>
                        )}
                      </div>
                      
                      {/* 해시태그 - 눌러서 검색 */}
                      {item.tags && item.tags.length > 0 && (
                        <div className="flex gap-1.5 overflow-x-auto [-ms-scrollbar-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                          {item.tags.slice(0, 5).map((tag, tagIndex) => {
                            const t = typeof tag === 'string' ? tag.replace(/^#+/, '') : tag;
                            return (
                              <button key={tagIndex} type="button" onClick={() => navigate(`/search?q=${encodeURIComponent('#' + t)}`)} className="text-[11px] font-medium text-primary bg-primary/10 hover:bg-primary/20 px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0 cursor-pointer transition-colors">
                                #{t}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 px-4">
              <span className="material-symbols-outlined text-7xl text-gray-300 dark:text-gray-600 mb-4">
                update
              </span>
              <p className="text-base font-medium text-gray-500 dark:text-gray-400 mb-2 text-center">
                아직 게시물이 없습니다
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500 text-center mb-4 max-w-xs">
                첫 번째 여행 사진을 올려보세요!
              </p>
              <button
                onClick={() => navigate('/upload')}
                className="bg-primary text-white px-6 py-3 rounded-full font-semibold hover:bg-primary/90 transition-colors shadow-lg flex items-center gap-2"
              >
                <span className="material-symbols-outlined">add_a_photo</span>
                첫 사진 올리기
              </button>
            </div>
          )}
        </main>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default RealtimeFeedScreen;

