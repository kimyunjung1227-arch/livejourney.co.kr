# Edge Function: analyze-tags

이미지를 OpenAI Vision(GPT-4o-mini)으로 분석해 여행/장소 해시태그를 생성합니다.  
**API 키는 Supabase에만 저장**하므로 프론트에는 노출되지 않습니다.

## 배포 및 API 키 설정

1. **Supabase CLI 설치** (최초 1회)
   - https://supabase.com/docs/guides/cli

2. **로그인 및 프로젝트 연결**
   ```bash
   npx supabase login
   npx supabase link --project-ref <프로젝트 ref>
   ```
   - 프로젝트 ref: Supabase 대시보드 URL의 `https://app.supabase.com/project/<ref>` 에서 확인

3. **Edge Function 배포**
   ```bash
   npx supabase functions deploy analyze-tags
   ```

4. **OpenAI API 키를 Supabase Secrets에 설정**
   - 대시보드: **Edge Functions** → **analyze-tags** → **Secrets** (또는 **Project Settings** → **Edge Functions** → **Secrets**)
   - `OPENAI_API_KEY` = OpenAI API 키 (https://platform.openai.com/api-keys)

   또는 CLI:
   ```bash
   npx supabase secrets set OPENAI_API_KEY=sk-...
   ```

이후 웹 앱에서 사진 추가 시 Supabase Edge Function이 호출되고, 키가 있으면 AI 태그가 생성됩니다.
