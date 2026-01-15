/**
 * 지역별 대표 명소/랜드마크 데이터
 * 각 지역의 대표적인 관광지, 명소들을 정의합니다
 */

export const REGION_LANDMARKS = {
  // 부산
  '부산': [
    { id: 'haeundae', name: '해운대', keywords: ['해운대', '해운대해수욕장', '해운대해변'] },
    { id: 'gwanganri', name: '광안리', keywords: ['광안리', '광안리해수욕장', '광안대교'] },
    { id: 'gamcheon', name: '감천문화마을', keywords: ['감천문화마을', '감천'] },
    { id: 'jagalchi', name: '자갈치시장', keywords: ['자갈치', '자갈치시장'] },
    { id: 'taejongdae', name: '태종대', keywords: ['태종대'] },
    { id: 'songdo', name: '송도', keywords: ['송도', '송도해수욕장'] },
    { id: 'yongdusan', name: '용두산공원', keywords: ['용두산', '용두산공원'] },
    { id: 'biff', name: '부산국제영화제거리', keywords: ['BIFF', '부산국제영화제', '영화제거리'] },
  ],

  // 경주
  '경주': [
    { id: 'bulguksa', name: '불국사', keywords: ['불국사'] },
    { id: 'hwangoingdan', name: '황리단길', keywords: ['황리단길', '황리단'] },
    { id: 'cheomseongdae', name: '첨성대', keywords: ['첨성대'] },
    { id: 'seokguram', name: '석굴암', keywords: ['석굴암'] },
    { id: 'woljeonggyo', name: '월정교', keywords: ['월정교'] },
    { id: 'gyeongju', name: '경주역사유적지구', keywords: ['경주역사유적', '역사유적지구'] },
    { id: 'donggung', name: '동궁과월지', keywords: ['동궁과월지', '안압지'] },
    { id: 'bomun', name: '보문관광단지', keywords: ['보문', '보문단지'] },
  ],

  // 서울
  '서울': [
    { id: 'namsan', name: '남산타워', keywords: ['남산', '남산타워', 'N서울타워'] },
    { id: 'gwanghwamun', name: '광화문', keywords: ['광화문', '경복궁'] },
    { id: 'myeongdong', name: '명동', keywords: ['명동'] },
    { id: 'hongdae', name: '홍대', keywords: ['홍대', '홍익대'] },
    { id: 'insadong', name: '인사동', keywords: ['인사동'] },
    { id: 'bukchon', name: '북촌한옥마을', keywords: ['북촌', '북촌한옥마을'] },
    { id: 'hanriver', name: '한강', keywords: ['한강', '한강공원'] },
    { id: 'itaewon', name: '이태원', keywords: ['이태원'] },
  ],

  // 제주
  '제주': [
    { id: 'jeju', name: '제주시', keywords: ['제주시'] },
    { id: 'seogwipo', name: '서귀포', keywords: ['서귀포', '서귀포시'] },
    { id: 'seongsan', name: '성산일출봉', keywords: ['성산일출봉', '성산'] },
    { id: 'hallasan', name: '한라산', keywords: ['한라산'] },
    { id: 'cheonjiyeon', name: '천지연폭포', keywords: ['천지연폭포'] },
    { id: 'hyupjae', name: '협재해수욕장', keywords: ['협재', '협재해수욕장'] },
    { id: 'hamdeok', name: '함덕해수욕장', keywords: ['함덕', '함덕해수욕장'] },
    { id: 'udo', name: '우도', keywords: ['우도'] },
  ],

  // 강릉
  '강릉': [
    { id: 'gangneung', name: '강릉시내', keywords: ['강릉', '강릉시내'] },
    { id: 'anjin', name: '안목해변', keywords: ['안목', '안목해변'] },
    { id: 'gyeongpo', name: '경포대', keywords: ['경포대', '경포해변'] },
    { id: 'oseam', name: '오세암', keywords: ['오세암'] },
    { id: 'jungdongjin', name: '정동진', keywords: ['정동진'] },
  ],

  // 전주
  '전주': [
    { id: 'hanok', name: '전주한옥마을', keywords: ['전주한옥마을', '한옥마을'] },
    { id: 'jeonju', name: '전주시내', keywords: ['전주', '전주시내'] },
    { id: 'deokjin', name: '덕진공원', keywords: ['덕진공원'] },
  ],

  // 여수
  '여수': [
    { id: 'yeosu', name: '여수시내', keywords: ['여수', '여수시내'] },
    { id: 'yeosu_night', name: '여수밤바다', keywords: ['여수밤바다', '밤바다'] },
    { id: 'hyangiram', name: '향일암', keywords: ['향일암'] },
  ],

  // 속초
  '속초': [
    { id: 'sokcho', name: '속초시내', keywords: ['속초', '속초시내'] },
    { id: 'seorak', name: '설악산', keywords: ['설악산'] },
    { id: 'abai', name: '아바이마을', keywords: ['아바이마을'] },
  ],

  // 인천
  '인천': [
    { id: 'incheon', name: '인천시내', keywords: ['인천', '인천시내'] },
    { id: 'songdo', name: '송도', keywords: ['송도', '송도국제도시'] },
    { id: 'ganghwa', name: '강화도', keywords: ['강화도'] },
    { id: 'wolmi', name: '월미도', keywords: ['월미도'] },
  ],

  // 대구
  '대구': [
    { id: 'dongseongro', name: '동성로', keywords: ['동성로'] },
    { id: 'kimkwangseok', name: '김광석길', keywords: ['김광석길', '김광석'] },
    { id: 'yaknyeongsi', name: '약령시', keywords: ['약령시', '약령시장'] },
    { id: 'palgongsan', name: '팔공산', keywords: ['팔공산'] },
  ],

  // 광주
  '광주': [
    { id: 'mudeungsan', name: '무등산', keywords: ['무등산'] },
    { id: 'yangdong', name: '양동시장', keywords: ['양동시장', '양동'] },
    { id: 'chungjangro', name: '충장로', keywords: ['충장로'] },
  ],

  // 대전
  '대전': [
    { id: 'expo', name: '엑스포과학공원', keywords: ['엑스포', '과학공원'] },
    { id: 'sungsimdang', name: '성심당', keywords: ['성심당'] },
    { id: 'hanbat', name: '한밭수목원', keywords: ['한밭수목원', '수목원'] },
    { id: 'daecheongho', name: '대청호', keywords: ['대청호', '대청댐'] },
  ],

  // 울산
  '울산': [
    { id: 'daewangam', name: '대왕암공원', keywords: ['대왕암공원', '대왕암'] },
    { id: 'ganjeolgut', name: '간절곶', keywords: ['간절곶'] },
    { id: 'ulsanbridge', name: '울산대교', keywords: ['울산대교'] },
    { id: 'taehwagang', name: '태화강', keywords: ['태화강', '태화강국가정원'] },
  ],

  // 세종
  '세종': [
    { id: 'hosu', name: '호수공원', keywords: ['호수공원'] },
    { id: 'dodam', name: '도담동', keywords: ['도담동'] },
  ],

  // 수원
  '수원': [
    { id: 'hwaseong', name: '화성', keywords: ['화성', '수원화성'] },
    { id: 'hwaseonghaenggung', name: '화성행궁', keywords: ['화성행궁', '행궁'] },
  ],

  // 용인
  '용인': [
    { id: 'everland', name: '에버랜드', keywords: ['에버랜드'] },
    { id: 'folkvillage', name: '한국민속촌', keywords: ['한국민속촌', '민속촌'] },
  ],

  // 성남
  '성남': [
    { id: 'pangyo', name: '판교', keywords: ['판교', '판교테크노밸리'] },
  ],

  // 고양
  '고양': [
    { id: 'ilsanlake', name: '일산호수공원', keywords: ['일산호수공원', '호수공원', '일산'] },
    { id: 'kintex', name: '킨텍스', keywords: ['킨텍스', '전시장'] },
  ],

  // 부천
  '부천': [
    { id: 'cartoon', name: '만화박물관', keywords: ['만화박물관', '애니메이션'] },
  ],

  // 포항
  '포항': [
    { id: 'homigot', name: '호미곶', keywords: ['호미곶', '일출'] },
  ],

  // 창원
  '창원': [
    { id: 'jinhae', name: '진해', keywords: ['진해', '벚꽃'] },
  ],
};

/**
 * 지역명으로 대표 명소 목록 가져오기
 */
export const getLandmarksByRegion = (regionName) => {
  if (!regionName) return [];
  return REGION_LANDMARKS[regionName] || [];
};

/**
 * 명소 ID로 명소 정보 가져오기
 */
export const getLandmarkById = (regionName, landmarkId) => {
  const landmarks = getLandmarksByRegion(regionName);
  return landmarks.find(landmark => landmark.id === landmarkId);
};

/**
 * 게시물이 선택된 명소와 일치하는지 확인
 */
export const isPostMatchingLandmarks = (post, selectedLandmarkIds, regionName) => {
  if (!selectedLandmarkIds || selectedLandmarkIds.length === 0) return true;
  
  const landmarks = getLandmarksByRegion(regionName);
  const selectedLandmarks = landmarks.filter(l => selectedLandmarkIds.includes(l.id));
  
  if (selectedLandmarks.length === 0) return true;
  
  // 게시물의 위치 정보
  const postLocation = (post.detailedLocation || post.placeName || post.location || '').toLowerCase();
  const postTags = (post.tags || []).join(' ').toLowerCase();
  const postNote = (post.note || post.content || '').toLowerCase();
  const searchText = `${postLocation} ${postTags} ${postNote}`;
  
  // 선택된 명소 중 하나라도 키워드와 일치하면 true
  return selectedLandmarks.some(landmark => {
    return landmark.keywords.some(keyword => {
      return searchText.includes(keyword.toLowerCase());
    });
  });
};
