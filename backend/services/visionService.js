// Google Vision API 또는 간단한 이미지 분석 서비스
// 카테고리: 3가지로 단순화

/**
 * 이미지를 분석하여 카테고리와 라벨을 반환
 * @param {Buffer} imageBuffer - 이미지 파일 버퍼
 * @returns {Object} - { category, categoryName, labels }
 */
const analyzeImage = async (imageBuffer) => {
  try {
    console.log('🤖 이미지 분석 시작...');
    
    // 간단한 로컬 분석 (Google Vision API 없이)
    // 실제로는 파일 확장자, 메타데이터 등을 기반으로 추측
    
    // 랜덤하게 카테고리 할당 (실제 프로덕션에서는 ML 모델 사용)
    const categories = [
      { id: 'scenic', name: '추천장소', keywords: ['풍경', '자연', '경치', '뷰'] },
      { id: 'food', name: '맛집정보', keywords: ['음식', '맛집', '레스토랑', '카페'] },
      { id: 'bloom', name: '개화정보', keywords: ['꽃', '벚꽃', '개화', '봄'] },
      { id: 'waiting', name: '웨이팅', keywords: ['대기', '줄', '웨이팅'] }
    ];
    
    // 랜덤 선택 (실제로는 이미지 분석)
    const randomCategory = categories[Math.floor(Math.random() * categories.length)];
    
    const result = {
      category: randomCategory.id,
      categoryName: randomCategory.name,
      labels: randomCategory.keywords.slice(0, 5),
      confidence: 0.85
    };
    
    console.log('✅ 이미지 분석 완료:', result);
    return result;
    
  } catch (error) {
    console.error('❌ 이미지 분석 실패:', error);
    
    // 실패 시 기본값
    return {
      category: 'scenic',
      categoryName: '추천장소',
      labels: ['여행', '풍경'],
      confidence: 0.5
    };
  }
};

/**
 * 파일 경로에서 이미지 분석
 * @param {String} filePath - 이미지 파일 경로
 */
const analyzeImageFromPath = async (filePath) => {
  try {
    const fs = require('fs');
    const imageBuffer = fs.readFileSync(filePath);
    return await analyzeImage(imageBuffer);
  } catch (error) {
    console.error('파일 읽기 실패:', error);
    return {
      category: 'scenic',
      categoryName: '추천장소',
      labels: ['여행'],
      confidence: 0.5
    };
  }
};

module.exports = {
  analyzeImage,
  analyzeImageFromPath
};

