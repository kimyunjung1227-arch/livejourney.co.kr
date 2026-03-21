/** @param {string} uri */
export const isVideoUri = (uri) => {
  if (!uri || typeof uri !== 'string') return false;
  return /\.(mp4|mov|m4v|webm)(\?.*)?$/i.test(uri.trim());
};

/**
 * 게시물에서 카드/캐러셀용 미디어 슬롯 (이미지·동영상 순서 유지, 중복 제거)
 * @param {object} post
 * @returns {{ type: 'image'|'video', uri: string }[]}
 */
export const buildMediaItemsFromPost = (post) => {
  if (!post) return [];
  const items = [];
  const seen = new Set();
  const push = (type, uri) => {
    if (!uri || seen.has(uri)) return;
    seen.add(uri);
    items.push({ type, uri });
  };

  for (const u of post.images || []) {
    if (u) push(isVideoUri(u) ? 'video' : 'image', u);
  }
  for (const u of post.videos || []) {
    if (u) push('video', u);
  }

  const fallback = post.image || post.thumbnail || post.imageUrl;
  if (fallback) push(isVideoUri(fallback) ? 'video' : 'image', fallback);

  return items;
};

/** 지도 핀·썸네일: 가능하면 사진 URL만 (동영상 URL은 Image가 실패할 수 있음) */
export const getMapThumbnailUri = (post) => {
  const items = buildMediaItemsFromPost(post);
  const img = items.find((m) => m.type === 'image');
  return img?.uri || '';
};
