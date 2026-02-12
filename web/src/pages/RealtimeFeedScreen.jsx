
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNavigation from '../components/BottomNavigation';
import { filterRecentPosts, filterActivePosts48, getTimeAgo } from '../utils/timeUtils';
import './MainScreen.css'; // MainScreen 스타일 재사용

import { getCombinedPosts } from '../utils/mockData';
import { getDisplayImageUrl } from '../api/upload';

const RealtimeFeedScreen = () => {
  const navigate = useNavigate();
  const [realtimeData, setRealtimeData] = useState([]);
  const [currentUserCount, setCurrentUserCount] = useState(0);
  const contentRef = useRef(null);
  const [visibleCount, setVisibleCount] = useState(8); // 2×4 = 8개부터 시작
  const [showHeader, setShowHeader] = useState(true);

  useEffect(() => {
    const loadData = () => {
      const localPosts = JSON.parse(localStorage.getItem('uploadedPosts') || '[]');
      const allPosts = getCombinedPosts(Array.isArray(localPosts) ? localPosts : []);
      const posts = filterActivePosts48(allPosts);

      const uniqueUserIds = new Set();
      posts.forEach(post => {
        const userId = post.userId || (typeof post.user === 'string' ? post.user : post.user?.id) || post.user;
        if (userId) uniqueUserIds.add(String(userId));
      });
      setCurrentUserCount(uniqueUserIds.size);

      const formattedWithRaw = posts.map(post => ({
        ...post,
        id: post.id,
        image: getDisplayImageUrl(post.images?.[0] || post.image || post.thumbnail || ''),
        location: post.location,
        time: post.timeLabel || getTimeAgo(post.timestamp || post.createdAt || post.time),
        content: post.note || post.content || `${post.location}의 모습`,
        likes: post.likes || 0,
      }));

      setRealtimeData(formattedWithRaw);
    };
    loadData();
  }, []);

  // 데이터가 바뀌면 처음부터 다시 8개 노출
  useEffect(() => {
    if (realtimeData.length > 0) {
      setVisibleCount(Math.min(8, realtimeData.length));
    }
  }, [realtimeData.length]);

  // 무한 스크롤용: 보이는 개수만큼 데이터를 반복해서 채워 넣기
  const displayedPosts = useMemo(() => {
    if (!realtimeData || realtimeData.length === 0) return [];
    return Array.from({ length: visibleCount }, (_, index) => {
      const srcIndex = index % realtimeData.length;
      return realtimeData[srcIndex];
    });
  }, [realtimeData, visibleCount]);

  // 스크롤 하단 근처에서 더 많은 아이템을 추가 (무한 스크롤처럼)
  useEffect(() => {
    const container = contentRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      if (scrollTop + clientHeight >= scrollHeight - 200) {
        setVisibleCount(prev => prev + 4); // 2×2 단위씩 추가
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // 스크롤이 시작되면 상단 헤더(제목 영역)를 숨김
  useEffect(() => {
    const container = contentRef.current;
    if (!container) return;

    const onScroll = () => {
      const y = container.scrollTop;
      // 약간만 내려도 헤더를 숨기고, 맨 위에 가까우면 다시 표시
      setShowHeader(y < 8);
    };

    container.addEventListener('scroll', onScroll, { passive: true });
    return () => container.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="screen-layout" style={{ background: '#ffffff', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* 헤더 */}
      <header
        className="screen-header"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          borderBottom: '1px solid #f0f0f0',
          flexShrink: 0,
          background: 'white',
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
          gap: '12px',
          transition: 'transform 0.2s ease-out, opacity 0.2s ease-out',
          transform: showHeader ? 'translateY(0)' : 'translateY(-100%)',
          opacity: showHeader ? 1 : 0
        }}
      >
        <button
          onClick={() => navigate(-1)}
          style={{
            border: 'none',
            background: 'none',
            fontSize: '26px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <span className="material-symbols-outlined" style={{ color: '#333' }}>arrow_back</span>
        </button>
        <h1 style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: '#1f2937' }}>지금 여기는</h1>
      </header>

      {/* 컨텐츠 */}
      <div
        ref={contentRef}
        className="screen-content"
        style={{ flex: 1, overflow: 'auto', padding: '16px', paddingBottom: '100px' }}
      >
        {realtimeData.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '48px', marginBottom: '16px', display: 'block' }}>schedule</span>
            <p>아직 게시물이 없어요</p>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
              rowGap: '7px',
              columnGap: '7px',
              paddingBottom: '16px'
            }}
          >
            {displayedPosts.map((post, index) => {
              const weather = post.weather || null;
              const hasWeather = weather && (weather.icon || weather.temperature);
              return (
                <div
                  key={`${post.id}-${index}`}
                  onClick={() => navigate(`/post/${post.id}`, { state: { post, allPosts: realtimeData } })}
                  style={{
                    background: '#ffffff',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    boxShadow: '0 2px 6px rgba(15,23,42,0.08)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  {/* 이미지: 정사각형 (padding-bottom 방식으로 호환성 확보) */}
                  <div style={{ width: '100%', paddingBottom: '100%', height: 0, position: 'relative', background: '#e5e7eb' }}>
                    {post.image ? (
                      <img
                        src={post.image}
                        alt={post.location}
                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      />
                    ) : (
                      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>image</span>
                      </div>
                    )}
                    <div style={{ position: 'absolute', bottom: '4px', right: '4px', background: 'rgba(15,23,42,0.7)', padding: '2px 6px', borderRadius: '999px', fontSize: '11px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '2px', color: '#f9fafb' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>favorite</span>
                      <span>{post.likes}</span>
                    </div>
                  </div>

                  {/* 하단 시트: 좌우 동일 높이, 시간·기온 한 줄(기온 우측) */}
                  <div style={{ padding: '12px 14px 14px', background: '#f8fafc', borderTop: '3px solid #475569', boxShadow: '0 -2px 0 0 #475569, 0 2px 8px rgba(0,0,0,0.08)', minHeight: '92px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexShrink: 0 }}>
                      📍 {post.location || '어딘가의 지금'}
                    </div>
                    {(post.content || post.note) && (
                      <div style={{ fontSize: '12px', color: '#4b5563', marginTop: '4px', lineHeight: 1.4, height: '2.8em', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                        {post.content || post.note}
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', flexShrink: 0, fontSize: '11px', color: '#6b7280' }}>
                      <span>{post.time}</span>
                      {hasWeather && (weather.icon || weather.temperature) && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {weather.icon && <span>{weather.icon}</span>}
                          {weather.temperature && <span>{weather.temperature}</span>}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 위로가기 버튼 - 프로필 버튼 바로 위, 흰색 완전 원형 */}
      <button
        type="button"
        onClick={() => {
          if (contentRef.current) {
            contentRef.current.scrollTop = 0;
            if (typeof contentRef.current.scrollTo === 'function') {
              contentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        style={{
          position: 'fixed',
          bottom: 'calc(80px + env(safe-area-inset-bottom, 0px) + 20px)',
          // 화면 전체가 아니라, 가운데 460px짜리 폰 화면 기준으로 오른쪽 정렬
          right: 'calc((100vw - 460px) / 2 + 20px)',
          width: '46px',
          height: '46px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.85)', // 반투명 흰색
          border: '1px solid rgba(148,163,184,0.5)', // 연한 회색 테두리
          boxShadow: '0 4px 14px rgba(15,23,42,0.22)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 200
        }}
        aria-label="위로가기"
      >
        <span className="material-symbols-outlined" style={{ fontSize: '22px', color: '#111827' }}>north</span>
      </button>

      <BottomNavigation />
    </div>
  );
};

export default RealtimeFeedScreen;
