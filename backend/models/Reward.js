const mongoose = require('mongoose');

/**
 * 라이브저니 뱃지 시스템 v3.0
 * 단순하고 명확한 달성 기준만!
 */

const BADGES = {
  // 시작 단계
  '첫 걸음': {
    name: '첫 걸음',
    description: '첫 번째 여행 사진을 올렸어요!',
    icon: '🌱',
    category: '시작',
    difficulty: 1,
    gradient: 'from-green-400 to-emerald-500',
    condition: { type: 'postCount', value: 1 }
  },
  
  '여행 시작': {
    name: '여행 시작',
    description: '3개의 여행 기록을 남겼어요',
    icon: '🎒',
    category: '시작',
    difficulty: 1,
    gradient: 'from-blue-400 to-cyan-500',
    condition: { type: 'postCount', value: 3 }
  },
  
  '첫 좋아요': {
    name: '첫 좋아요',
    description: '다른 사람이 내 사진을 좋아해줬어요!',
    icon: '💖',
    category: '시작',
    difficulty: 1,
    gradient: 'from-pink-400 to-rose-500',
    condition: { type: 'likesReceived', value: 1 }
  },
  
  // 활동 단계
  '여행 애호가': {
    name: '여행 애호가',
    description: '10개의 여행 기록을 남겼어요',
    icon: '✈️',
    category: '활동',
    difficulty: 2,
    gradient: 'from-sky-400 to-blue-500',
    condition: { type: 'postCount', value: 10 }
  },
  
  '사진 수집가': {
    name: '사진 수집가',
    description: '25개의 여행 사진을 모았어요',
    icon: '📷',
    category: '활동',
    difficulty: 2,
    gradient: 'from-purple-400 to-violet-500',
    condition: { type: 'postCount', value: 25 }
  },
  
  '인기 여행자': {
    name: '인기 여행자',
    description: '좋아요를 50개 받았어요!',
    icon: '⭐',
    category: '활동',
    difficulty: 2,
    gradient: 'from-yellow-400 to-orange-500',
    condition: { type: 'likesReceived', value: 50 }
  },
  
  // 전문가 단계
  '여행 전문가': {
    name: '여행 전문가',
    description: '50개의 여행 기록! 진정한 여행 전문가예요',
    icon: '🏆',
    category: '전문가',
    difficulty: 3,
    gradient: 'from-amber-400 to-yellow-600',
    condition: { type: 'postCount', value: 50 }
  },
  
  '슈퍼 인기': {
    name: '슈퍼 인기',
    description: '좋아요를 100개나 받았어요!',
    icon: '🌟',
    category: '전문가',
    difficulty: 3,
    gradient: 'from-yellow-500 to-amber-600',
    condition: { type: 'likesReceived', value: 100 }
  },
  
  '지역 탐험가': {
    name: '지역 탐험가',
    description: '5개 이상의 다른 지역을 방문했어요',
    icon: '🗺️',
    category: '전문가',
    difficulty: 3,
    gradient: 'from-teal-400 to-cyan-600',
    condition: { type: 'regionCount', value: 5 }
  },
  
  // 마스터 단계
  '여행 마스터': {
    name: '여행 마스터',
    description: '100개의 여행 기록! 정말 대단해요!',
    icon: '👑',
    category: '마스터',
    difficulty: 4,
    gradient: 'from-purple-500 to-pink-600',
    condition: { type: 'postCount', value: 100 }
  },
  
  '전국 정복자': {
    name: '전국 정복자',
    description: '10개 이상의 지역을 모두 방문했어요!',
    icon: '🌍',
    category: '마스터',
    difficulty: 4,
    gradient: 'from-green-500 to-teal-600',
    condition: { type: 'regionCount', value: 10 }
  },
  
  '메가 스타': {
    name: '메가 스타',
    description: '좋아요를 500개나 받았어요! 슈퍼스타!',
    icon: '🌠',
    category: '마스터',
    difficulty: 4,
    gradient: 'from-yellow-400 via-orange-500 to-red-600',
    condition: { type: 'likesReceived', value: 500 }
  },
  
  // 지역 특화 뱃지
  '내 지역 알리미': {
    name: '내 지역 알리미',
    description: '한 지역에서 30개 이상 게시했어요! 지역 홍보 대사!',
    icon: '📍',
    category: '지역',
    difficulty: 3,
    gradient: 'from-red-400 to-pink-500',
    condition: { type: 'regionMaxPosts', value: 30 }
  },
  
  '도시 홍보대사': {
    name: '도시 홍보대사',
    description: '한 지역에서 50개 이상! 이제 그 지역의 전문가예요',
    icon: '🏙️',
    category: '지역',
    difficulty: 4,
    gradient: 'from-cyan-400 to-blue-600',
    condition: { type: 'regionMaxPosts', value: 50 }
  },
  
  // 숨겨진 뱃지
  '행운아': {
    name: '행운아',
    description: '게시물 하나가 좋아요 100개를 받았어요!',
    icon: '🍀',
    category: '숨김',
    difficulty: 4,
    gradient: 'from-green-400 via-emerald-500 to-teal-600',
    hidden: true,
    condition: { type: 'singlePostLikes', value: 100 }
  },
  
  '신속 게시자': {
    name: '신속 게시자',
    description: '하루에 게시물을 5개 올렸어요!',
    icon: '⚡',
    category: '숨김',
    difficulty: 3,
    gradient: 'from-yellow-300 to-orange-500',
    hidden: true,
    condition: { type: 'dailyPosts', value: 5 }
  },
  
  '전설의 여행자': {
    name: '전설의 여행자',
    description: '200개의 여행 기록! 당신은 전설입니다!',
    icon: '🦄',
    category: '숨김',
    difficulty: 5,
    gradient: 'from-pink-400 via-purple-500 to-indigo-600',
    hidden: true,
    condition: { type: 'postCount', value: 200 }
  },
  
  '도시 탐험가': {
    name: '도시 탐험가',
    description: '한 지역에서 20개 이상 게시! 숨겨진 명소를 찾았어요',
    icon: '🌃',
    category: '숨김',
    difficulty: 3,
    gradient: 'from-indigo-400 to-purple-600',
    hidden: true,
    condition: { type: 'regionMaxPosts', value: 20 }
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
  }
}, {
  timestamps: true
});

rewardSchema.index({ user: 1, badgeName: 1 }, { unique: true });
rewardSchema.index({ createdAt: -1 });

// 뱃지 확인 및 지급
rewardSchema.statics.checkAndAwardBadges = async function(userId) {
  const User = mongoose.model('User');
  const Post = mongoose.model('Post');
  
  const user = await User.findById(userId);
  if (!user) return [];
  
  const newBadges = [];
  const posts = await Post.find({ user: userId, isPublic: true });
  const postCount = posts.length;
  
  // 통계 계산
  const regions = new Set(posts.map(p => (p.location || p.region || '').split(' ')[0]).filter(Boolean));
  const regionCount = regions.size;
  const likesReceived = posts.reduce((sum, post) => sum + (post.likes || 0), 0);
  const maxLikes = Math.max(...posts.map(p => p.likes || 0), 0);
  
  // 지역별 게시물 수
  const regionPostCounts = {};
  posts.forEach(post => {
    const region = (post.location || post.region || '').split(' ')[0];
    if (region) {
      regionPostCounts[region] = (regionPostCounts[region] || 0) + 1;
    }
  });
  const maxRegionPosts = Math.max(...Object.values(regionPostCounts), 0);
  
  // 날짜별 게시물 수
  const postsByDate = {};
  posts.forEach(post => {
    const date = new Date(post.createdAt).toDateString();
    postsByDate[date] = (postsByDate[date] || 0) + 1;
  });
  const maxDailyPosts = Math.max(...Object.values(postsByDate), 0);
  
  // 각 뱃지 조건 확인
  for (const [badgeName, badgeInfo] of Object.entries(BADGES)) {
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
      case 'regionCount':
        shouldAward = regionCount >= badgeInfo.condition.value;
        break;
      case 'singlePostLikes':
        shouldAward = maxLikes >= badgeInfo.condition.value;
        break;
      case 'regionMaxPosts':
        shouldAward = maxRegionPosts >= badgeInfo.condition.value;
        break;
      case 'dailyPosts':
        shouldAward = maxDailyPosts >= badgeInfo.condition.value;
        break;
    }
    
    if (shouldAward) {
      try {
        await this.create({
          user: userId,
          badgeName: badgeName,
          badgeData: badgeInfo
        });
        
        if (user.addBadge) {
          await user.addBadge(badgeName);
        }
        
        newBadges.push({
          badgeName,
          badgeData: badgeInfo
        });
        
        console.log(`✅ 뱃지 지급: ${badgeName}`);
      } catch (error) {
        console.error(`뱃지 지급 오류 (${badgeName}):`, error);
      }
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
