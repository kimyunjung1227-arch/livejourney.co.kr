// 지역별 좌표 정보
// Kakao Map API와 연동하여 사용

export const regionCoordinates = {
  '서울': { lat: 37.5665, lng: 126.9780 },
  '부산': { lat: 35.1796, lng: 129.0756 },
  '대구': { lat: 35.8714, lng: 128.6014 },
  '인천': { lat: 37.4563, lng: 126.7052 },
  '광주': { lat: 35.1595, lng: 126.8526 },
  '대전': { lat: 36.3504, lng: 127.3845 },
  '울산': { lat: 35.5384, lng: 129.3114 },
  '세종': { lat: 36.4800, lng: 127.2890 },
  '경기': { lat: 37.4138, lng: 127.5183 },
  '강원': { lat: 37.8228, lng: 128.1555 },
  '충북': { lat: 36.8000, lng: 127.7000 },
  '충남': { lat: 36.5184, lng: 126.8000 },
  '전북': { lat: 35.7175, lng: 127.1530 },
  '전남': { lat: 34.8679, lng: 126.9910 },
  '경북': { lat: 36.4919, lng: 128.8889 },
  '경남': { lat: 35.4606, lng: 128.2132 },
  '제주': { lat: 33.4890, lng: 126.4983 }
};

// 지역명으로 좌표 가져오기
export const getCoordinates = (regionName) => {
  return regionCoordinates[regionName] || { lat: 37.5665, lng: 126.9780 }; // 기본값: 서울
};

// 별칭 (weather.js에서 사용)
export const getCoordinatesByRegion = getCoordinates;

// 좌표로 가장 가까운 지역 찾기
export const getNearestRegion = (lat, lng) => {
  let nearest = '서울';
  let minDistance = Infinity;
  
  Object.entries(regionCoordinates).forEach(([name, coords]) => {
    const distance = Math.sqrt(
      Math.pow(coords.lat - lat, 2) + Math.pow(coords.lng - lng, 2)
    );
    if (distance < minDistance) {
      minDistance = distance;
      nearest = name;
    }
  });
  
  return nearest;
};

