import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Vite 환경에서 Leaflet 기본 마커 이미지 경로가 깨지는 문제 방지
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const DEFAULT_CENTER = { lat: 37.5665, lng: 126.9780 }; // 서울
const SHEET_PEEK_PX = 92;

const toText = (v) => (v == null ? '' : String(v));
const getPostId = (post, idx) => String(post?.id ?? post?._id ?? post?.postId ?? `local-${idx}`);
const getTitle = (post) => toText(post?.placeName || post?.detailedLocation || post?.location || post?.region || '기록');
const getLocationText = (post) =>
  toText(post?.detailedLocation || post?.placeName || post?.location || post?.region || '').trim();
const getBody = (post) => toText(post?.note || post?.content || '').trim();

const extractCoords = (post) => {
  const c = post?.coordinates;
  if (!c) return null;
  const lat = Number(c.lat ?? c.latitude);
  const lng = Number(c.lng ?? c.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
};

function FlyTo({ position, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (!position) return;
    map.flyTo([position.lat, position.lng], zoom ?? map.getZoom(), { duration: 0.6 });
  }, [map, position, zoom]);
  return null;
}

export default function MapScreenNew() {
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const sheetRef = useRef(null);
  const sheetHeightRef = useRef(0);

  const [activeChip, setActiveChip] = useState('all'); // all | sos | bloom | scenic
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState('');
  const [posts, setPosts] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [flyTo, setFlyTo] = useState(null);
  const [sheetHidden, setSheetHidden] = useState(false);
  const [sheetOffset, setSheetOffset] = useState(0);
  const [showMapControls, setShowMapControls] = useState(false);

  const selected = useMemo(() => posts.find((p) => p.__id === selectedId) || null, [posts, selectedId]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = posts;
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
      return list.filter((p) => String(p.category || '').includes('bloom') || String(p.categoryName || '').includes('개화'));
    }
    if (activeChip === 'scenic') {
      return list.filter((p) => String(p.category || '').includes('scenic') || String(p.categoryName || '').includes('관광'));
    }
    // sos는 액션용(필터 X)
    return list;
  }, [posts, search, activeChip]);

  const markers = useMemo(() => {
    return filtered
      .filter((p) => p.__coords && Number.isFinite(p.__coords.lat) && Number.isFinite(p.__coords.lng))
      .slice(0, 300);
  }, [filtered]);

  const center = useMemo(() => {
    const c = flyTo || selected?.__coords || markers[0]?.__coords || DEFAULT_CENTER;
    return [c.lat, c.lng];
  }, [flyTo, selected, markers]);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    setErrorText('');
    try {
      let localPosts = [];
      try {
        localPosts = JSON.parse(localStorage.getItem('uploadedPosts') || '[]');
      } catch {
        localPosts = [];
      }
      const byId = new Map();
      (Array.isArray(localPosts) ? localPosts : []).forEach((p, idx) => {
        const id = getPostId(p, idx);
        if (!byId.has(id)) byId.set(id, { ...p, __id: id });
      });

      const normalized = Array.from(byId.values())
        .map((p) => ({ ...p, __coords: extractCoords(p) }))
        .filter((p) => p.__coords);

      normalized.sort((a, b) => {
        const ta = new Date(a.timestamp || a.createdAt || a.photoDate || 0).getTime();
        const tb = new Date(b.timestamp || b.createdAt || b.photoDate || 0).getTime();
        return (Number.isFinite(tb) ? tb : 0) - (Number.isFinite(ta) ? ta : 0);
      });

      setPosts(normalized);
      if (normalized[0]?.__id) setSelectedId((prev) => prev || normalized[0].__id);
      if (normalized[0]?.__coords) setFlyTo(normalized[0].__coords);
    } catch (e) {
      setErrorText(e?.message || '게시물을 불러오지 못했어요.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPosts();
  }, [loadPosts]);

  // 시트 높이 측정 + 숨김 오프셋
  useEffect(() => {
    const el = sheetRef.current;
    if (!el) return;
    const update = () => {
      const h = el.getBoundingClientRect().height;
      sheetHeightRef.current = h;
      setSheetOffset(sheetHidden ? Math.max(0, h - SHEET_PEEK_PX) : 0);
    };
    update();
    if (typeof ResizeObserver === 'function') {
      const ro = new ResizeObserver(update);
      ro.observe(el);
      return () => ro.disconnect();
    }
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [sheetHidden]);

  const onSearchSubmit = useCallback(
    (e) => {
      e?.preventDefault?.();
      const q = search.trim();
      if (!q) return;
      const hit = filtered.find((p) => getLocationText(p).includes(q) || getTitle(p).includes(q));
      if (hit?.__coords) {
        setSelectedId(hit.__id);
        setFlyTo(hit.__coords);
        setSheetHidden(false);
      } else {
        setErrorText('현재 목록에서 검색 결과가 없습니다.');
      }
    },
    [search, filtered]
  );

  const chipButton = useCallback(
    (id, label, icon) => {
      const active = activeChip === id;
      return (
        <button
          key={id}
          type="button"
          onClick={() => setActiveChip(id)}
          className={`px-3 py-2 rounded-full text-xs font-semibold border ${
            active
              ? 'border-primary text-primary bg-primary/10'
              : 'border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-black/20 text-text-secondary-light dark:text-text-secondary-dark'
          }`}
        >
          <span className="inline-flex items-center gap-1">
            {icon ? <span aria-hidden>{icon}</span> : null}
            <span>{label}</span>
          </span>
        </button>
      );
    },
    [activeChip]
  );

  return (
    <div className="screen-layout bg-background-light dark:bg-background-dark relative overflow-hidden" style={{ minHeight: '100vh' }}>
      {/* 상단: 뒤로가기 + 검색창 + 새로고침 */}
      <div className="absolute top-0 left-0 right-0 z-20 px-4 pt-4 pointer-events-none">
        <div className="flex items-center gap-3 pointer-events-auto">
          <button
            type="button"
            onClick={() => navigate(-1)}
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
                placeholder="지역 또는 장소 검색"
                className="flex-1 bg-transparent outline-none text-sm"
              />
            </div>
          </form>

          <button
            type="button"
            onClick={() => void loadPosts()}
            className="w-10 h-10 rounded-full bg-white/95 dark:bg-black/30 shadow flex items-center justify-center"
            aria-label="새로고침"
            title="새로고침"
          >
            <span className="material-symbols-outlined text-[22px]">refresh</span>
          </button>
        </div>

        {/* 필터: 지금상황알아보기 / 개화정보 / 가볼만한 곳 */}
        <div className="mt-3 flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 pointer-events-auto">
          {chipButton('sos', '지금 상황 알아보기')}
          {chipButton('bloom', '개화정보', '🌸')}
          {chipButton('scenic', '가볼만한 곳', '🏝️')}
        </div>

        {errorText ? (
          <div className="mt-2 text-xs text-red-600 dark:text-red-400 pointer-events-auto">{errorText}</div>
        ) : null}
      </div>

      {/* 중앙: 지도(전체 화면) */}
      <div className="absolute inset-0 z-0" style={{ width: '100%', height: '100%' }}>
        <MapContainer
          center={center}
          zoom={13}
          style={{ width: '100%', height: '100%' }}
          ref={mapRef}
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {flyTo ? <FlyTo position={flyTo} zoom={14} /> : null}

          {markers.map((p) => {
            const c = p.__coords;
            const active = p.__id === selectedId;
            return (
              <Marker
                key={p.__id}
                position={[c.lat, c.lng]}
                opacity={active ? 1 : 0.9}
                eventHandlers={{
                  click: () => {
                    setSelectedId(p.__id);
                    setFlyTo(c);
                    setSheetHidden(false);
                  },
                }}
              >
                <Popup>
                  <div style={{ minWidth: 160 }}>
                    <div style={{ fontWeight: 800, marginBottom: 6 }}>{getTitle(p)}</div>
                    <div style={{ fontSize: 12, opacity: 0.75 }}>{getLocationText(p) || '위치'}</div>
                    {getBody(p) ? <div style={{ fontSize: 12, marginTop: 6 }}>{getBody(p).slice(0, 80)}</div> : null}
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      {/* 하단: 사진 시트 (우측 상단 컨트롤 버튼 포함) */}
      <div
        ref={sheetRef}
        className="absolute left-0 right-0 bottom-0 z-30"
        style={{
          transform: `translateY(${sheetOffset}px)`,
          transition: 'transform 220ms ease',
        }}
      >
        <div className="mx-auto max-w-[560px] px-4 pb-4">
          <div className="rounded-3xl border border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-gray-900/90 shadow-2xl overflow-hidden">
            <div className="p-3 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="text-sm font-extrabold truncate">사진</div>
                <div className="text-[11px] text-text-secondary-light dark:text-text-secondary-dark">
                  {loading ? '불러오는 중...' : `${markers.length}개 표시`}
                </div>
              </div>

              {/* 시트 우측 상단: 컨트롤 버튼 */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowMapControls((v) => !v)}
                  className="w-10 h-10 rounded-full border border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-black/20 flex items-center justify-center"
                  aria-label="지도 컨트롤"
                  title="지도 컨트롤"
                >
                  <span className="material-symbols-outlined text-[22px]">my_location</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSheetHidden((v) => !v)}
                  className="w-10 h-10 rounded-full border border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-black/20 flex items-center justify-center"
                  aria-label={sheetHidden ? '시트 열기' : '시트 숨기기'}
                  title={sheetHidden ? '시트 열기' : '시트 숨기기'}
                >
                  <span className="material-symbols-outlined text-[22px]">
                    {sheetHidden ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}
                  </span>
                </button>
              </div>
            </div>

            {showMapControls ? (
              <div className="px-3 pb-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const m = mapRef.current;
                      const map = m && typeof m.getZoom === 'function' ? m : null;
                      if (!map) return;
                      map.setZoom(Math.min(18, map.getZoom() + 1));
                    }}
                    className="w-10 h-10 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center justify-center bg-white/80 dark:bg-black/10"
                    aria-label="확대"
                  >
                    <span className="material-symbols-outlined text-[22px]">add</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const m = mapRef.current;
                      const map = m && typeof m.getZoom === 'function' ? m : null;
                      if (!map) return;
                      map.setZoom(Math.max(1, map.getZoom() - 1));
                    }}
                    className="w-10 h-10 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center justify-center bg-white/80 dark:bg-black/10"
                    aria-label="축소"
                  >
                    <span className="material-symbols-outlined text-[22px]">remove</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const c = selected?.__coords || markers[0]?.__coords || DEFAULT_CENTER;
                      setFlyTo(c);
                    }}
                    className="flex-1 h-10 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold bg-white/80 dark:bg-black/10"
                  >
                    중심으로
                  </button>
                </div>
              </div>
            ) : null}

            <div className="px-3 pb-3">
              {loading ? (
                <div className="text-xs text-text-secondary-light dark:text-text-secondary-dark py-6">불러오는 중...</div>
              ) : markers.length === 0 ? (
                <div className="text-xs text-text-secondary-light dark:text-text-secondary-dark py-6">
                  표시할 사진이 없습니다. (좌표가 있는 게시물만 지금은 표시돼요)
                </div>
              ) : (
                <div className="max-h-[34vh] overflow-auto pr-1">
                  <div className="grid grid-cols-1 gap-2">
                    {markers.slice(0, 80).map((p) => (
                      <button
                        key={p.__id}
                        type="button"
                        onClick={() => {
                          setSelectedId(p.__id);
                          setFlyTo(p.__coords);
                        }}
                        className={`text-left rounded-2xl px-3 py-2 border ${
                          p.__id === selectedId
                            ? 'border-primary bg-primary/10'
                            : 'border-gray-200 dark:border-gray-700 bg-white/60 dark:bg-black/10'
                        }`}
                      >
                        <div className="text-sm font-semibold truncate">{getTitle(p)}</div>
                        <div className="mt-1 text-xs text-text-secondary-light dark:text-text-secondary-dark truncate">
                          {getLocationText(p) || getBody(p) || '내용 없음'}
                        </div>
                      </button>
                    ))}
                  </div>
                  {markers.length > 80 ? (
                    <div className="mt-2 text-xs text-text-secondary-light dark:text-text-secondary-dark">
                      결과가 많아 상위 80개만 표시 중입니다.
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

