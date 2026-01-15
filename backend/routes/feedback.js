const express = require('express');
const router = express.Router();
const Feedback = require('../models/Feedback');
const { protect } = require('../middleware/auth');

// 피드백 생성 (인증 불필요 - 익명 가능)
router.post('/', async (req, res) => {
  try {
    const {
      type,
      category,
      title,
      description,
      screen,
      feature,
      username,
      email,
      attachments,
      userAgent,
      deviceInfo,
      browserInfo
    } = req.body;

    // 필수 필드 검증
    if (!type || !title || !description) {
      return res.status(400).json({
        success: false,
        message: '필수 필드가 누락되었습니다. (type, title, description)'
      });
    }

    // 피드백 생성
    const feedback = new Feedback({
      userId: req.user?._id || null, // 인증된 사용자면 userId 저장
      username: username || '익명',
      email: email || '',
      type,
      category: category || 'other',
      title: title.trim(),
      description: description.trim(),
      screen: screen || '',
      feature: feature || '',
      attachments: attachments || [],
      userAgent: userAgent || req.headers['user-agent'] || '',
      deviceInfo: deviceInfo || '',
      browserInfo: browserInfo || ''
    });

    await feedback.save();

    res.status(201).json({
      success: true,
      message: '피드백이 성공적으로 제출되었습니다.',
      feedback: {
        id: feedback._id,
        type: feedback.type,
        title: feedback.title,
        status: feedback.status
      }
    });
  } catch (error) {
    console.error('피드백 생성 오류:', error);
    res.status(500).json({
      success: false,
      message: '피드백 제출에 실패했습니다.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 피드백 목록 조회 (관리자용 - 인증 필요)
router.get('/', protect, async (req, res) => {
  try {
    const {
      type,
      status,
      priority,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // 필터 조건
    const filter = {};
    if (type) filter.type = type;
    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    // 정렬 조건
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // 페이지네이션
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const feedbacks = await Feedback.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('userId', 'username profileImage')
      .populate('respondedBy', 'username')
      .lean();

    const total = await Feedback.countDocuments(filter);

    res.json({
      success: true,
      feedbacks,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('피드백 목록 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '피드백 목록을 불러오는데 실패했습니다.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 피드백 상세 조회 (관리자용 - 인증 필요)
router.get('/:id', protect, async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id)
      .populate('userId', 'username profileImage email')
      .populate('respondedBy', 'username')
      .lean();

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: '피드백을 찾을 수 없습니다.'
      });
    }

    res.json({
      success: true,
      feedback
    });
  } catch (error) {
    console.error('피드백 상세 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '피드백을 불러오는데 실패했습니다.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 피드백 상태 업데이트 (관리자용 - 인증 필요)
router.patch('/:id/status', protect, async (req, res) => {
  try {
    const { status, adminResponse } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: '상태를 입력해주세요.'
      });
    }

    const updateData = {
      status,
      respondedAt: new Date(),
      respondedBy: req.user._id
    };

    if (adminResponse) {
      updateData.adminResponse = adminResponse.trim();
    }

    const feedback = await Feedback.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    )
      .populate('respondedBy', 'username')
      .lean();

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: '피드백을 찾을 수 없습니다.'
      });
    }

    res.json({
      success: true,
      message: '피드백 상태가 업데이트되었습니다.',
      feedback
    });
  } catch (error) {
    console.error('피드백 상태 업데이트 오류:', error);
    res.status(500).json({
      success: false,
      message: '피드백 상태 업데이트에 실패했습니다.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 피드백 공감 (인증 불필요)
router.post('/:id/upvote', async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id);

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: '피드백을 찾을 수 없습니다.'
      });
    }

    const userId = req.user?._id || null;
    
    if (userId) {
      // 인증된 사용자: 중복 체크
      const result = await feedback.addUpvote(userId);
      if (!result) {
        return res.json({
          success: false,
          message: '이미 공감하셨습니다.',
          upvotes: feedback.upvotes
        });
      }
    } else {
      // 비인증 사용자: 단순 카운트 증가 (중복 체크 불가)
      feedback.upvotes += 1;
      await feedback.save();
    }

    res.json({
      success: true,
      message: '공감이 추가되었습니다.',
      upvotes: feedback.upvotes
    });
  } catch (error) {
    console.error('피드백 공감 오류:', error);
    res.status(500).json({
      success: false,
      message: '공감 추가에 실패했습니다.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 피드백 통계 조회 (관리자용 - 인증 필요)
router.get('/stats/summary', protect, async (req, res) => {
  try {
    const stats = await Feedback.getStats();
    
    const total = await Feedback.countDocuments();
    const pending = await Feedback.countDocuments({ status: 'pending' });
    const resolved = await Feedback.countDocuments({ status: 'resolved' });
    
    res.json({
      success: true,
      stats: {
        total,
        pending,
        resolved,
        byStatus: stats.byStatus,
        byType: stats.byType
      }
    });
  } catch (error) {
    console.error('피드백 통계 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '통계를 불러오는데 실패했습니다.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
