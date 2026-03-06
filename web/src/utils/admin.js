/**
 * 관리자 권한 체크
 * - VITE_ADMIN_EMAILS (쉼표 구분)에 포함된 이메일이면 관리자
 * - Supabase admin_users 테이블에 user_id가 있으면 관리자
 */

import React from 'react';
import { supabase } from '../utils/supabaseClient';

const ADMIN_EMAILS_KEY = 'VITE_ADMIN_EMAILS';

/** 환경변수에서 관리자 이메일 목록 (쉼표 구분) */
const getAdminEmails = () => {
  const raw = import.meta.env[ADMIN_EMAILS_KEY] || '';
  if (!raw || typeof raw !== 'string') return [];
  return raw.split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);
};

/**
 * 이메일 기준 관리자 여부 (동기, 빠른 체크용)
 * @param {{ email?: string } | null} user
 */
export const isAdminByEmail = (user) => {
  if (!user) return false;
  const emails = getAdminEmails();
  const email = (user.email || '').trim().toLowerCase();
  return emails.length > 0 && email && emails.includes(email);
};

/**
 * Supabase admin_users 테이블에서 관리자 여부 조회
 * @param {string} userId - auth user id (UUID)
 * @returns {Promise<boolean>}
 */
export const fetchIsAdmin = async (userId) => {
  if (!userId) return false;
  try {
    const { data } = await supabase
      .from('admin_users')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle();
    return !!data;
  } catch {
    return false;
  }
};

/**
 * 관리자 여부 (이메일 또는 DB) - 비동기
 * @param {{ id?: string, email?: string } | null} user
 * @returns {Promise<boolean>}
 */
export const isAdmin = async (user) => {
  if (!user) return false;
  if (isAdminByEmail(user)) return true;
  if (user.id) return fetchIsAdmin(user.id);
  return false;
};

/**
 * React에서 관리자 여부 사용 (이메일 + admin_users 테이블)
 * @param {{ id?: string, email?: string } | null} user
 * @returns {{ isAdmin: boolean, loading: boolean }}
 */
export const useAdminState = (user) => {
  const [state, setState] = React.useState({ isAdmin: false, loading: !!user });
  React.useEffect(() => {
    if (!user) {
      setState({ isAdmin: false, loading: false });
      return;
    }
    if (isAdminByEmail(user)) {
      setState({ isAdmin: true, loading: false });
      return;
    }
    let cancelled = false;
    fetchIsAdmin(user.id).then((ok) => {
      if (!cancelled) setState({ isAdmin: ok, loading: false });
    });
    return () => { cancelled = true; };
  }, [user?.id, user?.email]);
  return state;
};
