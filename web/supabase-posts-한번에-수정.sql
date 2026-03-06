-- ============================================================
-- Supabase 게시물 저장이 안 될 때 → 아래 전체 복사 후 SQL Editor에서 Run
-- (42501 RLS 위반, 23502 user_id NOT NULL, 23503 FK 위반 등 한 번에 해결)
-- ============================================================

-- 1) user_id 컬럼을 nullable로 (23502 방지)
ALTER TABLE public.posts ALTER COLUMN user_id DROP NOT NULL;

-- 2) user_id FK 제거 (23503 방지)
--    posts.user_id가 public.users를 참조하면 OAuth 로그인 사용자(auth.users) 저장 시 오류 발생.
--    FK를 제거하면 로그인 사용자 UUID를 그대로 저장할 수 있음.
ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS posts_user_id_fkey;

-- 3) 기존 RLS 정책 제거
DROP POLICY IF EXISTS allow_public_insert ON public.posts;
DROP POLICY IF EXISTS allow_public_select ON public.posts;
DROP POLICY IF EXISTS allow_public_delete ON public.posts;

-- 4) anon이 INSERT 가능 (조건 없음)
CREATE POLICY allow_public_insert ON public.posts
  FOR INSERT TO anon
  WITH CHECK (true);

-- 4) anon이 모든 행 SELECT 가능
CREATE POLICY allow_public_select ON public.posts
  FOR SELECT TO anon
  USING (true);

-- 6) anon이 게시물 삭제 가능 (프로필에서 사진 삭제 시 사용)
CREATE POLICY allow_public_delete ON public.posts
  FOR DELETE TO anon
  USING (true);

-- 완료 후 앱에서 다시 업로드해 보세요.
