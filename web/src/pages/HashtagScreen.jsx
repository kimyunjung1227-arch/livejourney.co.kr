import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import BottomNavigation from '../components/BottomNavigation';
import { getTimeAgo } from '../utils/timeUtils';
import { getCombinedPosts } from '../utils/mockData';
import { getDisplayImageUrl } from '../api/upload';

const DEFAULT_HASHTAGS = ['바다', '힐링', '맛집', '자연', '꽃', '일출', '카페', '여행', '휴양', '등산', '야경', '축제', '해변', '산', '전통', '한옥', '감귤', '벚꽃', '단풍', '도시'];

const HashtagScreen = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [allPosts, setAllPosts] = useState([]);
  const [tagSearchQuery, setTagSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState(null);
  const [tagsExpanded, setTagsExpanded] = useState(false);
  const [showExpandButton, setShowExpandButton] = useState(true);

  const scrollBodyRef = useRef(null);

  // 사용자 업로드 + 목업 게시물에서 태그 수집, 빈도순
  const allHashtags = useMemo(() => {
    const norm = (s) => String(s || '').replace(/^#+/, '').trim().toLowerCase();
    const getDisplay = (t) => (typeof t === 'string' ? t : (t?.name || t?.label || '')).replace(/^#+/, '').trim();
    const map = new Map();
    allPosts.forEach((p) => {
      const tags = [
        ...(p.tags || []).map((t) => (typeof t === 'string' ? t : (t?.name || t?.label || ''))),
        ...(p.aiLabels || []).map((l) => (typeof l === 'string' ? l : (l?.name || l?.label || '')))
      ].filter(Boolean);
      tags.forEach((raw) => {
        const n = norm(raw);
        if (!n || n.length < 2) return;
        if (!map.has(n)) map.set(n, { display: getDisplay(raw) || n, count: 0 });
        map.get(n).count += 1;
      });
    });
    const fromPosts = Array.from(map.entries())
      .map(([n, { display, count }]) => ({ key: n, display, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 120);
    if (fromPosts.length === 0) {
      return DEFAULT_HASHTAGS.map((t) => ({ key: t.toLowerCase(), display: t, count: 0 }));
    }
    return fromPosts;
  }, [allPosts]);

  // 검색어로 태그 필터
  const filteredBySearch = useMemo(() => {
    const q = (tagSearchQuery || '').trim().toLowerCase();
    if (!q) return allHashtags;
    return allHashtags.filter((h) => h.key.includes(q) || (h.display || '').toLowerCase().includes(q));
  }, [allHashtags, tagSearchQuery]);

  // 펼치기 전에는 상위 6개만, 펼치면 모두
  const visibleTags = useMemo(() => {
    if (tagsExpanded) return filteredBySearch;
    return filteredBySearch.slice(0, 6);
  }, [filteredBySearch, tagsExpanded]);

  // 선택된 태그의 게시물
  const tagPosts = useMemo(() => {
    if (!selectedTag) return [];
    const norm = (s) => String(s || '').replace(/^#+/, '').trim().toLowerCase();
    const getPostTags = (p) => [
      ...(p.tags || []).map((t) => (typeof t === 'string' ? t : (t?.name || t?.label || ''))),
      ...(p.aiLabels || []).map((l) => (typeof l === 'string' ? l : (l?.name || l?.label || '')))
    ];
    const target = norm(selectedTag);
    return allPosts.filter((p) => {
      const pt = getPostTags(p).map(norm).filter(Boolean);
      return pt.some((pTag) => pTag === target || (pTag.includes(target) && target.length >= 2));
    });
  }, [allPosts, selectedTag]);

  useEffect(() => {
    const local = JSON.parse(localStorage.getItem('uploadedPosts') || '[]');
    setAllPosts(getCombinedPosts(local));
  }, []);

  // URL ?tag=바다 → 초기 선택
  useEffect(() => {
    const t = searchParams.get('tag');
    if (t && allHashtags.some((h) => h.key === t.toLowerCase() || h.display === t)) {
      setSelectedTag(t.replace(/^#+/, '').trim());
    }
  }, [searchParams, allHashtags]);

  // 스크롤 시작하면 펼치기/접기 숨김, 최상단(scrollTop 0)일 때만 다시 표시
  const handleScroll = useCallback(() => {
    const el = scrollBodyRef.current;
    if (!el) return;
    setShowExpandButton(el.scrollTop <= 0);
  }, []);

  return (
    <div className="screen-layout text-text-light dark:text-text-dark bg-background-light dark:bg-background-dark h-[100dvh] max-h-[100dvh] overflow-hidden flex flex-col">
      <div className="screen-content flex flex-col flex-1 min-h-0 overflow-hidden">
        {/* 헤더 (고정) */}
        <div className="flex-shrink-0 flex items-center px-4 pt-4 pb-2 bg-white dark:bg-gray-900">
          <button
            onClick={() => navigate(-1)}
            className="flex size-10 shrink-0 items-center justify-center text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined text-xl">arrow_back</span>
          </button>
          <h1 className="flex-1 text-center text-lg font-bold text-black dark:text-white mr-10">태그 전체보기</h1>
        </div>

        {/* 태그 검색창 */}
        <div className="flex-shrink-0 px-4 pt-2 pb-3 bg-white dark:bg-gray-900">
          <div className="flex items-center gap-2 rounded-xl bg-gray-100 dark:bg-gray-800 px-3 py-2 border border-gray-200 dark:border-gray-700">
            <span className="material-symbols-outlined text-gray-500 dark:text-gray-400 text-xl">search</span>
            <input
              type="text"
              value={tagSearchQuery}
              onChange={(e) => setTagSearchQuery(e.target.value)}
              placeholder="태그 검색 (예: 맛집, 꽃, 웨이팅)"
              className="flex-1 bg-transparent text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400 outline-none text-sm"
            />
            {tagSearchQuery && (
              <button type="button" onClick={() => setTagSearchQuery('')} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-1">
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            )}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">태그를 누르면 해당 사진을 볼 수 있어요</p>
        </div>

          {/* 스크롤 영역: 태그 목록 + 선택된 태그 사진 그리드 */}
        <div
          ref={scrollBodyRef}
          onScroll={handleScroll}
          className="screen-body flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain"
          style={{ minHeight: 0, WebkitOverflowScrolling: 'touch' }}
        >
          {/* 태그 목록 (사용자 태그 기반, 상위 6개 + 펼치기) */}
          <div className="px-4 pt-3 pb-2">
            <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">태그</h2>
            <div className="flex flex-wrap gap-2">
              {visibleTags.map(({ key, display, count }) => {
                const isSelected =
                  selectedTag && (selectedTag || '').replace(/^#+/, '').trim().toLowerCase() === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedTag(isSelected ? null : display)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      isSelected
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-primary/20'
                    }`}
                  >
                    #{display}
                    {count > 0 && <span className="opacity-80 ml-0.5">({count})</span>}
                  </button>
                );
              })}
            </div>

            {/* 펼치기 / 접기 버튼 */}
            {filteredBySearch.length > 6 && showExpandButton && (
              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => setTagsExpanded((prev) => !prev)}
                  className="px-4 py-2 rounded-full border border-gray-300 dark:border-gray-600 text-xs font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-900 mx-auto block"
                >
                  {tagsExpanded ? '접기' : '펼치기'}
                </button>
              </div>
            )}
          </div>

          {selectedTag && (
            <div className="px-4 pt-2 pb-6">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-black dark:text-white text-base font-bold">#{selectedTag} ({tagPosts.length}장)</h2>
                <button type="button" onClick={() => setSelectedTag(null)} className="text-xs text-gray-500 dark:text-gray-400 hover:text-primary">
                  해제
                </button>
              </div>
              {tagPosts.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {tagPosts.map((post) => {
                    const img = getDisplayImageUrl(post.images?.[0] || post.image || post.thumbnail);
                    const id = post.id || post._id;
                    const upTime = getTimeAgo(post.timestamp || post.createdAt);
                    return (
                      <button
                        key={id || (post.timestamp || 0)}
                        type="button"
                        onClick={() => navigate(`/post/${id}`, { state: { post, allPosts: tagPosts } })}
                        className="relative aspect-square rounded overflow-hidden bg-gray-200 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/50"
                      >
                        {img ? (
                          <img src={img} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="material-symbols-outlined text-gray-400 w-full h-full flex items-center justify-center">image</span>
                        )}
                        <span className="absolute bottom-1 left-1 right-1 text-[9px] text-white bg-black/50 px-1 py-0.5 rounded truncate text-center">
                          🕐 {upTime}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 py-8 text-center">이 해시태그가 달린 사진이 없습니다</p>
              )}
            </div>
          )}
        </div>
      </div>
      <BottomNavigation />
    </div>
  );
};

export default HashtagScreen;
