/**
 * 목업 데이터 없이, 실제 업로드된 로컬 게시물만 사용
 */
export const getCombinedPosts = (localPosts = []) => {
  const safeLocalPosts = Array.isArray(localPosts) ? localPosts : [];
  return [...safeLocalPosts];
};
