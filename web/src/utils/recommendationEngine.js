/**
 * 추천 여행지 엔진
 * 고객들이 올린 데이터를 분석하여 추천 여행지를 생성합니다.
 * - "시간"과 "태그" 중심으로 실시간성을 최대한 반영합니다.
 */

import { filterRecentPosts, getTimeAgo, getPostAgeInHours, isPostLive } from './timeUtils';

/**
 * (구) 지역 추천 → (신) 분위기/장소 추천으로 확장
 * - 호출부 호환을 위해 반환 객체 키는 기존(`regionName`, `title`)을 유지합니다.
 * - 내부 집계 단위는 "장소(placeKey)"를 우선으로 사용합니다.
 */
const normalizeText = (v) =>
  String(v || '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

const getPostTextBlob = (post) => {
  const tags = Array.isArray(post?.tags) ? post.tags : [];
  const aiLabels = Array.isArray(post?.aiLabels) ? post.aiLabels : [];
  const aiCats = Array.isArray(post?.aiCategories) ? post.aiCategories : [];
  const parts = [
    post?.note,
    post?.content,
    post?.location,
    post?.placeName,
    post?.detailedLocation,
    post?.categoryName,
    post?.aiCategoryName,
    post?.category,
    post?.aiCategory,
    ...aiCats,
    ...tags.map((t) => (typeof t === 'string' ? t : (t?.name || t?.label || ''))),
    ...aiLabels.map((l) => (typeof l === 'string' ? l : (l?.name || l?.label || ''))),
  ].filter(Boolean);
  return normalizeText(parts.join(' ')).replace(/#+/g, '');
};

const getPlaceKey = (post) => {
  const raw = post?.placeName || post?.detailedLocation || post?.location || '';
  const k = String(raw || '').replace(/\s+/g, ' ').trim();
  return k || '기록';
};

const hasCategory = (post, slug) =>
  post?.category === slug ||
  post?.aiCategory === slug ||
  (Array.isArray(post?.categories) && post.categories.includes(slug)) ||
  (Array.isArray(post?.aiCategories) && post.aiCategories.includes(slug));

const pickRepresentativeImage = (posts) => {
  const list = Array.isArray(posts) ? posts : [];
  const withImage = list
    .filter((p) => p?.images?.[0] || p?.thumbnail || p?.image)
    .slice()
    .sort((a, b) => {
      const timeA = a?.timestamp || a?.createdAt || a?.time || 0;
      const timeB = b?.timestamp || b?.createdAt || b?.time || 0;
      return timeB - timeA;
    });
  const first = withImage[0];
  if (!first) return null;
  const raw = first.images?.[0] ?? first.thumbnail ?? first.image;
  return typeof raw === 'string' ? raw : (raw?.url ?? raw?.src ?? null);
};

const matchesAny = (text, keywords) => {
  if (!text) return false;
  const t = normalizeText(text);
  return (keywords || []).some((kw) => t.includes(normalizeText(kw)));
};

const KEYWORDS = {
  seasonPeak: [
    '만개', '만개함', '개화', '꽃피', '벚꽃', '매화', '유채', '수국', '코스모스', '철쭉', '튤립',
    '단풍', '절정', '눈', '설경', '눈이', '함박눈',
    '풍경', '뷰', '전망', '경치', '윤슬', '일출', '일몰',
  ],
  silentHealing: [
    '한적', '조용', '여유', '고즈넉', '힐링', '아지트', '산책', '쉼', '쉼표', '책읽',
    '웨이팅없', '대기없', '줄없',
  ],
  deepSeaBlue: [
    '바다', '해변', '해수욕장', '파도', '해안', '포구', '항구', '서핑',
    '물멍', '윤슬', '탁트', '시원', '푸른바다', '푸른', '파란', '청량', '맑음', '맑은',
  ],
  livelyVibe: [
    '활기', '힙', '핫플', '북적', '인생샷', '감성', '축제', '사람많', '분위기최고', '재밌',
    '음악', '공연', '클럽', '야시장',
  ],
  easyWalking: [
    '아이', '키즈', '유모차', '가족', '아이와', '예스키즈', '키즈존',
    '반려', '반려견', '강아지', '댕', '애견', '멍', '고양이', '펫', 'pet',
    '주차', '주차편', '잔디', '넓은', '놀이터',
  ],
};

const COASTAL_HINT_REGIONS = new Set(['부산', '제주', '강릉', '속초', '여수', '인천', '울산', '포항', '통영', '거제']);

const calculatePlaceStats = (posts, placeKey) => {
  const placePosts = (Array.isArray(posts) ? posts : []).filter((post) => getPlaceKey(post) === placeKey);

  const total = placePosts.length;
  const bloomCount = placePosts.filter((p) => hasCategory(p, 'bloom')).length;
  const foodCount = placePosts.filter((p) => hasCategory(p, 'food')).length;
  const waitingCount = placePosts.filter((p) => hasCategory(p, 'waiting')).length;
  const scenicCount = placePosts.filter((p) => hasCategory(p, 'landmark') || hasCategory(p, 'scenic')).length;

  const recent3hPosts = filterRecentPosts(placePosts, 2, 3);
  const recent1hPosts = filterRecentPosts(placePosts, 2, 1);
  const recent24hPosts = filterRecentPosts(placePosts, 1, 24);
  const recent3hCount = recent3hPosts.length;
  const recent1hCount = recent1hPosts.length;
  const recent24hCount = recent24hPosts.length;

  const totalLikes = placePosts.reduce((sum, p) => sum + (p.likes || 0), 0);
  const avgLikes = total > 0 ? totalLikes / total : 0;

  const bloomRecentPosts = recent24hPosts.filter((p) => hasCategory(p, 'bloom'));
  const bloomRecentCount = bloomRecentPosts.length;

  const bloomPercentage = total > 0 ? (bloomCount / total) * 100 : 0;
  const activityScore = recent3hCount * 3 + recent1hCount * 5 + avgLikes * 0.3;
  const popularityScore = total * 1.5 + avgLikes;

  const latestPost = recent24hPosts[0] || placePosts
    .slice()
    .sort((a, b) => {
      const timeA = new Date(a.timestamp || a.createdAt || 0);
      const timeB = new Date(b.timestamp || b.createdAt || 0);
      return timeB - timeA;
    })[0];

  const latestTimestamp = latestPost ? (latestPost.timestamp || latestPost.createdAt) : null;
  const lastPostAgeHours = latestTimestamp ? getPostAgeInHours(latestTimestamp) : null;
  const lastPostAgeMinutes = lastPostAgeHours != null ? Math.round(lastPostAgeHours * 60) : null;
  const lastPostTimeAgoLabel = latestTimestamp ? getTimeAgo(latestTimestamp) : null;
  const isLiveRegion = latestTimestamp ? isPostLive(latestTimestamp, 30) : false;

  return {
    placeKey,
    total,
    bloomCount,
    foodCount,
    waitingCount,
    scenicCount,
    recentCount: recent24hCount,
    recent3hCount,
    recent1hCount,
    recent24hCount,
    bloomRecentCount,
    avgLikes: Math.round(avgLikes * 10) / 10,
    bloomPercentage: Math.round(bloomPercentage * 10) / 10,
    activityScore: Math.round(activityScore * 10) / 10,
    popularityScore: Math.round(popularityScore * 10) / 10,
    lastPostAgeMinutes,
    lastPostTimeAgoLabel,
    isLive: isLiveRegion,
    representativeImage: pickRepresentativeImage(placePosts),
    recentPosts: recent24hPosts.slice(0, 3),
  };
};

/**
 * 추천 타입별 추천 장소 계산 (호환: regionName 필드 유지)
 */
export const getRecommendedRegions = (posts, recommendationType = 'blooming') => {
  const rawType = String(recommendationType || '').trim();
  const type = (() => {
    // 기존 타입 호환(별칭)
    if (rawType === 'active' || rawType === 'popular' || rawType === 'food') return 'lively_vibe';
    if (rawType === 'blooming' || rawType === 'scenic') return 'season_peak';
    if (rawType === 'waiting') return 'silent_healing';
    return rawType || 'season_peak';
  })();

  const list = Array.isArray(posts) ? posts : [];
  const keys = Array.from(new Set(list.map((p) => getPlaceKey(p)).filter((k) => k && k !== '기록')));
  const stats = keys.map((k) => calculatePlaceStats(list, k)).filter((s) => s.total > 0);

  const getPlacePosts = (placeKey) => list.filter((p) => getPlaceKey(p) === placeKey);

  const scorePlace = (placeKey) => {
    const postsForPlace = getPlacePosts(placeKey);
    const blobAll = postsForPlace.map((p) => getPostTextBlob(p)).join(' ');
    const regionHint = placeKey.split(/\s+/)[0] || '';
    const isCoastal = COASTAL_HINT_REGIONS.has(regionHint);

    const recent1h = filterRecentPosts(postsForPlace, 2, 1);
    const recent3h = filterRecentPosts(postsForPlace, 2, 3);
    const recent24h = filterRecentPosts(postsForPlace, 1, 24);

    const seasonPred = (p) => {
      const t = getPostTextBlob(p);
      const scenicLike = hasCategory(p, 'scenic') || hasCategory(p, 'landmark') || hasCategory(p, 'bloom');
      return scenicLike && matchesAny(t, KEYWORDS.seasonPeak);
    };
    const silentPred = (p) => {
      const t = getPostTextBlob(p);
      const hasQuiet = matchesAny(t, KEYWORDS.silentHealing);
      const hasWaiting = matchesAny(t, ['웨이팅', '대기', '줄', 'queue', 'waiting']) || hasCategory(p, 'waiting');
      return hasQuiet && !hasWaiting;
    };
    const seaPred = (p) => {
      const t = getPostTextBlob(p);
      return matchesAny(t, KEYWORDS.deepSeaBlue) || isCoastal;
    };
    const livelyPred = (p) => {
      const t = getPostTextBlob(p);
      return matchesAny(t, KEYWORDS.livelyVibe);
    };
    const easyPred = (p) => {
      const t = getPostTextBlob(p);
      return matchesAny(t, KEYWORDS.easyWalking);
    };

    const count = (arr, pred) => (Array.isArray(arr) ? arr.filter((x) => pred(x)).length : 0);

    const season3h = count(recent3h, seasonPred);
    const season24h = count(recent24h, seasonPred);
    const silent3h = count(recent3h, silentPred);
    const silent24h = count(recent24h, silentPred);
    const sea3h = count(recent3h, seaPred);
    const sea24h = count(recent24h, seaPred);
    const lively1h = count(recent1h, livelyPred);
    const lively3h = count(recent3h, livelyPred);
    const easy3h = count(recent3h, easyPred);
    const easy24h = count(recent24h, easyPred);

    const avgLikes = postsForPlace.reduce((s, p) => s + (p?.likes || 0), 0) / Math.max(1, postsForPlace.length);

    const surgeBoost = (recentN, recentTotal) => {
      if (recentTotal <= 0) return 0;
      const ratio = recentN / recentTotal;
      if (recentN >= 3 && ratio >= 0.45) return 3;
      if (recentN >= 2 && ratio >= 0.35) return 2;
      if (recentN >= 1 && ratio >= 0.25) return 1;
      return 0;
    };

    if (type === 'season_peak') {
      const score = season3h * 9 + season24h * 3 + surgeBoost(season3h, season24h) * 6 + avgLikes * 0.35;
      return { score, extra: { season3h, season24h } };
    }
    if (type === 'silent_healing') {
      const waitingPenalty = matchesAny(blobAll, ['웨이팅', '대기', '줄', '북적']) ? 2 : 0;
      const score = silent3h * 9 + silent24h * 3 - waitingPenalty * 6 + avgLikes * 0.15;
      return { score, extra: { silent3h, silent24h } };
    }
    if (type === 'deep_sea_blue') {
      const blueBoost = matchesAny(blobAll, ['푸른', '파란', '윤슬', '맑음', '청량']) ? 2 : 0;
      const score = sea3h * 8 + sea24h * 3 + blueBoost * 5 + avgLikes * 0.2;
      return { score, extra: { sea3h, sea24h, isCoastal } };
    }
    if (type === 'lively_vibe') {
      const vividBoost = matchesAny(blobAll, ['화려', '선명', '축제', '공연', '힙']) ? 2 : 0;
      const score = recent1h.length * 8 + lively1h * 4 + lively3h * 2 + vividBoost * 6 + avgLikes * 0.45;
      return { score, extra: { recent1h: recent1h.length, lively1h } };
    }
    if (type === 'easy_walking') {
      const score = easy3h * 9 + easy24h * 3 + avgLikes * 0.2;
      return { score, extra: { easy3h, easy24h } };
    }

    const score = recent1h.length * 6 + recent3h.length * 3 + avgLikes * 0.3;
    return { score, extra: { recent1h: recent1h.length } };
  };

  const toDescription = (typeId, stat, extra) => {
    const t = stat.lastPostTimeAgoLabel || '방금';
    if (typeId === 'season_peak') {
      const n = extra?.season3h ?? 0;
      return `지금이 절정인 곳만 골랐어요. ${t} 갱신 — 3시간 내 피크 신호 ${n}건`;
    }
    if (typeId === 'silent_healing') {
      const n = extra?.silent3h ?? 0;
      return `“오늘은 조용하게.” 한적함 제보가 쌓인 쉼표 스팟 (${t}) · 조용 신호 ${n}`;
    }
    if (typeId === 'deep_sea_blue') {
      const n = extra?.sea3h ?? 0;
      return `파도/윤슬 감성 당기면 여기. ${t} 올라온 바다 무드 ${n}개`;
    }
    if (typeId === 'lively_vibe') {
      const n = extra?.recent1h ?? 0;
      return `지금 제일 “핫”한 공기. 1시간 업로드 ${n}개 · ${t}`;
    }
    if (typeId === 'easy_walking') {
      const n = extra?.easy3h ?? 0;
      return `아이/반려견 동반 OK 느낌 나는 곳 위주로. ${t} · 동반 신호 ${n}`;
    }
    return `${t} 새 소식`;
  };

  const toBadge = (typeId) => {
    if (typeId === 'season_peak') return '🌸 지금이 절정';
    if (typeId === 'silent_healing') return '🌿 한적한 아지트';
    if (typeId === 'deep_sea_blue') return '🌊 딥씨블루';
    if (typeId === 'lively_vibe') return '🔥 지금 힙한 곳';
    if (typeId === 'easy_walking') return '🐶 안심 나들이';
    return '✨ 추천';
  };

  const ranked = stats
    .map((s) => {
      const { score, extra } = scorePlace(s.placeKey);
      return { stat: s, score, extra };
    })
    .filter((x) => x.score > 0 || x.stat.recent24hCount > 0)
    .sort((a, b) => b.score - a.score || (a.stat.lastPostAgeMinutes ?? 999999) - (b.stat.lastPostAgeMinutes ?? 999999))
    .slice(0, 10);

  return ranked.map(({ stat, score, extra }) => ({
    regionName: stat.placeKey,
    title: stat.placeKey,
    description: toDescription(type, stat, extra),
    image: stat.representativeImage,
    badge: toBadge(type),
    _score: score,
    stats: {
      total: stat.total,
      recent24hCount: stat.recent24hCount,
      recent3hCount: stat.recent3hCount,
      recent1hCount: stat.recent1hCount,
      avgLikes: stat.avgLikes,
      isLive: stat.isLive,
      lastPostTimeAgoLabel: stat.lastPostTimeAgoLabel,
    },
  }));
};

/**
 * 추천 타입 목록 (분위기/테마 기반)
 */
export const RECOMMENDATION_TYPES = [
  {
    id: 'season_peak',
    name: '지금이 절정',
    description: '최근 3시간 내 계절·풍경 키워드가 급증한 장소',
    icon: '🌸'
  },
  {
    id: 'silent_healing',
    name: '한적한 아지트',
    description: '조용·여유 키워드가 감지되는 쉼표 스팟',
    icon: '🌿'
  },
  {
    id: 'deep_sea_blue',
    name: '딥씨 블루',
    description: '바다·파도·윤슬 등 “파란 감성” 신호가 강한 장소',
    icon: '🌊'
  },
  {
    id: 'lively_vibe',
    name: '힙&활기',
    description: '최근 1시간 업로드가 몰린 에너지 스팟',
    icon: '🔥'
  },
  {
    id: 'easy_walking',
    name: '안심 나들이',
    description: '아이/반려견 동반 신호가 있는 편안한 코스',
    icon: '🐶'
  }
];
