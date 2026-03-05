import { supabase } from '../utils/supabaseClient';
import { logger } from '../utils/logger';

// 간단한 UUID 형식 검사 (Supabase user_id 컬럼이 uuid 타입인 경우 대비)
const isValidUuid = (value) => {
  if (!value || typeof value !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value.trim());
};

// Supabase posts 테이블에 게시물 저장
export const createPostSupabase = async (post) => {
  try {
    if (!post) return { success: false, error: 'no_post' };

    const payload = {
      // user_id 컬럼이 uuid 타입이기 때문에, uuid가 아니면 null로 저장
      user_id: isValidUuid(post.userId) ? post.userId : null,
      content: post.note || post.content || '',
      images: Array.isArray(post.images) ? post.images : [],
      videos: Array.isArray(post.videos) ? post.videos : [],
      location: post.location || null,
      detailed_location: post.detailedLocation || null,
      place_name: post.placeName || null,
      region: post.region || null,
      tags: Array.isArray(post.tags)
        ? post.tags.map((t) => (typeof t === 'string' ? t.replace(/^#+/, '') : String(t || '')))
        : [],
      category: post.category || null,
      category_name: post.categoryName || null,
      likes_count: post.likes || 0,
      captured_at: post.photoDate ? new Date(post.photoDate) : null,
      created_at: post.createdAt ? new Date(post.createdAt) : new Date(),
    };

    let { data, error } = await supabase
      .from('posts')
      .insert(payload)
      .select('*')
      .single();

    // user_id가 public.users에 없으면 FK 오류(23503) → user_id 없이 재시도
    if (error && error.code === '23503' && payload.user_id) {
      const fallbackPayload = { ...payload, user_id: null };
      const retry = await supabase
        .from('posts')
        .insert(fallbackPayload)
        .select('*')
        .single();
      if (!retry.error) {
        return { success: true, post: retry.data };
      }
    }

    if (error) {
      throw error;
    }

    return { success: true, post: data };
  } catch (error) {
    logger.error('Supabase createPost 실패:', {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });
    return {
      success: false,
      error: error.message || error.code || 'unknown_error',
    };
  }
};

// Supabase에서 게시물 목록 읽기
export const fetchPostsSupabase = async () => {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (!data) return [];

    return data.map((row) => ({
      id: row.id,
      userId: row.user_id,
      user: row.user_id,
      images: Array.isArray(row.images) ? row.images : [],
      videos: Array.isArray(row.videos) ? row.videos : [],
      location: row.location || '',
      detailedLocation: row.detailed_location || '',
      placeName: row.place_name || '',
      region: row.region || '',
      tags: Array.isArray(row.tags) ? row.tags : [],
      note: row.content || '',
      content: row.content || '',
      timestamp: row.created_at ? new Date(row.created_at).getTime() : null,
      createdAt: row.created_at || null,
      photoDate: row.captured_at || row.created_at || null,
      likes: row.likes_count || 0,
      category: row.category || null,
      categoryName: row.category_name || null,
      thumbnail: (Array.isArray(row.images) && row.images[0]) || null,
    }));
  } catch (error) {
    logger.warn('Supabase fetchPosts 실패 (localStorage fallback 사용):', error);
    return [];
  }
};


