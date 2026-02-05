const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { generateSmartTags } = require('../services/aiTagService');

// 업로드 라우터 설정
const uploadDir = path.join(__dirname, '../uploads/images');
const videoUploadDir = path.join(__dirname, '../uploads/videos');

// 로컬 저장소 생성 (개발용)
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
if (!fs.existsSync(videoUploadDir)) fs.mkdirSync(videoUploadDir, { recursive: true });

// Cloudinary 설정 가져오기
let cloudinaryStorage = null;
let cloudinaryVideoStorage = null;

try {
  // 환경 변수가 있을 때만 Cloudinary 사용
  if (process.env.CLOUDINARY_CLOUD_NAME) {
    const cloudinaryConfig = require('../config/cloudinary');
    cloudinaryStorage = cloudinaryConfig.storage;
    cloudinaryVideoStorage = cloudinaryConfig.videoStorage; // 비디오용 스토리지
    console.log('✅ Cloudinary 저장소 연결됨');
  } else {
    // console.log('⚠️ 호스팅 모드: 로컬 스토리지 사용 (CLOUDINARY_CLOUD_NAME 없음)');
  }
} catch (error) {
  console.error('Cloudinary 설정 로드 실패:', error);
}

// Multer 설정 (이미지) - Cloudinary 우선, 없으면 로컬
const imageStorage = cloudinaryStorage || multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'image-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Multer 설정 (비디오)
const videoDiskStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, videoUploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'video-' + uniqueSuffix + (path.extname(file.originalname) || '.mp4'));
  }
});

const videoStorage = cloudinaryVideoStorage || videoDiskStorage;

const upload = multer({
  storage: imageStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    // MIME 타입 체크가 더 안전함
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('이미지 파일만 업로드 가능합니다.'));
    }
  }
});

const uploadVideo = multer({
  storage: videoStorage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('동영상 파일만 업로드 가능합니다.'));
    }
  }
});

// 단일 이미지 업로드
router.post('/image', upload.single('image'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: '이미지를 선택해주세요.' });

    // Cloudinary인 경우 path가 URL임
    const imageUrl = req.file.path.startsWith('http')
      ? req.file.path
      : `/uploads/images/${req.file.filename}`;

    res.json({
      success: true,
      imageUrl,
      url: imageUrl,
      message: '이미지 업로드 성공'
    });
  } catch (error) {
    console.error('이미지 업로드 오류:', error);
    res.status(500).json({ success: false, error: '업로드 중 오류가 발생했습니다.' });
  }
});

// 단일 동영상 업로드
router.post('/video', uploadVideo.single('video'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: '동영상을 선택해주세요.' });

    const videoUrl = req.file.path.startsWith('http')
      ? req.file.path
      : `/uploads/videos/${req.file.filename}`;

    res.json({
      success: true,
      videoUrl,
      url: videoUrl,
      message: '동영상 업로드 성공'
    });
  } catch (error) {
    console.error('동영상 업로드 오류:', error);
    res.status(500).json({ success: false, error: '업로드 중 오류가 발생했습니다.' });
  }
});

// 다중 이미지 업로드
router.post('/images', upload.array('images', 10), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) return res.status(400).json({ success: false, error: '이미지를 선택해주세요.' });

    const imageUrls = req.files.map(file =>
      file.path.startsWith('http') ? file.path : `/uploads/images/${file.filename}`
    );

    res.json({
      success: true,
      imageUrls,
      message: `${imageUrls.length}장의 사진이 업로드되었습니다.`
    });
  } catch (error) {
    console.error('다중 업로드 오류:', error);
    res.status(500).json({ success: false, error: '업로드 중 오류가 발생했습니다.' });
  }
});

// AI 태그 분석 (이미지 + 위치 + EXIF) - /upload/analyze-tags
router.post('/analyze-tags', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: '이미지를 선택해주세요.' });
    }

    // Cloudinary인 경우 req.file.path는 URL일 수 있음 (서비스에서 URL 다운로드 지원)
    const imagePathOrUrl = req.file.path;
    const location = req.body.location || '';
    let exifData = null;
    if (req.body.exifData) {
      try {
        exifData = JSON.parse(req.body.exifData);
      } catch {
        exifData = null;
      }
    }

    const mimeTypeHint = req.file.mimetype || 'image/jpeg';
    const aiResult = await generateSmartTags(imagePathOrUrl, location, exifData, mimeTypeHint);

    if (!aiResult || !aiResult.success) {
      return res.json({
        success: false,
        tags: [],
        message: aiResult?.message || 'AI 태그 생성에 실패했습니다.'
      });
    }

    return res.json({
      success: true,
      tags: aiResult.tags || [],
      caption: aiResult.caption || null,
      method: aiResult.method || 'gemini-ai',
      message: 'AI 태그 생성 완료'
    });
  } catch (error) {
    console.error('AI 태그 분석 오류:', error);
    return res.status(500).json({
      success: false,
      tags: [],
      message: 'AI 태그 생성 중 오류가 발생했습니다.'
    });
  }
});

module.exports = router;
