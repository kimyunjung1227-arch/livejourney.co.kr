import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNavigation from '../components/BottomNavigation';
import { filterActivePosts48, getTimeAgo } from '../utils/timeUtils';
import './MainScreen.css';

import { getCombinedPosts } from '../utils/mockData';
import { getDisplayImageUrl } from '../api/upload';
import { fetchPostsSupabase } from '../api/postsSupabase';

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
    const contentRef = useRef(null);

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
                    time: timeStr,
                    content: post.note || post.content || `${post.location || '장소'}의 모습`,
                    likes: likesNum,
                    likeCount: likesNum,
                    comments: commentsArr,
                };
            };

            const transformed = posts.map(transformPost);
            const hotPosts = transformed
                .filter((p) => {
                    const hasLikes = (p.likes || 0) > 0;
                    const isRecent = p.time && (p.time.includes('방금') || p.time.includes('분 전') || p.time.includes('시간 전'));
                    return hasLikes || isRecent;
                })
                .sort((a, b) => {
                    if (b.likes !== a.likes) return b.likes - a.likes;
                    if (a.time && a.time.includes('방금')) return -1;
                    if (b.time && b.time.includes('방금')) return 1;
                    if (a.time && a.time.includes('분 전') && !(b.time && b.time.includes('분 전'))) return -1;
                    if (b.time && b.time.includes('분 전') && !(a.time && a.time.includes('분 전'))) return 1;
                    return 0;
                })
                .slice(0, 100);

            setCrowdedData(hotPosts.length > 0 ? hotPosts : transformed.slice(0, 50));
        };
        loadData();
    }, [refreshKey]);

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
                {/* 상단 타이틀 — 이미지와 동일: 실시간 급상승 핫플 🔥, 지금 가장 핫한 장소를 확인해보세요 */}
                <section className="px-5 pt-6 pb-2">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
                        <span className="text-emerald-500 font-bold text-xs uppercase tracking-wider">Live Now</span>
                    </div>
                    <h2 className="text-2xl font-bold leading-tight text-text-main dark:text-white">
                        실시간 급상승 핫플 🔥
                    </h2>
                    <p className="text-text-sub dark:text-slate-400 text-sm mt-1">지금 가장 핫한 장소를 확인해보세요</p>
                </section>

                {/* 필터 — 전체(선택 시 진한 배경), 카페/맛집/명소 + 아이콘 */}
                <div className="flex gap-2 overflow-x-auto px-5 py-4 scrollbar-hide">
                    {FILTERS.map((f) => {
                        const isActive = activeFilter === f.id;
                        return (
                            <button
                                key={f.id}
                                type="button"
                                onClick={() => setActiveFilter(f.id)}
                                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                                    isActive
                                        ? 'bg-primary text-white shadow-md shadow-primary/20'
                                        : 'bg-slate-100 dark:bg-slate-800 text-text-sub dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                                }`}
                            >
                                {f.icon && <span className="material-symbols-outlined text-lg">{f.icon}</span>}
                                {f.label}
                            </button>
                        );
                    })}
                </div>

                {/* 피드 — 참고 HTML처럼 세로 리스트, 4:3 카드, 위치 뱃지 좌하단, 좋아요 우하단 */}
                {crowdedData.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 px-6 text-center text-slate-400 dark:text-slate-500">
                        <span className="material-symbols-outlined text-5xl mb-3">local_fire_department</span>
                        <p className="text-sm mb-1">아직 실시간 핫플 게시물이 없어요</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">좋아요가 쌓이거나 최근 게시물이 생기면 이곳에 표시돼요.</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-6 px-5 pb-24">
                        {crowdedData.filter((post) => matchFilter(post, activeFilter)).map((post) => {
                            const likeCount = Number(post.likes ?? post.likeCount ?? 0) || 0;
                            const commentCount = Array.isArray(post.comments) ? post.comments.length : 0;
                            return (
                                <div
                                    key={post.id}
                                    onClick={() => navigate(`/post/${post.id}`, { state: { post, allPosts: crowdedData } })}
                                    className="group flex flex-col bg-white dark:bg-slate-800 rounded-2xl shadow-md border border-slate-100 dark:border-slate-700 overflow-hidden cursor-pointer"
                                >
                                    <div className="relative w-full aspect-[4/3] bg-slate-200 overflow-hidden">
                                        {post.thumbnailIsVideo && post.firstVideoUrl ? (
                                            <video
                                                src={post.firstVideoUrl}
                                                muted
                                                playsInline
                                                preload="metadata"
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                            />
                                        ) : post.image ? (
                                            <img src={post.image} alt={post.location || ''} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                                                <span className="material-symbols-outlined text-4xl">image</span>
                                            </div>
                                        )}
                                        <div className="absolute bottom-4 left-4 bg-black/40 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-lg flex items-center gap-1">
                                            <span className="material-symbols-outlined text-sm">location_on</span>
                                            <span className="truncate max-w-[200px]">{post.location || '장소'}</span>
                                        </div>
                                        <div className="absolute bottom-3 right-3 flex items-center gap-2">
                                            <span className="inline-flex items-center gap-1.5 bg-black/45 text-white px-2.5 py-1 rounded-full text-xs font-semibold">
                                                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
                                                {likeCount}
                                            </span>
                                            <span className="inline-flex items-center gap-1.5 bg-black/45 text-white px-2.5 py-1 rounded-full text-xs font-semibold">
                                                <span className="material-symbols-outlined text-sm">chat_bubble</span>
                                                {commentCount}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="p-5">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="min-w-0 flex-1">
                                                <h3 className="text-xl font-bold text-text-main dark:text-white mb-1 truncate">{post.location || '어딘가의 지금'}</h3>
                                                <p className="text-sm text-text-sub dark:text-slate-400 line-clamp-2">{post.content || post.note || `${post.location || '장소'}의 모습`}</p>
                                            </div>
                                            <button type="button" className="text-slate-400 hover:text-primary transition-colors p-1" onClick={(e) => { e.stopPropagation(); }}>
                                                <span className="material-symbols-outlined">bookmark</span>
                                            </button>
                                        </div>
                                        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                                            <span className="text-xs text-text-sub dark:text-slate-500">{post.time}</span>
                                            <div className="flex items-center gap-1 text-slate-400">
                                                <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
                                                <span className="text-xs">{likeCount}</span>
                                            </div>
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
