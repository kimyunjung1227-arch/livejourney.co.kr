
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
        <div className="screen-layout" style={{ background: '#fafafa', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
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
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', rowGap: 0, columnGap: '8px', paddingBottom: '16px' }}>
                        {crowdedData.map(post => (
                            <div
                                key={post.id}
                                onClick={() => navigate('/map', { state: { selectedPin: { lat: post.center?.lat, lng: post.center?.lng } } })}
                                style={{
                                    background: '#ffffff',
                                    borderRadius: '12px',
                                    overflow: 'hidden',
                                    boxShadow: '0 2px 6px rgba(15,23,42,0.08)',
                                    cursor: 'pointer',
                                    transition: 'transform 0.18s ease',
                                    display: 'flex',
                                    flexDirection: 'column'
                                }}
                            >
                                {/* 상단 이미지 영역 (세로 길이 줄이기) */}
                                <div style={{ width: '100%', aspectRatio: '4 / 3', background: '#eee', position: 'relative' }}>
                                    {post.image ? (
                                        <img src={getDisplayImageUrl(post.image)} alt={post.location} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                                    ) : (
                                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1' }}>
                                            <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>image</span>
                                        </div>
                                    )}
                                    {/* 북마크 아이콘 */}
                                    <div style={{ position: 'absolute', top: '6px', right: '6px', width: '24px', height: '24px', borderRadius: '999px', background: 'rgba(15,23,42,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#f9fafb' }}>bookmark_border</span>
                                    </div>
                                </div>
                                {/* 텍스트 영역 */}
                                <div style={{ padding: '11px 12px 12px' }}>
                                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#111827', marginBottom: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {post.location}
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#4b5563', marginBottom: '6px', maxHeight: '3.2em', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {post.content}
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#6b7280' }}>
                                        <span style={{ fontWeight: 600 }}>
                                            {post.time}
                                        </span>
                                        {post.rising && (
                                            <span style={{ color: '#ef4444', fontWeight: 700, whiteSpace: 'nowrap' }}>🔥 급상승</span>
                                        )}
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
