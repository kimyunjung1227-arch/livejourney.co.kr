import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNavigation from '../components/BottomNavigation';
import { filterActivePosts48, getTimeAgo } from '../utils/timeUtils';
import './MainScreen.css';

import { getCombinedPosts } from '../utils/mockData';
import { getDisplayImageUrl } from '../api/upload';
import { fetchPostsSupabase } from '../api/postsSupabase';
import { rankHotspotPosts } from '../utils/hotnessEngine';
import { toggleBookmark, isPostBookmarked } from '../utils/socialInteractions';
import { getDongCategoryLine, getPhotoCaptionLine } from '../utils/hotPlaceDisplay';
import { getWeatherByRegion } from '../api/weather';

function getTrendingBadgeText(post, variantIndex) {
    const rank = post._rank;
    const v = variantIndex % 6;
    if (v === 0 && rank != null) return `TRENDING #${rank}`;
    if (v === 1) return '급상승';
    if (v === 2 && rank != null) return `HOT #${rank}`;
    if (v === 3) return '실시간 인기';
    if (v === 4 && rank != null) return `TOP ${rank}`;
    return rank != null ? `핫플 ${rank}위` : '실시간 핫플';
}

const FILTERS = [
    { id: '전체', label: '전체', icon: null },
    { id: '카페', label: '카페', icon: 'local_cafe' },
    { id: '맛집', label: '맛집', icon: 'restaurant' },
    { id: '명소', label: '명소', icon: 'location_on' },
];

const matchFilter = (post, filterId) => {
    if (filterId === '전체') return true;
    const cat = (post.category || '').toLowerCase();
    const tags = Array.isArray(post.tags) ? post.tags.join(' ').toLowerCase() : '';
    const content = (post.content || post.note || '').toLowerCase();
    const loc = (post.location || '').toLowerCase();
    const text = `${cat} ${tags} ${content} ${loc}`;
    if (filterId === '카페') return text.includes('카페') || text.includes('cafe') || text.includes('커피');
    if (filterId === '맛집') return cat === 'food';
    if (filterId === '명소') return cat === 'scenic' || cat === 'landmark';
    return true;
};

const CrowdedPlaceScreen = () => {
    const navigate = useNavigate();
    const [crowdedData, setCrowdedData] = useState([]);
    const [activeFilter, setActiveFilter] = useState('전체');
    const [refreshKey, setRefreshKey] = useState(0);
    const [bookmarkRefresh, setBookmarkRefresh] = useState(0);
    const [weatherByRegion, setWeatherByRegion] = useState({});
    const [badgeTick, setBadgeTick] = useState(0);
    const contentRef = useRef(null);

    useEffect(() => {
        const id = setInterval(() => setBadgeTick((t) => t + 1), 2600);
        return () => clearInterval(id);
    }, []);

    const crowdedRegionsKey = useMemo(() => {
        const keys = crowdedData.map((p) => (p?.region || p?.location || '').trim().split(/\s+/)[0]).filter(Boolean);
        return [...new Set(keys)].sort().join('|');
    }, [crowdedData]);

    useEffect(() => {
        const regions = new Set();
        crowdedData.forEach((p) => {
            if (p && !p.weather && (p.region || p.location)) {
                const r = (p.region || p.location || '').trim().split(/\s+/)[0] || p.region || p.location;
                if (r) regions.add(r);
            }
        });
        if (regions.size === 0) return undefined;
        let cancelled = false;
        const map = {};
        Promise.all(
            Array.from(regions).map(async (region) => {
                try {
                    const res = await getWeatherByRegion(region);
                    if (!cancelled && res?.success && res.weather) return { region, weather: res.weather };
                } catch (_) {
                    /* ignore */
                }
                return null;
            })
        ).then((results) => {
            if (cancelled) return;
            results.forEach((r) => {
                if (r) map[r.region] = r.weather;
            });
            setWeatherByRegion((prev) => ({ ...prev, ...map }));
        });
        return () => {
            cancelled = true;
        };
    }, [crowdedRegionsKey]);

    const handleBookmark = (e, post) => {
        e.stopPropagation();
        toggleBookmark(post);
        setBookmarkRefresh((k) => k + 1);
    };

    useEffect(() => {
        const handler = () => setRefreshKey((k) => k + 1);
        window.addEventListener('adminDeletedPost', handler);
        return () => window.removeEventListener('adminDeletedPost', handler);
    }, []);

    useEffect(() => {
        const onLike = (e) => {
            const { postId, likesCount } = e.detail || {};
            if (!postId || typeof likesCount !== 'number') return;
            const id = String(postId);
            setCrowdedData((prev) =>
                prev.map((p) => (p && String(p.id) === id ? { ...p, likes: likesCount, likeCount: likesCount } : p))
            );
        };
        const onComments = (e) => {
            const { postId, comments: nextComments } = e.detail || {};
            if (!postId || !Array.isArray(nextComments)) return;
            const id = String(postId);
            setCrowdedData((prev) =>
                prev.map((p) => (p && String(p.id) === id ? { ...p, comments: nextComments } : p))
            );
        };
        window.addEventListener('postLikeUpdated', onLike);
        window.addEventListener('postCommentsUpdated', onComments);
        return () => {
            window.removeEventListener('postLikeUpdated', onLike);
            window.removeEventListener('postCommentsUpdated', onComments);
        };
    }, []);

    useEffect(() => {
        const loadData = async () => {
            const localPosts = JSON.parse(localStorage.getItem('uploadedPosts') || '[]');
            const supabasePosts = await fetchPostsSupabase();
            const byId = new Map();
            [...(Array.isArray(supabasePosts) ? supabasePosts : []), ...(Array.isArray(localPosts) ? localPosts : [])].forEach((p) => {
                if (p && p.id && !byId.has(p.id)) byId.set(p.id, p);
            });
            const allPosts = getCombinedPosts(Array.from(byId.values()));
            const posts = filterActivePosts48(allPosts);

            const transformPost = (post) => {
                const firstImage = post.images?.[0] || post.image || post.thumbnail || '';
                const firstVideo = post.videos?.[0] || '';
                const likesNum = Number(post.likes ?? post.likeCount ?? 0) || 0;
                const commentsArr = Array.isArray(post.comments) ? post.comments : [];
                const timeStr = getTimeAgo(post.timestamp || post.createdAt || post.time);
                return {
                    ...post,
                    id: post.id,
                    image: getDisplayImageUrl(firstImage || firstVideo || ''),
                    thumbnailIsVideo: !firstImage && !!firstVideo,
                    firstVideoUrl: firstVideo ? getDisplayImageUrl(firstVideo) : null,
                    location: post.location,
                    region: post.region || (post.location || '').trim().split(/\s+/).slice(0, 2).join(' ') || post.location,
                    time: timeStr,
                    content: post.note || post.content || `${post.location || '장소'}의 모습`,
                    likes: likesNum,
                    likeCount: likesNum,
                    comments: commentsArr,
                };
            };

            const transformed = posts.map(transformPost);
            const preFiltered = transformed.filter((p) => {
                const hasLikes = (p.likes || 0) > 0;
                const isRecent = p.time && (p.time.includes('방금') || p.time.includes('분 전') || p.time.includes('시간 전'));
                return hasLikes || isRecent;
            });
            const toRank = preFiltered.length > 0 ? preFiltered : transformed;
            const ranked = rankHotspotPosts(toRank, { verifyFirst: true, maxItems: 100 });
            const crowdedWithRank = ranked.map((r) => ({
                ...r.post,
                _rank: r.rank,
                _impactLabel: r.impactLabel,
            }));
            setCrowdedData(crowdedWithRank.length > 0 ? crowdedWithRank : transformed.slice(0, 50));
        };
        loadData();
    }, [refreshKey]);

    const filteredPosts = crowdedData.filter((post) => matchFilter(post, activeFilter));

    return (
        <div className="screen-layout bg-background-light dark:bg-background-dark min-h-screen flex flex-col">
            {/* 헤더 */}
            <header className="screen-header sticky top-0 z-20 flex items-center justify-between px-4 py-3 bg-background-light/90 dark:bg-background-dark/90 border-b border-slate-100 dark:border-slate-800 backdrop-blur">
                <button
                    onClick={() => navigate(-1)}
                    aria-label="뒤로가기"
                    className="flex size-10 shrink-0 items-center justify-center rounded-full text-text-main dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                    <span className="material-symbols-outlined text-2xl">arrow_back</span>
                </button>
                <h1 className="flex-1 text-center text-lg font-bold text-text-main dark:text-white">
                    실시간 급상승 핫플
                </h1>
                <div className="w-10" />
            </header>

            {/* 컨텐츠 */}
            <div ref={contentRef} className="screen-content flex-1 overflow-y-auto">
                {/* 상단 타이틀 — 실시간 급상승 핫플 피드 */}
                <section className="px-5 pt-3 pb-0.5">
                    <h2 className="text-lg font-bold leading-tight text-text-main dark:text-white">
                        실시간 급상승 핫플 🔥
                    </h2>
                    <p className="text-text-sub dark:text-slate-400 text-[11px] mt-0.5">지금 가장 핫한 장소를 확인해보세요</p>
                </section>

                {/* 필터 — 칩 사이즈를 줄여 상단 영역 압축 */}
                <div className="flex gap-1.5 overflow-x-auto px-5 py-2 scrollbar-hide">
                    {FILTERS.map((f) => {
                        const isActive = activeFilter === f.id;
                        return (
                            <button
                                key={f.id}
                                type="button"
                                onClick={() => setActiveFilter(f.id)}
                                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors border ${
                                    isActive
                                        ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                                        : 'bg-white dark:bg-slate-800 text-text-sub dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'
                                }`}
                            >
                                {f.icon && <span className="material-symbols-outlined text-base">{f.icon}</span>}
                                {f.label}
                            </button>
                        );
                    })}
                </div>

                {/* 피드 — 세로 리스트, 4:3 카드, 랭킹은 3위까지 표시하되 피드는 계속 노출 */}
                {filteredPosts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 px-6 text-center text-slate-400 dark:text-slate-500">
                        <span className="material-symbols-outlined text-5xl mb-3">local_fire_department</span>
                        <p className="text-sm mb-1">아직 실시간 핫플 게시물이 없어요</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">좋아요가 쌓이거나 최근 게시물이 생기면 이곳에 표시돼요.</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-2 px-4 pb-16">
                        {filteredPosts.map((post) => {
                            const title =
                                (post.placeName || '').trim() ||
                                (post.location || '').trim() ||
                                (post.detailedLocation || '').trim() ||
                                '핫플레이스';
                            const isBookmarked = bookmarkRefresh >= 0 && isPostBookmarked(post.id);
                            const dongCatLine = getDongCategoryLine(post);
                            const captionLine = getPhotoCaptionLine(post);
                            const regionKey = (post.region || post.location || '').trim().split(/\s+/)[0] || post.region || post.location;
                            const weather = post.weather || weatherByRegion[regionKey] || null;
                            const hasWeather = weather && (weather.icon || weather.temperature != null);
                            return (
                                <div
                                    key={post.id}
                                    onClick={() => navigate(`/post/${post.id}`, { state: { post, allPosts: crowdedData } })}
                                    style={{ maxHeight: 'calc((100dvh - 200px) / 2)' }}
                                    className="group flex min-h-0 flex-col bg-white dark:bg-slate-800 rounded-2xl shadow-md border border-slate-100 dark:border-slate-700 overflow-hidden cursor-pointer"
                                >
                                    <div className="relative w-full shrink-0 overflow-hidden rounded-t-2xl bg-slate-200" style={{ aspectRatio: '16/9', maxHeight: 'min(22vh, 200px)' }}>
                                        <div className="absolute top-2 left-2 z-10 max-w-[58%] px-2 py-1 rounded-md bg-slate-900/82 text-white text-[10px] font-extrabold tracking-tight shadow-md">
                                            {getTrendingBadgeText(post, badgeTick)}
                                        </div>
                                        {hasWeather ? (
                                            <div className="absolute top-2 right-2 z-10 inline-flex items-center gap-0.5 px-2 py-1 rounded-md bg-black/55 text-white text-[10px] font-semibold shadow-md backdrop-blur-[2px]">
                                                <span className="leading-none">{weather.icon || '🌤️'}</span>
                                                <span>{weather.temperature != null && weather.temperature !== '-' ? `${weather.temperature}°` : ''}</span>
                                                <span className="truncate max-w-[4.5rem] opacity-95">{weather.condition && weather.condition !== '-' ? weather.condition : ''}</span>
                                            </div>
                                        ) : null}
                                        {post.thumbnailIsVideo && post.firstVideoUrl ? (
                                            <video
                                                src={post.firstVideoUrl}
                                                muted
                                                playsInline
                                                preload="metadata"
                                                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                                            />
                                        ) : post.image ? (
                                            <img src={post.image} alt={post.location || ''} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]" />
                                        ) : (
                                            <div className="flex h-full min-h-[100px] w-full items-center justify-center text-slate-400">
                                                <span className="material-symbols-outlined text-4xl">image</span>
                                            </div>
                                        )}
                                        <div className="pointer-events-none absolute inset-0 bg-black/5" />
                                    </div>
                                    <div className="min-h-0 flex-1 p-2.5 pb-2">
                                        <div className="flex justify-between items-start gap-2">
                                            <div className="min-w-0 flex-1">
                                                <h3 className="text-[15px] font-bold leading-snug text-text-main dark:text-white line-clamp-2">{title}</h3>
                                                {dongCatLine ? (
                                                    <p className="mt-0.5 text-[11px] leading-snug text-slate-500 dark:text-slate-400 line-clamp-2">{dongCatLine}</p>
                                                ) : null}
                                                {captionLine ? (
                                                    <p className="mt-1 text-[11px] leading-relaxed text-slate-600 dark:text-slate-300 line-clamp-3">{captionLine}</p>
                                                ) : null}
                                            </div>
                                            <button
                                                type="button"
                                                className="text-slate-400 hover:text-primary transition-colors p-1 flex-shrink-0 mt-0.5"
                                                onClick={(e) => handleBookmark(e, post)}
                                                aria-label="저장"
                                            >
                                                <span className="material-symbols-outlined text-[22px]" style={isBookmarked ? { fontVariationSettings: "'FILL' 1" } : undefined}>
                                                    bookmark
                                                </span>
                                            </button>
                                        </div>
                                        <div className="mt-1.5 flex items-center justify-between gap-2 text-[10px] text-slate-500 dark:text-slate-400">
                                            <span className="flex items-center gap-1 min-w-0 truncate">
                                                <span className="material-symbols-outlined text-primary text-[15px] flex-shrink-0">trending_up</span>
                                                <span className="font-medium text-slate-600 dark:text-slate-300">실시간 급상승 중</span>
                                            </span>
                                            <span className="flex-shrink-0 text-slate-400 dark:text-slate-500">
                                                {post.time ? `${post.time} 업로드` : '최근 업로드'}
                                            </span>
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
