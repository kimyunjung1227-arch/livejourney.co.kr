
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNavigation from '../components/BottomNavigation';
import { filterRecentPosts, filterActivePosts48, getTimeAgo } from '../utils/timeUtils';
import './MainScreen.css';

import { getCombinedPosts } from '../utils/mockData';
import { getDisplayImageUrl } from '../api/upload';
import { computeHotPlaces, loadSearchEvents } from '../utils/hotPlaceIndex';

const CrowdedPlaceScreen = () => {
    const navigate = useNavigate();
    const [crowdedData, setCrowdedData] = useState([]);
  const contentRef = useRef(null);

    useEffect(() => {
        const loadData = () => {
            const localPosts = JSON.parse(localStorage.getItem('uploadedPosts') || '[]');
            const allPosts = getCombinedPosts(Array.isArray(localPosts) ? localPosts : []);
            const recentPosts = filterActivePosts48(allPosts); // 48시간 이내만 핫플 후보
            const searchEvents = loadSearchEvents(60 * 24); // 최근 24시간 검색 로그

            const hotPlaces = computeHotPlaces(recentPosts, searchEvents);

            const formatted = hotPlaces.map((place) => ({
                id: place.key,
                image: place.image || '',
                location: place.key,
                time: place.rising ? '🔥 급상승' : '실시간 집계',
                content: place.verified ? '실시간 인증됨' : '지금 사람들이 모이는 중',
                likes: Math.round(place.score * 100),
                score: place.score,
                rising: place.rising,
                verified: place.verified,
                center: place.center
            }));

            setCrowdedData(formatted);
        };
        loadData();
    }, []);

    return (
        <div className="screen-layout" style={{ background: '#ffffff', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            {/* 헤더 */}
            <header className="screen-header" style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                padding: '12px 16px', 
                background: 'white', 
                position: 'sticky', 
                top: 0, 
                zIndex: 100, 
                borderBottom: '1px solid #f0f0f0',
                flexShrink: 0
            }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <button onClick={() => navigate(-1)} style={{ border: 'none', background: 'none', fontSize: '24px', cursor: 'pointer', marginRight: '12px', display: 'flex', alignItems: 'center' }}>
                        <span className="material-symbols-outlined" style={{ color: '#333' }}>arrow_back</span>
                    </button>
                    <div>
                        <h1 style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: '#1f2937' }}>실시간 급상승 핫플</h1>
                    </div>
                </div>
            </header>

            {/* 컨텐츠 */}
            <div
                ref={contentRef}
                className="screen-content"
                style={{ flex: 1, overflow: 'auto', padding: '16px', paddingBottom: '100px' }}
            >
                {crowdedData.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '48px', marginBottom: '16px', display: 'block' }}>groups</span>
                        <p>아직 붐비는 곳 정보가 없어요</p>
                    </div>
                ) : (
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                            rowGap: '12px',
                            columnGap: '10px',
                            paddingBottom: '16px'
                        }}
                    >
                        {crowdedData.map((post) => (
                            <div
                                key={post.id}
                                onClick={() => navigate('/map', { state: { selectedPin: { lat: post.center?.lat, lng: post.center?.lng } } })}
                                style={{
                                    background: '#ffffff',
                                    borderRadius: '12px',
                                    overflow: 'hidden',
                                    boxShadow: 'none',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    flexDirection: 'column'
                                }}
                            >
                                {/* 이미지: 정사각형 (지금 여기는 더보기와 동일) */}
                                <div style={{ width: '100%', paddingBottom: '100%', height: 0, position: 'relative', background: '#e5e7eb' }}>
                                    {post.image ? (
                                        <img
                                            src={getDisplayImageUrl(post.image)}
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

                                {/* 하단 시트: 시간·급상승 한 줄(우측 정렬) */}
                                <div style={{ padding: '12px 14px 14px', background: '#f8fafc', borderTop: '3px solid #475569', boxShadow: '0 -2px 0 0 #475569, 0 2px 8px rgba(0,0,0,0.08)', minHeight: '92px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexShrink: 0 }}>
                                        📍 {post.location}
                                    </div>
                                    {post.content && (
                                        <div style={{ fontSize: '12px', color: '#4b5563', marginTop: '4px', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', flex: '1 1 auto', minHeight: 0 }}>
                                            {post.content}
                                        </div>
                                    )}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', flexShrink: 0, fontSize: '11px', color: '#6b7280' }}>
                                        <span>{post.time}</span>
                                        {post.rising && <span style={{ color: '#ef4444', fontWeight: 700 }}>🔥 급상승</span>}
                                    </div>
                                </div>
                            </div>
                        ))}
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
                    right: 'calc((100vw - 460px) / 2 + 20px)',
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.85)',
                    border: '1px solid rgba(148,163,184,0.5)',
                    boxShadow: '0 4px 14px rgba(15,23,42,0.22)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    zIndex: 60
                }}
                aria-label="위로가기"
            >
                <span className="material-symbols-outlined" style={{ fontSize: '22px', color: '#111827' }}>north</span>
            </button>

            <BottomNavigation />
        </div>
    );
};

export default CrowdedPlaceScreen;
