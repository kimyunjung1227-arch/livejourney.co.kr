const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const path = require('path');
const Post = require('../models/Post');
const User = require('../models/User');
const { generateSmartTags } = require('../services/aiTagService');

// MongoDB ObjectId 유효성 검사 (24자 hex)
const isValidObjectId = (id) => {
  if (!id || typeof id !== 'string') return false;
  return /^[a-fA-F0-9]{24}$/.test(id);
};

// 모든 태그 및 AI 라벨 집계 조회
router.get('/tags', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json({
        success: true,
        tags: [],
        message: 'Mock 모드: DB 연결이 없습니다.'
      });
    }

    const posts = await Post.find({ isPublic: true, isBlocked: false }).select('tags aiLabels');

    const tagMap = new Map();

    posts.forEach(post => {
      // 일반 태그 처리
      if (post.tags && Array.isArray(post.tags)) {
        post.tags.forEach(tag => {
          if (!tag) return;
          const normalized = tag.trim();
          if (!normalized) return;
          tagMap.set(normalized, (tagMap.get(normalized) || 0) + 1);
        });
      }

      // AI 라벨 처리
      if (post.aiLabels && Array.isArray(post.aiLabels)) {
        post.aiLabels.forEach(label => {
          if (!label || !label.name) return;
          const normalized = label.name.trim();
          if (!normalized) return;
          tagMap.set(normalized, (tagMap.get(normalized) || 0) + 1);
        });
      }
    });

    const tags = Array.from(tagMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 100); // 상위 100개만 반환

    res.json({
      success: true,
      tags,
      message: '태그 목록을 성공적으로 불러왔습니다.'
    });
  } catch (error) {
    console.error('태그 조회 오류:', error);
    res.status(500).json({ success: false, error: '태그 목록을 불러오는 중 오류가 발생했습니다.' });
  }
});

// 게시물 목록 조회
router.get('/', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json({ success: true, posts: [], message: 'DB 연결이 없습니다.' });
    }

    const { category, tag, sort = 'latest', limit = 20, page = 1 } = req.query;

    // 필터 조건 구성
    const query = { isPublic: true, isBlocked: false };
    if (category && category !== 'all') {
      query.category = category;
    }

    // 태그 필터링 추가
    if (tag) {
      query.$or = [
        { tags: tag },
        { 'aiLabels.name': tag }
      ];
    }

    // 정렬 조건 구성
    let sortOption = { createdAt: -1 }; // 최신순 (기본)
    if (sort === 'popular') {
      sortOption = { likes: -1, createdAt: -1 };
    }

    const posts = await Post.find(query)
      .sort(sortOption)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('user', 'name avatar') // 작성자 정보 포함
      .lean();

    res.json({
      success: true,
      posts,
      message: '게시물 목록을 성공적으로 불러왔습니다.'
    });
  } catch (error) {
    console.error('게시물 조회 오류:', error.message || error);
    res.status(500).json({ success: false, error: '게시물 목록을 불러오는 중 오류가 발생했습니다.' });
  }
});

// 게시물 상세 조회
router.get('/:id', async (req, res) => {
  try {
    const id = req.params.id;

    // DB 미연결 시: 200 + post null 반환 (프론트에서 localStorage 등 사용 가능)
    if (mongoose.connection.readyState !== 1) {
      return res.json({
        success: true,
        post: null,
        message: 'DB 연결이 없습니다. 로컬 데이터를 사용해 주세요.'
      });
    }

    // ID가 MongoDB ObjectId 형식이 아니면 404 (로컬 전용 ID일 수 있음)
    if (!isValidObjectId(id)) {
      return res.status(404).json({
        success: false,
        error: '게시물을 찾을 수 없습니다.',
        code: 'INVALID_ID'
      });
    }

    const post = await Post.findById(id)
      .populate('user', 'name avatar')
      .populate('comments.user', 'name avatar');

    if (!post) {
      return res.status(404).json({ success: false, error: '게시물을 찾을 수 없습니다.' });
    }

    // 조회수 증가 (실패해도 응답은 성공으로)
    try {
      post.views += 1;
      await post.save();
    } catch (saveErr) {
      console.warn('조회수 저장 실패 (무시):', saveErr.message);
    }

    res.json({
      success: true,
      post,
      message: '게시물 상세 정보'
    });
  } catch (error) {
    console.error('게시물 상세 조회 오류:', error.message || error);
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, error: '잘못된 게시물 ID입니다.' });
    }
    res.status(500).json({
      success: false,
      error: '게시물 상세 조회 중 오류가 발생했습니다.',
      ...(process.env.NODE_ENV !== 'production' && { detail: error.message })
    });
  }
});

// 게시물 생성
router.post('/', async (req, res) => {
  try {
    // TODO: 실제 인증 미들웨어가 붙으면 req.user.id 사용
    // 현재는 요청 바디에서 userId를 받거나(테스트용), 임의의 사용자 할당
    let userId = req.body.userId;

    // 테스트용: 사용자가 없으면 첫 번째 사용자 찾아서 할당
    if (!userId) {
      const user = await User.findOne();
      if (user) userId = user._id;
    }

    if (!userId) {
      return res.status(401).json({ success: false, error: '로그인이 필요합니다.' });
    }

    const {
      content,
      location,
      detailedLocation,
      coordinates,
      images,
      tags,
      category,
      placeName,
      exifData
    } = req.body;

    const newPost = new Post({
      user: userId,
      note: content,
      location: location || '알 수 없는 위치',
      detailedLocation,
      placeName,
      coordinates: coordinates
        ? {
            type: 'Point',
            coordinates: [coordinates.lng, coordinates.lat]
          }
        : undefined,
      images: images || [],
      tags: tags || [],
      category: category || 'general'
    });

    // 🔹 AI 태그 생성 시도 (GEMINI_API_KEY가 설정된 경우만)
    try {
      const primaryImage = Array.isArray(images) && images.length > 0 ? images[0] : null;
      if (primaryImage && typeof primaryImage === 'string' && primaryImage.startsWith('/uploads/')) {
        const imagePath = path.join(__dirname, '..', primaryImage);
        const aiResult = await generateSmartTags(imagePath, location, exifData || null);

        if (aiResult && aiResult.success && Array.isArray(aiResult.tags)) {
          // aiLabels 필드에 저장
          newPost.aiLabels = aiResult.tags.map((t) => ({
            name: t,
            confidence: 1
          }));
          newPost.aiProcessed = true;

          // 기존 tags와 합쳐서 중복 제거
          const baseTags = Array.isArray(newPost.tags)
            ? newPost.tags.map((t) => String(t).replace(/^#+/, '').trim())
            : [];
          const merged = Array.from(new Set([...baseTags, ...aiResult.tags].filter(Boolean)));
          newPost.tags = merged;
        }
      }
    } catch (aiError) {
      console.error('AI 태그 생성 중 오류 (게시물 저장은 계속 진행):', aiError.message || aiError);
    }

    await newPost.save();

    res.status(201).json({
      success: true,
      post: newPost,
      message: '게시물이 등록되었습니다.'
    });
  } catch (error) {
    console.error('게시물 생성 오류:', error);
    res.status(500).json({ success: false, error: '게시물 등록 중 오류가 발생했습니다.' });
  }
});

// 게시물 삭제
router.delete('/:id', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ success: false, error: 'DB 연결이 없습니다.' });
    }
    if (!isValidObjectId(req.params.id)) {
      return res.status(404).json({ success: false, error: '게시물을 찾을 수 없습니다.' });
    }
    const post = await Post.findByIdAndDelete(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, error: '게시물을 찾을 수 없습니다.' });
    }
    res.json({ success: true, message: '게시물이 삭제되었습니다.' });
  } catch (error) {
    console.error('게시물 삭제 오류:', error.message || error);
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, error: '잘못된 게시물 ID입니다.' });
    }
    res.status(500).json({ success: false, error: '게시물 삭제 중 오류가 발생했습니다.' });
  }
});

module.exports = router;
