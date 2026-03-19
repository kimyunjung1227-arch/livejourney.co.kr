/**
 * 추천 여행지 엔진
 * 고객들이 올린 데이터를 분석하여 추천 여행지를 생성합니다.
 */

import { filterRecentPosts } from './timeUtils';

/**
 * 지역별 통계 계산
 */
const calculateRegionStats = (posts, regionName) => {
  const regionPosts = posts.filter(post => 
    post.location?.includes(regionName) || post.location === regionName
  );

  const total = regionPosts.length;
  const bloomCount = regionPosts.filter(p => p.category === 'bloom').length;
  const foodCount = regionPosts.filter(p => p.category === 'food').length;
  const scenicCount = regionPosts.filter(p => 
    p.category === 'landmark' || p.category === 'scenic'
  ).length;
  
  // 최근 7일 이내 게시물 수
  const recentPosts = filterRecentPosts(regionPosts, 7);
  const recentCount = recentPosts.length;
  
  // 평균 좋아요 수
  const totalLikes = regionPosts.reduce((sum, p) => sum + (p.likes || 0), 0);
  const avgLikes = total > 0 ? totalLikes / total : 0;
  
  // 개화상태 퍼센트 (개화 카테고리 게시물 비율)
  const bloomPercentage = total > 0 ? (bloomCount / total) * 100 : 0;
  
  // 최근 활동 점수 (최근 게시물 수 + 좋아요 가중치)
  const activityScore = recentCount * 2 + avgLikes * 0.5;
  
  // 인기도 점수 (전체 게시물 수 + 좋아요 가중치)
  const popularityScore = total * 1.5 + avgLikes;

  return {
    regionName,
    total,
    bloomCount,
    foodCount,
    scenicCount,
    recentCount,
    avgLikes: Math.round(avgLikes * 10) / 10,
    bloomPercentage: Math.round(bloomPercentage * 10) / 10,
    activityScore: Math.round(activityScore * 10) / 10,
    popularityScore: Math.round(popularityScore * 10) / 10,
    // 대표 이미지 (가장 최근 게시물의 images[0] → thumbnail → image)
    representativeImage: (() => {
      const withImage = regionPosts
        .filter(p => p.images?.[0] || p.thumbnail || p.image)
        .sort((a, b) => {
          const timeA = a.timestamp || a.createdAt || a.time || 0;
          const timeB = b.timestamp || b.createdAt || b.time || 0;
          return timeB - timeA;
        });
      const first = withImage[0];
      if (!first) return null;
      const raw = first.images?.[0] ?? first.thumbnail ?? first.image;
      return typeof raw === 'string' ? raw : (raw?.url ?? raw?.src ?? null);
    })(),
    // 최근 게시물 샘플
    recentPosts: recentPosts.slice(0, 3)
  };
};

/**
 * 추천 타입별 추천 지역 계산
 */
export const getRecommendedRegions = (posts, recommendationType = 'blooming') => {
  // 모든 지역 목록
  const allRegions = [
    '서울', '부산', '제주', '경주', '강릉', '전주', '여수', '속초',
    '인천', '대구', '광주', '대전', '울산', '수원', '용인', '성남', '고양', '부천', '포항', '창원'
  ];

  // 지역별 통계 계산
  const regionStats = allRegions
    .map(region => calculateRegionStats(posts, region))
    .filter(stat => stat.total > 0); // 게시물이 있는 지역만

  let recommended = [];

  switch (recommendationType) {
    case 'blooming':
      // 개화상태 80% 이상인 곳 (또는 개화 게시물이 많은 곳)
      recommended = regionStats
        .filter(stat => stat.bloomPercentage >= 80 || stat.bloomCount >= 3)
        .sort((a, b) => {
          // 개화 퍼센트 우선, 같으면 최근 활동 점수
          if (Math.abs(a.bloomPercentage - b.bloomPercentage) > 5) {
            return b.bloomPercentage - a.bloomPercentage;
          }
          return b.activityScore - a.activityScore;
        })
        .slice(0, 10)
        .map(stat => ({
          regionName: stat.regionName,
          title: stat.regionName,
          description: `개화상태 ${stat.bloomPercentage}% | 최근 게시물 ${stat.recentCount}개`,
          image: stat.representativeImage,
          badge: `🌸 개화 ${stat.bloomPercentage}%`,
          stats: {
            bloomPercentage: stat.bloomPercentage,
            recentCount: stat.recentCount,
            total: stat.total
          }
        }));
      break;

    case 'active':
      // 최근 업로드가 많은 곳
      recommended = regionStats
        .filter(stat => stat.recentCount > 0)
        .sort((a, b) => b.activityScore - a.activityScore)
        .slice(0, 10)
        .map(stat => ({
          regionName: stat.regionName,
          title: stat.regionName,
          description: `최근 7일간 ${stat.recentCount}개 게시물 | 평균 좋아요 ${stat.avgLikes}`,
          image: stat.representativeImage,
          badge: `🔥 활발 ${stat.recentCount}개`,
          stats: {
            recentCount: stat.recentCount,
            avgLikes: stat.avgLikes,
            activityScore: stat.activityScore
          }
        }));
      break;

    case 'popular':
      // 좋아요가 많은 곳 (인기 있는 곳)
      recommended = regionStats
        .filter(stat => stat.avgLikes > 0)
        .sort((a, b) => b.popularityScore - a.popularityScore)
        .slice(0, 10)
        .map(stat => ({
          regionName: stat.regionName,
          title: stat.regionName,
          description: `평균 좋아요 ${stat.avgLikes} | 총 ${stat.total}개 게시물`,
          image: stat.representativeImage,
          badge: `⭐ 인기 ${stat.avgLikes}❤️`,
          stats: {
            avgLikes: stat.avgLikes,
            total: stat.total,
            popularityScore: stat.popularityScore
          }
        }));
      break;

    case 'food':
      // 맛집 정보가 많은 곳
      recommended = regionStats
        .filter(stat => stat.foodCount > 0)
        .sort((a, b) => {
          // 맛집 게시물 수 우선, 같으면 최근 활동
          if (a.foodCount !== b.foodCount) {
            return b.foodCount - a.foodCount;
          }
          return b.activityScore - a.activityScore;
        })
        .slice(0, 10)
        .map(stat => ({
          regionName: stat.regionName,
          title: stat.regionName,
          description: `맛집 정보 ${stat.foodCount}개 | 최근 게시물 ${stat.recentCount}개`,
          image: stat.representativeImage,
          badge: `🍜 맛집 ${stat.foodCount}개`,
          stats: {
            foodCount: stat.foodCount,
            recentCount: stat.recentCount,
            total: stat.total
          }
        }));
      break;

    case 'scenic':
      // 가볼만한 곳이 많은 곳
      recommended = regionStats
        .filter(stat => stat.scenicCount > 0)
        .sort((a, b) => {
          // 명소 게시물 수 우선, 같으면 최근 활동
          if (a.scenicCount !== b.scenicCount) {
            return b.scenicCount - a.scenicCount;
          }
          return b.activityScore - a.activityScore;
        })
        .slice(0, 10)
        .map(stat => ({
          regionName: stat.regionName,
          title: stat.regionName,
          description: `추천 장소 ${stat.scenicCount}개 | 최근 게시물 ${stat.recentCount}개`,
          image: stat.representativeImage,
          badge: `🏞️ 명소 ${stat.scenicCount}개`,
          stats: {
            scenicCount: stat.scenicCount,
            recentCount: stat.recentCount,
            total: stat.total
          }
        }));
      break;

    default:
      // 기본: 최근 활동이 많은 곳
      recommended = regionStats
        .filter(stat => stat.recentCount > 0)
        .sort((a, b) => b.activityScore - a.activityScore)
        .slice(0, 10)
        .map(stat => ({
          regionName: stat.regionName,
          title: stat.regionName,
          description: `최근 7일간 ${stat.recentCount}개 게시물`,
          image: stat.representativeImage,
          badge: `🔥 활발`,
          stats: {
            recentCount: stat.recentCount,
            activityScore: stat.activityScore
          }
        }));
  }

  return recommended;
};

/**
 * 추천 타입 목록 (활발한 지역 먼저 노출)
 */
export const RECOMMENDATION_TYPES = [
  {
    id: 'active',
    name: '🔥 지금 북적이는 곳',
    description: '지금 이 순간 활동이 가장 활발한 곳',
    icon: '🔥'
  },
  {
    id: 'blooming',
    name: '🌸 오늘 개화 현황',
    description: '오늘 개화 상태가 좋은 곳',
    icon: '🌸'
  },
  {
    id: 'popular',
    name: '⭐ 방금 올라온 장소',
    description: '방금(최근) 업로드된 장소',
    icon: '⭐'
  },
  {
    id: 'food',
    name: '🍲 실시간 웨이팅 현황',
    description: '실시간 웨이팅이 있는 곳',
    icon: '🍜'
  },
  {
    id: 'scenic',
    name: '🏞️ 추천 장소',
    description: '가볼만한 곳이 많은 곳',
    icon: '🏞️'
  }
];
