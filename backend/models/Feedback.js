const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  // 작성자 정보 (익명 가능)
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  username: {
    type: String,
    default: '익명'
  },
  email: {
    type: String,
    default: ''
  },
  
  // 피드백 유형
  type: {
    type: String,
    enum: ['bug', 'feature', 'improvement', 'question', 'other'],
    required: true,
    index: true
  },
  category: {
    type: String,
    enum: ['ui', 'functionality', 'performance', 'content', 'other'],
    default: 'other',
    index: true
  },
  
  // 피드백 내용
  title: {
    type: String,
    required: true,
    maxlength: 200,
    trim: true
  },
  description: {
    type: String,
    required: true,
    maxlength: 2000,
    trim: true
  },
  
  // 관련 화면/기능
  screen: {
    type: String,
    default: '',
    trim: true
  },
  feature: {
    type: String,
    default: '',
    trim: true
  },
  
  // 우선순위 (관리자 설정)
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
    index: true
  },
  
  // 상태
  status: {
    type: String,
    enum: ['pending', 'reviewing', 'in-progress', 'resolved', 'rejected', 'duplicate'],
    default: 'pending',
    index: true
  },
  
  // 관리자 응답
  adminResponse: {
    type: String,
    default: '',
    maxlength: 1000
  },
  respondedAt: {
    type: Date
  },
  respondedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // 첨부 파일 (스크린샷 등)
  attachments: [{
    type: String // URL 또는 파일 경로
  }],
  
  // 메타데이터
  userAgent: {
    type: String,
    default: ''
  },
  deviceInfo: {
    type: String,
    default: ''
  },
  browserInfo: {
    type: String,
    default: ''
  },
  
  // 투표/공감
  upvotes: {
    type: Number,
    default: 0,
    min: 0
  },
  upvotedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // 중복 체크용 해시
  contentHash: {
    type: String,
    index: true
  }
}, {
  timestamps: true
});

// 인덱스 설정
feedbackSchema.index({ type: 1, status: 1 });
feedbackSchema.index({ createdAt: -1 });
feedbackSchema.index({ priority: -1, createdAt: -1 });
feedbackSchema.index({ status: 1, createdAt: -1 });

// 중복 체크용 해시 생성
feedbackSchema.pre('save', function(next) {
  if (this.isNew || this.isModified('title') || this.isModified('description')) {
    const crypto = require('crypto');
    const hashString = `${this.title}${this.description}${this.type}`;
    this.contentHash = crypto.createHash('md5').update(hashString).digest('hex');
  }
  next();
});

// 가상 필드: 응답 여부
feedbackSchema.virtual('isResponded').get(function() {
  return !!this.adminResponse && !!this.respondedAt;
});

// 메서드: 공감 추가
feedbackSchema.methods.addUpvote = async function(userId) {
  if (!this.upvotedBy.includes(userId)) {
    this.upvotes += 1;
    this.upvotedBy.push(userId);
    await this.save();
    return true;
  }
  return false;
};

// 메서드: 공감 취소
feedbackSchema.methods.removeUpvote = async function(userId) {
  const index = this.upvotedBy.indexOf(userId);
  if (index > -1) {
    this.upvotes -= 1;
    this.upvotedBy.splice(index, 1);
    await this.save();
    return true;
  }
  return false;
};

// 정적 메서드: 통계 조회
feedbackSchema.statics.getStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
  
  const typeStats = await this.aggregate([
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 }
      }
    }
  ]);
  
  return {
    byStatus: stats.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {}),
    byType: typeStats.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {})
  };
};

const Feedback = mongoose.model('Feedback', feedbackSchema);

module.exports = Feedback;
