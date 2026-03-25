// Supabase Edge Function: 이미지 → AI 해시태그 생성 (Google Gemini)
// API 키: Supabase 대시보드 → Edge Functions → Secrets 에 GEMINI_API_KEY 설정
// CORS: 브라우저 preflight(OPTIONS)에 200 + 아래 헤더 필요 (Supabase 권장와 동일)

const cors: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const GEMINI_MODEL = 'gemini-1.5-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
/** 502 방지: base64가 너무 크면 메모리/타임아웃 위험 (약 400KB 상한) */
const MAX_BASE64_LENGTH = 550000;
/** Gemini 호출 타임아웃 (ms) - Supabase 기본 60초 전에 종료 */
const GEMINI_TIMEOUT_MS = 50000;

interface RequestBody {
  imageBase64?: string;
  mimeType?: string;
  location?: string;
  exifData?: Record<string, unknown>;
}

const CATEGORY_MAP: Record<string, { name: string; icon: string }> = {
  bloom: { name: '개화정보', icon: '🌸' },
  food: { name: '맛집정보', icon: '🍜' },
  scenic: { name: '추천장소', icon: '🏞️' },
  landmark: { name: '명소', icon: '🏛️' },
  waiting: { name: '웨이팅', icon: '⏱️' },
  general: { name: '일반', icon: '📌' },
};
const CATEGORY_KEYS = Object.keys(CATEGORY_MAP);

function parseTagsFromContent(content: string): string[] {
  const trimmed = content.trim();
  const tags: string[] = [];
  const matches = trimmed.match(/#[^\s#]+/g) || trimmed.split(/[\s,，、]+/).filter(Boolean);
  for (const m of matches) {
    const t = m.replace(/^#+/, '').trim();
    if (t && t.length <= 20) tags.push(t);
  }
  return [...new Set(tags)].slice(0, 12);
}

function parseCategoryFromContent(content: string): { category: string; categoryName: string; categoryIcon: string } {
  const fallback = { category: 'scenic', categoryName: CATEGORY_MAP.scenic.name, categoryIcon: CATEGORY_MAP.scenic.icon };
  const lines = content.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  let category = '';
  let categoryName = '';
  for (const line of lines) {
    const upper = line.toUpperCase();
    if (upper.startsWith('CATEGORY:') || upper.startsWith('카테고리:')) {
      const val = line.replace(/^(?:CATEGORY|카테고리):\s*/i, '').trim().toLowerCase().split(/\s/)[0];
      if (CATEGORY_KEYS.includes(val)) category = val;
      break;
    }
  }
  for (const line of lines) {
    const upper = line.toUpperCase();
    if (upper.startsWith('NAME:') || upper.startsWith('이름:')) {
      categoryName = line.replace(/^(?:NAME|이름):\s*/i, '').trim().slice(0, 20);
      break;
    }
  }
  if (!category || !CATEGORY_MAP[category]) return fallback;
  const mapped = CATEGORY_MAP[category];
  return {
    category,
    categoryName: categoryName || mapped.name,
    categoryIcon: mapped.icon,
  };
}

function parseCategoriesFromContent(content: string): Array<{ category: string; categoryName: string; categoryIcon: string }> {
  const lines = content.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  for (const line of lines) {
    const upper = line.toUpperCase();
    if (upper.startsWith('CATEGORIES:')) {
      const raw = line.replace(/^CATEGORIES:\s*/i, '').trim();
      const parts = raw.split(/[,，\s]+/).map((s) => s.toLowerCase().trim()).filter(Boolean);
      const out: Array<{ category: string; categoryName: string; categoryIcon: string }> = [];
      const seen = new Set<string>();
      for (const p of parts) {
        if (!CATEGORY_KEYS.includes(p) || seen.has(p)) continue;
        seen.add(p);
        const m = CATEGORY_MAP[p];
        out.push({ category: p, categoryName: m.name, categoryIcon: m.icon });
      }
      if (out.length) return out;
    }
  }
  const single = parseCategoryFromContent(content);
  return [{ category: single.category, categoryName: single.categoryName, categoryIcon: single.categoryIcon }];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: cors });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ success: false, message: 'Method not allowed' }), {
      status: 405,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  if (!GEMINI_API_KEY) {
    return new Response(
      JSON.stringify({ success: false, message: 'GEMINI_API_KEY not configured in Edge Function secrets' }),
      { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const body: RequestBody = await req.json();
    const { imageBase64, mimeType = 'image/jpeg', location = '', exifData } = body;

    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return new Response(
        JSON.stringify({ success: false, message: 'imageBase64 required' }),
        { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }
    const base64Clean = imageBase64.replace(/\s/g, '');
    if (base64Clean.length > MAX_BASE64_LENGTH) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'image too large',
          detail: `base64 length ${base64Clean.length} exceeds ${MAX_BASE64_LENGTH}. Resize image on client.`,
        }),
        { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    const locationText = location ? `촬영/위치: ${location}.` : '';
    const exifText = exifData && typeof exifData === 'object'
      ? ` EXIF 등 메타: ${JSON.stringify(exifData).slice(0, 200)}.`
      : '';

    const prompt =
      '이 사진을 보고 여행/장소 기준으로 (1) 카테고리(복수 가능)와 (2) 해시태그를 아래 형식대로만 답하세요. 다른 설명 금지.\n\n' +
      'CATEGORIES: bloom, food, scenic, landmark, waiting, general 중 해당되는 것을 영어로 쉼표로 나열. ' +
      '꽃·벚꽃·개화가 보이면 bloom과 scenic을 함께 적어도 됨 (예: bloom,scenic). 웨이팅·줄이면 waiting. 음식·맛집이면 food.\n' +
      'TAGS: #태그1 #태그2 #태그3 ... 한글 위주 5~12개, 짧고 구체적으로\n\n' +
      locationText +
      exifText;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(GEMINI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  inlineData: {
                    mimeType: mimeType || 'image/jpeg',
                    data: base64Clean,
                  },
                },
                { text: prompt },
              ],
            },
          ],
          generationConfig: {
            maxOutputTokens: 500,
            temperature: 0.4,
          },
        }),
        signal: controller.signal,
      });
    } catch (fetchErr: unknown) {
      clearTimeout(timeoutId);
      const errMsg = fetchErr instanceof Error ? fetchErr.message : String(fetchErr);
      const isTimeout = errMsg.includes('abort') || errMsg.includes('timeout');
      return new Response(
        JSON.stringify({
          success: false,
          message: isTimeout ? 'Gemini request timeout' : 'Gemini request failed',
          detail: errMsg,
        }),
        { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }
    clearTimeout(timeoutId);

    if (!response.ok) {
      const err = await response.text();
      return new Response(
        JSON.stringify({ success: false, message: 'Gemini API error', detail: err.slice(0, 500) }),
        { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    let data: Record<string, unknown>;
    try {
      data = (await response.json()) as Record<string, unknown>;
    } catch (parseErr: unknown) {
      const errMsg = parseErr instanceof Error ? parseErr.message : String(parseErr);
      return new Response(
        JSON.stringify({ success: false, message: 'Invalid Gemini response', detail: errMsg }),
        { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    const candidates = data?.candidates as Array<{ content?: { parts?: Array<{ text?: string }> } }> | undefined;
    const textPart = candidates?.[0]?.content?.parts?.[0]?.text;
    const content = typeof textPart === 'string' ? textPart : '';
    const tags = parseTagsFromContent(content);
    const categories = parseCategoriesFromContent(content);
    const primary = categories[0] || parseCategoryFromContent(content);
    const hasTags = tags.length > 0;
    const hasCategory = categories.length > 0 && CATEGORY_KEYS.includes(primary.category);

    return new Response(
      JSON.stringify({
        success: hasTags || hasCategory,
        tags,
        categories,
        category: primary.category,
        categoryName: categories.map((c) => c.categoryName).join(', '),
        categoryIcon: primary.categoryIcon,
        caption: content.slice(0, 200) || null,
        method: 'supabase-edge-gemini',
      }),
      { headers: { ...cors, 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ success: false, message: e?.message || 'Internal error' }),
      { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } }
    );
  }
});
