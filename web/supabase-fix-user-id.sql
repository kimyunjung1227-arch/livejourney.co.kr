-- Supabase 게시물 저장 오류(23502) 해결용
-- Supabase 대시보드 → SQL Editor → New query → 아래 문장 붙여넣기 → Run

ALTER TABLE posts ALTER COLUMN user_id DROP NOT NULL;
