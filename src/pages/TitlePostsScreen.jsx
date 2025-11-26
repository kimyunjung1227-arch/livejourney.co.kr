import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPosts } from '../api/posts';
import { getUserDailyTitle } from '../utils/dailyTitleSystem';
import { getTimeAgo } from '../utils/timeUtils';
import { initializeTitlePosts } from '../utils/titlePostsMockData';

const TitlePostsScreen = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 타이틀 게시물 예시 데이터 초기화
    initializeTitlePosts();
    loadPosts();
  }, []);

  // 모든 타이틀 게시물을 한 번에 보여주므로 추가 필터는 사용하지 않음

  const loadPosts = async () => {
    try {
      setLoading(true);

      // 1) 타이틀 예시 게시물/타이틀 데이터 보장 (localStorage에 생성)
      initializeTitlePosts();

      // 2) localStorage에서 모든 게시물 로드
      const allPosts = JSON.parse(localStorage.getItem('uploadedPosts') || '[]');

      // 3) 오늘의 타이틀을 가진 사용자의 게시물만 필터링
      const titlePosts = allPosts.filter(post => {
        if (!post.userId) return false;
        const userTitle = getUserDailyTitle(post.userId);
        return userTitle !== null;
      });

      setPosts(titlePosts);
    } catch (error) {
      console.error('게시물 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 타이틀별로 그룹화 (한 화면에서 모두 보기)
  const postsByTitle = posts.reduce((acc, post) => {
    const userTitle = getUserDailyTitle(post.userId);
    if (userTitle) {
      const titleId = userTitle.id;
      if (!acc[titleId]) {
        acc[titleId] = {
          title: userTitle,
          posts: []
        };
      }
      acc[titleId].posts.push(post);
    }
    return acc;
  }, {});

  return (
    <div className="screen-layout bg-gray-100 dark:bg-gray-900">
      <div className="screen-content">
          {/* 헤더 - 타이틀 명예의 전당 */}
          <header className="screen-header bg-white dark:bg-gray-900 flex items-center p-4 justify-between shadow-sm">
          <button 
            onClick={() => navigate(-1)}
            aria-label="Back" 
            className="flex size-12 shrink-0 items-center justify-center text-text-primary-light dark:text-text-primary-dark hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined text-2xl">arrow_back</span>
          </button>
          <h1 className="text-text-primary-light dark:text-text-primary-dark text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center pr-10">
            타이틀 명예의 전당
          </h1>
        </header>

        {/* 메인 컨텐츠 */}
        <main className="flex-grow px-4 py-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-500 dark:text-gray-400">로딩 중...</div>
            </div>
          ) : posts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <span className="material-symbols-outlined text-6xl text-gray-300 dark:text-gray-600 mb-4">
                image_not_supported
              </span>
              <p className="text-gray-500 dark:text-gray-400 text-center text-base font-medium mb-2">
                타이틀을 획득한 게시물이 없습니다
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(postsByTitle).map(([titleId, { title, posts: titlePosts }]) => (
                <div key={titleId}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 via-orange-400 to-yellow-400 shadow-lg">
                      <span className="text-2xl">{title.icon}</span>
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-gray-800 dark:text-gray-200">
                        {title.name}
                      </h2>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {titlePosts.length}개의 게시물
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    {titlePosts.map((post) => (
                      <div
                        key={post.id}
                        onClick={() => navigate(`/post/${post.id}`, { state: { post } })}
                        className="relative aspect-square rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity shadow-md group border border-border-light dark:border-border-dark"
                      >
                        {post.images && post.images.length > 0 ? (
                          <img
                            src={post.images[0]}
                            alt={post.note || post.location}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = 'https://images.unsplash.com/photo-1524222717473-730000096953?w=800&auto=format&fit=crop&q=80';
                            }}
                          />
                        ) : (
                          <img
                            src="https://images.unsplash.com/photo-1524222717473-730000096953?w=800&auto=format&fit=crop&q=80"
                            alt={post.note || post.location || '여행 사진'}
                            className="w-full h-full object-cover"
                          />
                        )}
                        
                        {/* 그라데이션 오버레이 */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                        
                        {/* 타이틀 배지 (VIP 문구 제거, 심플한 주황 배지) */}
                        <div className="absolute top-2 right-2 z-10">
                          <div 
                            className="px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-md bg-primary/90 text-white text-[11px] font-bold"
                          >
                            <span>{title.icon}</span>
                            <span>{title.name}</span>
                          </div>
                        </div>
                        
                        {/* 하단 정보 */}
                        <div className="absolute bottom-0 left-0 right-0 p-3">
                          <p className="text-white text-sm font-bold line-clamp-2 drop-shadow-lg">
                            {post.note || post.location || '여행 기록'}
                          </p>
                          <p className="text-white/90 text-xs mt-1 drop-shadow-lg">
                            {getTimeAgo(post.timestamp || post.createdAt)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default TitlePostsScreen;

