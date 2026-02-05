
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNavigation from '../components/BottomNavigation';
import { getUnreadCount } from '../utils/notifications';
import { getTimeAgo, filterRecentPosts, filterActivePosts48 } from '../utils/timeUtils';
import { getInterestPlaces, toggleInterestPlace } from '../utils/interestPlaces';
import { getRegionDefaultImage } from '../utils/regionDefaultImages';
import { logger } from '../utils/logger';
import { getRecommendedRegions, RECOMMENDATION_TYPES } from '../utils/recommendationEngine';
import { useHorizontalDragScroll } from '../hooks/useHorizontalDragScroll';
import './MainScreen.css';
import { getCombinedPosts } from '../utils/mockData';
import { getDisplayImageUrl } from '../api/upload';

const MainScreen = () => {
    const navigate = useNavigate();
    const [selectedTag, setSelectedTag] = useState(null);
    const [popularTags, setPopularTags] = useState([]);

    const [realtimeData, setRealtimeData] = useState([]);
    const [crowdedData, setCrowdedData] = useState([]);
    const [recommendedData, setRecommendedData] = useState([]);
    const [allPostsForRecommend, setAllPostsForRecommend] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
    const [interestPlaces, setInterestPlaces] = useState([]);
    const [selectedInterest, setSelectedInterest] = useState(null);
    const [showAddInterestModal, setShowAddInterestModal] = useState(false);
    const [newInterestPlace, setNewInterestPlace] = useState('');
    const [deleteConfirmPlace, setDeleteConfirmPlace] = useState(null);
    const [selectedRecommendTag, setSelectedRecommendTag] = useState('blooming');

    const { handleDragStart, hasMovedRef } = useHorizontalDragScroll();

    const withDragCheck = useCallback((fn) => () => {
        if (!hasMovedRef.current) fn();
    }, [hasMovedRef]);

    // SOS 알림
    const [nearbySosRequests, setNearbySosRequests] = useState([]);
    const [currentLocation, setCurrentLocation] = useState(null);
    const [dismissedSosIds, setDismissedSosIds] = useState(() => {
        try {
            const saved = localStorage.getItem('dismissedSosIds_v1');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            return [];
        }
    });

    const getDistanceKm = (lat1, lon1, lat2, lon2) => {
        const toRad = (v) => (v * Math.PI) / 180;
        const R = 6371;
        const dLat = toRad(lat2 - lat1);
        const dLon = toRad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) *
            Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    const loadSosRequests = useCallback(() => {
        try {
            const sosJson = localStorage.getItem('sosRequests_v1');
            const sosRequests = sosJson ? JSON.parse(sosJson) : [];
            if (!currentLocation) {
                setNearbySosRequests([]);
                return;
            }
            const nearby = sosRequests.filter((req) => {
                if (req.status !== 'open' || !req.coordinates) return false;
                const d = getDistanceKm(
                    currentLocation.latitude,
                    currentLocation.longitude,
                    req.coordinates.lat,
                    req.coordinates.lng
                );
                return d <= 5;
            });
            setNearbySosRequests(nearby);
        } catch (error) {
            logger.error('SOS 요청 로드 실패:', error);
        }
    }, [currentLocation]);

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setCurrentLocation({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                    });
                },
                (error) => {
                    logger.error('위치 가져오기 실패:', error);
                }
            );
        }
    }, []);

    useEffect(() => {
        loadSosRequests();
        const interval = setInterval(() => {
            loadSosRequests();
        }, 30000);
        return () => clearInterval(interval);
    }, [loadSosRequests]);

    const loadMockData = useCallback(() => {
        const localPosts = JSON.parse(localStorage.getItem('uploadedPosts') || '[]');
        const allPosts = getCombinedPosts(Array.isArray(localPosts) ? localPosts : []);

        const posts = filterActivePosts48(allPosts); // 피드는 48시간 이내만 노출

        const transformPost = (post) => {
            const dynamicTime = getTimeAgo(post.timestamp || post.createdAt || post.time);
            // 급상승 지표 계산 (최근 좋아요 증가율 기반)
            const recentLikes = post.likes || 0;
            const surgeIndicator = recentLikes > 50 ? '급상승' : recentLikes > 20 ? '인기' : '실시간';
            const surgePercent = recentLikes > 50 ? Math.floor(Math.random() * 50) + 100 : recentLikes > 20 ? Math.floor(Math.random() * 30) + 50 : Math.floor(Math.random() * 30) + 20;
            
            // 이유 태그 추출 (tags, note, categoryName에서) - 다양하게 생성
            const reasonTags = [];
            const tags = post.tags || [];
            const note = post.note || '';
            const categoryName = post.categoryName || '';
            const category = post.category || '';
            
            // 다양한 이유 태그 목록
            const possibleReasons = [
                '#지금_노을맛집', '#갑자기_공연중', '#재료소진_직전', '#지금_웨이팅_폭주',
                '#오늘_특가', '#한정_메뉴', '#이벤트_진행중', '#신메뉴_출시',
                '#포토존_신설', '#야경_최고', '#주말_특별', '#예약_필수',
                '#인기_급상승', '#SNS_화제', '#리뷰_폭주', '#방문자_증가',
                '#특별_프로모션', '#시즌_한정', '#오픈_기념', '#추천_맛집'
            ];
            
            // 태그에서 이유 추출
            tags.forEach(tag => {
                const tagStr = typeof tag === 'string' ? tag.replace(/^#+/, '') : String(tag);
                if (tagStr.includes('노을') || tagStr.includes('일몰') || tagStr.includes('일출')) {
                    reasonTags.push('#지금_노을맛집');
                } else if (tagStr.includes('공연') || tagStr.includes('축제') || tagStr.includes('이벤트')) {
                    reasonTags.push('#갑자기_공연중');
                } else if (tagStr.includes('재료') || tagStr.includes('소진') || tagStr.includes('한정')) {
                    reasonTags.push('#재료소진_직전');
                } else if (tagStr.includes('웨이팅') || tagStr.includes('대기') || tagStr.includes('줄')) {
                    reasonTags.push('#지금_웨이팅_폭주');
                } else if (tagStr.includes('특가') || tagStr.includes('할인') || tagStr.includes('프로모션')) {
                    reasonTags.push('#오늘_특가');
                } else if (tagStr.includes('신메뉴') || tagStr.includes('신상')) {
                    reasonTags.push('#신메뉴_출시');
                } else if (tagStr.includes('포토') || tagStr.includes('인스타')) {
                    reasonTags.push('#포토존_신설');
                } else if (tagStr.includes('야경') || tagStr.includes('야경')) {
                    reasonTags.push('#야경_최고');
                } else if (tagStr.includes('예약') || tagStr.includes('예약')) {
                    reasonTags.push('#예약_필수');
                }
            });
            
            // note에서 키워드 추출
            if (note.includes('노을') || note.includes('일몰') || note.includes('일출')) reasonTags.push('#지금_노을맛집');
            if (note.includes('공연') || note.includes('축제') || note.includes('이벤트')) reasonTags.push('#갑자기_공연중');
            if (note.includes('재료') || note.includes('소진') || note.includes('한정')) reasonTags.push('#재료소진_직전');
            if (note.includes('웨이팅') || note.includes('대기') || note.includes('줄')) reasonTags.push('#지금_웨이팅_폭주');
            if (note.includes('특가') || note.includes('할인') || note.includes('프로모션')) reasonTags.push('#오늘_특가');
            if (note.includes('신메뉴') || note.includes('신상')) reasonTags.push('#신메뉴_출시');
            if (note.includes('포토') || note.includes('인스타')) reasonTags.push('#포토존_신설');
            if (note.includes('야경')) reasonTags.push('#야경_최고');
            if (note.includes('예약')) reasonTags.push('#예약_필수');
            
            // 카테고리 기반 태그 추가
            if (category === 'waiting') {
                reasonTags.push('#지금_웨이팅_폭주');
            } else if (category === 'blooming') {
                reasonTags.push('#지금_노을맛집');
            } else if (category === 'food') {
                reasonTags.push('#인기_급상승');
            } else if (category === 'spots') {
                reasonTags.push('#SNS_화제');
            }
            
            // 카테고리명 기반 태그
            if (categoryName.includes('맛집')) reasonTags.push('#추천_맛집');
            if (categoryName.includes('카페')) reasonTags.push('#오늘_특가');
            if (categoryName.includes('명소')) reasonTags.push('#포토존_신설');
            
            // 중복 제거
            const uniqueReasons = [...new Set(reasonTags)];
            
            // 기본 태그 추가 (아무것도 없을 때)
            if (uniqueReasons.length === 0) {
                // 랜덤하게 1-2개 선택
                const randomReasons = possibleReasons.sort(() => 0.5 - Math.random()).slice(0, Math.floor(Math.random() * 2) + 1);
                uniqueReasons.push(...randomReasons);
            }
            
            return {
                ...post,
                id: post.id,
                image: getDisplayImageUrl((post.images && post.images.length > 0) ? post.images[0] : (post.image || post.thumbnail || '')),
                title: post.location,
                time: dynamicTime,
                content: post.note || post.content || `${post.location}의 모습`,
                likes: post.likes || 0,
                weather: post.weather || null,
                surgeIndicator,
                surgePercent,
                reasonTags: uniqueReasons.slice(0, 2), // 최대 2개만
            };
        };

        const transformedAll = posts.map(transformPost);

        // "지금 여기는": 최신순 정렬 후 상위 20개
        const byLatest = [...transformedAll].sort((a, b) => {
            const tA = a.timestamp || a.createdAt || a.time || 0;
            const tB = b.timestamp || b.createdAt || b.time || 0;
            const dateA = typeof tA === 'number' ? tA : new Date(tA).getTime();
            const dateB = typeof tB === 'number' ? tB : new Date(tB).getTime();
            return dateB - dateA;
        });
        setRealtimeData(byLatest.slice(0, 20));

        // "실시간 급상승 핫플": 다양한 카테고리에서 인기 게시물 선택
        // 좋아요 수가 높거나 최근 게시물을 우선적으로 선택
        const hotPosts = transformedAll
            .filter(p => {
                // 다양한 카테고리 포함: waiting, blooming, food, spots 등
                const hasLikes = (p.likes || 0) > 0;
                const isRecent = p.time && (p.time.includes('방금') || p.time.includes('분 전') || p.time.includes('시간 전'));
                return hasLikes || isRecent;
            })
            .sort((a, b) => {
                // 좋아요 수 기준 정렬, 같으면 최신순
                if (b.likes !== a.likes) return b.likes - a.likes;
                const timeA = a.time || '';
                const timeB = b.time || '';
                if (timeA.includes('방금')) return -1;
                if (timeB.includes('방금')) return 1;
                if (timeA.includes('분 전') && !timeB.includes('분 전')) return -1;
                if (timeB.includes('분 전') && !timeA.includes('분 전')) return 1;
                return 0;
            })
            .slice(0, 15); // 상위 15개 선택
        
        setCrowdedData(hotPosts.length > 0 ? hotPosts : transformedAll.slice(20, 35));

        const recs = getRecommendedRegions(allPosts, 'blooming');
        setRecommendedData(recs.slice(0, 10));
        setAllPostsForRecommend(allPosts);
    }, []);

    const fetchPosts = useCallback(async () => {
        setLoading(true);
        try { loadMockData(); } catch (err) { loadMockData(); } finally { setLoading(false); }
    }, [loadMockData]);

    const loadInterestPlaces = useCallback(() => {
        const places = getInterestPlaces();
        setInterestPlaces(places);
    }, []);

    const filteredInterestPosts = useMemo(() => {
        if (!selectedInterest) return [];
        const allPosts = [...realtimeData, ...crowdedData, ...recommendedData];
        return allPosts.filter(item => {
            const location = item.location || item.title || '';
            return location.includes(selectedInterest) || selectedInterest.includes(location);
        }).filter((v, i, a) => a.findIndex(t => (t.id === v.id)) === i);
    }, [selectedInterest, realtimeData, crowdedData, recommendedData]);

    const handleAddInterestPlace = useCallback(() => {
        if (!newInterestPlace.trim()) return;
        const added = toggleInterestPlace(newInterestPlace.trim());
        if (added) {
            loadInterestPlaces();
            setNewInterestPlace('');
            setShowAddInterestModal(false);
        }
    }, [newInterestPlace, loadInterestPlaces]);

    const handleDeleteInterestPlace = useCallback(() => {
        if (deleteConfirmPlace) {
            toggleInterestPlace(deleteConfirmPlace);
            loadInterestPlaces();
            if (selectedInterest === deleteConfirmPlace) setSelectedInterest(null);
            setDeleteConfirmPlace(null);
        }
    }, [deleteConfirmPlace, loadInterestPlaces, selectedInterest]);

    useEffect(() => {
        fetchPosts();
        setUnreadNotificationCount(getUnreadCount());
        loadInterestPlaces();
    }, [fetchPosts, loadInterestPlaces]);

    // 추천 여행지 탭 변경 시 추천 목록만 갱신 (실시간 급상승 태그는 그대로 유지)
    useEffect(() => {
        if (!allPostsForRecommend || allPostsForRecommend.length === 0) return;
        const recs = getRecommendedRegions(allPostsForRecommend, selectedRecommendTag);
        setRecommendedData(recs.slice(0, 10));
    }, [selectedRecommendTag, allPostsForRecommend]);

    return (
        <div className="screen-layout" style={{ background: '#fafafa' }}>
            <div className="screen-content" style={{ background: '#fafafa' }}>
                {/* 앱 헤더: 로고 + 검색창 + 알림 */}
                <div className="app-header" style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '12px 16px',
                    background: '#fafafa',
                    backdropFilter: 'blur(10px)',
                    position: 'sticky',
                    top: 0,
                    zIndex: 100,
                    borderBottom: 'none',
                    boxShadow: 'none'
                }}>
                    <span style={{ fontSize: '20px', fontWeight: 900, color: '#00BCD4', letterSpacing: '-0.5px', flexShrink: 0 }}>Live Journey</span>
                    <button
                        type="button"
                        onClick={() => navigate('/search')}
                        style={{
                            flex: 1,
                            minWidth: 0,
                            maxWidth: 240,
                            height: 40,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '0 14px',
                            background: 'rgba(0,0,0,0.04)',
                            border: '1px solid rgba(0,0,0,0.06)',
                            borderRadius: 20,
                            color: '#64748b',
                            fontSize: 14,
                            cursor: 'pointer',
                            textAlign: 'left'
                        }}
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: 20 }}>search</span>
                        <span>검색</span>
                    </button>
                    <button onClick={() => navigate('/notifications')} className="icon-btn" style={{ minWidth: 44, minHeight: 44, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }} aria-label="알림">
                        <span className="material-symbols-outlined" style={{ fontSize: 24 }}>notifications</span>
                        {unreadNotificationCount > 0 && <span className="noti-badge"></span>}
                    </button>
                </div>

                {/* SOS 알림 배너 */}
                {nearbySosRequests.length > 0 && !dismissedSosIds.includes(nearbySosRequests[0]?.id) && (
                    <div style={{ padding: '8px 16px' }}>
                        <div style={{ background: 'linear-gradient(135deg, #ff6b35, #ff9e7d)', color: 'white', padding: '12px 16px', borderRadius: '14px', fontSize: '14px', display: 'flex', alignItems: 'center', boxShadow: '0 4px 15px rgba(255, 107, 53, 0.2)' }}>
                            <span><b>SOS</b> 주변에 도움이 필요한 이웃이 있습니다.</span>
                        </div>
                    </div>
                )}

                {/* 관심 지역/장소 — 지금 여기는 위, 가볍게 */}
                <div style={{ padding: '10px 16px 12px', background: '#fafafa' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 500, color: '#64748b' }}>관심 지역</span>
                        {interestPlaces.length === 0 && <span style={{ fontSize: '12px', color: '#94a3b8' }}>· 추가해보세요</span>}
                    </div>
                    <div
                        style={{ display: 'flex', gap: '10px', padding: '0 0 4px 0', overflowX: 'auto', scrollbarWidth: 'none', cursor: 'grab', scrollSnapType: 'x mandatory' }}
                        className="hide-scrollbar"
                        onMouseDown={handleDragStart}
                    >
                        {interestPlaces.map((place, idx) => {
                            const isSelected = selectedInterest === place.name;
                            return (
                                <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', flexShrink: 0, position: 'relative', scrollSnapAlign: 'start', minWidth: 52 }}>
                                    <div
                                        role="button"
                                        tabIndex={0}
                                        onClick={withDragCheck(() => setSelectedInterest(isSelected ? null : place.name))}
                                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedInterest(isSelected ? null : place.name); } }}
                                        style={{
                                            width: 44, height: 44, minWidth: 44, minHeight: 44,
                                            borderRadius: '50%',
                                            border: isSelected ? '2px solid #00BCD4' : '1px solid rgba(0,0,0,0.08)',
                                            overflow: 'hidden',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            position: 'relative', cursor: 'pointer', flexShrink: 0
                                        }}
                                    >
                                        <img
                                            src={getRegionDefaultImage(place.name)}
                                            alt={place.name}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                        />
                                        {isSelected && (
                                            <button type="button" onClick={(e) => { e.stopPropagation(); setDeleteConfirmPlace(place.name); }}
                                                style={{ position: 'absolute', top: -1, right: -1, width: 20, height: 20, minWidth: 20, minHeight: 20, padding: 0, border: 'none', borderRadius: '50%', background: 'transparent', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}
                                                aria-label="삭제">
                                                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>close</span>
                                            </button>
                                        )}
                                    </div>
                                    <span style={{ fontSize: '12px', color: isSelected ? '#00BCD4' : '#94a3b8', fontWeight: isSelected ? 600 : 400, maxWidth: 52, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{place.name}</span>
                                </div>
                            );
                        })}
                        <button type="button" onClick={withDragCheck(() => setShowAddInterestModal(true))} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer', flexShrink: 0, border: 'none', background: 'none', minWidth: 44, minHeight: 44 }} aria-label="관심 지역 추가">
                            <div style={{ width: 44, height: 44, minWidth: 44, minHeight: 44, borderRadius: '50%', border: '1px dashed rgba(0,0,0,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', color: '#00BCD4', fontSize: 20, fontWeight: 600 }}>+</div>
                            <span style={{ fontSize: '12px', color: '#94a3b8' }}>추가</span>
                        </button>
                    </div>
                </div>

                {/* 지금 여기는 — 관심 지역 선택 시 숨김, 선택 해제 시에만 표시 */}
                {!selectedInterest && (
                    <div style={{ padding: '20px 16px 28px', background: '#fafafa' }}>
                    <div style={{ padding: '0 0 12px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#111827' }}>지금 여기는</h2>
                            <span className="pulse-badge" style={{ fontSize: '12px', background: '#FFF8E1', color: '#F59E0B', padding: '5px 11px', borderRadius: '8px', fontWeight: 600, border: '1px solid rgba(245, 158, 11, 0.3)' }}>LIVE</span>
                        </div>
                        <button onClick={() => navigate('/realtime-feed')} style={{ border: 'none', background: 'none', color: '#00BCD4', fontSize: '15px', fontWeight: 600, cursor: 'pointer', padding: '8px 12px', minHeight: 44 }}>더보기</button>
                    </div>
                    <div
                        style={{ display: 'flex', gap: '12px', padding: '0 0 24px 0', overflowX: 'auto', scrollbarWidth: 'none', scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch', cursor: 'grab', background: '#fafafa' }}
                        className="hide-scrollbar"
                        onMouseDown={handleDragStart}
                    >
                        {realtimeData.map((post) => {
                            const firstImage = getDisplayImageUrl(Array.isArray(post.images) && post.images.length > 0 ? post.images[0] : (post.image || post.thumbnail || ''));
                            const weather = post.weather || null;
                            const hasWeather = weather && (weather.icon || weather.temperature);
                            return (
                                <div
                                    key={post.id}
                                    onClick={withDragCheck(() => navigate(`/post/${post.id}`, { state: { post, allPosts: realtimeData } }))}
                                    style={{
                                        minWidth: '64%',
                                        width: '64%',
                                        borderRadius: '22px',
                                        overflow: 'hidden',
                                        background: 'white',
                                        flexShrink: 0,
                                        cursor: 'pointer',
                                        scrollSnapAlign: 'start',
                                        scrollSnapStop: 'always',
                                        boxShadow: '0 12px 26px rgba(15,23,42,0.14)'
                                    }}
                                >
                                    <div style={{ width: '100%', height: '235px', background: '#e5e7eb', position: 'relative' }}>
                                        {firstImage && (
                                            <img
                                                src={firstImage}
                                                alt={post.location}
                                                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                            />
                                        )}
                                        {/* 날씨 정보만 이미지 우측 상단에 오버레이 */}
                                        {hasWeather && (
                                            <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(15,23,42,0.7)', padding: '4px 8px', borderRadius: '999px', fontSize: '12px', fontWeight: 600, color: '#f9fafb', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                {weather.icon && <span>{weather.icon}</span>}
                                                {weather.temperature && <span>{weather.temperature}</span>}
                                            </div>
                                        )}
                                    </div>
                                    {/* 사진 정보는 하단 흰색 영역에 텍스트로 명확하게 표시 */}
                                    <div style={{ padding: '12px 14px 14px', background: '#ffffff' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', marginBottom: (post.content || post.note) ? 6 : 2 }}>
                                            <div style={{ color: '#111827', fontSize: '16px', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {post.location || '어딘가의 지금'}
                                            </div>
                                            <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: 600, whiteSpace: 'nowrap', marginLeft: 'auto' }}>
                                                {post.time}
                                            </div>
                                        </div>
                                        {(post.content || post.note) && (
                                            <div style={{ color: '#4b5563', fontSize: '14px', lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                                                {post.content || post.note}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
                )}

                {/* 메인 컨텐츠 */}
                {selectedInterest ? (
                    <div style={{ padding: '0 16px 20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', background: '#f0f9ff', padding: '12px', borderRadius: '12px' }}>
                            <span style={{ fontWeight: 700, color: '#0284c7', fontSize: '14px' }}>"{selectedInterest}" 모아보기</span>
                            <button type="button" onClick={() => setSelectedInterest(null)} style={{ border: 'none', background: 'none', color: '#0284c7', fontSize: '14px', fontWeight: 600, cursor: 'pointer', padding: '8px 12px', minHeight: 44 }}>전체 보기</button>
                        </div>
                        {filteredInterestPosts.length > 0 ? (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                                {filteredInterestPosts.map((post) => (
                                    <div key={post.id} onClick={() => navigate(`/post/${post.id}`, { state: { post, allPosts: filteredInterestPosts } })} style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', cursor: 'pointer' }}>
                                        <div style={{ height: '130px', background: '#eee', position: 'relative', overflowX: 'auto', display: 'flex', scrollSnapType: 'x mandatory', scrollbarWidth: 'none' }} className="hide-scrollbar">
                                            {(post.images && post.images.length > 0) ? (
                                                post.images.map((img, i) => (
                                                    <img key={i} src={getDisplayImageUrl(img)} alt={post.location} style={{ width: '100%', minWidth: '100%', height: '100%', objectFit: 'cover', scrollSnapAlign: 'start', scrollSnapStop: 'always' }} />
                                                ))
                                            ) : (
                                                <img src={getDisplayImageUrl(post.image || post.thumbnail)} alt={post.location} style={{ width: '100%', height: '100%', objectFit: 'cover', scrollSnapAlign: 'start', scrollSnapStop: 'always' }} />
                                            )}
                                            <div style={{ position: 'absolute', bottom: '6px', right: '6px', background: 'rgba(255,255,255,0.9)', padding: '4px 8px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, color: '#333' }}>좋아요 {post.likes}</div>
                                        </div>
                                        <div style={{ padding: '10px' }}>
                                            <div style={{ fontSize: '13px', fontWeight: 600, color: '#333', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{post.content || post.note || post.location}</div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#94a3b8' }}>
                                                <span>{post.time}</span>
                                                <span style={{ maxWidth: '60%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{post.location}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
                                <p style={{ margin: 0, fontSize: '14px' }}>아직 이 지역의 사진이 없어요.</p>
                                <p style={{ margin: '4px 0 0 0', fontSize: '12px' }}>첫 번째 사진을 올려보세요!</p>
                            </div>
                        )}
                    </div>
                ) : (
                <div style={{ padding: '0 16px 20px', background: '#fafafa', minHeight: '100%' }}>

                        {/* 실시간 급상승 핫플 — 가로 슬라이드, 한 화면에 최대 3개 */}
                        <div style={{ marginBottom: '0', paddingTop: '0', paddingBottom: '24px', background: '#fafafa' }}>
                            <div style={{ padding: '0 0 12px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fafafa' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#374151' }}>실시간 핫플</h3>
                                </div>
                                <button onClick={() => navigate('/crowded-place')} style={{ border: 'none', background: 'none', color: '#4b5563', fontSize: '13px', fontWeight: 500, cursor: 'pointer', padding: '8px 12px', minHeight: 44 }}>더보기</button>
                            </div>
                            {/* 가로 스크롤 슬라이더 (드래그/슬라이드 가능) */}
                            <div
                                style={{
                                    display: 'flex',
                                    gap: '8px',
                                    paddingBottom: '8px',
                                    background: '#fafafa',
                                    overflowX: 'auto',
                                    scrollbarWidth: 'none',
                                    WebkitOverflowScrolling: 'touch',
                                    cursor: 'grab'
                                }}
                                className="hide-scrollbar"
                                onMouseDown={handleDragStart}
                            >
                                {crowdedData.map(post => (
                                    <div key={post.id}
                                        onClick={withDragCheck(() => navigate(`/post/${post.id}`, { state: { post, allPosts: crowdedData } }))}
                                        style={{
                                            cursor: 'pointer',
                                            background: '#fafafa',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'stretch',
                                            minWidth: '32%',
                                            maxWidth: '32%',
                                            flexShrink: 0
                                        }}
                                    >
                                        {/* 정사각형 이미지 */}
                                        <div style={{ width: '100%', aspectRatio: '1', borderRadius: '10px', overflow: 'hidden', background: '#eee', position: 'relative' }}>
                                            {(Array.isArray(post.images) && post.images.length > 0) || post.image || post.thumbnail ? (
                                                <img src={getDisplayImageUrl(post.images?.[0] || post.image || post.thumbnail)} alt={post.location} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                                            ) : (
                                                <div style={{ width: '100%', height: '100%', background: '#e5e7eb' }} />
                                            )}
                                        </div>
                                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#111827', marginTop: '6px', marginBottom: '2px', letterSpacing: '-0.3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{post.location}</div>
                                        <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: 600, marginBottom: '4px' }}>{post.categoryLabel}</div>
                                        {post.reasonTags && post.reasonTags.length > 0 && (
                                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                                {post.reasonTags.slice(0, 2).map((tag, idx) => (
                                                    <span key={idx} style={{ fontSize: '12px', color: '#64748b', fontWeight: 500, background: '#e2e8f0', padding: '2px 6px', borderRadius: '4px', whiteSpace: 'nowrap' }}>
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* ✨ 추천 여행지 */}
                        <div style={{ marginBottom: '24px', background: '#fafafa' }}>
                            <div style={{ padding: '0 0 12px 0' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#374151' }}>추천 여행지</h3>
                                    <button onClick={() => navigate('/recommended-place')} style={{ border: 'none', background: 'none', color: '#00BCD4', fontSize: '14px', fontWeight: 500, cursor: 'pointer', padding: '8px 12px', minHeight: 44 }}>더보기</button>
                                </div>
                                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b' }}>
                                    {RECOMMENDATION_TYPES.find(t => t.id === selectedRecommendTag)?.description}
                                </p>
                            </div>
                            <div
                                style={{ display: 'flex', gap: '8px', padding: '0 0 12px 0', overflowX: 'auto', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch', cursor: 'grab', scrollSnapType: 'x mandatory' }}
                                className="hide-scrollbar"
                                onMouseDown={handleDragStart}
                            >
                                {RECOMMENDATION_TYPES.map(tag => (
                                    <div key={tag.id} onClick={withDragCheck(() => setSelectedRecommendTag(tag.id))} style={{ background: selectedRecommendTag === tag.id ? '#00BCD4' : '#f1f5f9', color: selectedRecommendTag === tag.id ? 'white' : '#64748b', padding: '12px 20px', borderRadius: '25px', fontSize: '14px', fontWeight: 600, whiteSpace: 'nowrap', cursor: 'pointer', border: selectedRecommendTag === tag.id ? 'none' : '1px solid #e2e8f0', flexShrink: 0, transition: 'all 0.2s', scrollSnapAlign: 'start', minHeight: 44, display: 'inline-flex', alignItems: 'center' }}>{tag.name}</div>
                                ))}
                            </div>
                            <div
                                style={{ display: 'flex', gap: '12px', padding: '0 0 16px 0', overflowX: 'auto', scrollbarWidth: 'none', scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch', cursor: 'grab' }}
                                className="hide-scrollbar"
                                onMouseDown={handleDragStart}
                            >
                                {recommendedData.map((item, idx) => {
                                    const regionPosts = allPostsForRecommend.filter(p =>
                                        (typeof p.location === 'string' && p.location.includes(item.regionName)) ||
                                        (p.detailedLocation && String(p.detailedLocation).includes(item.regionName)) ||
                                        (p.placeName && String(p.placeName).includes(item.regionName))
                                    );
                                    const rawImages = [
                                        item.image,
                                        ...regionPosts.flatMap(p => (p.images && p.images.length ? p.images : [p.thumbnail || p.image].filter(Boolean)))
                                    ].filter(Boolean).slice(0, 5);
                                    const displayImages = rawImages.map(url => getDisplayImageUrl(url)).filter(Boolean);
                                    const mainSrc = displayImages[0] || 'https://images.unsplash.com/photo-1548115184-bc65ae4986cf?w=800&q=80';

                                    return (
                                        <div
                                            key={idx}
                                            onClick={withDragCheck(() => navigate(`/region/${item.regionName}`))}
                                            style={{ minWidth: '74%', width: '74%', borderRadius: '18px', overflow: 'hidden', background: 'white', flexShrink: 0, cursor: 'pointer', scrollSnapAlign: 'center', scrollSnapStop: 'always', boxShadow: '0 10px 26px rgba(15,23,42,0.08)' }}
                                        >
                                            <div style={{ width: '100%', height: '160px', display: 'flex', overflowX: 'auto', scrollSnapType: 'x mandatory', scrollbarWidth: 'none', background: '#e5e7eb' }} className="hide-scrollbar">
                                                {(displayImages.length ? displayImages : [mainSrc]).map((src, i) => (
                                                    <img
                                                        key={i}
                                                        src={src}
                                                        alt={item.title}
                                                        style={{ width: '100%', minWidth: '100%', height: '100%', objectFit: 'cover', scrollSnapAlign: 'start' }}
                                                        onError={(e) => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1548115184-bc65ae4986cf?w=800&q=80'; }}
                                                    />
                                                ))}
                                            </div>
                                            <div style={{ padding: '10px 13px 13px' }}>
                                                <div style={{ fontSize: '11px', fontWeight: 700, color: '#06b6d4', marginBottom: '3px' }}>추천</div>
                                                <div style={{ color: '#111827', fontSize: '14px', fontWeight: 800, marginBottom: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {item.title}
                                                </div>
                                                <div style={{ color: '#4b5563', fontSize: '12px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {item.description}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

            </div>

            {/* 관심 지역 삭제 확인 모달 */}
            {deleteConfirmPlace && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: 'white', width: '85%', maxWidth: '300px', padding: '24px', borderRadius: '20px', textAlign: 'center' }}>
                        <h3 style={{ margin: '0 0 12px 0', fontSize: '18px', fontWeight: 700 }}>관심 지역 삭제</h3>
                        <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: '#64748b' }}>'{deleteConfirmPlace}'을(를) 관심 지역에서 삭제하시겠습니까?</p>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button type="button" onClick={() => setDeleteConfirmPlace(null)} style={{ flex: 1, padding: '14px 16px', minHeight: 48, borderRadius: '12px', background: '#f1f5f9', color: '#64748b', fontWeight: 600, fontSize: '15px' }}>취소</button>
                            <button type="button" onClick={handleDeleteInterestPlace} style={{ flex: 1, padding: '14px 16px', minHeight: 48, borderRadius: '12px', background: '#ef4444', color: 'white', fontWeight: 600, fontSize: '15px' }}>삭제</button>
                        </div>
                    </div>
                </div>
            )}

            {/* 관심 지역 추가 모달 */}
            {showAddInterestModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: 'white', width: '85%', maxWidth: '320px', padding: '28px', borderRadius: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h3 style={{ fontSize: '20px', fontWeight: 800, margin: 0 }}>관심 지역 추가</h3>
                            <button type="button" onClick={() => { setShowAddInterestModal(false); setNewInterestPlace(''); }} style={{ minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#64748b' }} aria-label="닫기">×</button>
                        </div>
                        <input type="text" value={newInterestPlace} onChange={e => setNewInterestPlace(e.target.value)} placeholder="예: 제주도, 강남, 부산" style={{ width: '100%', padding: '16px', borderRadius: '16px', border: '2px solid #e2e8f0', marginBottom: '24px' }} />
                        <button type="button" onClick={handleAddInterestPlace} disabled={!newInterestPlace.trim()} style={{ width: '100%', padding: '16px', minHeight: 52, borderRadius: '16px', background: newInterestPlace.trim() ? '#00BCD4' : '#cbd5e1', color: 'white', fontWeight: 700, fontSize: '16px' }}>추가하기</button>
                    </div>
                </div>
            )}

            <BottomNavigation />
        </div >
    );

};

export default MainScreen;
