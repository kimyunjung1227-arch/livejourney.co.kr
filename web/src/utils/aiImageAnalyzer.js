// AI 이미지 분석 및 해시태그 자동 생성
// 클라이언트 측에서 이미지를 분석하여 관련 해시태그를 생성합니다
import { logger } from './logger';

// 한국 여행 관련 키워드 데이터베이스 (전문적이고 날씨 중심)
const koreanTravelKeywords = {
  // 날씨 관련 전문 태그
  weather: [
    '맑음', '맑은날씨', '청명한날씨', '화창한날씨', '쾌청한날씨',
    '흐림', '흐린날씨', '구름많음', '흐리고비', '우천',
    '비', '소나기', '장마', '강수', '우천주의',
    '눈', '강설', '눈발', '함박눈', '소낙눈',
    '바람', '강풍', '미풍', '시원한바람', '따뜻한바람',
    '안개', '짙은안개', '옅은안개', '안개주의',
    '습도', '건조', '습함', '쾌적한습도',
    '체감온도', '체감온도낮음', '체감온도높음', '쾌적한온도',
    '일출', '일몰', '황금시간대', '블루아워', '골든아워',
    '자외선', '자외선강함', '자외선주의', '자외선약함'
  ],
  
  // 자연 & 풍경 (전문적)
  nature: ['자연', '풍경', '산', '바다', '강', '호수', '계곡', '폭포', '숲', '들판', '하늘', '구름', '일몰', '일출', '별', '푸른하늘', '맑은하늘', '푸른바다', '푸른숲', '푸른산'],
  
  // 계절 (전문적)
  seasons: ['봄', '여름', '가을', '겨울', '벚꽃', '단풍', '눈', '꽃', '따뜻한햇살', '시원한바람', '고운꽃', '아름다운단풍', '하얀눈'],
  
  // 음식 (직관적 연상)
  food: ['맛집', '음식', '카페', '디저트', '커피', '한식', '양식', '일식', '중식', '분식', '길거리음식', '전통음식', '따뜻한음식', '시원한음식', '달콤한디저트', '향긋한커피'],
  
  // 활동 (직관적 연상)
  activities: ['여행', '나들이', '힐링', '휴식', '산책', '등산', '캠핑', '수영', '서핑', '스키', '드라이브', '편안한휴식', '즐거운여행', '힐링타임'],
  
  // 장소 유형 (직관적 연상)
  places: ['관광지', '명소', '공원', '해변', '항구', '시장', '박물관', '미술관', '사찰', '성당', '궁궐', '한옥마을', '아름다운명소', '고즈넉한곳', '활기찬곳'],
  
  // 분위기 (직관적 연상 - 더 풍부하게)
  mood: ['아름다운', '평화로운', '활기찬', '낭만적인', '고즈넉한', '시원한', '따뜻한', '청량한', '밝은', '화사한', '따스한', '상큼한', '포근한', '로맨틱한', '신선한', '깨끗한', '맑은', '푸른', '하얀', '화려한'],
  
  // 색상 기반 직관적 연상
  colors: {
    green: ['푸른', '초록', '자연', '숲', '풀', '신선한', '청량한'],
    blue: ['파란', '하늘', '바다', '시원한', '맑은', '깨끗한', '푸른하늘', '푸른바다'],
    red: ['빨간', '따뜻한', '활기찬', '화사한', '단풍', '가을'],
    yellow: ['노란', '따뜻한', '밝은', '화사한', '햇살', '따스한'],
    white: ['하얀', '깨끗한', '순수한', '눈', '구름'],
    dark: ['어두운', '야경', '밤', '로맨틱한', '신비로운']
  },
  
  // 지역별 특징
  regions: {
    서울: ['도시', '야경', '쇼핑', '문화', '한강', '궁궐', '활기찬도시', '화려한야경'],
    부산: ['바다', '해운대', '광안리', '항구', '해산물', '야경', '푸른바다', '시원한바다'],
    제주: ['섬', '바다', '오름', '한라산', '감귤', '돌하르방', '푸른바다', '아름다운섬'],
    강릉: ['바다', '커피', '해변', '경포대', '정동진', '시원한바다', '향긋한커피'],
    전주: ['한옥', '한식', '비빔밥', '전통', '고즈넉한', '전통적인'],
    경주: ['역사', '문화재', '신라', '불국사', '첨성대', '고즈넉한', '역사적인']
  }
};

// 이미지 파일에서 EXIF 데이터 읽기
const readExifData = async (file) => {
  return new Promise((resolve) => {
    try {
      // EXIF 라이브러리 없이 기본 정보만 추출
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve({
          fileSize: file.size,
          fileType: file.type,
          fileName: file.name,
          lastModified: new Date(file.lastModified)
        });
      };
      reader.readAsDataURL(file);
    } catch (error) {
      resolve({});
    }
  });
};

// 파일명에서 키워드 추출
const extractKeywordsFromFilename = (filename) => {
  const keywords = [];
  const name = filename.toLowerCase().replace(/\.(jpg|jpeg|png|gif|heic)$/i, '');
  
  // 일반적인 키워드 패턴
  if (name.includes('img') || name.includes('photo') || name.includes('pic')) {
    // 기본 이미지 파일명은 무시
  } else {
    // 파일명에서 의미있는 단어 추출 가능
    const words = name.split(/[_-\s]+/);
    keywords.push(...words.filter(w => w.length > 2));
  }
  
  return keywords;
};

// 이미지 밝기 분석 (초고속 분석)
const analyzeImageBrightness = async (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // 매우 작은 크기로 초고속 분석 (10x10)
          const size = 10;
          canvas.width = size;
          canvas.height = size;
          
          ctx.drawImage(img, 0, 0, size, size);
          const imageData = ctx.getImageData(0, 0, size, size);
          const data = imageData.data;
          
          let brightness = 0;
          // 4픽셀마다 샘플링 (더 빠름)
          for (let i = 0; i < data.length; i += 16) {
            const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
            brightness += avg;
          }
          brightness = brightness / (size * size / 4);
          
          resolve({
            brightness: brightness / 255,
            isDark: brightness < 80,
            isBright: brightness > 180
          });
        } catch (error) {
          resolve({ brightness: 0.5, isDark: false, isBright: false });
        }
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
};

// 위치 기반 키워드 생성
const generateLocationKeywords = (location) => {
  const keywords = [];
  
  if (!location) return keywords;
  
  // 지역별 특징 키워드
  Object.keys(koreanTravelKeywords.regions).forEach(region => {
    if (location.includes(region)) {
      keywords.push(...koreanTravelKeywords.regions[region]);
    }
  });
  
  // 일반적인 위치 관련 키워드
  if (location.includes('산') || location.includes('봉')) {
    keywords.push('산', '등산', '자연', '힐링');
  }
  if (location.includes('바다') || location.includes('해변') || location.includes('해수욕장')) {
    keywords.push('바다', '해변', '여름', '시원한');
  }
  if (location.includes('강') || location.includes('천')) {
    keywords.push('강', '자연', '힐링');
  }
  if (location.includes('공원')) {
    keywords.push('공원', '산책', '힐링', '자연');
  }
  if (location.includes('시장')) {
    keywords.push('시장', '맛집', '음식', '전통');
  }
  if (location.includes('한옥') || location.includes('고궁') || location.includes('궁')) {
    keywords.push('한옥', '전통', '역사', '문화');
  }
  if (location.includes('카페') || location.includes('cafe')) {
    keywords.push('카페', '커피', '디저트', '휴식');
  }
  
  return keywords;
};

// 계절 감지 (현재 날짜 기반)
const detectSeason = () => {
  const month = new Date().getMonth() + 1;
  
  if (month >= 3 && month <= 5) {
    return ['봄', '벚꽃', '꽃'];
  } else if (month >= 6 && month <= 8) {
    return ['여름', '바다', '시원한'];
  } else if (month >= 9 && month <= 11) {
    return ['가을', '단풍', '낙엽'];
  } else {
    return ['겨울', '눈', '따뜻한'];
  }
};

// 카테고리 자동 분류 (3가지)
const detectCategory = (keywords, location, note, brightness) => {
  const keywordList = Array.from(keywords);
  const allText = `${keywordList.join(' ')} ${location} ${note}`.toLowerCase();
  
  // 1. 개화 상황 🌸
  const bloomKeywords = ['꽃', '벚꽃', '개화', '봄', '매화', '진달래', '철쭉', '튤립', '유채', '수국', '코스모스', '해바라기'];
  if (bloomKeywords.some(kw => allText.includes(kw))) {
    return { category: 'bloom', categoryName: '개화 상황', icon: '🌸' };
  }
  
  // 2. 맛집 정보 🍜
  const foodKeywords = ['맛집', '음식', '카페', '커피', '디저트', '레스토랑', '식당', '먹', '요리', '메뉴', '빵', '케이크'];
  if (foodKeywords.some(kw => allText.includes(kw))) {
    return { category: 'food', categoryName: '맛집 정보', icon: '🍜' };
  }
  
  // 3. 추천 장소 🏞️ (기본값)
  return { category: 'scenic', categoryName: '추천 장소', icon: '🏞️' };
};

// 이미지 색상 분석 (고급)
const analyzeImageColors = async (imageFile) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // 50x50 크기로 샘플링 (더 정확한 분석)
          const size = 50;
          canvas.width = size;
          canvas.height = size;
          
          ctx.drawImage(img, 0, 0, size, size);
          const imageData = ctx.getImageData(0, 0, size, size);
          const data = imageData.data;
          
          let r = 0, g = 0, b = 0;
          let brightness = 0;
          const pixels = data.length / 4;
          
          // 모든 픽셀 분석
          for (let i = 0; i < data.length; i += 4) {
            r += data[i];
            g += data[i + 1];
            b += data[i + 2];
            brightness += (data[i] + data[i + 1] + data[i + 2]) / 3;
          }
          
          r = Math.floor(r / pixels);
          g = Math.floor(g / pixels);
          b = Math.floor(b / pixels);
          brightness = brightness / pixels;
          
          // 색상 특징 분석 (더 정교하게)
          const isGreen = g > r && g > b && g > 100; // 초록색 우세 (자연)
          const isBlue = b > r && b > g && b > 100; // 파란색 우세 (하늘, 바다)
          const isRed = r > g && r > b && r > 100; // 빨간색 우세 (단풍, 음식)
          const isYellow = r > 150 && g > 150 && b < 100; // 노란색 (가을, 음식)
          const isWhite = r > 200 && g > 200 && b > 200; // 흰색 (눈, 구름)
          const isPink = r > 200 && g > 150 && g < 200 && b > 150 && b < 200; // 분홍색 (벚꽃)
          
          // 색상 채도 계산
          const maxColor = Math.max(r, g, b);
          const minColor = Math.min(r, g, b);
          const saturation = maxColor === 0 ? 0 : (maxColor - minColor) / maxColor;
          const isVivid = saturation > 0.5; // 선명한 색상
          const isMuted = saturation < 0.3; // 차분한 색상
          
          resolve({
            brightness: brightness / 255,
            isDark: brightness < 80,
            isBright: brightness > 180,
            dominantColor: { r, g, b },
            isGreen,
            isBlue,
            isRed,
            isYellow,
            isWhite,
            isPink,
            saturation,
            isVivid,
            isMuted
          });
        } catch (error) {
          resolve({ brightness: 0.5, isDark: false, isBright: false });
        }
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(imageFile);
  });
};

// 메인 AI 분석 함수 (멀티모달 AI 우선, 실패 시 기존 방식)
export const analyzeImageForTags = async (imageFile, location = '', existingNote = '') => {
  try {
    logger.log('🤖 AI 이미지 분석 시작...');
    logger.debug('  📍 위치:', location);
    logger.debug('  📝 노트:', existingNote);
    
    // EXIF 데이터 추출 (멀티모달 AI에 전달하기 위해)
    const exifData = await readExifData(imageFile);
    
    // 1차 시도: 멀티모달 AI 기반 태그 생성 (백엔드 API)
    try {
      logger.log('🤖 멀티모달 AI 태그 생성 시도 중...');
      const { generateAITags } = await import('../api/aiTags');
      logger.debug('  API 함수 로드 완료');
      
      const aiResult = await generateAITags(imageFile, location, exifData);
      logger.debug('  API 호출 결과:', aiResult);
      
      if (aiResult && aiResult.success && aiResult.tags && aiResult.tags.length > 0) {
        logger.log('✅ 멀티모달 AI 태그 생성 성공!');
        logger.debug('  생성된 태그:', aiResult.tags);
        logger.debug('  이미지 묘사:', aiResult.caption?.substring(0, 100) + '...');
        
        // 카테고리 자동 분류
        const categoryResult = detectCategory(new Set(aiResult.tags), location, existingNote, { brightness: 0.5 });
        
        return {
          success: true,
          tags: aiResult.tags.slice(0, 10), // 최대 10개
          category: categoryResult.category,
          categoryName: categoryResult.categoryName,
          categoryIcon: categoryResult.icon,
          caption: aiResult.caption,
          method: 'multimodal-ai'
        };
      } else {
        logger.warn('⚠️ AI 결과가 비어있거나 실패:', {
          aiResult,
          success: aiResult?.success,
          tagsCount: aiResult?.tags?.length || 0
        });
      }
    } catch (aiError) {
      logger.warn('⚠️ 멀티모달 AI 실패, 기존 방식으로 폴백:');
      logger.warn('  에러:', aiError);
      logger.warn('  메시지:', aiError.message);
      logger.warn('  스택:', aiError.stack);
    }
    
    // 2차 시도: 기존 방식 (색상 분석 기반)
    logger.log('🔄 기존 방식으로 태그 생성...');
    const keywords = new Set();
    
    // 병렬 처리로 속도 향상
    const colorAnalysis = await analyzeImageColors(imageFile);
    
    logger.debug('🎨 색상 분석 결과:');
    logger.debug('  RGB:', colorAnalysis.dominantColor);
    logger.debug('  밝기:', (colorAnalysis.brightness * 100).toFixed(1) + '%');
    logger.debug('  초록색:', colorAnalysis.isGreen);
    logger.debug('  파란색:', colorAnalysis.isBlue);
    logger.debug('  빨간색:', colorAnalysis.isRed);
    logger.debug('  노란색:', colorAnalysis.isYellow);
    logger.debug('  어두움:', colorAnalysis.isDark);
    logger.debug('  밝음:', colorAnalysis.isBright);
    
    // 우선순위 1: 날씨 관련 키워드 (전문적)
    const currentMonth = new Date().getMonth() + 1;
    const currentHour = new Date().getHours();
    
    // 계절별 날씨 태그
    if (currentMonth >= 3 && currentMonth <= 5) {
      keywords.add('봄날씨');
      keywords.add('화창한날씨');
      if (currentHour >= 6 && currentHour <= 8) {
        keywords.add('일출');
        keywords.add('골든아워');
      } else if (currentHour >= 17 && currentHour <= 19) {
        keywords.add('일몰');
        keywords.add('황금시간대');
      }
    } else if (currentMonth >= 6 && currentMonth <= 8) {
      keywords.add('여름날씨');
      keywords.add('자외선주의');
      if (colorAnalysis.isBright) {
        keywords.add('맑은날씨');
        keywords.add('청명한날씨');
      }
    } else if (currentMonth >= 9 && currentMonth <= 11) {
      keywords.add('가을날씨');
      keywords.add('쾌청한날씨');
      if (currentHour >= 17 && currentHour <= 19) {
        keywords.add('일몰');
        keywords.add('골든아워');
      }
    } else {
      keywords.add('겨울날씨');
      if (colorAnalysis.isWhite) {
        keywords.add('강설');
        keywords.add('눈');
      }
    }
    
    // 밝기 기반 날씨 태그
    if (colorAnalysis.isBright && colorAnalysis.brightness > 0.7) {
      keywords.add('맑음');
      keywords.add('청명한날씨');
      keywords.add('화창한날씨');
    } else if (colorAnalysis.isDark && colorAnalysis.brightness < 0.4) {
      keywords.add('흐림');
      keywords.add('흐린날씨');
    }
    
    // 색상 기반 날씨 태그
    if (colorAnalysis.isBlue && (colorAnalysis.dominantColor?.b ?? 0) > 150) {
      keywords.add('맑은하늘');
      keywords.add('청명한날씨');
    }
    if (colorAnalysis.isWhite && colorAnalysis.brightness > 0.8) {
      keywords.add('구름많음');
    }
    
    // 우선순위 2: 위치 기반 키워드
    const locationKeywords = generateLocationKeywords(location);
    if (locationKeywords.length > 0) {
      locationKeywords.slice(0, 3).forEach(kw => keywords.add(kw));
    }
    
    // 우선순위 3: 노트 내용 분석 (사용자가 직접 입력한 내용) - 날씨 중심
    if (existingNote && existingNote.trim().length > 0) {
      const noteLower = existingNote.toLowerCase();
      
      // 날씨 관련 키워드 우선 추출
      koreanTravelKeywords.weather.forEach(weatherKeyword => {
        if (noteLower.includes(weatherKeyword.toLowerCase()) || existingNote.includes(weatherKeyword)) {
          keywords.add(weatherKeyword);
        }
      });
      
      // 날씨 관련 일반 표현 추출
      const weatherPatterns = {
        '맑음': ['맑', '화창', '청명', '쾌청', '밝', '선명'],
        '흐림': ['흐', '구름', '우중', '비올', '비가'],
        '비': ['비', '소나기', '장마', '우천', '강수'],
        '눈': ['눈', '강설', '눈발', '함박', '소낙'],
        '바람': ['바람', '강풍', '미풍', '시원한바람', '따뜻한바람'],
        '안개': ['안개', '짙은안개', '옅은안개'],
        '일출': ['일출', '새벽', '동틀', '아침'],
        '일몰': ['일몰', '석양', '황금', '저녁', '노을'],
        '자외선': ['자외선', '햇빛', '태양', '쨍쨍']
      };
      
      Object.entries(weatherPatterns).forEach(([weatherTag, patterns]) => {
        if (patterns.some(pattern => noteLower.includes(pattern))) {
          keywords.add(weatherTag);
        }
      });
      
      // 모든 키워드 카테고리에서 매칭
      Object.values(koreanTravelKeywords).forEach(categoryKeywords => {
        if (Array.isArray(categoryKeywords)) {
          categoryKeywords.forEach(keyword => {
            if (existingNote.includes(keyword)) {
              keywords.add(keyword);
            }
          });
        }
      });
      
      // 색상 기반 키워드도 노트에서 찾기
      if (koreanTravelKeywords.colors) {
        Object.values(koreanTravelKeywords.colors).flat().forEach(keyword => {
          if (existingNote.includes(keyword)) {
            keywords.add(keyword);
          }
        });
      }
    }
    
    // 우선순위 4: 색상 분석 (실제 이미지 특성) - 전문적 태그 생성
    const { r, g, b } = colorAnalysis.dominantColor || { r: 128, g: 128, b: 128 };
    const colorDiff = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(b - r));
    
    // 색상 차이가 뚜렷한 경우 (20 이상으로 완화하여 더 많은 태그 생성)
    if (colorDiff > 20) {
      if (colorAnalysis.isGreen && g > 100) {
        keywords.add('자연');
        keywords.add('숲');
        keywords.add('푸른');
        if (g > 150) {
          keywords.add('푸른숲');
          keywords.add('신선한');
        }
      }
      if (colorAnalysis.isBlue && b > 100) {
        keywords.add('하늘');
        if (b > 150) {
          keywords.add('푸른하늘');
          keywords.add('맑은하늘');
        }
        if (location.includes('바다') || location.includes('해')) {
          keywords.add('바다');
          if (b > 150) {
            keywords.add('푸른바다');
            keywords.add('시원한바다');
          }
        }
        keywords.add('시원한');
        keywords.add('청량한');
      }
      if (colorAnalysis.isRed && r > 120) {
        // 빨간색 + 가을철만 단풍 추천
        const month = new Date().getMonth() + 1;
        if (month >= 9 && month <= 11) {
          keywords.add('단풍');
          keywords.add('가을');
          keywords.add('아름다운단풍');
        } else {
          keywords.add('활기찬');
          keywords.add('화사한');
        }
        keywords.add('따뜻한');
      }
      if (colorAnalysis.isYellow && r > 120 && g > 120) {
        keywords.add('따뜻한');
        keywords.add('밝은');
        keywords.add('화사한');
        if (r > 180 && g > 180) {
          keywords.add('따뜻한햇살');
          keywords.add('따스한');
        }
      }
    }
    
    // 우선순위 5: 밝기 분석 - 날씨 관련 전문 태그
    if (colorAnalysis.isDark) {
      keywords.add('야경');
      keywords.add('밤');
      if (colorAnalysis.brightness < 0.3) {
        keywords.add('로맨틱한');
        keywords.add('신비로운');
      }
    } else if (colorAnalysis.isBright) {
      keywords.add('맑은');
      keywords.add('밝은');
      if (colorAnalysis.brightness > 0.8) {
        keywords.add('화사한');
        keywords.add('따뜻한햇살');
      }
    } else {
      keywords.add('편안한');
    }
    
    // 색상 조합 기반 직관적 태그
    if (colorAnalysis.isGreen && colorAnalysis.isBlue) {
      keywords.add('자연');
      keywords.add('시원한');
      keywords.add('청량한');
      keywords.add('푸른');
    }
    if (colorAnalysis.isRed && colorAnalysis.isYellow) {
      keywords.add('따뜻한');
      keywords.add('활기찬');
      keywords.add('화사한');
    }
    if (colorAnalysis.isPink) {
      keywords.add('벚꽃');
      keywords.add('봄');
      keywords.add('로맨틱한');
      keywords.add('예쁜');
    }
    if (colorAnalysis.isWhite && colorAnalysis.brightness > 0.8) {
      keywords.add('하얀');
      keywords.add('깨끗한');
      keywords.add('순수한');
    }
    
    // 색상 채도 기반 직관적 태그
    if (colorAnalysis.isVivid) {
      keywords.add('화려한');
      keywords.add('선명한');
      keywords.add('생생한');
    }
    if (colorAnalysis.isMuted) {
      keywords.add('차분한');
      keywords.add('고즈넉한');
      keywords.add('편안한');
    }
    
    // 우선순위 6: 계절 키워드 (위치/노트에 관련 내용이 있을 때만)
    const month = new Date().getMonth() + 1;
    const allText = `${location} ${existingNote}`.toLowerCase();
    
    if ((month >= 3 && month <= 5) && (allText.includes('꽃') || allText.includes('벚꽃'))) {
      keywords.add('봄');
    } else if ((month >= 6 && month <= 8) && allText.includes('바다')) {
      keywords.add('여름');
    } else if ((month >= 9 && month <= 11) && (allText.includes('단풍') || allText.includes('가을'))) {
      keywords.add('가을');
    } else if ((month >= 12 || month <= 2) && (allText.includes('눈') || allText.includes('겨울'))) {
      keywords.add('겨울');
    }
    
    // 우선순위 6: 파일명 분석 제외 (한국어만 사용하기 위해)
    // 파일명 분석은 영어 키워드가 나올 수 있어 제외
    
    // 최소 키워드가 너무 적으면 날씨 중심 기본값 추가
    if (keywords.size < 3) {
      keywords.add('여행');
      if (location) {
        keywords.add('추억');
      }
      // 날씨 기본 태그 추가
      if (colorAnalysis.isBright && colorAnalysis.brightness > 0.7) {
        keywords.add('맑음');
        keywords.add('화창한날씨');
      } else if (colorAnalysis.isDark && colorAnalysis.brightness < 0.4) {
        keywords.add('흐림');
        keywords.add('흐린날씨');
      } else {
        keywords.add('쾌적한날씨');
      }
    }
    
    // 날씨 관련 전문 태그 추가 (부족한 경우)
    if (keywords.size < 6) {
      const currentMonth = new Date().getMonth() + 1;
      if (currentMonth >= 3 && currentMonth <= 5) {
        keywords.add('봄날씨');
      } else if (currentMonth >= 6 && currentMonth <= 8) {
        keywords.add('여름날씨');
      } else if (currentMonth >= 9 && currentMonth <= 11) {
        keywords.add('가을날씨');
      } else {
        keywords.add('겨울날씨');
      }
    }
    
    // 8. AI 카테고리 자동 분류 ⭐
    const categoryResult = detectCategory(keywords, location, existingNote, colorAnalysis);
    
    // 9. 중복 제거 및 배열 변환 - 한국어만 필터링 (5개로 제한)
    const finalTags = Array.from(keywords)
      .filter(tag => {
        // 한국어만 허용 (한글, 공백, 숫자만)
        const isKorean = /^[가-힣\s\d]+$/.test(tag);
        return tag && tag.length >= 2 && isKorean;
      })
      .slice(0, 5); // 최대 5개로 제한
    
    logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logger.log('✅ AI 분석 완료! (기존 방식)');
    logger.debug('📍 위치:', location || '없음');
    logger.debug('📝 노트:', existingNote || '없음');
    logger.log('🏷️ 추천 태그 (' + finalTags.length + '개):', finalTags);
    logger.log('🎯 자동 카테고리:', categoryResult.categoryName);
    logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    return {
      success: true,
      tags: finalTags,
      category: categoryResult.category,
      categoryName: categoryResult.categoryName,
      categoryIcon: categoryResult.icon,
      brightness: colorAnalysis.brightness,
      colorAnalysis,
      metadata: exifData,
      method: 'color-analysis' // 기존 방식 표시
    };
    
  } catch (error) {
    logger.error('❌ AI 분석 실패:', error);
    return {
      success: false,
      tags: ['여행', '풍경', '추억'],
      category: 'scenic',
      categoryName: '추천 장소',
      categoryIcon: '🏞️',
      error: error.message
    };
  }
};

// 태그를 해시태그 형식으로 변환
export const formatAsHashtags = (tags) => {
  return tags.map(tag => tag.startsWith('#') ? tag : `#${tag}`);
};

// 추천 태그 가져오기 (카테고리별) - 모두 한국어 직관적 연상 단어
export const getRecommendedTags = (category) => {
  const recommendations = {
    all: ['여행', '풍경', '맛집', '카페', '힐링', '자연', '도시', '바다', '산', '추억', '아름다운', '편안한', '즐거운'],
    nature: ['자연', '풍경', '산', '바다', '숲', '계곡', '힐링', '푸른', '맑은', '시원한', '신선한'],
    food: ['맛집', '음식', '카페', '디저트', '커피', '한식', '맛있는', '따뜻한음식', '향긋한커피', '달콤한디저트'],
    city: ['도시', '야경', '쇼핑', '카페', '문화', '건축', '활기찬도시', '화려한야경'],
    activity: ['여행', '나들이', '등산', '캠핑', '드라이브', '힐링', '즐거운여행', '편안한휴식']
  };
  
  return recommendations[category] || recommendations.all;
};

