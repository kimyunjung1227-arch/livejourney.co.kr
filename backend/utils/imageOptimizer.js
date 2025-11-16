/**
 * 이미지 최적화 유틸리티
 * sharp 라이브러리 사용 (선택사항)
 * sharp가 없으면 원본 반환
 */

const fs = require('fs');
const path = require('path');

let sharp = null;
try {
  sharp = require('sharp');
  console.log('✅ Sharp 라이브러리 로드 성공 - 이미지 최적화 활성화');
} catch (error) {
  console.warn('⚠️ Sharp 라이브러리가 설치되지 않았습니다. 이미지 최적화가 비활성화됩니다.');
  console.warn('   설치: npm install sharp');
}

/**
 * 이미지 최적화 (리사이징 및 압축)
 * @param {Buffer} imageBuffer - 원본 이미지 버퍼
 * @param {Object} options - 최적화 옵션
 * @returns {Promise<Buffer>} - 최적화된 이미지 버퍼
 */
async function optimizeImage(imageBuffer, options = {}) {
  const {
    maxWidth = 1200,
    maxHeight = 1200,
    quality = 80,
    format = 'jpeg' // 'jpeg', 'webp', 'png'
  } = options;

  // Sharp가 없으면 원본 반환
  if (!sharp) {
    console.warn('⚠️ Sharp가 없어 원본 이미지를 반환합니다.');
    return imageBuffer;
  }

  try {
    let pipeline = sharp(imageBuffer);

    // 메타데이터 확인
    const metadata = await pipeline.metadata();
    console.log(`📸 원본 이미지: ${metadata.width}x${metadata.height}, ${metadata.format}, ${(imageBuffer.length / 1024).toFixed(2)}KB`);

    // 리사이징 (비율 유지)
    pipeline = pipeline.resize(maxWidth, maxHeight, {
      fit: 'inside',
      withoutEnlargement: true // 확대하지 않음
    });

    // 포맷 변환 및 압축
    if (format === 'webp') {
      pipeline = pipeline.webp({ quality });
    } else if (format === 'jpeg' || format === 'jpg') {
      pipeline = pipeline.jpeg({ quality, progressive: true });
    } else if (format === 'png') {
      pipeline = pipeline.png({ quality, compressionLevel: 9 });
    }

    const optimizedBuffer = await pipeline.toBuffer();
    const savedSize = ((imageBuffer.length - optimizedBuffer.length) / imageBuffer.length * 100).toFixed(1);
    
    console.log(`✅ 최적화 완료: ${(optimizedBuffer.length / 1024).toFixed(2)}KB (${savedSize}% 절감)`);
    
    return optimizedBuffer;
  } catch (error) {
    console.error('❌ 이미지 최적화 실패:', error);
    // 실패 시 원본 반환
    return imageBuffer;
  }
}

/**
 * 썸네일 생성
 * @param {Buffer} imageBuffer - 원본 이미지 버퍼
 * @param {number} size - 썸네일 크기 (정사각형)
 * @returns {Promise<Buffer>} - 썸네일 버퍼
 */
async function generateThumbnail(imageBuffer, size = 300) {
  if (!sharp) {
    return imageBuffer;
  }

  try {
    const thumbnail = await sharp(imageBuffer)
      .resize(size, size, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ quality: 75 })
      .toBuffer();

    return thumbnail;
  } catch (error) {
    console.error('❌ 썸네일 생성 실패:', error);
    return imageBuffer;
  }
}

/**
 * 여러 크기의 이미지 생성 (썸네일, 중간, 원본)
 * @param {Buffer} imageBuffer - 원본 이미지 버퍼
 * @returns {Promise<Object>} - { thumbnail, medium, large }
 */
async function generateMultipleSizes(imageBuffer) {
  if (!sharp) {
    return {
      thumbnail: imageBuffer,
      medium: imageBuffer,
      large: imageBuffer
    };
  }

  try {
    const [thumbnail, medium, large] = await Promise.all([
      generateThumbnail(imageBuffer, 300),
      optimizeImage(imageBuffer, { maxWidth: 800, quality: 80 }),
      optimizeImage(imageBuffer, { maxWidth: 1200, quality: 85 })
    ]);

    return { thumbnail, medium, large };
  } catch (error) {
    console.error('❌ 다중 크기 이미지 생성 실패:', error);
    return {
      thumbnail: imageBuffer,
      medium: imageBuffer,
      large: imageBuffer
    };
  }
}

/**
 * 파일에서 이미지 최적화
 * @param {string} filePath - 이미지 파일 경로
 * @param {Object} options - 최적화 옵션
 * @returns {Promise<Buffer>} - 최적화된 이미지 버퍼
 */
async function optimizeImageFromFile(filePath, options = {}) {
  const imageBuffer = fs.readFileSync(filePath);
  return optimizeImage(imageBuffer, options);
}

module.exports = {
  optimizeImage,
  generateThumbnail,
  generateMultipleSizes,
  optimizeImageFromFile
};


