const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  // 작성자
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // 이미지
  images: [{
    type: String,
    required: true
  }],
  
  // 위치 정보
  location: {
    type: String,
    required: true,
    index: true
  },
  detailedLocation: {
    type: String,
    default: ''
  },
  placeName: {
    type: String,
    default: ''
  },
  address: {
    type: String,
    default: ''
  },
  coordinates: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      index: '2dsphere'
    }
  },
  
  // 태그 & 카테고리
  tags: [{
    type: String,
    trim: true
  }],
  category: {
    type: String,
    enum: ['bloom', 'landmark', 'food', 'scenic', 'general'],
    default: 'general',
    index: true
  },
  categoryName: {
    type: String,
    default: '일반'
  },
  
  // AI 분류 정보
  aiLabels: [{
    name: String,
    confidence: Number
  }],
  aiProcessed: {
    type: Boolean,
    default: false
  },
  
  // 본문
  note: {
    type: String,
    maxlength: 500,
    default: ''
  },
  
  // 시간 정보
  timeLabel: {
    type: String,
    enum: ['새벽', '오전', '점심', '오후', '저녁', '밤'],
    default: '오전'
  },
  visitedAt: {
    type: Date,
    default: Date.now
  },
  
  // 상호작용
  likes: {
    type: Number,
    default: 0,
    min: 0
  },
  likedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    text: {
      type: String,
      required: true,
      maxlength: 200
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // 게시물 상태
  isPublic: {
    type: Boolean,
    default: true
  },
  isNew: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  
  // 조회수
  views: {
    type: Number,
    default: 0
  },
  
  // 신고/차단
  reports: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  isBlocked: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 인덱스 설정
postSchema.index({ location: 1, category: 1 });
postSchema.index({ user: 1, createdAt: -1 });
postSchema.index({ tags: 1 });
postSchema.index({ likes: -1 }); // 인기 게시물용
postSchema.index({ createdAt: -1 }); // 최신순 정렬용
postSchema.index({ 'coordinates': '2dsphere' }); // 지리적 쿼리용

// 가상 필드: 댓글 수
postSchema.virtual('commentCount').get(function() {
  return this.comments ? this.comments.length : 0;
});

// 좋아요 추가 메서드
postSchema.methods.addLike = async function(userId) {
  if (!this.likedBy.includes(userId)) {
    this.likes += 1;
    this.likedBy.push(userId);
    await this.save();
    return true;
  }
  return false;
};

// 좋아요 취소 메서드
postSchema.methods.removeLike = async function(userId) {
  const index = this.likedBy.indexOf(userId);
  if (index > -1) {
    this.likes -= 1;
    this.likedBy.splice(index, 1);
    await this.save();
    return true;
  }
  return false;
};

// 댓글 추가 메서드
postSchema.methods.addComment = async function(userId, text) {
  this.comments.push({
    user: userId,
    text: text
  });
  await this.save();
  return this.comments[this.comments.length - 1];
};

// 조회수 증가 메서드
postSchema.methods.incrementViews = async function() {
  this.views += 1;
  await this.save();
  return this.views;
};

// 게시물 작성 후 사용자 통계 업데이트
postSchema.post('save', async function(doc) {
  if (doc.isNew) {
    const User = mongoose.model('User');
    await User.findByIdAndUpdate(doc.user, {
      $inc: { 'stats.totalPosts': 1 },
      $addToSet: { 'stats.visitedRegions': doc.location }
    });
  }
});

// 게시물 삭제 시 사용자 통계 업데이트
postSchema.pre('remove', async function(next) {
  const User = mongoose.model('User');
  await User.findByIdAndUpdate(this.user, {
    $inc: { 'stats.totalPosts': -1 }
  });
  next();
});

const Post = mongoose.model('Post', postSchema);

module.exports = Post;




















