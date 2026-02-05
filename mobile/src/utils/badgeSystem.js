/**
 * 라이브저니 뱃지 시스템 v5.0 - Mobile (웹과 동일 20개)
 * 7 카테고리: 온보딩, 지역 가이드, 실시간 정보, 도움 지수, 정확한 정보, 친절한 여행자, 기여도
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

export const getBadgeDisplayName = (badge) => {
  if (badge?.region && badge?.name && /^지역\s/.test(badge.name))
    return `${badge.region} ${badge.name.replace(/^지역\s/, '')}`;
  return badge?.name || '';
};

const REGION_AWARE_NAMES = ['지역 가이드', '지역 지킴이', '지역 통신원', '지역 마스터'];

export const BADGES = {
  '첫 걸음': { name: '첫 걸음', description: '첫 번째 실시간 여행 정보를 공유했어요. 여행의 첫걸음을 내딛었어요!', icon: '👣', category: '온보딩', difficulty: 1, gradient: 'from-green-400 to-emerald-500', condition: (s) => (s.totalPosts || 0) >= 1, getProgress: (s) => Math.min(100, ((s.totalPosts || 0) / 1) * 100) },
  '지역 가이드': { name: '지역 가이드', description: '해당 지역 실시간 제보 10회 이상. 가장 직관적인 로컬 전문가 인증', icon: '🗺️', category: '지역 가이드', difficulty: 2, gradient: 'from-indigo-600 to-blue-800', regionAware: true, condition: (s) => (s.maxRegionReports || 0) >= 10, getProgress: (s) => Math.min(100, ((s.maxRegionReports || 0) / 10) * 100) },
  '지역 지킴이': { name: '지역 지킴이', description: '해당 지역의 중요 정보(폐업, 혼잡 등) 5회 이상 공유. 지역의 실패 없는 여행을 수호', icon: '🛡️', category: '지역 가이드', difficulty: 2, gradient: 'from-amber-600 to-amber-800', regionAware: true, condition: (s) => (s.regionImportantInfo || 0) >= 5, getProgress: (s) => Math.min(100, ((s.regionImportantInfo || 0) / 5) * 100) },
  '지역 통신원': { name: '지역 통신원', description: '해당 지역에서 3일 연속 실시간 중계. 지역 소식을 실시간으로 전하는 특파원', icon: '📡', category: '지역 가이드', difficulty: 3, gradient: 'from-cyan-500 to-blue-600', regionAware: true, condition: (s) => (s.regionConsecutiveDays || 0) >= 3, getProgress: (s) => Math.min(100, ((s.regionConsecutiveDays || 0) / 3) * 100) },
  '지역 마스터': { name: '지역 마스터', description: '해당 지역 활동량 상위 1% 기록. 그 지역에 대해선 모르는 게 없는 권위자', icon: '👑', category: '지역 가이드', difficulty: 4, gradient: 'from-purple-600 to-fuchsia-700', regionAware: true, condition: (s) => (s.regionTop1Percent || 0) >= 1, getProgress: (s) => Math.min(100, (s.regionTop1Percent || 0) * 100) },
  '날씨요정': { name: '날씨요정', description: '비/눈 등 기상 변화 시 10분 이내 현장 제보 5회. 친근하고 확실한 날씨 알림이', icon: '🌦️', category: '실시간 정보', difficulty: 2, gradient: 'from-cyan-400 to-blue-600', condition: (s) => (s.weatherReports || 0) >= 5, getProgress: (s) => Math.min(100, ((s.weatherReports || 0) / 5) * 100) },
  '웨이팅 요정': { name: '웨이팅 요정', description: '실시간 대기 줄 상황과 예상 시간 10회 공유. 헛걸음과 시간 낭비를 막아주는 구세주', icon: '⏱️', category: '실시간 정보', difficulty: 2, gradient: 'from-lime-400 to-green-600', condition: (s) => (s.waitingShares || 0) >= 10, getProgress: (s) => Math.min(100, ((s.waitingShares || 0) / 10) * 100) },
  '0.1초 셔터': { name: '0.1초 셔터', description: '현장 도착 즉시 실시간 라이브 사진 업로드. 누구보다 빠르게 현장을 중계하는 유저', icon: '⚡', category: '실시간 정보', difficulty: 3, gradient: 'from-yellow-300 to-amber-500', condition: (s) => (s.fastUploads || 0) >= 5, getProgress: (s) => Math.min(100, ((s.fastUploads || 0) / 5) * 100) },
  '베스트 나침반': { name: '베스트 나침반', description: '실시간 게시글 총 조회수 10,000회 돌파. 많은 이들의 길잡이가 된 영향력 인증', icon: '🧭', category: '도움 지수', difficulty: 4, gradient: 'from-amber-400 to-yellow-600', condition: (s) => (s.totalInfoViews || 0) >= 10000, getProgress: (s) => Math.min(100, ((s.totalInfoViews || 0) / 10000) * 100) },
  '실패 구조대': { name: '실패 구조대', description: '내 정보로 헛걸음을 피한 감사 피드백 50회. 라이브저니의 사명을 가장 잘 실천한 유저', icon: '🫀', category: '도움 지수', difficulty: 3, gradient: 'from-red-400 to-rose-600', condition: (s) => (s.preventedFailFeedback || s.totalLikes || 0) >= 50, getProgress: (s) => Math.min(100, ((s.preventedFailFeedback || s.totalLikes || 0) / 50) * 100) },
  '라이트하우스': { name: '라이트하우스', description: '정보가 귀한 시점(밤, 악천후)에 유용한 정보 제공. 어려운 상황에서 타인의 여행을 밝혀준 존재', icon: '🗼', category: '도움 지수', difficulty: 3, gradient: 'from-cyan-400 to-blue-600', condition: (s) => (s.nightWeatherUseful || 0) >= 5, getProgress: (s) => Math.min(100, ((s.nightWeatherUseful || 0) / 5) * 100) },
  '팩트 체크 마스터': { name: '팩트 체크 마스터', description: '잘못된 과거 정보를 최신으로 수정/갱신 10회. 정보의 최신성을 유지하는 커뮤니티의 기둥', icon: '✅', category: '정확한 정보', difficulty: 3, gradient: 'from-emerald-600 to-teal-700', condition: (s) => (s.factCheckEdits || 0) >= 10, getProgress: (s) => Math.min(100, ((s.factCheckEdits || 0) / 10) * 100) },
  '인간 GPS': { name: '인간 GPS', description: '제보 위치와 실제 GPS 일치율 100% 유지. 데이터 신뢰도를 보장하는 물리적 인증', icon: '🛡️', category: '정확한 정보', difficulty: 2, gradient: 'from-slate-500 to-slate-700', condition: (s) => (s.gpsVerifiedCount || 0) >= (s.totalPosts || 1) && (s.totalPosts || 0) >= 5, getProgress: (s) => { const t = s.totalPosts || 0, v = s.gpsVerifiedCount || 0; if (t < 5) return Math.min(100, (t / 5) * 50); return Math.min(100, (v / Math.max(t, 1)) * 100); } },
  '트래블 셜록': { name: '트래블 셜록', description: '주차 꿀팁, 숨은 입구 등 디테일한 정보 공유. 남들이 놓치는 세밀한 부분까지 챙기는 유저', icon: '🔍', category: '정확한 정보', difficulty: 2, gradient: 'from-amber-600 to-amber-800', condition: (s) => (s.detailShares || 0) >= 5, getProgress: (s) => Math.min(100, ((s.detailShares || 0) / 5) * 100) },
  '실시간 답변러': { name: '실시간 답변러', description: '질문 게시글에 10분 이내로 답변 5회 이상. 여행자의 궁금증을 즉시 해결해 주는 해결사', icon: '💬', category: '친절한 여행자', difficulty: 2, gradient: 'from-sky-400 to-blue-500', condition: (s) => (s.questionAnswersFast || 0) >= 5, getProgress: (s) => Math.min(100, ((s.questionAnswersFast || 0) / 5) * 100) },
  '길 위의 천사': { name: '길 위의 천사', description: '타인의 게시글에 응원 및 격려 댓글 50회 이상. 커뮤니티의 긍정적인 활력을 불어넣는 유저', icon: '👼', category: '친절한 여행자', difficulty: 1, gradient: 'from-yellow-400 to-orange-500', condition: (s) => (s.cheerAndComments || s.totalComments || 0) >= 50, getProgress: (s) => Math.min(100, ((s.cheerAndComments || s.totalComments || 0) / 50) * 100) },
  '동행 가이드': { name: '동행 가이드', description: '사진을 포함한 정성스러운 답변으로 도움 제공. 가장 헌신적으로 정보를 나누는 친절한 유저', icon: '🤝', category: '친절한 여행자', difficulty: 3, gradient: 'from-violet-500 to-purple-600', condition: (s) => (s.helpfulAnswersWithPhoto || 0) >= 5, getProgress: (s) => Math.min(100, ((s.helpfulAnswersWithPhoto || 0) / 5) * 100) },
  '라이브 기록가': { name: '라이브 기록가', description: '총 실시간 제보 게시글 100개 달성. 서비스의 성장을 이끄는 핵심 기여자', icon: '📝', category: '기여도', difficulty: 3, gradient: 'from-blue-600 to-indigo-700', condition: (s) => (s.totalPosts || 0) >= 100, getProgress: (s) => Math.min(100, ((s.totalPosts || 0) / 100) * 100) },
  '연속 중계 마스터': { name: '연속 중계 마스터', description: '30일 연속으로 실시간 상황 1회 이상 공유. 변함없는 성실함으로 신뢰를 쌓는 유저', icon: '📅', category: '기여도', difficulty: 4, gradient: 'from-emerald-500 to-green-700', condition: (s) => (s.consecutiveDays || 0) >= 30, getProgress: (s) => Math.min(100, ((s.consecutiveDays || 0) / 30) * 100) },
  '지도 개척자': { name: '지도 개척자', description: '정보가 없던 새로운 장소의 첫 실시간 정보 등록. 라이브저니의 지도를 확장하는 선구자', icon: '🗺️', category: '기여도', difficulty: 2, gradient: 'from-amber-600 to-orange-700', condition: (s) => (s.firstReportNewPlace || 0) >= 1, getProgress: (s) => Math.min(100, ((s.firstReportNewPlace || 0) / 1) * 100) }
};

export const calculateUserStats = (posts = [], user = {}) => {
  console.log('📊 사용자 통계 계산 시작');

  const regionCounts = {};
  const byRegionAndDate = {};
  const byDate = {};
  const dateSet = new Set();

  (posts || []).forEach((p) => {
    const r = p.region || (p.location && p.location.split(' ')[0]) || null;
    if (r) {
      regionCounts[r] = (regionCounts[r] || 0) + 1;
      const createdAt = p.createdAt || p.created;
      if (createdAt) {
        const d = new Date(createdAt).toDateString();
        if (!byRegionAndDate[r]) byRegionAndDate[r] = new Set();
        byRegionAndDate[r].add(d);
      }
    }
    const createdAt = p.createdAt || p.created;
    if (createdAt) {
      const d = new Date(createdAt).toDateString();
      dateSet.add(d);
      if (!byDate[d]) byDate[d] = new Set();
      const placeKey = p.placeId || p.location || p.region || (p.coordinates && String(p.coordinates)) || 'unknown';
      byDate[d].add(placeKey);
    }
  });

  const regionValues = Object.values(regionCounts);
  const maxRegionReports = regionValues.length > 0 ? Math.max(...regionValues) : 0;
  const topRegionName = regionValues.length > 0 ? Object.entries(regionCounts).find(([, c]) => c === maxRegionReports)?.[0] || null : null;

  let regionConsecutiveDays = 0;
  for (const region of Object.keys(byRegionAndDate)) {
    const sorted = [...byRegionAndDate[region]].sort();
    let run = 1;
    for (let i = 1; i < sorted.length; i++) {
      const prev = new Date(sorted[i - 1]).getTime();
      const curr = new Date(sorted[i]).getTime();
      const diffDays = (curr - prev) / (24 * 60 * 60 * 1000);
      if (diffDays === 1) run += 1;
      else run = 1;
      regionConsecutiveDays = Math.max(regionConsecutiveDays, run);
    }
    regionConsecutiveDays = Math.max(regionConsecutiveDays, run);
  }

  const sortedDates = [...dateSet].sort();
  let consecutiveDays = 0;
  if (sortedDates.length > 0) {
    let run = 1;
    for (let i = 1; i < sortedDates.length; i++) {
      const prev = new Date(sortedDates[i - 1]).getTime();
      const curr = new Date(sortedDates[i]).getTime();
      const diffDays = (curr - prev) / (24 * 60 * 60 * 1000);
      if (diffDays === 1) run += 1;
      else run = 1;
      consecutiveDays = Math.max(consecutiveDays, run);
    }
    consecutiveDays = Math.max(consecutiveDays, run);
  }

  const totalComments = (posts || []).reduce((sum, p) => sum + (Array.isArray(p.comments) ? p.comments.length : 0), 0);

  const stats = {
    totalPosts: (posts || []).length,
    posts: posts || [],
    userId: user?.id || user?._id,
    totalLikes: (posts || []).reduce((sum, p) => sum + (p.likes || 0), 0),
    maxLikes: (posts || []).length > 0 ? Math.max(0, ...(posts || []).map((p) => p.likes || 0)) : 0,
    visitedRegions: new Set((posts || []).map((p) => p.region || (p.location && p.location.split(' ')[0])).filter(Boolean)).size,
    totalComments,
    maxRegionReports, topRegionName, regionImportantInfo: 0, regionConsecutiveDays, regionTop1Percent: 0,
    weatherReports: 0, waitingShares: 0, fastUploads: 0,
    totalInfoViews: 0, preventedFailFeedback: 0, nightWeatherUseful: 0,
    gpsVerifiedCount: 0, detailShares: 0, factCheckEdits: 0,
    cheerAndComments: totalComments, questionAnswersFast: 0, helpfulAnswersWithPhoto: 0,
    consecutiveDays, firstReportNewPlace: 0
  };

  console.log(`✅ 통계 계산 완료: 총 ${stats.totalPosts}개 게시물, ${stats.visitedRegions}개 지역`);
  return stats;
};

export const checkNewBadges = async (stats) => {
  const s = stats || {};
  console.log('🎖️ 새 뱃지 확인 시작');
  try {
    const earnedBadgesJson = await AsyncStorage.getItem('earnedBadges');
    const earnedBadges = earnedBadgesJson ? JSON.parse(earnedBadgesJson) : [];
    const earnedBadgeNames = earnedBadges.map((b) => b.name);
    const newBadges = [];
    for (const [badgeName, badgeInfo] of Object.entries(BADGES)) {
      if (earnedBadgeNames.includes(badgeName)) continue;
      try {
        if (badgeInfo.condition(s)) {
          newBadges.push(badgeInfo);
          console.log(`🎉 새 뱃지 획득 가능: ${badgeName}`);
        }
      } catch (err) {
        console.error(`뱃지 조건 확인 오류 (${badgeName}):`, err);
      }
    }
    console.log(`✅ 뱃지 확인 완료: ${newBadges.length}개 신규 획득 가능`);
    return newBadges;
  } catch (error) {
    console.error('❌ 뱃지 체크 오류:', error);
    return [];
  }
};

/** @param {object} [opts] - { region } 지역 뱃지일 때 획득 지역명 */
export const awardBadge = async (badge, opts = {}) => {
  console.log(`🎁 뱃지 획득 처리 시작: ${badge.name}`);
  try {
    const earnedBadgesJson = await AsyncStorage.getItem('earnedBadges');
    const earnedBadges = earnedBadgesJson ? JSON.parse(earnedBadgesJson) : [];
    if (earnedBadges.some((b) => b.name === badge.name)) {
      console.log(`⚠️ 이미 획득한 뱃지: ${badge.name}`);
      return false;
    }
    const newBadge = {
      ...badge,
      earnedAt: new Date().toISOString(),
      ...(opts?.region && (badge.regionAware || REGION_AWARE_NAMES.includes(badge.name)) && { region: opts.region })
    };
    earnedBadges.push(newBadge);
    await AsyncStorage.setItem('earnedBadges', JSON.stringify(earnedBadges));
    console.log(`✅ 뱃지 저장 완료: ${badge.name}`);
    return true;
  } catch (error) {
    console.error(`❌ 뱃지 획득 처리 오류:`, error);
    return false;
  }
};

export const getEarnedBadges = async () => {
  try {
    const earnedBadgesJson = await AsyncStorage.getItem('earnedBadges');
    return earnedBadgesJson ? JSON.parse(earnedBadgesJson) : [];
  } catch (error) {
    console.error('❌ 뱃지 목록 조회 오류:', error);
    return [];
  }
};

export const getBadgeProgress = (badgeName, stats) => {
  const badge = BADGES[badgeName];
  if (!badge || !badge.getProgress) return 0;
  
  try {
    return badge.getProgress(stats);
  } catch (error) {
    console.error(`뱃지 진행도 계산 오류 (${badgeName}):`, error);
    return 0;
  }
};

export const getBadgesByCategory = (category) => {
  return Object.values(BADGES).filter(badge => badge.category === category);
};

export const getVisibleBadges = () => {
  return Object.values(BADGES).filter(badge => !badge.hidden);
};

export const hasSeenBadge = async (badgeName) => {
  try {
    const seenBadgesJson = await AsyncStorage.getItem('seenBadges');
    const seenBadges = seenBadgesJson ? JSON.parse(seenBadgesJson) : [];
    return seenBadges.includes(badgeName);
  } catch (error) {
    console.error('❌ 뱃지 확인 오류:', error);
    return false;
  }
};

export const markBadgeAsSeen = async (badgeName) => {
  try {
    const seenBadgesJson = await AsyncStorage.getItem('seenBadges');
    const seenBadges = seenBadgesJson ? JSON.parse(seenBadgesJson) : [];
    if (!seenBadges.includes(badgeName)) {
      seenBadges.push(badgeName);
      await AsyncStorage.setItem('seenBadges', JSON.stringify(seenBadges));
      console.log(`✅ 뱃지 확인 표시: ${badgeName}`);
    }
    return true;
  } catch (error) {
    console.error('❌ 뱃지 확인 표시 오류:', error);
    return false;
  }
};
export const getEarnedBadgesForUser = async (userId) => {
  const earned = await getEarnedBadges();
  if (earned && earned.length > 0) {
    return earned;
  }

  // 개발 단계: 아직 실제 뱃지 데이터가 없을 때,
  // 각 사용자에게 BADGES 기반 임의 뱃지를 몇 개씩 부여해서
  // UI에서 항상 뱃지와 대표 뱃지가 보이도록 한다.
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    const visibleBadges = Object.values(BADGES);
    if (visibleBadges.length === 0) return [];

    const baseCount = 3;
    const maxExtra = 4; // 3~7개

    const hashSource = userId ? userId.toString() : 'default-user';
    const hash = hashSource
      .split('')
      .reduce((acc, ch) => acc + ch.charCodeAt(0), 0);

    const count = baseCount + (hash % maxExtra);

    const mockBadges = [];
    for (let i = 0; i < count; i += 1) {
      const idx = (hash + i) % visibleBadges.length;
      const badge = visibleBadges[idx];
      mockBadges.push({
        ...badge,
        earnedAt: new Date().toISOString(),
      });
    }

    return mockBadges;
  }

  return earned;
};

export const getAvailableBadges = async (stats = null) => {
  const earnedBadges = await getEarnedBadges();
  return Object.entries(BADGES).map(([name, badge]) => {
    const earnedBadge = earnedBadges.find((b) => b.name === name);
    const isEarned = !!earnedBadge;
    return {
      ...badge,
      name,
      isEarned,
      progress: stats ? getBadgeProgress(name, stats) : 0,
      ...(isEarned && earnedBadge?.region && { region: earnedBadge.region }),
      ...(!isEarned && stats?.topRegionName && (badge.regionAware || REGION_AWARE_NAMES.includes(name)) && { displayRegion: stats.topRegionName })
    };
  });
};

export const getBadgeStats = async () => {
  const earnedBadges = await getEarnedBadges();
  const categoryCounts = {
    '온보딩': earnedBadges.filter((b) => b.category === '온보딩').length,
    '지역 가이드': earnedBadges.filter((b) => b.category === '지역 가이드').length,
    '실시간 정보': earnedBadges.filter((b) => b.category === '실시간 정보').length,
    '도움 지수': earnedBadges.filter((b) => b.category === '도움 지수').length,
    '정확한 정보': earnedBadges.filter((b) => b.category === '정확한 정보').length,
    '친절한 여행자': earnedBadges.filter((b) => b.category === '친절한 여행자').length,
    '기여도': earnedBadges.filter((b) => b.category === '기여도').length
  };
  return { total: earnedBadges.length, categoryCounts };
};
export default BADGES;


