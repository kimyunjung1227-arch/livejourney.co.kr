/**
 * ⚠️ 운영 환경에서 `https://<domain>/api/*` 백엔드가 없을 수 있어
 * /api 호출은 404를 유발합니다.
 *
 * 앱은 Supabase를 단일 소스로 사용하도록 전환되었으므로,
 * 이 파일은 "기존 호출부 호환"용 얇은 래퍼로만 유지합니다.
 */

import { getUploadedPostsSafe } from '../utils/localStorageManager';
import {
  fetchPostsSupabase,
  fetchPostsByUserIdSupabase,
  fetchPostByIdSupabase,
  createPostSupabase,
} from './postsSupabase';

// 게시물 목록 조회
export const getPosts = async (params = {}) => {
  try {
    const limit = Math.max(0, Number(params?.limit) || 0);
    const userId = params?.userId ? String(params.userId) : null;

    const supabasePosts = userId
      ? await fetchPostsByUserIdSupabase(userId)
      : await fetchPostsSupabase();
    const localPosts = getUploadedPostsSafe();

    const byId = new Map();
    [...(Array.isArray(supabasePosts) ? supabasePosts : []), ...(Array.isArray(localPosts) ? localPosts : [])].forEach((p) => {
      if (p && p.id && !byId.has(p.id)) byId.set(p.id, p);
    });

    const merged = Array.from(byId.values()).sort((a, b) => (b.timestamp || b.createdAt || 0) - (a.timestamp || a.createdAt || 0));
    const sliced = limit > 0 ? merged.slice(0, limit) : merged;
    return { success: true, posts: sliced };
  } catch (error) {
    console.warn('게시물 조회 실패(백엔드 대신 Supabase 사용):', error?.message || error);
    return { success: false, posts: [] };
  }
};

// 게시물 상세 조회
export const getPost = async (postId) => {
  try {
    const post = await fetchPostByIdSupabase(String(postId || '').trim());
    return { success: !!post, post: post || null };
  } catch (error) {
    console.warn('게시물 상세 조회 실패:', error?.message || error);
    return { success: false, post: null };
  }
};

// 게시물 작성
export const createPost = async (postData) => {
  try {
    const res = await createPostSupabase(postData);
    if (res?.success) return { success: true, post: res.post || null };
    return { success: false, error: res?.error || 'create_failed', hint: res?.hint };
  } catch (error) {
    console.warn('게시물 작성 실패:', error?.message || error);
    return { success: false };
  }
};

// 해시태그 통계(기존 `/posts/tags` 호환)
export const getTags = async () => {
  try {
    const supabasePosts = await fetchPostsSupabase();
    const localPosts = getUploadedPostsSafe();
    const posts = [
      ...(Array.isArray(supabasePosts) ? supabasePosts : []),
      ...(Array.isArray(localPosts) ? localPosts : []),
    ];

    const norm = (s) => String(s || '').replace(/^#+/, '').trim();
    const freq = new Map(); // tag -> count
    posts.forEach((p) => {
      const tags = Array.isArray(p?.tags) ? p.tags : [];
      tags.forEach((t) => {
        const key = norm(t).toLowerCase();
        if (!key || key.length < 2) return;
        freq.set(key, (freq.get(key) || 0) + 1);
      });
    });

    const tags = Array.from(freq.entries())
      .map(([k, count]) => ({ name: k, count }))
      .sort((a, b) => b.count - a.count);
    return { success: true, tags };
  } catch (e) {
    return { success: false, tags: [] };
  }
};















