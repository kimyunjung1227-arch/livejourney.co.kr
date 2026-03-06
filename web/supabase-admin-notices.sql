-- ============================================================
-- 관리자 + 공지사항 테이블 생성
-- Supabase 대시보드 → SQL Editor에서 이 스크립트 전체 실행
-- ============================================================

-- 1) 관리자 계정 테이블
CREATE TABLE IF NOT EXISTS public.admin_users (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2) 공지사항 테이블
CREATE TABLE IF NOT EXISTS public.notices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT DEFAULT '공지',
  content TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3) RLS 활성화
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;

-- 4) admin_users: 본인 행만 조회
DROP POLICY IF EXISTS admin_users_select_own ON public.admin_users;
CREATE POLICY admin_users_select_own ON public.admin_users
  FOR SELECT USING (auth.uid() = user_id);

-- 5) notices: 모두 읽기 가능
DROP POLICY IF EXISTS notices_select_all ON public.notices;
CREATE POLICY notices_select_all ON public.notices
  FOR SELECT USING (true);

-- 6) notices: 관리자만 쓰기/수정/삭제
DROP POLICY IF EXISTS notices_insert_admin ON public.notices;
CREATE POLICY notices_insert_admin ON public.notices
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS notices_update_admin ON public.notices;
CREATE POLICY notices_update_admin ON public.notices
  FOR UPDATE USING (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS notices_delete_admin ON public.notices;
CREATE POLICY notices_delete_admin ON public.notices
  FOR DELETE USING (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()));

-- 7) 공지 수정 시 updated_at 자동 갱신
CREATE OR REPLACE FUNCTION public.set_notices_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS notices_updated_at ON public.notices;
CREATE TRIGGER notices_updated_at
  BEFORE UPDATE ON public.notices
  FOR EACH ROW EXECUTE PROCEDURE public.set_notices_updated_at();

-- ============================================================
-- 관리자 추가 방법 (둘 중 하나 선택)
-- ============================================================
-- 방법 1) Supabase 대시보드에서: Authentication → Users 에서
--         관리자로 지정할 사용자의 UUID를 복사한 뒤 아래 실행
--         INSERT INTO public.admin_users (user_id) VALUES ('복사한-UUID-여기');
--
-- 방법 2) 앱 환경변수로: .env에 다음 추가 후 해당 이메일로 로그인한 사용자가 관리자
--         VITE_ADMIN_EMAILS=admin@example.com,another@example.com
-- ============================================================
