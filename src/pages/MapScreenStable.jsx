import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUploadedPostsSafe } from '../utils/localStorageManager';
import { logger } from '../utils/logger';

/**
 * MapScreenStable (첨부 이미지 구조)
 * - 상단: 뒤로가기 + 검색창 + 새로고침
 * - 중단: 전체 지도
 * - 상단 칩: 지금 상황 알아보기 / 개화정보 / 맛집정보 / 가볼만한 곳
 * - 하단: 슬라이드 시트(숨김/복구 버튼 포함) + 시트 우측상단 지도 컨트롤 버튼
 *
 * NOTE:
 * - TDZ(순환 의존성) 리스크를 줄이기 위해 무거운 모듈(api/util)들은 동적 import를 사용합니다.
 * - "정확한 위치 입력"은 (post.coordinates 우선) → (지역 좌표 사전 매칭) → (카카오 키워드 지오코딩) 순으로 좌표를 확보합니다.
 */

const DEFAULT_CENTER = { lat: 37.5665, lng: 126.9780 }; // 서울
const SHEET_PEEK_PX = 88;

const toText = (v) => (v == null ? '' : String(v));

const normalizePostId = (post, idx) => {
  const raw = post?.id ?? post?._id ?? post?.postId ?? null;
  if (raw != null && raw !== '') return String(raw);
  return `local-${idx}`;
};

const getPostLocationText = (post) =>
  toText(post?.detailedLocation || post?.placeName || post?.location || post?.region || '').trim();

const getPostTitle = (post) =>
  toText(post?.placeName || post?.detailedLocation || post?.location || post?.region || '기록');

const getPostBody = (post) => toText(post?.note || post?.content || '').trim();

const extractCoords = (post) => {
  const c = post?.coordinates;
  if (!c) return null;
  const lat = Number(c.lat ?? c.latitude);
  const lng = Number(c.lng ?? c.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
};

const pickThumbRaw = (post) => {
  const images = Array.isArray(post?.images) ? post.images : [];
  const videos = Array.isArray(post?.videos) ? post.videos : [];
  const firstImg = images.find((x) => typeof x === 'string' && x.trim());
  if (firstImg) return firstImg;
  const thumb = post?.thumbnail;
  if (typeof thumb === 'string' && thumb.trim()) return thumb;
  const img = post?.image;
  if (typeof img === 'string' && img.trim()) return img;
  const firstVid = videos.find((x) => typeof x === 'string' && x.trim());
  if (firstVid) return firstVid;
  return '';
};

const safeDisplayUrl = async (raw) => {
  if (!raw) return '';
  try {
    const mod = await import('../api/upload');
    return mod.getDisplayImageUrl(raw);
  } catch {
    return typeof raw === 'string' ? raw : '';
  }
};

const ensureGeoCache = () => {
  if (!globalThis.__lj_map_geo_cache_v2) {
    globalThis.__lj_map_geo_cache_v2 = {
      resolved: new Map(), // locationText -> { lat, lng }
      inflight: new Map(), // locationText -> Promise<{lat,lng}|null>
    };
  }
  return globalThis.__lj_map_geo_cache_v2;
};

const resolveCoordsForPost = async (post) => {
  const existing = extractCoords(post);
  if (existing) return existing;

  const text = getPostLocationText(post);
  if (!text) return null;

  const cache = ensureGeoCache();
  const cached = cache.resolved.get(text);
  if (cached) return cached;

  const inflight = cache.inflight.get(text);
  if (inflight) return await inflight;

  const p = (async () => {
    try {
      // 1) 사전 좌표 매칭(빠름)
      try {
        const mod = await import('../utils/locationCoordinates');
        const coords = mod.getCoordinatesByLocation?.(text) || null;
        if (coords?.lat != null && coords?.lng != null) {
          const out = { lat: Number(coords.lat), lng: Number(coords.lng) };
          if (Number.isFinite(out.lat) && Number.isFinite(out.lng)) return out;
        }
      } catch {
        // ignore
      }

      // 2) 카카오 키워드 지오코딩(정확 입력 대응)
      try {
        const mod = await import('../utils/kakaoPlacesGeocode');
        const geo = await mod.searchPlaceWithKakaoFirst?.(text);
        if (geo?.lat != null && geo?.lng != null) {
          const out = { lat: Number(geo.lat), lng: Number(geo.lng) };
          if (Number.isFinite(out.lat) && Number.isFinite(out.lng)) return out;
        }
      } catch {
        // ignore
      }

      return null;
    } finally {
      cache.inflight.delete(text);
    }
  })();

  cache.inflight.set(text, p);
  const resolved = await p;
  if (resolved) cache.resolved.set(text, resolved);
  return resolved;
};

const buildPinHtml = ({ active, label }) => {
  const border = active ? '2px solid #0ea5e9' : '1px solid rgba(0,0,0,0.18)';
  const bg = active ? 'rgba(14,165,233,0.12)' : 'rgba(255,255,255,0.92)';
  const dot = active ? '#0ea5e9' : '#111827';
  const text = label ? String(label).slice(0, 6) : '';
  return `
    <div style="
      display:flex;align-items:center;gap:6px;
      padding:6px 8px;
      border:${border};
      background:${bg};
      border-radius:8px;
      box-shadow:0 2px 8px rgba(0,0,0,0.10);
      transform: translate(-50%, -100%);
      cursor:pointer;
      user-select:none;
      white-space:nowrap;
      ">
      <span style="display:inline-block;width:8px;height:8px;border-radius:3px;background:${dot};"></span>
      <span style="font-size:12px;color:#111827;max-width:140px;overflow:hidden;text-overflow:ellipsis;">
        ${text ? text.replace(/</g, '&lt;').replace(/>/g, '&gt;') : '제보'}
      </span>
    </div>
  `;
};

export default function MapScreenStable() {
  const navigate = useNavigate();

  const mapElRef = useRef(null);
  const mapRef = useRef(null);
  const overlaysRef = useRef(new Map()); // id -> CustomOverlay

  const sheetRef = useRef(null);
  const sheetHeightRef = useRef(0);
  const draggingRef = useRef(false);
  const dragStartYRef = useRef(0);
  const dragStartOffsetRef = useRef(0);

  const [ready, setReady] = useState(false);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [allPosts, setAllPosts] = useState([]);
  const [selectedId, setSelectedId] = useState(null);

  const [search, setSearch] = useState('');
  const [activeChip, setActiveChip] = useState('all'); // all | sos | bloom | food | scenic
  const [sheetHidden, setSheetHidden] = useState(false);
  const [sheetOffset, setSheetOffset] = useState(0); // translateY(px)
  const [thumbUrl, setThumbUrl] = useState('');
  const [showMapControls, setShowMapControls] = useState(false);

  const selectedPost = useMemo(
    () => allPosts.find((p) => p.__id === selectedId) || null,
    [allPosts, selectedId]
  );

  const filteredPosts = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = allPosts;
    if (q) {
      list = list.filter((p) => {
        const hay = [
          p.placeName,
          p.detailedLocation,
          p.location,
          p.region,
          p.note,
          p.content,
          p.category,
          p.categoryName,
          ...(Array.isArray(p.tags) ? p.tags : []),
        ]
          .map(toText)
          .join(' ')
          .toLowerCase();
        return hay.includes(q);
      });
    }
    if (activeChip === 'bloom') {
      return list.filter((p) => (p.category || '').includes('bloom') || (p.categoryName || '').includes('개화'));
    }
    if (activeChip === 'food') {
      return list.filter((p) => (p.category || '').includes('food') || (p.categoryName || '').includes('맛집'));
    }
    if (activeChip === 'scenic') {
      return list.filter((p) => (p.category || '').includes('scenic') || (p.categoryName || '').includes('관광'));
    }
    // sos는 액션용(필터 X)
    return list;
  }, [allPosts, search, activeChip]);

  // 카카오 지도 초기화
  useEffect(() => {
    const el = mapElRef.current;
    if (!el) return;

    const boot = () => {
      const maps = window.kakao?.maps;
      if (!maps) return false;

      // autoload=false로 로딩되는 경우가 있어, maps.load로 초기화 완료 후 생성자를 사용해야 함
      const finalizeInit = () => {
        try {
          if (typeof window.kakao?.maps?.LatLng !== 'function') return false;
          const center = new window.kakao.maps.LatLng(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng);
          const map = new window.kakao.maps.Map(el, { center, level: 7 });
          mapRef.current = map;
          setReady(true);
          return true;
        } catch (e) {
          logger.error('Map init failed:', e);
          return false;
        }
      };

      if (typeof maps.load === 'function') {
        // load는 비동기이므로 true/false로 완료를 판단하지 않고, 콜백에서 setReady 처리
        try {
          maps.load(() => {
            finalizeInit();
          });
          return true;
        } catch (e) {
          logger.error('Map init failed:', e);
          return false;
        }
      }

      return finalizeInit();
    };

    if (boot()) return;

    let tries = 0;
    const id = setInterval(() => {
      tries += 1;
      if (boot() || tries > 60) clearInterval(id);
    }, 200);
    return () => clearInterval(id);
  }, []);

  // 시트 높이 측정 + 초기 오프셋(열림)
  useEffect(() => {
    const el = sheetRef.current;
    if (!el) return;
    const update = () => {
      const h = el.getBoundingClientRect().height;
      sheetHeightRef.current = h;
      if (sheetHidden) setSheetOffset(Math.max(0, h - SHEET_PEEK_PX));
      else setSheetOffset(0);
    };
    update();
    // 일부 WebView(특히 구형)에서는 ResizeObserver가 없어서 바로 크래시 → 흰 화면이 될 수 있음
    if (typeof ResizeObserver === 'function') {
      const ro = new ResizeObserver(update);
      ro.observe(el);
      return () => ro.disconnect();
    }
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [sheetHidden]);

  const setSheetOpen = useCallback((open) => {
    const h = sheetHeightRef.current || 0;
    if (!h) return;
    setSheetHidden(!open);
    setSheetOffset(open ? 0 : Math.max(0, h - SHEET_PEEK_PX));
  }, []);

  const onSheetPointerDown = useCallback((e) => {
    draggingRef.current = true;
    dragStartYRef.current = e.clientY;
    dragStartOffsetRef.current = sheetOffset;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
  }, [sheetOffset]);

  const onSheetPointerMove = useCallback((e) => {
    if (!draggingRef.current) return;
    const dy = e.clientY - dragStartYRef.current;
    const h = sheetHeightRef.current || 0;
    const next = Math.min(Math.max(0, dragStartOffsetRef.current + dy), Math.max(0, h - SHEET_PEEK_PX));
    setSheetOffset(next);
  }, []);

  const onSheetPointerUp = useCallback(() => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    const h = sheetHeightRef.current || 0;
    const closed = Math.max(0, h - SHEET_PEEK_PX);
    const isClose = sheetOffset > closed * 0.55;
    setSheetHidden(isClose);
    setSheetOffset(isClose ? closed : 0);
  }, [sheetOffset]);

  // 게시물 로드 + 좌표 확보
  const loadPosts = useCallback(async () => {
    setLoadingPosts(true);
    try {
      const localPosts = getUploadedPostsSafe();
      let serverPosts = [];
      try {
        const mod = await import('../api/postsSupabase');
        serverPosts = (await mod.fetchPostsSupabase()) || [];
      } catch (e) {
        logger.warn('Supabase posts load failed(ignored):', e?.message || e);
      }

      const merged = [
        ...(Array.isArray(serverPosts) ? serverPosts : []),
        ...(Array.isArray(localPosts) ? localPosts : []),
      ];

      // 중복 제거(가능한 경우 id 기준)
      const seen = new Set();
      const dedup = [];
      merged.forEach((p, idx) => {
        const pid = normalizePostId(p, idx);
        if (seen.has(pid)) return;
        seen.add(pid);
        dedup.push({ ...p, __id: pid });
      });

      // 좌표 확정(동시성 제한)
      const out = [];
      const concurrency = 6;
      let cursor = 0;
      const workers = Array.from({ length: concurrency }, async () => {
        while (cursor < dedup.length) {
          const i = cursor++;
          const p = dedup[i];
          const coords = extractCoords(p) || (await resolveCoordsForPost(p));
          if (coords) out.push({ ...p, __coords: coords });
        }
      });
      await Promise.all(workers);

      // 안정적 정렬(최근순에 가깝게)
      out.sort((a, b) => {
        const ta = new Date(a.timestamp || a.createdAt || a.photoDate || 0).getTime();
        const tb = new Date(b.timestamp || b.createdAt || b.photoDate || 0).getTime();
        return (Number.isFinite(tb) ? tb : 0) - (Number.isFinite(ta) ? ta : 0);
      });

      setAllPosts(out);
      if (out[0]?.__id) setSelectedId((prev) => prev || out[0].__id);
    } finally {
      setLoadingPosts(false);
    }
  }, []);

  useEffect(() => {
    void loadPosts();
  }, [loadPosts]);

  // 핀(CustomOverlay) 렌더링
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;

    const overlays = overlaysRef.current;
    const nextIds = new Set(filteredPosts.map((p) => p.__id));

    // 제거
    for (const [id, ov] of overlays.entries()) {
      if (!nextIds.has(id)) {
        try {
          ov.setMap(null);
        } catch {}
        overlays.delete(id);
      }
    }

    // 추가 + active 스타일 업데이트
    filteredPosts.forEach((post) => {
      const c = post.__coords;
      if (!c) return;
      const pos = new window.kakao.maps.LatLng(c.lat, c.lng);

      const active = post.__id === selectedId;
      const label = getPostTitle(post);

      if (!overlays.has(post.__id)) {
        const content = document.createElement('div');
        content.innerHTML = buildPinHtml({ active, label });
        const root = content.firstElementChild;
        if (root) {
          root.addEventListener('click', () => {
            setSelectedId(post.__id);
            setSheetOpen(true);
          });
        }
        const overlay = new window.kakao.maps.CustomOverlay({
          position: pos,
          content,
          yAnchor: 1,
          zIndex: active ? 5 : 1,
        });
        overlay.setMap(map);
        overlays.set(post.__id, overlay);
      } else {
        const overlay = overlays.get(post.__id);
        try {
          const el = overlay.getContent?.() || overlay.a; // kakao 내부 구현 차이 대응(최대한)
          if (el && el.firstElementChild) {
            el.firstElementChild.innerHTML = buildPinHtml({ active, label });
          }
          overlay.setZIndex(active ? 5 : 1);
        } catch {
          // ignore
        }
      }
    });
  }, [filteredPosts, ready, selectedId, setSheetOpen]);

  // 선택 썸네일
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!selectedPost) {
        setThumbUrl('');
        return;
      }
      const raw = pickThumbRaw(selectedPost);
      const url = await safeDisplayUrl(raw);
      if (!cancelled) setThumbUrl(url);
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [selectedPost]);

  const goBack = useCallback(() => navigate(-1), [navigate]);

  const panToPost = useCallback((post) => {
    const map = mapRef.current;
    if (!map || !post?.__coords) return;
    const pos = new window.kakao.maps.LatLng(post.__coords.lat, post.__coords.lng);
    map.panTo(pos);
    map.setLevel(4);
  }, []);

  const onClickPostInSheet = useCallback((post) => {
    setSelectedId(post.__id);
    setSheetOpen(true);
    panToPost(post);
  }, [panToPost, setSheetOpen]);

  const openPostDetail = useCallback(() => {
    if (!selectedPost) return;
    const id = selectedPost.id || selectedPost.postId || selectedPost._id;
    if (id) navigate(`/post/${id}`);
  }, [navigate, selectedPost]);

  const onSearchSubmit = useCallback(async (e) => {
    e?.preventDefault?.();
    const q = search.trim();
    if (!q) return;
    const map = mapRef.current;
    if (!map) return;

    // 1) 먼저 현재 데이터에서 매칭되는 게시물 있으면 그걸로 이동
    const hit = filteredPosts.find((p) => getPostLocationText(p).includes(q) || getPostTitle(p).includes(q));
    if (hit?.__coords) {
      onClickPostInSheet(hit);
      return;
    }

    // 2) 지오코딩으로 이동
    try {
      const mod = await import('../utils/kakaoPlacesGeocode');
      const geo = await mod.searchPlaceWithKakaoFirst?.(q);
      if (geo?.lat != null && geo?.lng != null) {
        const pos = new window.kakao.maps.LatLng(Number(geo.lat), Number(geo.lng));
        map.panTo(pos);
        map.setLevel(4);
      }
    } catch (err) {
      logger.warn('검색 지오코딩 실패:', err?.message || err);
    }
  }, [search, filteredPosts, onClickPostInSheet]);

  const chip = useCallback(
    (id, label, icon) => {
      const active = activeChip === id;
      return (
        <button
          key={id}
          onClick={() => {
            if (id === 'sos') {
              // 지금 상황 알아보기: 우선 구조만 맞추고, 상세 플로우는 기존 MapScreen에서 재이식 가능
              alert('지금 상황 알아보기 기능은 다음 단계에서 연결할게요.');
              return;
            }
            setActiveChip(id);
          }}
          className={`px-3 py-2 rounded-full text-xs font-semibold border ${
            active
              ? 'border-primary text-primary bg-primary/10'
              : 'border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-black/20 text-text-secondary-light dark:text-text-secondary-dark'
          }`}
        >
          <span className="inline-flex items-center gap-1">
            {icon ? <span>{icon}</span> : null}
            <span>{label}</span>
          </span>
        </button>
      );
    },
    [activeChip]
  );

  return (
    <div
      className="screen-layout bg-background-light dark:bg-background-dark relative overflow-hidden"
      style={{
        minHeight: '100vh',
        background: 'var(--lj-map-bg, #f8fafc)',
      }}
    >
      {/* 상단바 */}
      <div className="absolute top-0 left-0 right-0 z-20 px-4 pt-4">
        <div className="flex items-center gap-3">
          <button
            onClick={goBack}
            className="w-10 h-10 rounded-full bg-white/95 dark:bg-black/30 shadow flex items-center justify-center"
            aria-label="뒤로가기"
          >
            <span className="material-symbols-outlined text-[22px]">arrow_back</span>
          </button>

          <form onSubmit={onSearchSubmit} className="flex-1">
            <div className="h-10 rounded-full bg-white/95 dark:bg-black/30 shadow flex items-center px-3 gap-2">
              <span className="material-symbols-outlined text-[22px] text-gray-500">search</span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="지역 검색"
                className="flex-1 bg-transparent outline-none text-sm"
              />
            </div>
          </form>

          <button
            onClick={() => void loadPosts()}
            className="w-10 h-10 rounded-full bg-white/95 dark:bg-black/30 shadow flex items-center justify-center"
            aria-label="새로고침"
            title="새로고침"
          >
            <span className="material-symbols-outlined text-[22px]">refresh</span>
          </button>
        </div>

        {/* 필터 칩 */}
        <div className="mt-3 flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {chip('sos', '지금 상황 알아보기')}
          {chip('bloom', '개화정보', '🌸')}
          {chip('food', '맛집정보', '🍜')}
          {chip('scenic', '가볼만한 곳', '🏝️')}
        </div>

        {!ready && (
          <div className="mt-2 text-xs text-red-600 dark:text-red-400">
            카카오 지도를 불러오지 못했어요. (스크립트 로딩 중이거나 API 키 설정 확인 필요)
          </div>
        )}
      </div>

      {/* 지도 */}
      <div
        ref={mapElRef}
        className="absolute inset-0 bg-gray-100 dark:bg-gray-900"
        style={{ width: '100%', height: '100%' }}
      />

      {/* 하단시트 */}
      <div
        ref={sheetRef}
        className="absolute left-0 right-0 bottom-0 z-30"
        style={{
          transform: `translateY(${sheetOffset}px)`,
          transition: draggingRef.current ? 'none' : 'transform 220ms ease',
        }}
      >
        <div className="bg-white dark:bg-background-dark rounded-t-3xl shadow-2xl border-t border-gray-200 dark:border-gray-700">
          {/* 드래그 핸들 + 헤더 */}
          <div
            onPointerDown={onSheetPointerDown}
            onPointerMove={onSheetPointerMove}
            onPointerUp={onSheetPointerUp}
            onPointerCancel={onSheetPointerUp}
            className="pt-3 pb-2 px-4 touch-none"
          >
            <div className="mx-auto w-10 h-1.5 rounded-full bg-gray-300 dark:bg-gray-700" />
            <div className="mt-3 flex items-center justify-between">
              <div className="text-sm font-semibold">주변 장소</div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowMapControls((v) => !v)}
                  className="w-10 h-10 rounded-full border border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-black/20 flex items-center justify-center"
                  aria-label="지도 컨트롤"
                  title="지도 컨트롤"
                >
                  <span className="material-symbols-outlined text-[22px]">my_location</span>
                </button>
                <button
                  onClick={() => setSheetOpen(false)}
                  className="w-10 h-10 rounded-full border border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-black/20 flex items-center justify-center"
                  aria-label="시트 숨기기"
                  title="시트 숨기기"
                >
                  <span className="material-symbols-outlined text-[22px]">keyboard_arrow_down</span>
                </button>
              </div>
            </div>
          </div>

          {showMapControls && (
            <div className="px-4 pb-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const map = mapRef.current;
                    if (!map) return;
                    map.setLevel(Math.max(1, (map.getLevel?.() ?? 7) - 1));
                  }}
                  className="w-10 h-10 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center justify-center"
                >
                  <span className="material-symbols-outlined text-[22px]">add</span>
                </button>
                <button
                  onClick={() => {
                    const map = mapRef.current;
                    if (!map) return;
                    map.setLevel(Math.min(14, (map.getLevel?.() ?? 7) + 1));
                  }}
                  className="w-10 h-10 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center justify-center"
                >
                  <span className="material-symbols-outlined text-[22px]">remove</span>
                </button>
                <button
                  onClick={() => {
                    const map = mapRef.current;
                    if (!map) return;
                    const center = new window.kakao.maps.LatLng(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng);
                    map.panTo(center);
                    map.setLevel(7);
                  }}
                  className="flex-1 h-10 rounded-xl border border-gray-200 dark:border-gray-700 text-sm"
                >
                  기본 위치로
                </button>
              </div>
            </div>
          )}

          {/* 선택된 핀 요약 */}
          {selectedPost && (
            <div className="px-4 pb-3">
              <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-black/10 p-3">
                <div className="flex gap-3">
                  <div className="w-14 h-14 rounded-xl bg-gray-200 dark:bg-gray-800 overflow-hidden shrink-0">
                    {thumbUrl ? <img src={thumbUrl} alt="" className="w-full h-full object-cover" /> : null}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">{getPostTitle(selectedPost)}</div>
                    <div className="mt-1 text-xs text-text-secondary-light dark:text-text-secondary-dark line-clamp-2">
                      {getPostBody(selectedPost) || '내용 없음'}
                    </div>
                    <div className="mt-2 flex gap-2">
                      <button onClick={openPostDetail} className="rounded-xl bg-primary text-white px-3 py-2 text-xs">
                        상세보기
                      </button>
                      <button
                        onClick={() => panToPost(selectedPost)}
                        className="rounded-xl border border-gray-200 dark:border-gray-700 px-3 py-2 text-xs"
                      >
                        지도에서 보기
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 리스트 */}
          <div className="px-4 pb-6">
            {loadingPosts ? (
              <div className="text-xs text-text-secondary-light dark:text-text-secondary-dark py-6">
                불러오는 중...
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="text-xs text-text-secondary-light dark:text-text-secondary-dark py-6">
                표시할 장소가 없습니다
              </div>
            ) : (
              <div className="max-h-[36vh] overflow-auto pr-1">
                <div className="grid grid-cols-1 gap-2">
                  {filteredPosts.slice(0, 60).map((p) => (
                    <button
                      key={p.__id}
                      onClick={() => onClickPostInSheet(p)}
                      className={`text-left rounded-2xl px-3 py-2 border ${
                        p.__id === selectedId
                          ? 'border-primary bg-primary/10'
                          : 'border-gray-200 dark:border-gray-700 bg-white/60 dark:bg-black/10'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="inline-block w-3.5 h-3.5 rounded-md bg-gray-900/80" />
                        <div className="text-sm font-medium truncate">{getPostTitle(p)}</div>
                      </div>
                      <div className="mt-1 text-xs text-text-secondary-light dark:text-text-secondary-dark truncate">
                        {getPostBody(p) || getPostLocationText(p) || '내용 없음'}
                      </div>
                    </button>
                  ))}
                </div>
                {filteredPosts.length > 60 && (
                  <div className="mt-2 text-xs text-text-secondary-light dark:text-text-secondary-dark">
                    결과가 많아 상위 60개만 표시 중입니다.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 시트 숨김 상태 복구 버튼 */}
      {sheetHidden && (
        <div className="absolute left-0 right-0 bottom-4 z-40 flex justify-center">
          <button
            onClick={() => setSheetOpen(true)}
            className="rounded-full bg-white/95 dark:bg-black/30 shadow px-4 py-2 text-sm font-semibold border border-gray-200 dark:border-gray-700"
          >
            사진 다시보기
          </button>
        </div>
      )}
    </div>
  );
}

