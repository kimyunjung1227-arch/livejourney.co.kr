
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
    // 국내 관심지역 선택용 상태 (전국 8도)
    const [selectedCountry, setSelectedCountry] = useState('서울');
    const [selectedCity, setSelectedCity] = useState('서울 전체');
    const [selectedInterestLabels, setSelectedInterestLabels] = useState([]);
    const [deleteConfirmPlace, setDeleteConfirmPlace] = useState(null);
    const [selectedRecommendTag, setSelectedRecommendTag] = useState('blooming');

    const { handleDragStart, hasMovedRef } = useHorizontalDragScroll();

    const withDragCheck = useCallback((fn) => () => {
        if (!hasMovedRef.current) fn();
    }, [hasMovedRef]);

    const loadMockData = useCallback(() => {
        const localPosts = JSON.parse(localStorage.getItem('uploadedPosts') || '[]');
        const allPosts = getCombinedPosts(Array.isArray(localPosts) ? localPosts : []);

        const posts = filterActivePosts48(allPosts); // 피드는 48시간 이내만 노출

        // 촬영 시간 라벨 포맷터 (가볍게: "2/10 14:30")
        const formatCaptureLabel = (post) => {
            const src = post.photoDate || post.timestamp || post.createdAt;
            if (!src) return null;
            const d = new Date(src);
            if (Number.isNaN(d.getTime())) return null;
            const month = d.getMonth() + 1;
            const day = d.getDate();
            const hours = d.getHours();
            const minutes = String(d.getMinutes()).padStart(2, '0');
            return `${month}/${day} ${hours}:${minutes}`;
        };

        // ===== 태그 분류용 집계 (장소별 통계) =====
        const now = Date.now();
        const placeStats = {};

        const getPlaceKey = (post) => {
            return post.location || post.placeName || post.detailedLocation || '기록';
        };

        const collectTextForPost = (post) => {
            const tags = Array.isArray(post.tags) ? post.tags : [];
            const parts = [
                post.note,
                post.content,
                post.categoryName,
                post.location,
                post.placeName,
                ...tags.map((t) => typeof t === 'string' ? t : String(t || ''))
            ].filter(Boolean);
            return parts.join(' ');
        };

        posts.forEach((post) => {
            const placeKey = getPlaceKey(post);
            if (!placeStats[placeKey]) {
                placeStats[placeKey] = {
                    // 실시간 계층 (최근 60분)
                    waitingRecent: 0,
                    soldoutRecent: 0,
                    // 시즌/이벤트 계층 (최근 24시간)
                    blossom24h: 0,
                    newMenu24h: 0,
                    popup24h: 0,
                    total24h: 0,
                    // 상시 특징 계층 (누적)
                    nightViewAll: 0,
                    parkingAll: 0,
                    photoSpotAll: 0,
                    totalAll: 0,
                };
            }

            const stats = placeStats[placeKey];
            const text = collectTextForPost(post);
            const ts = post.timestamp || post.createdAt || post.time;
            const postTime = ts ? new Date(ts).getTime() : now;
            const diffMinutes = Math.max(0, (now - postTime) / 60000);
            const diffHours = diffMinutes / 60;

            const hasWaiting = text.includes('웨이팅') || text.includes('대기') || text.includes('줄') || text.includes('북적');
            const hasSoldout = text.includes('재고') || text.includes('소진') || text.includes('품절');
            const hasBlossom = text.includes('벚꽃') || text.includes('꽃놀이') || text.includes('벚꽃축제');
            const hasNewMenu = text.includes('신메뉴') || text.includes('신상') || text.includes('한정') || text.includes('시즌메뉴');
            const hasPopup = text.includes('팝업') || text.includes('팝업스토어');
            const hasNightView = text.includes('야경');
            const hasParking = text.includes('주차');
            const hasPhotoSpot = text.includes('포토존') || text.includes('사진 맛집') || text.includes('사진맛집') || text.includes('인스타');

            // 실시간: 최근 60분 이내 제보
            if (diffMinutes <= 60) {
                if (hasWaiting) stats.waitingRecent += 1;
                if (hasSoldout) stats.soldoutRecent += 1;
            }

            // 시즌/이벤트: 최근 24시간
            if (diffHours <= 24) {
                stats.total24h += 1;
                if (hasBlossom) stats.blossom24h += 1;
                if (hasNewMenu) stats.newMenu24h += 1;
                if (hasPopup) stats.popup24h += 1;
            }

            // 상시 특징: 누적
            stats.totalAll += 1;
            if (hasNightView) stats.nightViewAll += 1;
            if (hasParking) stats.parkingAll += 1;
            if (hasPhotoSpot) stats.photoSpotAll += 1;
        });

        const transformPost = (post) => {
            const dynamicTime = getTimeAgo(post.timestamp || post.createdAt || post.time);
            // 급상승 지표 계산 (최근 좋아요 증가율 기반)
            const recentLikes = post.likes || 0;
            const surgeIndicator = recentLikes > 50 ? '급상승' : recentLikes > 20 ? '인기' : '실시간';
            const surgePercent = recentLikes > 50 ? Math.floor(Math.random() * 50) + 100 : recentLikes > 20 ? Math.floor(Math.random() * 30) + 50 : Math.floor(Math.random() * 30) + 20;

            const placeKey = getPlaceKey(post);
            const stats = placeStats[placeKey] || {
                waitingRecent: 0,
                soldoutRecent: 0,
                blossom24h: 0,
                newMenu24h: 0,
                popup24h: 0,
                total24h: 0,
                nightViewAll: 0,
                parkingAll: 0,
                photoSpotAll: 0,
                totalAll: 0,
            };

            const reasonTags = [];

            // 1) 실시간 상태 (Live) - 최우선
            if (stats.waitingRecent >= 3) {
                reasonTags.push('#지금_웨이팅_폭주');
            }
            if (stats.soldoutRecent >= 2) {
                reasonTags.push('#재고_소진_임박');
            }

            // 2) 시즌/이벤트 (Context) - 최근 24시간 / 48시간 맥락
            if (stats.total24h > 0) {
                const blossomRatio = stats.blossom24h / stats.total24h;
                if (blossomRatio >= 0.7) {
                    reasonTags.push('#벚꽃_절정');
                }
                const newMenuRatio = stats.newMenu24h / stats.total24h;
                if (newMenuRatio >= 0.4) {
                    reasonTags.push('#신메뉴_출시');
                }
                const popupRatio = stats.popup24h / stats.total24h;
                if (popupRatio >= 0.4) {
                    reasonTags.push('#팝업스토어');
                }
            }

            // 3) 상시 특징 (Feature) - 누적 리뷰 기반
            if (stats.totalAll > 0) {
                const nightRatio = stats.nightViewAll / stats.totalAll;
                if (nightRatio >= 0.3) {
                    reasonTags.push('#야경_최고');
                }
                const parkingRatio = stats.parkingAll / stats.totalAll;
                if (parkingRatio >= 0.3) {
                    reasonTags.push('#주차_편함');
                }
                const photoRatio = stats.photoSpotAll / stats.totalAll;
                if (photoRatio >= 0.3) {
                    reasonTags.push('#사진_맛집');
                }
            }

            // 아무 태그도 없으면 가벼운 기본 태그로 보완 (정보 과부하 방지용 1~2개)
            const uniqueReasons = [...new Set(reasonTags)];
            if (uniqueReasons.length === 0) {
                const fallback = ['#추천_맛집', '#SNS_화제', '#오늘_특가', '#사진_맛집'];
                const shuffled = [...fallback].sort(() => 0.5 - Math.random());
                uniqueReasons.push(shuffled[0]);
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
                // 메타데이터 기반 촬영 시간 라벨
                captureLabel: formatCaptureLabel(post),
                // 카드당 최대 2~3개 태그만 노출
                reasonTags: uniqueReasons.slice(0, 3),
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
        // 새 UI: 여러 개의 국내 관심지역을 한 번에 추가
        if (!selectedInterestLabels || selectedInterestLabels.length === 0) return;

        let addedAny = false;
        selectedInterestLabels.forEach((label) => {
            const added = toggleInterestPlace(label);
            if (added) addedAny = true;
        });

        if (addedAny) {
            loadInterestPlaces();
        }

        setShowAddInterestModal(false);
        setSelectedInterestLabels([]);
    }, [selectedInterestLabels, loadInterestPlaces]);

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

    // 새 알림이 생기면 메인 화면에서도 배지 갱신
    useEffect(() => {
        const onCountChange = () => setUnreadNotificationCount(getUnreadCount());
        window.addEventListener('notificationCountChanged', onCountChange);
        return () => window.removeEventListener('notificationCountChanged', onCountChange);
    }, []);

    // 추천 여행지 탭 변경 시 추천 목록만 갱신 (실시간 급상승 태그는 그대로 유지)
    useEffect(() => {
        if (!allPostsForRecommend || allPostsForRecommend.length === 0) return;
        const recs = getRecommendedRegions(allPostsForRecommend, selectedRecommendTag);
        setRecommendedData(recs.slice(0, 10));
    }, [selectedRecommendTag, allPostsForRecommend]);

    return (
        <div className="screen-layout" style={{ background: '#ffffff' }}>
            <div
                className="screen-content"
                style={{
                    background: '#ffffff',
                }}
            >
                {/* 앱 헤더: 로고 + 검색창 + 알림 */}
                <div className="app-header" style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '12px 16px',
                    background: '#ffffff',
                    backdropFilter: 'blur(10px)',
                    position: 'sticky',
                    top: 0,
                    zIndex: 100,
                    borderBottom: 'none',
                    boxShadow: 'none'
                }}>
                    <span
                        className="logo-text"
                        style={{ fontSize: '20px', fontWeight: 900, color: '#000000', letterSpacing: '-0.5px', flexShrink: 0 }}
                    >
                        Live Journey
                    </span>
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
                    <button onClick={() => navigate('/notices', { state: { fromMain: true } })} className="icon-btn" style={{ minWidth: 44, minHeight: 44, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }} aria-label="공지사항">
                        <span className="material-symbols-outlined" style={{ fontSize: 24 }}>campaign</span>
                    </button>
                    <button onClick={() => navigate('/notifications')} className="icon-btn" style={{ minWidth: 44, minHeight: 44, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }} aria-label="알림">
                        <span className="material-symbols-outlined" style={{ fontSize: 24 }}>notifications</span>
                        {unreadNotificationCount > 0 && <span className="noti-badge" aria-label="새 알림">{unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}</span>}
                    </button>
                </div>

                {/* 관심 지역/장소 — 지금 여기는 위, 가볍게 */}
                <div style={{ padding: '8px 16px 8px', background: '#ffffff' }}>
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
                                <div
                                    key={idx}
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: 4,
                                        flexShrink: 0,
                                        position: 'relative',
                                        scrollSnapAlign: 'start',
                                        minWidth: 56,
                                    }}
                                >
                                        <div style={{ position: 'relative' }}>
                                            <div
                                                role="button"
                                                tabIndex={0}
                                                onClick={withDragCheck(() => setSelectedInterest(isSelected ? null : place.name))}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' || e.key === ' ') {
                                                        e.preventDefault();
                                                        setSelectedInterest(isSelected ? null : place.name);
                                                    }
                                                }}
                                                style={{
                                                    width: 48,
                                                    height: 48,
                                                    minWidth: 48,
                                                    minHeight: 48,
                                                    borderRadius: '50%',
                                                    border: isSelected
                                                        ? '2px solid rgba(15,23,42,0.9)'
                                                        : '1px solid rgba(148,163,184,0.7)',
                                                    overflow: 'hidden',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    cursor: 'pointer',
                                                    background: '#E5E7EB',
                                                }}
                                            >
                                                <img
                                                    src={getRegionDefaultImage(place.name)}
                                                    alt={place.name}
                                                    style={{
                                                        width: '100%',
                                                        height: '100%',
                                                        objectFit: 'cover',
                                                        display: 'block',
                                                    }}
                                                />
                                            </div>
                                            {isSelected && (
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        withDragCheck(() => setDeleteConfirmPlace(place.name))();
                                                    }}
                                                    style={{
                                                        position: 'absolute',
                                                        top: -4,
                                                        right: 0,
                                                        transform: 'translate(30%, -40%)', // 조금 더 위로 / 바깥으로
                                                        width: 24,
                                                        height: 24,
                                                        borderRadius: '999px', // 완전한 원형
                                                        backgroundColor: '#ffffff',
                                                        border: '1.5px solid #ffeded',
                                                        color: '#ff4d4f',
                                                        cursor: 'pointer',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontSize: 16,
                                                        lineHeight: 0,
                                                        padding: 0,
                                                        fontWeight: 700,
                                                        boxShadow: '0 2px 5px rgba(0,0,0,0.10)',
                                                        transition: 'transform 0.2s ease, background-color 0.2s ease',
                                                        zIndex: 2,
                                                    }}
                                                    aria-label={`${place.name} 관심 지역 삭제`}
                                                >
                                                    ×
                                                </button>
                                            )}
                                        </div>
                                    <span
                                        style={{
                                            fontSize: 11,
                                            color: isSelected ? '#0F172A' : '#94A3B8',
                                            fontWeight: isSelected ? 600 : 400,
                                            maxWidth: 56,
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                            textAlign: 'center',
                                        }}
                                    >
                                        {place.name}
                                    </span>
                                </div>
                            );
                        })}
                        <button
                            type="button"
                            onClick={withDragCheck(() => navigate('/interest-places'))}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: 4,
                                cursor: 'pointer',
                                flexShrink: 0,
                                border: 'none',
                                background: 'none',
                                minWidth: 56,
                            }}
                            aria-label="관심 지역 추가"
                        >
                            <div
                                style={{
                                    width: 48,
                                    height: 48,
                                    minWidth: 48,
                                    minHeight: 48,
                                    borderRadius: '50%',
                                    border: '1px dashed rgba(148,163,184,0.8)',
                                    position: 'relative',
                                    background: 'transparent',
                                    color: '#64748b',
                                }}
                            >
                                <span
                                    style={{
                                        position: 'absolute',
                                        top: '50%',
                                        left: '50%',
                                        transform: 'translate(-50%, -50%)',
                                        fontSize: 20,
                                        fontWeight: 600,
                                        lineHeight: 1,
                                    }}
                                >
                                    +
                                </span>
                            </div>
                        </button>
                    </div>
                </div>

                {/* 지금 여기는 — 관심 지역 선택 시 숨김, 한 화면에 핫플까지 보이도록 높이 축소 */}
                {!selectedInterest && (
                    <div style={{ padding: '12px 16px 14px', background: '#ffffff' }}>
                    <div style={{ padding: '0 0 8px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#111827' }}>지금 여기는</h2>
                            <span
                                style={{
                                    fontSize: '10px',
                                    padding: '3px 8px',
                                    borderRadius: '999px',
                                    fontWeight: 600,
                                    letterSpacing: '0.14em',
                                    textTransform: 'uppercase',
                                    border: '1px solid rgba(248, 113, 113, 0.3)',
                                    background: 'rgba(248, 113, 113, 0.06)',
                                    color: '#b91c1c',
                                }}
                            >
                                live
                            </span>
                        </div>
                        <button onClick={() => navigate('/realtime-feed')} style={{ border: 'none', background: 'none', color: '#64748b', fontSize: '14px', fontWeight: 600, cursor: 'pointer', padding: '6px 10px', minHeight: 36 }}>더보기</button>
                    </div>
                    <div
                    style={{ display: 'flex', gap: '7px', padding: '0 0 12px 0', overflowX: 'auto', scrollbarWidth: 'none', scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch', cursor: 'grab', background: '#ffffff' }}
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
                                        minWidth: '52%',
                                        width: '52%',
                                        borderRadius: '20px',
                                        overflow: 'hidden',
                                        background: 'white',
                                        flexShrink: 0,
                                        cursor: 'pointer',
                                        scrollSnapAlign: 'start',
                                        scrollSnapStop: 'always',
                                        boxShadow: 'none'
                                    }}
                                >
                                    <div style={{ width: '100%', height: '150px', background: '#e5e7eb', position: 'relative', borderRadius: '20px 20px 0 0', overflow: 'hidden' }}>
                                        {firstImage && (
                                            <img
                                                src={firstImage}
                                                alt={post.location}
                                                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', borderRadius: '20px 20px 0 0' }}
                                            />
                                        )}
                                        {/* 날씨 정보만 이미지 우측 상단에 오버레이 */}
                                        {hasWeather && (
                                            <div style={{ position: 'absolute', top: '6px', right: '10px', background: 'rgba(15,23,42,0.7)', padding: '4px 8px', borderRadius: '999px', fontSize: '12px', fontWeight: 600, color: '#f9fafb', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                {weather.icon && <span>{weather.icon}</span>}
                                                {weather.temperature && <span>{weather.temperature}</span>}
                                            </div>
                                        )}
                                    </div>
                                    {/* 사진 정보 하단 시트 — 업로드 시간 우측 상단 */}
                                    <div style={{ padding: '12px 14px 14px', background: '#f8fafc', borderTop: '3px solid #475569', boxShadow: '0 -2px 0 0 #475569, 0 2px 8px rgba(0,0,0,0.08)', minHeight: '100px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', flexShrink: 0 }}>
                                            <div style={{ color: '#111827', fontSize: '14px', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, minWidth: 0 }}>
                                                {post.location || '어딘가의 지금'}
                                            </div>
                                            <span style={{ fontSize: '11px', color: '#6b7280', flexShrink: 0 }}>
                                                {post.captureLabel || post.time}
                                            </span>
                                        </div>
                                        {(post.content || post.note) && (
                                            <div style={{ color: '#4b5563', fontSize: '13px', lineHeight: 1.45, marginTop: '6px', height: '2.9em', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
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
                            <button
                                type="button"
                                onClick={() => {
                                    // 관심지역 전체 피드를 별도 화면(지역 상세)에서 볼 수 있도록 이동
                                    navigate(`/region/${encodeURIComponent(selectedInterest)}`, {
                                        state: { region: { name: selectedInterest } },
                                    });
                                }}
                                style={{
                                    border: 'none',
                                    background: 'none',
                                    color: '#0284c7',
                                    fontSize: '14px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    padding: '8px 12px',
                                    minHeight: 44,
                                }}
                            >
                                전체 보기
                            </button>
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
                                        <div style={{ padding: '12px 14px 14px', background: '#f8fafc', borderTop: '3px solid #475569', boxShadow: '0 -2px 0 0 #475569, 0 2px 8px rgba(0,0,0,0.08)' }}>
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
                <div style={{ padding: '0 16px 20px', background: '#ffffff', minHeight: '100%' }}>

                        {/* 실시간 급상승 핫플 — 한 화면에 보이도록 상단 여백 최소화 */}
                        <div style={{ marginBottom: '0', paddingTop: '0', paddingBottom: '20px', background: '#ffffff' }}>
                            <div style={{ padding: '0 0 8px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ffffff' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 600, color: '#374151' }}>실시간 핫플</h3>
                                </div>
                                <button onClick={() => navigate('/crowded-place')} style={{ border: 'none', background: 'none', color: '#64748b', fontSize: '14px', fontWeight: 600, cursor: 'pointer', padding: '6px 10px', minHeight: 36 }}>더보기</button>
                            </div>
                            {/* 가로 스크롤 슬라이더 */}
                            <div
                                style={{
                                    display: 'flex',
                                    gap: '7px',
                                    paddingBottom: '4px',
                                    background: '#ffffff',
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
                                            background: '#ffffff',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'stretch',
                                            minWidth: '32%',
                                            maxWidth: '32%',
                                            flexShrink: 0
                                        }}
                                    >
                                        <div style={{ width: '100%', aspectRatio: '1', borderRadius: '10px', overflow: 'hidden', background: '#eee', position: 'relative' }}>
                                            {(Array.isArray(post.images) && post.images.length > 0) || post.image || post.thumbnail ? (
                                                <img src={getDisplayImageUrl(post.images?.[0] || post.image || post.thumbnail)} alt={post.location} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                                            ) : (
                                                <div style={{ width: '100%', height: '100%', background: '#e5e7eb' }} />
                                            )}
                                        </div>
                                        <div style={{ fontSize: '12px', fontWeight: 700, color: '#111827', marginTop: '4px', marginBottom: '2px', letterSpacing: '-0.3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{post.location}</div>
                                        {post.categoryLabel && <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: 600, marginBottom: '2px' }}>{post.categoryLabel}</div>}
                                        {post.reasonTags && post.reasonTags.length > 0 && (
                                            <div style={{ display: 'flex', gap: '2px', flexWrap: 'wrap' }}>
                                                {post.reasonTags.slice(0, 2).map((tag, idx) => (
                                                    <span key={idx} style={{ fontSize: '10px', color: '#64748b', fontWeight: 500, background: '#e2e8f0', padding: '1px 4px', borderRadius: '4px', whiteSpace: 'nowrap' }}>
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
                        <div style={{ marginBottom: '24px', background: '#ffffff' }}>
                            <div style={{ padding: '0 0 12px 0' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#374151' }}>추천 여행지</h3>
                                    <button onClick={() => navigate('/recommended-place')} style={{ border: 'none', background: 'none', color: '#64748b', fontSize: '14px', fontWeight: 500, cursor: 'pointer', padding: '8px 12px', minHeight: 44 }}>더보기</button>
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
                                style={{ display: 'flex', gap: '10px', padding: '0 0 16px 0', overflowX: 'auto', scrollbarWidth: 'none', scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch', cursor: 'grab' }}
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
                                            style={{ minWidth: '74%', width: '74%', borderRadius: '18px', overflow: 'hidden', background: 'white', flexShrink: 0, cursor: 'pointer', scrollSnapAlign: 'center', scrollSnapStop: 'always', boxShadow: 'none' }}
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
                                            <div style={{ padding: '12px 14px 14px', background: '#f8fafc', borderTop: '3px solid #475569', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
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

            {/* 관심 지역 추가 모달 - 지역 선택 UI */}
            {showAddInterestModal && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.45)',
                        backdropFilter: 'blur(8px)',
                        zIndex: 2000,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '16px',
                    }}
                >
                    <div style={{ background: '#ffffff', width: '100%', maxWidth: 420, maxHeight: '80vh', borderRadius: 28, overflowY: 'auto', overflowX: 'hidden', boxShadow: '0 18px 45px rgba(15,23,42,0.35)', display: 'flex', flexDirection: 'column', margin: 'auto', WebkitOverflowScrolling: 'touch' }}>
                        {/* 헤더 */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px 14px', borderBottom: '1px solid #e5e7eb' }}>
                            <button
                                type="button"
                                onClick={() => { setShowAddInterestModal(false); }}
                                style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer', minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'flex-start', color: '#111827' }}
                                aria-label="닫기"
                            >
                                <span style={{ fontSize: 20 }}>×</span>
                            </button>
                            <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: '#111827' }}>관심지역 설정</h3>
                            <div style={{ width: 44, height: 44 }} />
                        </div>
                        {/* 본문: 좌우 2열 레이아웃 */}
                        <div style={{ display: 'flex', flex: 1, minHeight: 260 }}>
                            {/* 왼쪽: 국내 권역 리스트 (전국 8도 개념) */}
                            <div style={{ width: '38%', borderRight: '1px solid #f1f5f9', background: '#f8fafc' }}>
                                {['서울', '경기', '인천', '강원', '충청', '전라', '경상', '제주'].map((country) => {
                                    const isActive = selectedCountry === country;
                                    return (
                                        <button
                                            key={country}
                                            type="button"
                                            onClick={() => { setSelectedCountry(country); setSelectedCity(`${country} 전체`); }}
                                            style={{
                                                width: '100%',
                                                padding: '10px 12px',
                                                textAlign: 'left',
                                                border: 'none',
                                                background: isActive ? '#e5f0ff' : 'transparent',
                                                color: isActive ? '#111827' : '#94a3b8',
                                                fontSize: 14,
                                                fontWeight: isActive ? 600 : 500,
                                                cursor: 'pointer',
                                            }}
                                        >
                                            {country}
                                        </button>
                                    );
                                })}
                            </div>
                            {/* 오른쪽: 선택한 권역의 세부 지역 리스트 */}
                            <div style={{ flex: 1, background: '#ffffff', display: 'flex', flexDirection: 'column' }}>
                                <div style={{ padding: '10px 16px', borderBottom: '1px solid #f1f5f9', fontSize: 14, fontWeight: 600, color: '#111827' }}>
                                    {selectedCountry}
                                </div>
                                <div style={{ flex: 1, overflowY: 'auto' }}>
                                    {(() => {
                                        const cityMap = {
                                            '서울': ['서울 전체', '종로·중구', '강남·서초', '송파·강동', '마포·용산', '홍대·신촌', '여의도'],
                                            '경기': ['경기 전체', '성남·분당', '수원', '고양·일산', '용인', '김포·파주', '가평·양평'],
                                            '인천': ['인천 전체', '송도', '연수·남동', '부평·계양', '중구(월미·영종)'],
                                            '강원': ['강원 전체', '춘천', '강릉', '속초', '평창', '양양'],
                                            '충청': ['충청 전체', '대전', '세종', '천안·아산', '청주'],
                                            '전라': ['전라 전체', '전주', '광주', '여수', '순천', '목포', '군산'],
                                            '경상': ['경상 전체', '부산', '대구', '울산', '경주', '포항', '창원·마산·진해'],
                                            '제주': ['제주 전체', '제주시', '서귀포', '애월', '성산·표선'],
                                        };
                                        const cities = cityMap[selectedCountry] || [`${selectedCountry} 전체`];
                                        return cities.map((city) => {
                                            const label = city.includes('전체') ? city : `${selectedCountry} ${city}`;
                                            const isActive = selectedInterestLabels.includes(label);
                                            return (
                                                <button
                                                    key={city}
                                                    type="button"
                                                    onClick={() =>
                                                        setSelectedInterestLabels((prev) =>
                                                            prev.includes(label)
                                                                ? prev.filter((v) => v !== label)
                                                                : [...prev, label]
                                                        )
                                                    }
                                                    style={{
                                                        width: '100%',
                                                        padding: '12px 16px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'space-between',
                                                        border: 'none',
                                                        borderBottom: '1px solid #f1f5f9',
                                                        background: isActive ? '#f9fafb' : '#ffffff',
                                                        cursor: 'pointer',
                                                        fontSize: 14,
                                                        color: '#111827',
                                                    }}
                                                >
                                                    <span>{city}</span>
                                                    {isActive && (
                                                        <span style={{ color: '#0ea5e9', fontSize: 16 }}>✓</span>
                                                    )}
                                                </button>
                                            );
                                        });
                                    })()}
                                </div>
                            </div>
                        </div>
                        {/* 하단 버튼 */}
                        <div style={{ padding: '14px 18px', borderTop: '1px solid #e5e7eb', display: 'flex', gap: 10 }}>
                            <button
                                type="button"
                                onClick={() => { setShowAddInterestModal(false); setSelectedInterestLabels([]); }}
                                style={{
                                    flex: 1,
                                    padding: '12px 14px',
                                    borderRadius: 999,
                                    border: '1px solid #e5e7eb',
                                    background: '#ffffff',
                                    color: '#6b7280',
                                    fontWeight: 600,
                                    fontSize: 14,
                                    cursor: 'pointer',
                                }}
                            >
                                취소
                            </button>
                            <button
                                type="button"
                                onClick={handleAddInterestPlace}
                                style={{
                                    flex: 1,
                                    padding: '12px 14px',
                                    borderRadius: 999,
                                    border: 'none',
                                    background: selectedInterestLabels.length > 0 ? '#111827' : '#cbd5e1',
                                    color: '#ffffff',
                                    fontWeight: 700,
                                    fontSize: 14,
                                    cursor: selectedInterestLabels.length > 0 ? 'pointer' : 'default',
                                }}
                                disabled={selectedInterestLabels.length === 0}
                            >
                                추가하기
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <BottomNavigation />
        </div >
    );

};

export default MainScreen;
