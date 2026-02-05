/**
 * 멀티모달 AI 기반 해시태그 생성 서비스
 * 4단계 파이프라인: 이미지 분석 → 상황 묘사 → 태그 생성 → 필터링
 */

const axios = require('axios');
const fs = require('fs');

// 환경 변수에서 API 키 가져오기
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
// API 키가 있으면 자동으로 활성화 (별도 설정이 'false'가 아닌 경우)
const USE_AI = process.env.USE_AI_TAG_GENERATION !== 'false' && !!GEMINI_API_KEY;

// 디버깅: 환경 변수 확인
console.log('🔍 AI 태그 생성 설정 확인:');
console.log('  USE_AI:', USE_AI);
console.log('  GEMINI_API_KEY 존재:', !!GEMINI_API_KEY);
console.log('  GEMINI_API_KEY 길이:', GEMINI_API_KEY ? GEMINI_API_KEY.length : 0);

/**
 * 이미지를 Base64로 변환 (크기 제한 체크 포함)
 * Gemini API 제한: 최대 7MB (Base64 인코딩 전 원본 기준 약 5.25MB)
 */
const imageToBase64 = async (imagePathOrUrl, mimeTypeHint = 'image/jpeg') => {
  try {
    let imageBuffer;
    let mimeType = mimeTypeHint;

    // Cloudinary/외부 URL 지원
    if (typeof imagePathOrUrl === 'string' && /^https?:\/\//i.test(imagePathOrUrl)) {
      console.log('🌐 이미지 URL 다운로드:', imagePathOrUrl.substring(0, 120) + (imagePathOrUrl.length > 120 ? '...' : ''));
      const resp = await axios.get(imagePathOrUrl, {
        responseType: 'arraybuffer',
        timeout: 20000
      });
      imageBuffer = Buffer.from(resp.data);
      mimeType = resp.headers?.['content-type'] || mimeTypeHint;
    } else {
      imageBuffer = fs.readFileSync(imagePathOrUrl);
      mimeType = mimeTypeHint;
    }

    const fileSizeMB = imageBuffer.length / (1024 * 1024);

    console.log('📏 이미지 크기 확인:');
    console.log('  원본 크기:', fileSizeMB.toFixed(2), 'MB');
    console.log('  Base64 변환 후 예상 크기:', (fileSizeMB * 1.33).toFixed(2), 'MB');

    // Gemini API 제한: 원본 이미지 7MB (Base64 변환 전)
    // 너무 작은 안전 마진 때문에 5MB 초과 이미지는 모두 막히고 있었음
    // → 실제 제한에 가깝게 7MB로 완화 (대부분의 스마트폰 사진 허용)
    const MAX_IMAGE_SIZE_MB = 7;

    if (fileSizeMB > MAX_IMAGE_SIZE_MB) {
      console.warn(`⚠️ 이미지 크기가 너무 큼 (${fileSizeMB.toFixed(2)}MB > ${MAX_IMAGE_SIZE_MB}MB)`);
      console.warn('  Gemini API 제한: 최대 7MB (원본 기준)');
      console.warn('  이미지 리사이즈 또는 압축이 필요합니다.');
      return null;
    }

    const base64 = imageBuffer.toString('base64');
    const base64SizeMB = (base64.length * 3) / 4 / (1024 * 1024);
    console.log('  Base64 실제 크기:', base64SizeMB.toFixed(2), 'MB');

    return { base64, mimeType };
  } catch (error) {
    console.error('이미지 읽기 실패:', error);
    return null;
  }
};

/**
 * 1단계: 이미지 분석 및 상황 묘사 (Image Captioning) - Gemini 사용
 */
const generateImageCaption = async (imageBase64, mimeType = 'image/jpeg', location = '', exifData = null) => {
  console.log('🔍 generateImageCaption 호출됨');
  console.log('  USE_AI:', USE_AI);
  console.log('  GEMINI_API_KEY 존재:', !!GEMINI_API_KEY);
  console.log('  이미지 Base64 길이:', imageBase64 ? imageBase64.length : 0);
  console.log('  mime_type:', mimeType);

  if (!USE_AI || !GEMINI_API_KEY) {
    console.log('⚠️ generateImageCaption: 조건 불만족으로 종료');
    return null;
  }

  try {
    console.log('📡 Gemini API 호출 시작...');
    // EXIF 정보를 컨텍스트로 추가
    let contextInfo = '';
    if (exifData) {
      if (exifData.gpsCoordinates) {
        contextInfo += `\n위치 정보: 위도 ${exifData.gpsCoordinates.lat}, 경도 ${exifData.gpsCoordinates.lng}`;
      }
      if (exifData.photoDate) {
        const photoDate = new Date(exifData.photoDate);
        const dayOfWeek = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'][photoDate.getDay()];
        const hour = photoDate.getHours();
        const timeLabel = hour >= 5 && hour < 12 ? '오전' : hour >= 12 && hour < 18 ? '오후' : hour >= 18 && hour < 22 ? '저녁' : '밤';
        contextInfo += `\n촬영 시간: ${photoDate.toLocaleDateString('ko-KR')} ${dayOfWeek} ${timeLabel} ${hour}시`;
      }
    }
    if (location) {
      contextInfo += `\n사용자가 입력한 위치: ${location}`;
    }

    const prompt = `이 사진을 매우 상세하게 묘사해주세요. 다음 요소들을 포함해서 작성해주세요:

1. 주요 피사체 (사람, 사물, 건물 등)
2. 배경과 환경
3. 분위기와 감정 (평화로운, 활기찬, 신비로운 등)
4. 색감과 조명 (따뜻한, 차가운, 밝은, 어두운 등)
5. 계절감이나 시간대 느낌
6. 전체적인 인상과 느낌

한국어로 자연스럽고 감성적인 문단으로 작성해주세요.${contextInfo}`;

    // Gemini API 호출
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [
              {
                text: prompt
              },
              {
                inline_data: {
                  mime_type: mimeType || 'image/jpeg',
                  data: imageBase64
                }
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 500,
        }
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('📥 Gemini API 응답 받음');
    console.log('  응답 상태:', response.status);
    console.log('  응답 구조:', JSON.stringify(response.data, null, 2).substring(0, 1000));

    if (!response.data) {
      console.error('❌ 응답 데이터가 없음');
      return null;
    }

    if (!response.data.candidates || !response.data.candidates[0]) {
      console.error('❌ 응답에 candidates가 없음:', response.data);
      if (response.data.error) {
        console.error('  Gemini API 에러:', response.data.error);
      }
      return null;
    }

    if (!response.data.candidates[0].content || !response.data.candidates[0].content.parts || !response.data.candidates[0].content.parts[0]) {
      console.error('❌ 응답 구조가 올바르지 않음:', response.data.candidates[0]);
      return null;
    }

    const caption = response.data.candidates[0].content.parts[0].text;
    console.log('✅ Gemini 이미지 캡션 생성 성공');
    console.log('  캡션 길이:', caption.length);
    console.log('  캡션 미리보기:', caption.substring(0, 100));
    return caption;
  } catch (error) {
    console.error('❌ 이미지 캡션 생성 실패:');
    console.error('  에러 메시지:', error.message);
    console.error('  응답 데이터:', JSON.stringify(error.response?.data, null, 2));
    console.error('  상태 코드:', error.response?.status);
    console.error('  전체 에러:', error);
    return null;
  }
};

/**
 * 2단계: 묘사를 바탕으로 태그 생성 (Tag Generation with Prompt Engineering) - Gemini 사용
 */
const generateTagsFromCaption = async (caption, location = '', exifData = null) => {
  console.log('🔍 generateTagsFromCaption 호출됨');
  console.log('  캡션 존재:', !!caption);
  console.log('  캡션 길이:', caption?.length || 0);
  console.log('  GEMINI_API_KEY 존재:', !!GEMINI_API_KEY);

  if (!caption || !GEMINI_API_KEY) {
    console.log('⚠️ generateTagsFromCaption: 조건 불만족으로 종료');
    return null;
  }

  try {
    console.log('📡 Gemini API 호출 시작 (태그 생성)...');
    // EXIF 정보를 컨텍스트로 추가
    let contextInfo = '';
    if (exifData?.gpsCoordinates) {
      contextInfo += `\n\n위치 정보: 위도 ${exifData.gpsCoordinates.lat}, 경도 ${exifData.gpsCoordinates.lng}`;
    }
    if (location) {
      contextInfo += `\n사용자 입력 위치: ${location}`;
    }

    const prompt = `너는 인스타그램 인기 인플루언서야. 아래 사진 묘사를 바탕으로 사람들이 많이 검색하고, '좋아요'를 많이 받을 수 있는 매력적인 한국어 해시태그 20개를 생성해줘.

**중요 규칙:**
1. 각 카테고리별로 나누어서 작성해줘
2. 너무 긴 태그는 피하고 (최대 10자 이내)
3. 자연스럽고 트렌디한 표현 사용
4. 중복되지 않게

**카테고리별 분류:**

1. 객관적 사실 (장소, 사물 이름)
   예: 한강공원 반영샷 카페투어

2. 분위기/감성 (느낌, 색감)
   예: 청량한 비온뒤맑음 색감맛집 분위기깡패

3. 상황/행동
   예: 주말나들이 산책스타그램 카페수혈

4. 트렌드/유행어
   예: 핫플 인생샷건짐 데일리그램

**사진 묘사:**
${caption}${contextInfo}

위 묘사를 바탕으로 각 카테고리별로 5개씩, 총 20개의 해시태그를 생성해줘. # 기호 없이 태그만 나열해줘. 한 줄에 하나씩 태그만 작성해줘.`;

    // Gemini API 호출
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.8,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 500,
        }
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    const tagsText = response.data.candidates[0].content.parts[0].text;

    // 태그 추출 (다양한 형식 지원)
    const tags = tagsText
      .split(/\n|,|#/)
      .map(tag => tag.trim().replace(/^#/, '').replace(/[^\w가-힣\s]/g, ''))
      .filter(tag => tag.length >= 2 && tag.length <= 10)
      .filter(tag => /^[가-힣\s]+$/.test(tag)) // 한국어만
      .slice(0, 20);

    console.log('📥 Gemini API 응답 받음 (태그)');
    console.log('  원본 태그 텍스트:', tagsText.substring(0, 200));
    console.log('✅ Gemini 태그 생성 성공:', tags.length + '개');
    console.log('  생성된 태그:', tags);
    return tags;
  } catch (error) {
    console.error('❌ 태그 생성 실패:');
    console.error('  에러 메시지:', error.message);
    console.error('  응답 데이터:', JSON.stringify(error.response?.data, null, 2));
    console.error('  상태 코드:', error.response?.status);
    console.error('  전체 에러:', error);
    return null;
  }
};

/**
 * 3단계: 외부 데이터(Context) 주입 및 4단계: 결과 필터링
 */
const filterAndRefineTags = (tags, location = '', exifData = null) => {
  if (!tags || tags.length === 0) {
    return [];
  }

  // 중복 제거
  const uniqueTags = [...new Set(tags)];

  // 너무 긴 태그 제거 (10자 초과)
  const filteredTags = uniqueTags.filter(tag => tag.length <= 10);

  // 위치 정보가 있으면 관련 태그 우선순위 상승
  const locationTags = [];
  if (location) {
    const locationParts = location.split(' ');
    locationParts.forEach(part => {
      if (part.length >= 2 && part.length <= 6) {
        locationTags.push(part);
      }
    });
  }

  // EXIF 시간 정보 기반 태그 추가
  const timeTags = [];
  if (exifData?.photoDate) {
    const photoDate = new Date(exifData.photoDate);
    const hour = photoDate.getHours();
    const dayOfWeek = photoDate.getDay();

    if (hour >= 5 && hour < 12) {
      timeTags.push('오전', '아침');
    } else if (hour >= 12 && hour < 18) {
      timeTags.push('오후', '낮');
    } else if (hour >= 18 && hour < 22) {
      timeTags.push('저녁', '일몰');
    } else {
      timeTags.push('밤', '야경');
    }

    if (dayOfWeek === 0 || dayOfWeek === 6) {
      timeTags.push('주말');
    } else {
      timeTags.push('평일');
    }
  }

  // 최종 태그 조합 (위치 태그 + 시간 태그 + AI 태그)
  const finalTags = [
    ...locationTags.slice(0, 2),
    ...timeTags.slice(0, 2),
    ...filteredTags
  ].slice(0, 15); // 최대 15개

  return finalTags;
};

/**
 * 메인 함수: 멀티모달 AI 기반 태그 생성
 */
const generateSmartTags = async (imagePathOrUrl, location = '', exifData = null, mimeTypeHint = 'image/jpeg') => {
  try {
    // AI 사용 가능 여부 확인
    console.log('🔍 generateSmartTags 호출됨');
    console.log('  USE_AI:', USE_AI);
    console.log('  GEMINI_API_KEY 존재:', !!GEMINI_API_KEY);

    if (!USE_AI || !GEMINI_API_KEY) {
      console.log('⚠️ AI 태그 생성 비활성화 또는 API 키 없음 - 기본 방식 사용');
      console.log('  USE_AI:', USE_AI);
      console.log('  GEMINI_API_KEY:', GEMINI_API_KEY ? '존재함' : '없음');
      return {
        success: false,
        tags: [],
        caption: null,
        method: 'disabled',
        message: 'AI 태그 생성이 비활성화되어 있습니다. (GEMINI_API_KEY / USE_AI_TAG_GENERATION 설정 확인)'
      };
    }

    // 이미지를 Base64로 변환
    const imageData = await imageToBase64(imagePathOrUrl, mimeTypeHint);
    if (!imageData?.base64) {
      return {
        success: false,
        tags: [],
        caption: null,
        method: 'read-failed',
        message: '이미지 처리에 실패했습니다. (파일 경로/URL 또는 이미지 크기 제한 확인)'
      };
    }

    // 1단계: 이미지 분석 및 상황 묘사
    console.log('📸 1단계: 이미지 분석 및 상황 묘사 중...');
    const caption = await generateImageCaption(imageData.base64, imageData.mimeType, location, exifData);

    if (!caption) {
      console.log('⚠️ 이미지 캡션 생성 실패 - 기본 방식 사용');
      return {
        success: false,
        tags: [],
        caption: null,
        method: 'caption-failed',
        message: 'AI 이미지 분석(캡션) 생성에 실패했습니다.'
      };
    }

    console.log('✅ 이미지 묘사 완료:', caption.substring(0, 100) + '...');

    // 2단계: 묘사를 바탕으로 태그 생성
    console.log('🏷️ 2단계: 태그 생성 중...');
    const tags = await generateTagsFromCaption(caption, location, exifData);

    if (!tags || tags.length === 0) {
      console.log('⚠️ 태그 생성 실패 - 기본 방식 사용');
      return {
        success: false,
        tags: [],
        caption,
        method: 'tags-failed',
        message: 'AI 태그 생성에 실패했습니다.'
      };
    }

    console.log('✅ 태그 생성 완료:', tags.length + '개');

    // 3-4단계: 외부 데이터 주입 및 필터링
    const finalTags = filterAndRefineTags(tags, location, exifData);

    console.log('✅ 최종 태그:', finalTags);

    return {
      success: true,
      tags: finalTags,
      caption: caption,
      method: 'gemini-ai'
    };
  } catch (error) {
    console.error('❌ AI 태그 생성 실패:', error);
    return {
      success: false,
      tags: [],
      caption: null,
      method: 'error',
      message: 'AI 태그 생성 중 오류가 발생했습니다.'
    };
  }
};

module.exports = {
  generateSmartTags,
  generateImageCaption,
  generateTagsFromCaption,
  filterAndRefineTags
};
