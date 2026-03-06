-- ============================================================
-- 23503 오류: "Key is not present in table users" 해결
-- Supabase SQL Editor에서 이 한 줄만 실행하면 됨.
-- ============================================================
-- posts.user_id가 public.users를 참조할 때, OAuth 로그인 사용자(auth.users)는
-- public.users에 없어서 게시물 저장이 실패합니다. 아래로 FK를 제거하면 저장 가능합니다.

ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS posts_user_id_fkey;
