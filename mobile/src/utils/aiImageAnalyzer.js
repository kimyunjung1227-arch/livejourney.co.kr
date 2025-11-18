// AI 이미지 분석 및 해시태그 자동 생성
// 클라이언트 측에서 이미지를 분석하여 관련 해시태그를 생성합니다

// 한국 여행 관련 키워드 데이터베이스
const koreanTravelKeywords = {
  // 자연 & 풍경
  nature: ['자연', '풍경', '산', '바다', '강', '호수', '계곡', '폭포', '숲', '들판', '하늘', '구름', '일몰', '일출', '별'],
  
  // 계절
  seasons: ['봄', '여름', '가을', '겨울', '벚꽃', '단풍', '눈', '꽃'],
  
  // 음식
  food: ['맛집', '음식', '카페', '디저트', '커피', '한식', '양식', '일식', '중식', '분식', '길거리음식', '전통음식'],
  
  // 활동
  activities: ['여행', '나들이', '힐링', '휴식', '산책', '등산', '캠핑', '수영', '서핑', '스키', '드라이브'],
  
  // 장소 유형
  places: ['관광지', '명소', '공원', '해변', '항구', '시장', '박물관', '미술관', '사찰', '성당', '궁궐', '한옥마을'],
  
  // 분위기
  mood: ['아름다운', '평화로운', '활기찬', '낭만적인', '고즈넉한', '시원한', '따뜻한', '청량한'],
  
  // 지역별 특징
  regions: {
    서울: ['도시', '야경', '쇼핑', '문화', '한강', '궁궐'],
    부산: ['바다', '해운대', '광안리', '항구', '해산물', '야경'],
    제주: ['섬', '바다', '오름', '한라산', '감귤', '돌하르방'],
    강릉: ['바다', '커피', '해변', '경포대', '정동진'],
    전주: ['한옥', '한식', '비빔밥', '전통'],
    경주: ['역사', '문화재', '신라', '불국사', '첨성대']
  }
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

// React Native에서 이미지 분석 (간단한 버전)
export const analyzeImageForTags = async (imageUri, location = '', existingNote = '') => {
  try {
    console.log('🤖 AI 이미지 분석 시작...');
    console.log('  📍 위치:', location);
    console.log('  📝 노트:', existingNote);
    
    const keywords = new Set();
    
    // 우선순위 1: 위치 기반 키워드 (가장 중요!)
    const locationKeywords = generateLocationKeywords(location);
    if (locationKeywords.length > 0) {
      locationKeywords.slice(0, 4).forEach(kw => keywords.add(kw));
    }
    
    // 우선순위 2: 노트 내용 분석 (사용자가 직접 입력한 내용)
    if (existingNote && existingNote.trim().length > 0) {
      Object.values(koreanTravelKeywords).forEach(categoryKeywords => {
        if (Array.isArray(categoryKeywords)) {
          categoryKeywords.forEach(keyword => {
            if (existingNote.includes(keyword)) {
              keywords.add(keyword);
            }
          });
        }
      });
    }
    
    // 우선순위 3: 계절 키워드
    const seasonKeywords = detectSeason();
    if (location || existingNote) {
      seasonKeywords.slice(0, 2).forEach(kw => keywords.add(kw));
    }
    
    // 최소 키워드가 너무 적으면 기본값 추가
    if (keywords.size < 3) {
      keywords.add('여행');
      if (location) {
        keywords.add('추억');
      }
      keywords.add('풍경');
    }
    
    // AI 카테고리 자동 분류
    const categoryResult = detectCategory(keywords, location, existingNote, 0.5);
    
    // 중복 제거 및 배열 변환 (최대 8개로 제한)
    const finalTags = Array.from(keywords)
      .filter(tag => tag && tag.length >= 2)
      .slice(0, 8);
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ AI 분석 완료!');
    console.log('📍 위치:', location || '없음');
    console.log('📝 노트:', existingNote || '없음');
    console.log('🏷️ 추천 태그 (' + finalTags.length + '개):', finalTags);
    console.log('🎯 자동 카테고리:', categoryResult.categoryName);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    return {
      success: true,
      tags: finalTags,
      category: categoryResult.category,
      categoryName: categoryResult.categoryName,
      categoryIcon: categoryResult.icon,
      brightness: 0.5,
      colorAnalysis: {},
      metadata: {}
    };
    
  } catch (error) {
    console.error('❌ AI 분석 실패:', error);
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

// 추천 태그 가져오기 (카테고리별)
export const getRecommendedTags = (category) => {
  const recommendations = {
    all: ['여행', '풍경', '맛집', '카페', '힐링', '자연', '도시', '바다', '산', '추억'],
    nature: ['자연', '풍경', '산', '바다', '숲', '계곡', '힐링'],
    food: ['맛집', '음식', '카페', '디저트', '커피', '한식', '맛있는'],
    city: ['도시', '야경', '쇼핑', '카페', '문화', '건축'],
    activity: ['여행', '나들이', '등산', '캠핑', '드라이브', '힐링']
  };
  
  return recommendations[category] || recommendations.all;
};



