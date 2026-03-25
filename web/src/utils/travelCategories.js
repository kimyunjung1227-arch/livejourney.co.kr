/** AI 분석 결과 → 카테고리 슬러그 배열 */
export function slugsFromAnalysisResult(result) {
  if (!result) return ['scenic'];
  if (Array.isArray(result.categories) && result.categories.length > 0) {
    const s = result.categories.map((c) => c.category).filter(Boolean);
    return [...new Set(s.length ? s : ['scenic'])];
  }
  if (result.category) return [result.category];
  return ['scenic'];
}

/** 여행 게시물 카테고리 슬러그 → 표시명 (웹·백엔드 표기 통일) */
export const TRAVEL_CATEGORY_META = {
  bloom: { name: '개화정보', icon: '🌸' },
  scenic: { name: '추천장소', icon: '🏞️' },
  food: { name: '맛집정보', icon: '🍜' },
  waiting: { name: '웨이팅', icon: '⏱️' },
  landmark: { name: '명소', icon: '🏛️' },
  general: { name: '일반', icon: '📌' }
};

/**
 * 게시물에서 카테고리 칩 목록 (다중 categories 우선, 없으면 단일 categoryName)
 */
export function getCategoryChipsFromPost(post) {
  if (Array.isArray(post?.categories) && post.categories.length > 0) {
    return post.categories.map((slug) => {
      const m = TRAVEL_CATEGORY_META[slug];
      return {
        slug,
        name: m?.name || slug,
        icon: m?.icon || ''
      };
    });
  }
  if (post?.categoryName) {
    return [
      {
        slug: post.category || 'general',
        name: post.categoryName,
        icon: post.categoryIcon || ''
      }
    ];
  }
  return [];
}
