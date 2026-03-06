import { supabase } from '../utils/supabaseClient';
import { logger } from '../utils/logger';

/**
 * 공지 목록 조회 (최신순, 고정 공지 상단)
 */
export const fetchNotices = async () => {
  try {
    const { data, error } = await supabase
      .from('notices')
      .select('*')
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (e) {
    logger.warn('fetchNotices 실패:', e?.message);
    return [];
  }
};

/**
 * 공지 한 건 조회
 */
export const fetchNoticeById = async (id) => {
  try {
    const { data, error } = await supabase
      .from('notices')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  } catch (e) {
    logger.warn('fetchNoticeById 실패:', e?.message);
    return null;
  }
};

/**
 * 공지 작성
 */
export const createNotice = async (payload) => {
  try {
    const { data, error } = await supabase
      .from('notices')
      .insert({
        title: payload.title || '',
        category: payload.category || '공지',
        content: payload.content || '',
        is_pinned: !!payload.is_pinned,
      })
      .select('*')
      .single();
    if (error) throw error;
    return { success: true, notice: data };
  } catch (e) {
    logger.error('createNotice 실패:', e?.message);
    return { success: false, error: e?.message };
  }
};

/**
 * 공지 수정
 */
export const updateNotice = async (id, payload) => {
  try {
    const { data, error } = await supabase
      .from('notices')
      .update({
        ...(payload.title !== undefined && { title: payload.title }),
        ...(payload.category !== undefined && { category: payload.category }),
        ...(payload.content !== undefined && { content: payload.content }),
        ...(payload.is_pinned !== undefined && { is_pinned: payload.is_pinned }),
      })
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return { success: true, notice: data };
  } catch (e) {
    logger.error('updateNotice 실패:', e?.message);
    return { success: false, error: e?.message };
  }
};

/**
 * 공지 삭제
 */
export const deleteNotice = async (id) => {
  try {
    const { error } = await supabase.from('notices').delete().eq('id', id);
    if (error) throw error;
    return { success: true };
  } catch (e) {
    logger.error('deleteNotice 실패:', e?.message);
    return { success: false, error: e?.message };
  }
};
