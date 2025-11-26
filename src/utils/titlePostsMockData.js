/**
 * 타이틀 획득 게시물 예시 데이터 생성
 * 타이틀을 획득한 사용자들의 게시물을 시연용으로 생성
 */

import { DAILY_TITLES } from './dailyTitleSystem';

// 타이틀 획득 사용자 ID와 타이틀 매핑
const titleUsers = {
  'user-title-1': DAILY_TITLES['실시간 0분 스피드 헌터'],
  'user-title-2': DAILY_TITLES['긴급 속보 특파원'],
  'user-title-3': DAILY_TITLES['번개 날씨 예보관'],
  'user-title-4': DAILY_TITLES['위험 경보의 수호자'],
  'user-title-5': DAILY_TITLES['의지의 핫플 실패러'],
  'user-title-6': DAILY_TITLES['새벽 개척자'],
  'user-title-7': DAILY_TITLES['현장 줄 서기 명인'],
  'user-title-8': DAILY_TITLES['날 것의 기록자'],
  'user-title-9': DAILY_TITLES['오늘 길잡이'],
  'user-title-10': DAILY_TITLES['오늘 지역 전문가'],
};

// 타이틀 게시물 예시 데이터
export const generateTitlePosts = () => {
  const posts = [];
  const now = new Date();
  
  Object.entries(titleUsers).forEach(([userId, title], index) => {
    // title이 undefined인 경우 건너뛰기
    if (!title || !title.name) {
      console.warn(`타이틀을 찾을 수 없습니다: ${userId}`);
      return;
    }
    
    // 각 타이틀별로 2-3개의 게시물 생성
    const postCount = 2 + (index % 2);
    
    for (let i = 0; i < postCount; i++) {
      const postTime = new Date(now.getTime() - (i * 30 * 60 * 1000)); // 30분 간격
      
      posts.push({
        id: `title-post-${userId}-${i}`,
        userId: userId,
        user: title.name.replace(/ .*/, '') + '님', // 타이틀 이름에서 사용자명 추출
        images: [
          getImageForTitle(title.name, i)
        ],
        videos: [],
        location: getLocationForTitle(title.name),
        region: getRegionForTitle(title.name),
        detailedLocation: getLocationForTitle(title.name),
        placeName: getLocationForTitle(title.name),
        note: getNoteForTitle(title.name, i),
        tags: getTagsForTitle(title.name),
        timestamp: postTime.toISOString(),
        createdAt: postTime.toISOString(),
        timeLabel: getTimeAgo(postTime),
        likes: 10 + Math.floor(Math.random() * 50),
        comments: [],
        questions: [],
        category: getCategoryForTitle(title.name),
        categoryName: getCategoryNameForTitle(title.name),
        aiLabels: [],
        coordinates: null,
      });
    }
  });
  
  return posts;
};

// 타이틀별 위치 생성
function getLocationForTitle(titleName) {
  const locations = {
    '실시간 0분 스피드 헌터': '서울 강남구 코엑스',
    '긴급 속보 특파원': '서울 종로구 경복궁',
    '번개 날씨 예보관': '부산 해운대구 해운대해수욕장',
    '위험 경보의 수호자': '제주 제주시 한라산',
    '의지의 핫플 실패러': '서울 마포구 홍대거리',
    '새벽 개척자': '서울 용산구 N서울타워',
    '현장 줄 서기 명인': '서울 송파구 롯데월드타워',
    '날 것의 기록자': '경주 보문단지',
    '오늘 길잡이': '전주 한옥마을',
    '오늘 지역 전문가': '서울 강남구 신사동',
  };
  return locations[titleName] || '서울 강남구';
}

// 타이틀별 지역 생성
function getRegionForTitle(titleName) {
  const regions = {
    '실시간 0분 스피드 헌터': '서울',
    '긴급 속보 특파원': '서울',
    '번개 날씨 예보관': '부산',
    '위험 경보의 수호자': '제주',
    '의지의 핫플 실패러': '서울',
    '새벽 개척자': '서울',
    '현장 줄 서기 명인': '서울',
    '날 것의 기록자': '경주',
    '오늘 길잡이': '전주',
    '오늘 지역 전문가': '서울',
  };
  return regions[titleName] || '서울';
}

// 타이틀별 메모 생성
function getNoteForTitle(titleName, index) {
  const notes = {
    '실시간 0분 스피드 헌터': [
      '지금 막 도착했어요! 실시간으로 공유합니다 🚀',
      '방금 전에 왔는데 사람이 많네요! 실시간 정보 공유합니다',
    ],
    '긴급 속보 특파원': [
      '⚠️ 긴급! 오늘 휴무입니다! 참고하세요',
      '🚨 교통 통제 중입니다! 우회하세요',
    ],
    '번개 날씨 예보관': [
      '🌧️ 갑자기 비가 와요! 우산 챙기세요',
      '⛈️ 번개가 치고 있어요! 안전하게 이동하세요',
    ],
    '위험 경보의 수호자': [
      '⚠️ 이 구간은 위험합니다! 조심하세요',
      '🚨 안전사고 주의! 이 경로는 피하세요',
    ],
    '의지의 핫플 실패러': [
      '😢 오늘 휴무네요... 참고하세요',
      '🚧 리모델링 중입니다. 방문 전 확인하세요',
    ],
    '새벽 개척자': [
      '🌙 새벽 3시에 도착! 조용하고 좋아요',
      '새벽에 왔는데 사람이 없어서 좋네요',
    ],
    '현장 줄 서기 명인': [
      '⏳ 현재 대기시간 약 30분입니다',
      '줄이 길어요! 약 1시간 정도 기다려야 할 것 같아요',
    ],
    '날 것의 기록자': [
      '📸 생생한 현장 사진입니다!',
      '실제로 이렇게 보여요! 현장 스케치',
    ],
    '오늘 길잡이': [
      '여기 정말 추천해요! 꼭 가보세요',
      '이 코스로 다니면 완벽해요! 가이드합니다',
    ],
    '오늘 지역 전문가': [
      '이 지역은 제가 전문이에요!',
      '이 지역의 숨은 명소를 알려드려요',
    ],
  };
  
  const titleNotes = notes[titleName] || ['여행 기록입니다'];
  return titleNotes[index % titleNotes.length];
}

// 타이틀별 태그 생성
function getTagsForTitle(titleName) {
  const tags = {
    '실시간 0분 스피드 헌터': ['실시간', '스피드', '최신정보'],
    '긴급 속보 특파원': ['긴급', '속보', '주의'],
    '번개 날씨 예보관': ['날씨', '실시간', '주의'],
    '위험 경보의 수호자': ['안전', '주의', '경고'],
    '의지의 핫플 실패러': ['휴무', '변동', '정보'],
    '새벽 개척자': ['새벽', '조용함', '특별'],
    '현장 줄 서기 명인': ['대기시간', '혼잡도', '실시간'],
    '날 것의 기록자': ['현장', '생생', '실제'],
    '오늘 길잡이': ['추천', '가이드', '코스'],
    '오늘 지역 전문가': ['지역', '전문가', '추천'],
  };
  return tags[titleName] || ['여행'];
}

// 타이틀별 카테고리 생성
function getCategoryForTitle(titleName) {
  if (titleName.includes('맛집')) return 'food';
  if (titleName.includes('날씨') || titleName.includes('속보')) return 'realtime';
  if (titleName.includes('가이드')) return 'guide';
  return 'spot';
}

// 타이틀별 카테고리명 생성
function getCategoryNameForTitle(titleName) {
  if (titleName.includes('맛집')) return '맛집';
  if (titleName.includes('날씨') || titleName.includes('속보')) return '실시간 정보';
  if (titleName.includes('가이드')) return '추천 장소';
  return '명소';
}

// 타이틀 데이터를 localStorage에 저장
export const initializeTitlePosts = () => {
  // 오늘 날짜 키
  const todayKey = new Date().toISOString().split('T')[0];
  
  // 기존 dailyTitles 가져오기
  const dailyTitles = JSON.parse(localStorage.getItem('dailyTitles') || '{}');
  
  if (!dailyTitles[todayKey]) {
    dailyTitles[todayKey] = {};
  }
  
  // 각 타이틀 사용자에게 타이틀 부여
  Object.entries(titleUsers).forEach(([userId, title]) => {
    dailyTitles[todayKey][userId] = {
      ...title,
      earnedAt: new Date().toISOString(),
    };
  });
  
  localStorage.setItem('dailyTitles', JSON.stringify(dailyTitles));
  
  // 타이틀 게시물 생성 및 저장
  const titlePosts = generateTitlePosts();
  const existingPosts = JSON.parse(localStorage.getItem('uploadedPosts') || '[]');
  
  // 중복 제거 (이미 존재하는 게시물은 제외)
  const newPosts = titlePosts.filter(post => 
    !existingPosts.some(existing => existing.id === post.id)
  );
  
  if (newPosts.length > 0) {
    const allPosts = [...existingPosts, ...newPosts];
    localStorage.setItem('uploadedPosts', JSON.stringify(allPosts));
    console.log(`✅ 타이틀 게시물 ${newPosts.length}개 생성 완료`);
  }
  
  return titlePosts;
};

// 타이틀별 이미지 생성
function getImageForTitle(titleName, index) {
  const imageMap = {
    // 모두 한국 배경 이미지 (서울/부산/경주/전주/제주 등)
    '실시간 0분 스피드 헌터': 'https://images.unsplash.com/photo-1524222717473-730000096953?w=800', // 서울 야경
    '긴급 속보 특파원': 'https://images.unsplash.com/photo-1526481280695-3c687fd543c0?w=800',       // 서울 도심 도로
    '번개 날씨 예보관': 'https://images.unsplash.com/photo-1600405267342-9a4b4011a18b?w=800',         // 번개/폭우
    '위험 경보의 수호자': 'https://images.unsplash.com/photo-1514890547357-a9ee288728e0?w=800',      // 한라산 등산로
    '의지의 핫플 실패러': 'https://images.unsplash.com/photo-1504615755583-2916b52192d7?w=800',      // 문 닫힌 가게 앞
    '새벽 개척자': 'https://images.unsplash.com/photo-1519129560278-aa6b4e57bb60?w=800',             // 남산/도심 새벽
    '현장 줄 서기 명인': 'https://images.unsplash.com/photo-1527490087278-9c75beedc1b9?w=800',       // 줄 서 있는 사람들
    '날 것의 기록자': 'https://images.unsplash.com/photo-1528460033278-a6ba57020470?w=800',          // 재래시장/스트리트
    '오늘 길잡이': 'https://images.unsplash.com/photo-1514222134-b57cbb8ce073?w=800',                // 전주 한옥마을 골목
    '오늘 지역 전문가': 'https://images.unsplash.com/photo-1524222717473-730000096953?w=800',        // 서울 시티뷰
  };
  return imageMap[titleName] || 'https://images.unsplash.com/photo-1524222717473-730000096953?w=800';
}

// getTimeAgo 함수 (간단한 버전)
function getTimeAgo(date) {
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (minutes < 1) return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;
  if (hours < 24) return `${hours}시간 전`;
  return `${days}일 전`;
}

