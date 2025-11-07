const mongoose = require('mongoose');

// 뱃지 정의
const BADGES = {
  '첫 여행 기록': {
    name: '첫 여행 기록',
    description: '첫 번째 여행 사진을 업로드했어요!',
    icon: '🎯',
    gradient: 'from-blue-400 to-cyan-400',
    condition: { type: 'postCount', value: 1 },
    points: 50
  },
  '여행 탐험가': {
    name: '여행 탐험가',
    description: '10개의 여행 기록을 남겼어요!',
    icon: '🗺️',
    gradient: 'from-green-400 to-emerald-400',
    condition: { type: 'postCount', value: 10 },
    points: 100
  },
  '여행 마스터': {
    name: '여행 마스터',
    description: '50개의 여행 기록을 달성했어요!',
    icon: '⭐',
    gradient: 'from-yellow-400 to-orange-400',
    condition: { type: 'postCount', value: 50 },
    points: 500
  },
  '여행 전문가': {
    name: '여행 전문가',
    description: '100개의 여행 기록! 정말 대단해요!',
    icon: '👑',
    gradient: 'from-purple-400 to-pink-400',
    condition: { type: 'postCount', value: 100 },
    points: 1000
  },
  '인기 여행자': {
    name: '인기 여행자',
    description: '좋아요를 100개 받았어요!',
    icon: '❤️',
    gradient: 'from-rose-400 to-red-400',
    condition: { type: 'likesReceived', value: 100 },
    points: 200
  },
  '소통왕': {
    name: '소통왕',
    description: '댓글을 50개 작성했어요!',
    icon: '💬',
    gradient: 'from-indigo-400 to-blue-400',
    condition: { type: 'commentCount', value: 50 },
    points: 150
  },
  '지역 탐험가': {
    name: '지역 탐험가',
    description: '5개 이상의 지역을 여행했어요!',
    icon: '🌏',
    gradient: 'from-teal-400 to-cyan-400',
    condition: { type: 'regionCount', value: 5 },
    points: 300
  },
  '전국 일주': {
    name: '전국 일주',
    description: '10개 이상의 지역을 방문했어요!',
    icon: '🎊',
    gradient: 'from-fuchsia-400 to-purple-400',
    condition: { type: 'regionCount', value: 10 },
    points: 800
  },
  '개화 전문가': {
    name: '개화 전문가',
    description: '꽃 사진을 20개 올렸어요!',
    icon: '🌸',
    gradient: 'from-pink-400 to-rose-400',
    condition: { type: 'categoryCount', category: 'bloom', value: 20 },
    points: 200
  },
  '맛집 헌터': {
    name: '맛집 헌터',
    description: '맛집 사진을 20개 올렸어요!',
    icon: '🍜',
    gradient: 'from-amber-400 to-orange-400',
    condition: { type: 'categoryCount', category: 'food', value: 20 },
    points: 200
  },
  '랜드마크 마니아': {
    name: '랜드마크 마니아',
    description: '명소 사진을 20개 올렸어요!',
    icon: '🏛️',
    gradient: 'from-slate-400 to-zinc-400',
    condition: { type: 'categoryCount', category: 'landmark', value: 20 },
    points: 200
  },
  '성실한 여행자': {
    name: '성실한 여행자',
    description: '7일 연속 접속했어요!',
    icon: '📅',
    gradient: 'from-lime-400 to-green-400',
    condition: { type: 'consecutiveDays', value: 7 },
    points: 100
  }
};

// 뱃지 획득 기록 스키마
const rewardSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  badgeName: {
    type: String,
    required: true,
    enum: Object.keys(BADGES)
  },
  badgeData: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  pointsAwarded: {
    type: Number,
    default: 0
  },
  isNotified: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// 인덱스
rewardSchema.index({ user: 1, badgeName: 1 }, { unique: true }); // 중복 획득 방지
rewardSchema.index({ createdAt: -1 });

// 뱃지 확인 및 지급 정적 메서드
rewardSchema.statics.checkAndAwardBadges = async function(userId) {
  const User = mongoose.model('User');
  const Post = mongoose.model('Post');
  const { PointHistory } = require('./Point');
  
  const user = await User.findById(userId);
  if (!user) return [];
  
  const newBadges = [];
  
  // 사용자 통계 가져오기
  const postCount = await Post.countDocuments({ user: userId, isPublic: true });
  const posts = await Post.find({ user: userId, isPublic: true });
  
  // 지역 수 계산
  const regions = new Set(posts.map(p => p.location));
  const regionCount = regions.size;
  
  // 카테고리별 게시물 수 계산
  const categoryCounts = {};
  posts.forEach(post => {
    categoryCounts[post.category] = (categoryCounts[post.category] || 0) + 1;
  });
  
  // 좋아요 받은 수 계산
  const likesReceived = posts.reduce((sum, post) => sum + post.likes, 0);
  
  // 댓글 수 계산
  const commentCount = posts.reduce((sum, post) => sum + post.comments.length, 0);
  
  // 각 뱃지 조건 확인
  for (const [badgeName, badgeInfo] of Object.entries(BADGES)) {
    // 이미 획득한 뱃지인지 확인
    const alreadyHas = await this.findOne({ user: userId, badgeName });
    if (alreadyHas) continue;
    
    let shouldAward = false;
    
    switch (badgeInfo.condition.type) {
      case 'postCount':
        shouldAward = postCount >= badgeInfo.condition.value;
        break;
      case 'likesReceived':
        shouldAward = likesReceived >= badgeInfo.condition.value;
        break;
      case 'commentCount':
        shouldAward = commentCount >= badgeInfo.condition.value;
        break;
      case 'regionCount':
        shouldAward = regionCount >= badgeInfo.condition.value;
        break;
      case 'categoryCount':
        const catCount = categoryCounts[badgeInfo.condition.category] || 0;
        shouldAward = catCount >= badgeInfo.condition.value;
        break;
      // consecutiveDays는 별도 로직 필요
    }
    
    if (shouldAward) {
      // 뱃지 지급
      const reward = await this.create({
        user: userId,
        badgeName: badgeName,
        badgeData: badgeInfo,
        pointsAwarded: badgeInfo.points
      });
      
      // 사용자에게 뱃지 추가
      await user.addBadge(badgeName);
      
      // 포인트 지급
      await PointHistory.awardPoints(userId, '뱃지 획득', {
        badgeName: badgeName,
        points: badgeInfo.points
      });
      
      newBadges.push({
        badgeName,
        badgeData: badgeInfo,
        points: badgeInfo.points
      });
    }
  }
  
  return newBadges;
};

// 사용자의 모든 뱃지 조회
rewardSchema.statics.getUserBadges = async function(userId) {
  const badges = await this.find({ user: userId })
    .sort({ createdAt: -1 });
  
  return badges.map(b => ({
    ...b.toObject(),
    ...BADGES[b.badgeName]
  }));
};

const Reward = mongoose.model('Reward', rewardSchema);

module.exports = {
  Reward,
  BADGES
};




















