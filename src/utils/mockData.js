// 목업 데이터 제거 버전
// - 실제 업로드된 게시물(로컬 또는 나중에 Supabase 연동)을 그대로 사용
export const getCombinedPosts = (localPosts = []) => {
  if (!Array.isArray(localPosts)) return [];
  return localPosts;
};

