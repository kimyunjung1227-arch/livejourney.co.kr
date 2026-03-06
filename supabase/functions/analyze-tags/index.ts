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

interface RequestBody {
  imageBase64?: string;
  mimeType?: string;
  location?: string;
  exifData?: Record<string, unknown>;
}

const CATEGORY_MAP: Record<string, { name: string; icon: string }> = {
  bloom: { name: '꽃·개화', icon: '🌸' },
  food: { name: '맛집·음식', icon: '🍽️' },
  scenic: { name: '풍경·명소', icon: '📍' },
  landmark: { name: '관광지', icon: '🏛️' },
  waiting: { name: '웨이팅·대기', icon: '⏳' },
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

    const locationText = location ? `촬영/위치: ${location}.` : '';
    const exifText = exifData && typeof exifData === 'object'
      ? ` EXIF 등 메타: ${JSON.stringify(exifData).slice(0, 200)}.`
      : '';

    const prompt =
      '이 사진을 보고 여행/장소 기준으로 (1) 카테고리와 (2) 해시태그를 아래 형식대로만 답하세요. 다른 설명 금지.\n\n' +
      'CATEGORY: 다음 중 정확히 하나만 영어로 입력 — bloom, food, scenic, landmark, waiting, general\n' +
      '  (bloom=꽃·개화, food=맛집·음식, scenic=풍경·명소, landmark=관광지·명소, waiting=웨이팅·대기, general=일반)\n' +
      'NAME: 위 카테고리에 맞는 한글 이름 한 줄 (예: 꽃·개화, 맛집·음식)\n' +
      'TAGS: #태그1 #태그2 #태그3 ... 한글 위주 5~12개, 짧고 구체적으로\n\n' +
      locationText +
      exifText;

    const response = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                inlineData: {
                  mimeType: mimeType || 'image/jpeg',
                  data: imageBase64,
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
    });

    if (!response.ok) {
      const err = await response.text();
      return new Response(
        JSON.stringify({ success: false, message: 'Gemini API error', detail: err }),
        { status: 502, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const textPart = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    const content = typeof textPart === 'string' ? textPart : '';
    const tags = parseTagsFromContent(content);
    const { category, categoryName, categoryIcon } = parseCategoryFromContent(content);
    const hasTags = tags.length > 0;
    const hasCategory = !!category && CATEGORY_KEYS.includes(category);

    return new Response(
      JSON.stringify({
        success: hasTags || hasCategory,
        tags,
        category,
        categoryName,
        categoryIcon,
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
