
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNavigation from '../components/BottomNavigation';
import { filterActivePosts48 } from '../utils/timeUtils';
import './MainScreen.css';

import { getCombinedPosts } from '../utils/mockData';
import { getDisplayImageUrl } from '../api/upload';
import { computeHotPlaces, loadSearchEvents } from '../utils/hotPlaceIndex';
import PostThumbnail from '../components/PostThumbnail';

const CrowdedPlaceScreen = () => {
    const navigate = useNavigate();
    const [crowdedData, setCrowdedData] = useState([]);
    const [activeFilter, setActiveFilter] = useState('전체');
    const contentRef = useRef(null);

    useEffect(() => {
        const loadData = () => {
            const localPosts = JSON.parse(localStorage.getItem('uploadedPosts') || '[]');
            const allPosts = getCombinedPosts(Array.isArray(localPosts) ? localPosts : []);
            const recentPosts = filterActivePosts48(allPosts); // 48시간 이내만 핫플 후보
            const searchEvents = loadSearchEvents(60 * 24); // 최근 24시간 검색 로그

            const hotPlaces = computeHotPlaces(recentPosts, searchEvents);

            const formatted = hotPlaces.map((place) => {
                const sample = place.samplePost || {};
                const description =
                    sample.content ||
                    sample.note ||
                    (place.verified ? '실시간 인증된 장소예요' : '지금 사람들이 모이는 중이에요');

                return {
                    id: place.key,
                    image: place.image || '',
                    location: place.key,
                    description,
                    likes: Math.round(place.score * 100),
                    score: place.score,
                    rising: place.rising,
                    verified: place.verified,
                    center: place.center,
                    kind: place.kind || '기타',
                    viewerCount: place.viewerCount || place.counts?.users || 0,
                    samplePostId: sample.id,
                    samplePost: sample
                };
            });

            setCrowdedData(formatted);
        };
        loadData();
    }, []);

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
                {/* 상단 타이틀 섹션 */}
                <section className="px-5 pt-5 pb-3">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="inline-flex h-2 w-2 items-center justify-center rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
                        <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-500">
                            Live Now
                        </span>
                    </div>
                    <h2 className="text-xl font-bold leading-tight text-text-main dark:text-white">
                        실시간 급상승 핫플
                    </h2>
                    <p className="mt-1 text-xs text-text-sub dark:text-slate-400">
                        지금 가장 핫한 여행지를 확인해보세요
                    </p>
                </section>

                {/* 카테고리 태그 바 (디자인용) */}
                <div className="flex gap-2 overflow-x-auto px-5 py-3 scrollbar-hide">
                    {['전체', '카페', '맛집', '포토존', '액티비티'].map((label) => {
                        const isActive = activeFilter === label;
                        return (
                            <button
                                key={label}
                                type="button"
                                onClick={() => setActiveFilter(label)}
                                className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                                    isActive
                                        ? 'bg-primary text-white shadow-md shadow-primary/20'
                                        : 'bg-slate-100 dark:bg-slate-800 text-text-sub dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                                }`}
                            >
                                {label}
                            </button>
                        );
                    })}
                </div>

                {/* 핫플 카드 리스트 */}
                {crowdedData.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 px-6 text-center text-slate-400 dark:text-slate-500">
                        <span className="material-symbols-outlined text-5xl mb-3">groups</span>
                        <p className="text-sm mb-1">아직 붐비는 곳 정보가 없어요</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                            사람들이 많이 모이는 여행지가 생기면 이곳에 먼저 알려드릴게요.
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4 px-5 pb-24">
                        {crowdedData
                            .filter((post) => activeFilter === '전체' || post.kind === activeFilter)
                            .map((post) => {
                            const samplePost = post.samplePost || { image: post.image, images: post.image ? [post.image] : [], videos: [] };
                            const statusText = post.description;
                            return (
                                <button
                                    key={post.id}
                                    type="button"
                                    onClick={() => {
                                        if (post.samplePostId) {
                                            navigate(`/post/${post.samplePostId}`, {
                                                state: { post: post.samplePost }
                                            });
                                        }
                                    }}
                                    className="group flex flex-col bg-white dark:bg-slate-800 rounded-2xl shadow-soft border border-slate-100 dark:border-slate-700 overflow-hidden text-left"
                                >
                                    <div className="relative w-full aspect-[16/9] bg-slate-200 overflow-hidden">
                                        <PostThumbnail
                                            post={samplePost}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        />
                                        {post.rising && (
                                            <div className="absolute top-4 right-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur px-3 py-1.5 rounded-full text-xs font-bold text-primary shadow-sm">
                                                HOT
                                            </div>
                                        )}
                                        <div className="absolute bottom-4 left-4">
                                            <div className="bg-black/45 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                                                <span className="material-symbols-outlined text-sm">location_on</span>
                                                <span className="truncate max-w-[200px]">{post.location}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-5">
                                        <div className="flex items-start justify-between gap-2 mb-2">
                                            <div className="min-w-0">
                                                <h3 className="text-base sm:text-lg font-bold text-text-main dark:text-white truncate mb-0.5">
                                                    {post.location}
                                                </h3>
                                                <p className="text-xs text-text-sub dark:text-slate-400 line-clamp-2">
                                                    {statusText}
                                                </p>
                                            </div>
                                                <span className="text-slate-400 hover:text-primary transition-colors flex-shrink-0">
                                                    <span className="material-symbols-outlined text-[20px]">bookmark</span>
                                                </span>
                                        </div>

                                        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                                            <div className="flex items-center gap-1.5 min-w-0">
                                                <div className="flex -space-x-2 overflow-hidden">
                                                    <div className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700 text-[10px]">
                                                        👤
                                                    </div>
                                                    <div className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700 text-[10px]">
                                                        👤
                                                    </div>
                                                    <div className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700 text-[10px]">
                                                        👤
                                                    </div>
                                                </div>
                                                <span className="text-[11px] text-text-sub dark:text-slate-500 truncate">
                                                    지금 {post.viewerCount}명이 이 장소를 보고 있어요
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1 text-slate-400 flex-shrink-0">
                                                <span className="material-symbols-outlined text-base">favorite</span>
                                                <span className="text-[11px]">{post.likes}</span>
                                            </div>
                                        </div>
                                    </div>
                                </button>
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
