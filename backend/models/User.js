const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  // 소셜 로그인 정보
  socialId: {
    type: String,
    sparse: true,
    index: true
  },
  socialProvider: {
    type: String,
    enum: ['local', 'kakao', 'naver', 'google'],
    default: 'local'
  },
  
  // 기본 정보
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 2,
    maxlength: 20
  },
  email: {
    type: String,
    sparse: true,
    lowercase: true,
    trim: true
  },
  
  // 프로필
  profileImage: {
    type: String,
    default: ''
  },
  bio: {
    type: String,
    maxlength: 200,
    default: ''
  },
  
  // 포인트 & 레벨
  points: {
    type: Number,
    default: 0,
    min: 0
  },
  level: {
    type: Number,
    default: 1,
    min: 1
  },
  
  // 뱃지
  badges: [{
    type: String
  }],
  
  // 통계
  stats: {
    totalPosts: {
      type: Number,
      default: 0
    },
    totalLikes: {
      type: Number,
      default: 0
    },
    totalComments: {
      type: Number,
      default: 0
    },
    visitedRegions: [{
      type: String
    }],
    consecutiveDays: {
      type: Number,
      default: 0
    },
    lastVisitDate: {
      type: Date
    }
  },
  
  // 설정
  settings: {
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'auto'
    },
    language: {
      type: String,
      enum: ['ko', 'en'],
      default: 'ko'
    },
    notifications: {
      push: {
        type: Boolean,
        default: true
      },
      email: {
        type: Boolean,
        default: true
      },
      marketing: {
        type: Boolean,
        default: false
      }
    },
    privacy: {
      profilePublic: {
        type: Boolean,
        default: true
      },
      showStats: {
        type: Boolean,
        default: true
      },
      allowMessages: {
        type: Boolean,
        default: true
      }
    }
  },
  
  // 계정 상태
  isActive: {
    type: Boolean,
    default: true
  },
  isBlocked: {
    type: Boolean,
    default: false
  },
  lastLogin: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// 인덱스
userSchema.index({ username: 1 });
userSchema.index({ email: 1 });
userSchema.index({ socialId: 1, socialProvider: 1 });
userSchema.index({ points: -1 });
userSchema.index({ level: -1 });
userSchema.index({ createdAt: -1 });

// 가상 필드: 다음 레벨까지 필요한 포인트
userSchema.virtual('nextLevelPoints').get(function() {
  return this.level * 1000;
});

// 가상 필드: 레벨 진행도 (%)
userSchema.virtual('levelProgress').get(function() {
  const currentLevelPoints = (this.level - 1) * 1000;
  const nextLevelPoints = this.level * 1000;
  const pointsInCurrentLevel = this.points - currentLevelPoints;
  const pointsNeededForLevel = nextLevelPoints - currentLevelPoints;
  return Math.min(100, Math.round((pointsInCurrentLevel / pointsNeededForLevel) * 100));
});

// 메서드: 포인트 추가
userSchema.methods.addPoints = async function(points, reason = '기타') {
  this.points += points;
  
  // 레벨 업 체크
  const newLevel = Math.floor(this.points / 1000) + 1;
  if (newLevel > this.level) {
    this.level = newLevel;
    console.log(`🎉 사용자 ${this.username}님이 레벨 ${newLevel}로 올랐습니다!`);
  }
  
  await this.save();
  return this.points;
};

// 메서드: 포인트 차감
userSchema.methods.deductPoints = async function(points, reason = '사용') {
  if (this.points < points) {
    throw new Error('포인트가 부족합니다.');
  }
  
  this.points -= points;
  await this.save();
  return this.points;
};

// 메서드: 뱃지 추가
userSchema.methods.addBadge = async function(badgeName) {
  if (!this.badges.includes(badgeName)) {
    this.badges.push(badgeName);
    await this.save();
  }
};

// 메서드: 방문 지역 추가
userSchema.methods.addVisitedRegion = async function(region) {
  if (!this.stats.visitedRegions.includes(region)) {
    this.stats.visitedRegions.push(region);
    await this.save();
  }
};

// 메서드: 연속 방문일 체크 및 업데이트
userSchema.methods.updateConsecutiveDays = async function() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const lastVisit = this.stats.lastVisitDate ? new Date(this.stats.lastVisitDate) : null;
  if (lastVisit) {
    lastVisit.setHours(0, 0, 0, 0);
  }
  
  const oneDayMs = 24 * 60 * 60 * 1000;
  
  if (!lastVisit) {
    // 첫 방문
    this.stats.consecutiveDays = 1;
  } else if (today.getTime() === lastVisit.getTime()) {
    // 오늘 이미 방문함 (변경 없음)
    return this.stats.consecutiveDays;
  } else if (today.getTime() - lastVisit.getTime() === oneDayMs) {
    // 어제 방문 → 연속 +1
    this.stats.consecutiveDays += 1;
  } else if (today.getTime() - lastVisit.getTime() > oneDayMs) {
    // 하루 이상 건너뜀 → 초기화
    this.stats.consecutiveDays = 1;
  }
  
  this.stats.lastVisitDate = today;
  await this.save();
  return this.stats.consecutiveDays;
};

// 메서드: 통계 업데이트
userSchema.methods.updateStats = async function(type, value = 1) {
  switch (type) {
    case 'post':
      this.stats.totalPosts += value;
      break;
    case 'like':
      this.stats.totalLikes += value;
      break;
    case 'comment':
      this.stats.totalComments += value;
      break;
  }
  await this.save();
};

// JSON 직렬화 시 민감한 정보 제외
userSchema.methods.toJSON = function() {
  const obj = this.toObject({ virtuals: true });
  delete obj.__v;
  return obj;
};

// 정적 메서드: 리더보드 조회
userSchema.statics.getLeaderboard = async function(limit = 10, sortBy = 'points') {
  const sort = {};
  sort[sortBy] = -1;
  
  return await this.find({ isActive: true, isBlocked: false })
    .sort(sort)
    .limit(limit)
    .select('username profileImage points level badges stats.totalPosts');
};

// 정적 메서드: 사용자 검색
userSchema.statics.searchUsers = async function(query, limit = 10) {
  return await this.find({
    $or: [
      { username: new RegExp(query, 'i') },
      { email: new RegExp(query, 'i') }
    ],
    isActive: true,
    isBlocked: false
  })
  .limit(limit)
  .select('username profileImage points level badges');
};

const User = mongoose.model('User', userSchema);

module.exports = User;
















