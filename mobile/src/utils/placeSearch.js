/**
 * 장소 검색 유틸리티
 * 구체적인 장소 검색 지원 (예: "서울 남산타워")
 */

/**
 * 한국 주요 관광지 및 장소 좌표 데이터베이스
 */
const placeCoordinates = {
  // 서울
  '남산타워': { lat: 37.5512, lng: 126.9882 },
  'N서울타워': { lat: 37.5512, lng: 126.9882 },
  '서울 남산타워': { lat: 37.5512, lng: 126.9882 },
  '경복궁': { lat: 37.5796, lng: 126.9770 },
  '서울 경복궁': { lat: 37.5796, lng: 126.9770 },
  '명동': { lat: 37.5636, lng: 126.9834 },
  '서울 명동': { lat: 37.5636, lng: 126.9834 },
  '광장시장': { lat: 37.5707, lng: 127.0017 },
  '서울 광장시장': { lat: 37.5707, lng: 127.0017 },
  '북촌한옥마을': { lat: 37.5823, lng: 126.9850 },
  '서울 북촌한옥마을': { lat: 37.5823, lng: 126.9850 },
  '청계천': { lat: 37.5695, lng: 126.9788 },
  '서울 청계천': { lat: 37.5695, lng: 126.9788 },
  '덕수궁': { lat: 37.5658, lng: 126.9751 },
  '서울 덕수궁': { lat: 37.5658, lng: 126.9751 },
  '강남': { lat: 37.4979, lng: 127.0276 },
  '서울 강남': { lat: 37.4979, lng: 127.0276 },
  '이태원': { lat: 37.5345, lng: 126.9947 },
  '서울 이태원': { lat: 37.5345, lng: 126.9947 },
  '홍대': { lat: 37.5563, lng: 126.9239 },
  '서울 홍대': { lat: 37.5563, lng: 126.9239 },
  '인사동': { lat: 37.5716, lng: 126.9864 },
  '서울 인사동': { lat: 37.5716, lng: 126.9864 },
  
  // 부산
  '해운대': { lat: 35.1631, lng: 129.1636 },
  '부산 해운대': { lat: 35.1631, lng: 129.1636 },
  '광안리': { lat: 35.1532, lng: 129.1186 },
  '부산 광안리': { lat: 35.1532, lng: 129.1186 },
  '자갈치시장': { lat: 35.0977, lng: 129.0324 },
  '부산 자갈치시장': { lat: 35.0977, lng: 129.0324 },
  '태종대': { lat: 35.0547, lng: 129.0842 },
  '부산 태종대': { lat: 35.0547, lng: 129.0842 },
  
  // 제주
  '성산일출봉': { lat: 33.4584, lng: 126.9426 },
  '제주 성산일출봉': { lat: 33.4584, lng: 126.9426 },
  '한라산': { lat: 33.3617, lng: 126.5292 },
  '제주 한라산': { lat: 33.3617, lng: 126.5292 },
  '천지연폭포': { lat: 33.2444, lng: 126.5603 },
  '제주 천지연폭포': { lat: 33.2444, lng: 126.5603 },
  '성읍민속마을': { lat: 33.3867, lng: 126.8000 },
  '제주 성읍민속마을': { lat: 33.3867, lng: 126.8000 },
  
  // 경주
  '불국사': { lat: 35.7894, lng: 129.3317 },
  '경주 불국사': { lat: 35.7894, lng: 129.3317 },
  '석굴암': { lat: 35.7894, lng: 129.3317 },
  '경주 석굴암': { lat: 35.7894, lng: 129.3317 },
  '첨성대': { lat: 35.8347, lng: 129.2192 },
  '경주 첨성대': { lat: 35.8347, lng: 129.2192 },
  
  // 강원
  '남이섬': { lat: 37.7900, lng: 127.5250 },
  '춘천 남이섬': { lat: 37.7900, lng: 127.5250 },
  '설악산': { lat: 38.1217, lng: 128.4656 },
  '속초 설악산': { lat: 38.1217, lng: 128.4656 },
};

/**
 * 장소 검색 (로컬 데이터베이스 기반)
 * @param {string} query - 검색어
 * @returns {Array} 검색 결과 배열
 */
export const searchPlaces = (query) => {
  if (!query || query.trim() === '') {
    return [];
  }

  const q = query.trim();
  const results = [];

  // 정확한 매칭
  if (placeCoordinates[q]) {
    results.push({
      name: q,
      lat: placeCoordinates[q].lat,
      lng: placeCoordinates[q].lng,
      type: 'place',
    });
  }

  // 부분 매칭
  for (const [placeName, coords] of Object.entries(placeCoordinates)) {
    if (placeName.includes(q) || q.includes(placeName)) {
      if (!results.find(r => r.name === placeName)) {
        results.push({
          name: placeName,
          lat: coords.lat,
          lng: coords.lng,
          type: 'place',
        });
      }
    }
  }

  return results;
};

/**
 * 장소명으로 좌표 가져오기
 * @param {string} placeName - 장소명
 * @returns {Object|null} { lat, lng } 또는 null
 */
export const getCoordinatesByPlaceName = (placeName) => {
  if (!placeName || placeName.trim() === '') {
    return null;
  }

  // 정확한 매칭
  if (placeCoordinates[placeName]) {
    return placeCoordinates[placeName];
  }

  // 부분 매칭
  for (const [key, coords] of Object.entries(placeCoordinates)) {
    if (placeName.includes(key) || key.includes(placeName)) {
      return coords;
    }
  }

  return null;
};

