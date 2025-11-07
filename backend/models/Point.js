const mongoose = require('mongoose');

// 포인트 히스토리 스키마
const pointHistorySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  points: {
    type: Number,
    required: true
  },
  reason: {
    type: String,
    required: true,
    enum: [
      '게시물 작성',
      '게시물 좋아요 받음',
      '댓글 작성',
      '댓글 좋아요 받음',
      '뱃지 획득',
      '출석 체크',
      '이벤트 참여',
      '추천인 가입',
      '프로필 완성',
      '첫 여행 기록',
      '연속 방문',
      '기타'
    ]
  },
  relatedPost: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post'
  },
  balance: {
    type: Number,
    required: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// 인덱스
pointHistorySchema.index({ user: 1, createdAt: -1 });
pointHistorySchema.index({ reason: 1 });

// 포인트 규칙 정의
const POINT_RULES = {
  '게시물 작성': 10,
  '게시물 좋아요 받음': 2,
  '댓글 작성': 3,
  '댓글 좋아요 받음': 1,
  '뱃지 획득': 50,
  '출석 체크': 5,
  '이벤트 참여': 20,
  '추천인 가입': 100,
  '프로필 완성': 30,
  '첫 여행 기록': 50,
  '연속 방문': 10
};

// 포인트 지급 정적 메서드
pointHistorySchema.statics.awardPoints = async function(userId, reason, metadata = {}) {
  const User = mongoose.model('User');
  const user = await User.findById(userId);
  
  if (!user) {
    throw new Error('사용자를 찾을 수 없습니다.');
  }
  
  const points = POINT_RULES[reason] || 0;
  
  if (points > 0) {
    const newBalance = await user.addPoints(points, reason);
    
    const history = await this.create({
      user: userId,
      points: points,
      reason: reason,
      balance: newBalance,
      metadata: metadata
    });
    
    return { points, balance: newBalance, history };
  }
  
  return null;
};

// 사용자의 포인트 히스토리 조회 정적 메서드
pointHistorySchema.statics.getUserHistory = async function(userId, limit = 20, offset = 0) {
  const history = await this.find({ user: userId })
    .sort({ createdAt: -1 })
    .skip(offset)
    .limit(limit)
    .populate('relatedPost', 'images location');
  
  const total = await this.countDocuments({ user: userId });
  
  return {
    history,
    total,
    hasMore: offset + limit < total
  };
};

// 포인트 통계 정적 메서드
pointHistorySchema.statics.getStatistics = async function(userId) {
  const stats = await this.aggregate([
    { $match: { user: mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: '$reason',
        count: { $sum: 1 },
        totalPoints: { $sum: '$points' }
      }
    },
    { $sort: { totalPoints: -1 } }
  ]);
  
  const totalPoints = stats.reduce((sum, item) => sum + item.totalPoints, 0);
  
  return {
    totalPoints,
    breakdown: stats
  };
};

const PointHistory = mongoose.model('PointHistory', pointHistorySchema);

module.exports = {
  PointHistory,
  POINT_RULES
};




















