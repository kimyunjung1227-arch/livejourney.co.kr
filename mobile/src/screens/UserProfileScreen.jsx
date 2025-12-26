import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants/styles';
import { getUserDailyTitle } from '../utils/dailyTitleSystem';
import { getEarnedBadgesForUser, BADGES } from '../utils/badgeSystem';
import { getUserLevel } from '../utils/levelSystem';
import PostGridItem from '../components/PostGridItem';
import { ScreenLayout, ScreenContent, ScreenHeader, ScreenBody } from '../components/ScreenLayout';

const UserProfileScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { userId, username: passedUsername } = route.params || {};
  
  const [user, setUser] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [dailyTitle, setDailyTitle] = useState(null);
  const [earnedBadges, setEarnedBadges] = useState([]);
  const [representativeBadge, setRepresentativeBadge] = useState(null);
  const [stats, setStats] = useState({
    posts: 0,
    likes: 0,
    comments: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showAllBadges, setShowAllBadges] = useState(false);
  const [levelInfo, setLevelInfo] = useState(null);

  useEffect(() => {
    if (!userId) {
      navigation.goBack();
      return;
    }
    loadUserData();
  }, [userId, navigation]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      
      // userId가 변경되면 상태 초기화
      setUser(null);
      setUserPosts([]);
      setEarnedBadges([]);
      setRepresentativeBadge(null);
      setStats({ posts: 0, likes: 0, comments: 0 });
      setDailyTitle(null);
      
      // 해당 사용자의 정보 찾기 (게시물에서)
      const uploadedPostsJson = await AsyncStorage.getItem('uploadedPosts');
      const uploadedPosts = uploadedPostsJson ? JSON.parse(uploadedPostsJson) : [];
      
      // userId 매칭 (여러 형태 지원)
      const userPost = uploadedPosts.find(p => {
        const postUserId = p.userId || 
                          (typeof p.user === 'string' ? p.user : p.user?.id) ||
                          p.user;
        return postUserId === userId;
      });
      
      // 사진 상세화면에서 넘어온 사용자 이름이 있다면,
      // 그 이름을 최우선으로 사용해서 프로필 화면에서도 항상 동일하게 보여준다.
      if (passedUsername) {
        setUser({
          id: userId,
          username: passedUsername,
          profileImage: null,
        });
      } else if (userPost) {
        const postUserId =
          userPost.userId ||
          (typeof userPost.user === 'string' ? userPost.user : userPost.user?.id) ||
          userPost.user;
        const resolvedUsername =
          (typeof userPost.user === 'string' ? userPost.user : userPost.user?.username) ||
          postUserId ||
          '사용자';
        const foundUser = {
          id: userId,
          username: resolvedUsername,
          profileImage: null,
        };
        setUser(foundUser);
      } else {
        // 사용자 정보를 찾을 수 없으면 기본값
        setUser({
          id: userId,
          username: '사용자',
          profileImage: null,
        });
      }

      // 24시간 타이틀 로드
      const title = await getUserDailyTitle(userId);
      setDailyTitle(title);
      
      // 레벨 정보 로드 (현재는 전역 경험치 기준, 작성자/뷰어 구분 없이 표시)
      const userLevelInfo = await getUserLevel();
      setLevelInfo(userLevelInfo);
      
      // 대표 뱃지 로드 (먼저 설정)
      const repBadgeJson = await AsyncStorage.getItem(`representativeBadge_${userId}`);
      if (repBadgeJson) {
        const repBadge = JSON.parse(repBadgeJson);
        setRepresentativeBadge(repBadge);
      } else {
        // 개발 단계: 모든 사용자에게 임의로 대표 뱃지 설정 (실제 뱃지 시스템의 뱃지 사용)
        const availableBadges = Object.values(BADGES).map(badge => ({
          name: badge.name,
          icon: badge.icon,
          description: badge.description,
          difficulty: badge.difficulty
        }));
        
        // userId를 기반으로 일관된 뱃지 선택 (더 다양한 분산)
        let badgeIndex = 0;
        if (userId) {
          // userId의 모든 문자를 합산하여 더 다양한 분산
          const hash = userId.toString().split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
          badgeIndex = hash % availableBadges.length;
        }
        const mockRepBadge = availableBadges[badgeIndex];
        // 대표 뱃지를 저장하여 일관성 유지
        await AsyncStorage.setItem(`representativeBadge_${userId}`, JSON.stringify(mockRepBadge));
        console.log('📝 UserProfileScreen - 임의 대표 뱃지 설정:', mockRepBadge);
        setRepresentativeBadge(mockRepBadge);
      }
      
      // 뱃지 로드
      let badges = await getEarnedBadgesForUser(userId);
      console.log('📊 UserProfileScreen - 획득한 뱃지:', badges?.length || 0, '개');
      
      // 개발 단계: 획득한 뱃지가 없으면 임의로 몇 개 추가
      if (!badges || badges.length === 0) {
        const allBadges = [
          { name: '첫 여행 기록', icon: '🎯', description: '첫 번째 여행 사진을 업로드했습니다!' },
          { name: '여행 입문자', icon: '🌱', description: '3개의 여행 기록을 남겼습니다.' },
          { name: '첫 좋아요', icon: '❤️', description: '첫 번째 좋아요를 받았습니다!' },
          { name: '여행 탐험가', icon: '🧭', description: '10개의 여행 기록을 남긴 진정한 탐험가!' },
          { name: '사진 수집가', icon: '📸', description: '25개의 여행 사진을 업로드했습니다.' },
          { name: '인기 여행자', icon: '⭐', description: '50개의 좋아요를 받았습니다!' },
          { name: '지역 전문가', icon: '🗺️', description: '5개 이상의 지역을 방문했습니다.' },
          { name: '댓글 마스터', icon: '💬', description: '10개의 댓글을 작성했습니다.' },
          { name: '여행 애호가', icon: '✈️', description: '다양한 여행지를 방문했습니다.' },
        ];
        // userId를 기반으로 일관된 뱃지 선택 (3-7개)
        const badgeCount = 3 + (userId ? userId.toString().charCodeAt(0) % 5 : 0);
        badges = allBadges.slice(0, badgeCount);
        console.log('📝 UserProfileScreen - 임의 획득 뱃지 설정:', badges.length, '개');
      }
      
      setEarnedBadges(badges || []);

      // 해당 사용자의 게시물 로드 (여러 형태 지원)
      const posts = uploadedPosts.filter(post => {
        const postUserId = post.userId || 
                          (typeof post.user === 'string' ? post.user : post.user?.id) ||
                          post.user;
        return postUserId === userId;
      });
      setUserPosts(posts);
      
      // 통계 계산
      const totalLikes = posts.reduce((sum, post) => sum + (post.likes || 0), 0);
      const totalComments = posts.reduce((sum, post) => {
        const comments = post.comments || [];
        const qnaList = post.qnaList || [];
        return sum + comments.length + qnaList.length;
      }, 0);
      
      setStats({
        posts: posts.length,
        likes: totalLikes,
        comments: totalComments,
      });
    } catch (error) {
      console.error('사용자 데이터 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePostPress = (post, index) => {
    navigation.navigate('PostDetail', {
      postId: post.id,
      post: post,
      allPosts: userPosts,
      currentPostIndex: index >= 0 ? index : userPosts.findIndex(p => p.id === post.id),
    });
  };

  if (loading) {
    return (
      <ScreenLayout>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>로딩 중...</Text>
        </View>
      </ScreenLayout>
    );
  }

  if (!user) {
    return (
      <ScreenLayout>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>사용자 정보를 불러올 수 없습니다.</Text>
        </View>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout>
      <ScreenContent>
        {/* 헤더 - 웹과 동일한 구조 */}
        <ScreenHeader>
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color={COLORS.textPrimaryLight} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>프로필</Text>
            <View style={styles.headerPlaceholder} />
          </View>
        </ScreenHeader>

        {/* 메인 컨텐츠 - 웹과 동일한 구조 */}
        <ScreenBody>
        {/* 프로필 정보 */}
        <View style={styles.profileSection}>
          <View style={styles.profileHeader}>
            <View style={styles.avatar}>
              {user.profileImage ? (
                <Image source={{ uri: user.profileImage }} style={styles.avatarImage} />
              ) : (
                <Ionicons name="person" size={40} color={COLORS.textSubtle} />
              )}
            </View>
              <View style={styles.profileInfoContainer}>
                {/* 프로필 이름, 대표 뱃지, 획득 뱃지 숫자를 한 줄에 가로 배치 */}
                <View style={styles.profileInfoRow}>
                  <Text style={styles.username}>{user.username || '사용자'}</Text>
                  
                  {/* 대표 뱃지 */}
                  {representativeBadge && (
                    <View style={styles.representativeBadgeWithName}>
                      <Text style={styles.representativeBadgeIconWithName}>
                        {representativeBadge.icon}
                      </Text>
                      <Text style={styles.representativeBadgeName} numberOfLines={1}>
                        {representativeBadge.name}
                      </Text>
                    </View>
                  )}
                  
                  {/* 획득한 뱃지 개수 표시 */}
                  {earnedBadges && earnedBadges.length > (representativeBadge ? 1 : 0) && (
                    <TouchableOpacity
                      style={styles.badgeCountButton}
                      onPress={() => setShowAllBadges(true)}
                    >
                      <Text style={styles.badgeCountText}>
                        +{earnedBadges.length - (representativeBadge ? 1 : 0)}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* 레벨 표시 */}
                <View style={styles.levelRow}>
                  <Text style={styles.levelText}>
                    {levelInfo
                      ? `Lv. ${levelInfo.level} ${levelInfo.title}`
                      : 'Lv. 1 여행 입문자'}
                  </Text>
                </View>
                
                {dailyTitle && (
                  <View style={styles.titleBadge}>
                    <Text style={styles.titleIcon}>{dailyTitle.icon}</Text>
                    <Text style={styles.titleText}>{dailyTitle.name}</Text>
                  </View>
                )}
              </View>
          </View>

          {/* 통계 정보 */}
          <View style={styles.statsSection}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.posts}</Text>
              <Text style={styles.statLabel}>게시물</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.likes}</Text>
              <Text style={styles.statLabel}>좋아요</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.comments}</Text>
              <Text style={styles.statLabel}>댓글</Text>
            </View>
          </View>
        </View>

        {/* 여행 기록 그리드 */}
        <View style={styles.postsSection}>
          {userPosts.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="images-outline" size={64} color={COLORS.textSubtle} />
              <Text style={styles.emptyText}>아직 업로드한 사진이 없습니다</Text>
            </View>
          ) : (
            <View style={styles.postsGrid}>
              {userPosts.map((post, index) => (
                <PostGridItem
                  key={post.id || index}
                  post={post}
                  index={index}
                  isEditMode={false}
                  isSelected={false}
                  onPress={handlePostPress}
                  onToggleSelection={() => {}}
                />
              ))}
            </View>
          )}
        </View>
        </ScreenBody>

      {/* 뱃지 모두보기 모달 */}
      <Modal
        visible={showAllBadges}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAllBadges(false)}
      >
        <View style={styles.modalOverlay}>
          <SafeAreaView style={styles.modalSafeArea}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>대표 뱃지</Text>
                <TouchableOpacity
                  onPress={() => setShowAllBadges(false)}
                  style={styles.modalCloseButton}
                >
                  <Ionicons name="close" size={24} color={COLORS.text} />
                </TouchableOpacity>
              </View>
              <ScrollView 
                style={styles.modalScrollView} 
                contentContainerStyle={styles.modalScrollContent}
                showsVerticalScrollIndicator={true}
              >
                <View style={styles.allBadgesGrid}>
                  {representativeBadge ? (
                    <View style={styles.allBadgeItem}>
                      <View style={[styles.allBadgeIconContainer, styles.allBadgeIconContainerRepresentative]}>
                        <Text style={styles.allBadgeIcon}>{representativeBadge.icon || '🏆'}</Text>
                      </View>
                      <Text style={styles.allBadgeName} numberOfLines={2}>
                        {representativeBadge.name}
                      </Text>
                      <View style={styles.representativeLabel}>
                        <Text style={styles.representativeLabelText}>대표</Text>
                      </View>
                    </View>
                  ) : earnedBadges.length > 0 ? (
                    <View style={styles.allBadgeItem}>
                      <View style={styles.allBadgeIconContainer}>
                        <Text style={styles.allBadgeIcon}>{earnedBadges[0].icon || '🏆'}</Text>
                      </View>
                      <Text style={styles.allBadgeName} numberOfLines={2}>
                        {earnedBadges[0].name}
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.emptyText}>아직 대표 뱃지가 없습니다</Text>
                  )}
                </View>
              </ScrollView>
            </View>
          </SafeAreaView>
        </View>
      </Modal>
      </ScreenContent>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.backgroundLight,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...TYPOGRAPHY.h2,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  headerPlaceholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  profileSection: {
    backgroundColor: COLORS.backgroundLight,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.lg,
    gap: SPACING.md,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 32,
  },
  profileInfoContainer: {
    flex: 1,
    minWidth: 0,
  },
  profileInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flexWrap: 'wrap',
    marginBottom: SPACING.xs,
  },
  levelRow: {
    marginTop: 2,
  },
  levelText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  username: {
    ...TYPOGRAPHY.h3,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  representativeBadge: {
    width: 40, // w-10 = 40px (웹 버전과 동일)
    height: 40,
    borderRadius: 20, // rounded-full
    backgroundColor: COLORS.primary + '33', // bg-primary/20
    borderWidth: 2,
    borderColor: COLORS.primary, // border-primary
    justifyContent: 'center',
    alignItems: 'center',
  },
  representativeBadgeIcon: {
    fontSize: 20, // text-2xl = 20px (웹 버전과 동일)
  },
  titleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    backgroundColor: COLORS.primary + '20',
    borderRadius: 999,
    borderWidth: 2,
    borderColor: COLORS.primary + '30',
    alignSelf: 'flex-start',
  },
  titleIcon: {
    fontSize: 16,
  },
  titleText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  badgesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm, // gap-2 = 8px (웹 버전과 동일)
    marginTop: SPACING.sm, // mt-2 = 8px
    flexWrap: 'wrap',
  },
  badgeItem: {
    width: 32, // w-8 = 32px (웹 버전과 동일)
    height: 32,
    borderRadius: 16, // rounded-full
    backgroundColor: COLORS.borderLight, // bg-gray-100
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border, // border-gray-200
  },
  badgeItemRepresentative: {
    width: 48, // w-12 = 48px (웹 버전과 동일)
    height: 48,
    borderRadius: 24, // rounded-full
    backgroundColor: COLORS.primary + '33', // bg-primary/20
    borderWidth: 2,
    borderColor: COLORS.primary, // border-primary
  },
  badgeIcon: {
    fontSize: 18, // text-lg = 18px (웹 버전과 동일)
  },
  badgeIconRepresentative: {
    fontSize: 24, // text-2xl = 24px (웹 버전과 동일)
  },
  badgeMore: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  viewAllBadgesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    backgroundColor: COLORS.primary + '10',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
  },
  viewAllBadgesText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalSafeArea: {
    width: '100%',
    maxHeight: '85%',
  },
  modalContent: {
    flex: 1,
    backgroundColor: COLORS.backgroundLight,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginHorizontal: SPACING.sm,
    marginBottom: SPACING.sm,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    ...TYPOGRAPHY.h3,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalScrollView: {
    flex: 1,
  },
  modalScrollContent: {
    paddingBottom: SPACING.xl,
  },
  allBadgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: SPACING.md,
    gap: SPACING.md,
  },
  allBadgeItem: {
    width: '30%',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  allBadgeIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.borderLight,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  allBadgeIconContainerRepresentative: {
    backgroundColor: COLORS.primary + '33',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  allBadgeIcon: {
    fontSize: 32,
  },
  allBadgeName: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
  },
  representativeLabel: {
    marginTop: SPACING.xs,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
  },
  representativeLabelText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.backgroundLight,
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    ...TYPOGRAPHY.h2,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  postsSection: {
    padding: SPACING.md,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl,
  },
  emptyText: {
    marginTop: SPACING.md,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  postsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  representativeBadgeWithName: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    backgroundColor: COLORS.primary + '20',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  representativeBadgeIconWithName: {
    fontSize: 20,
  },
  representativeBadgeName: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
    maxWidth: 80,
  },
  badgeCountButton: {
    minWidth: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.borderLight,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xs,
  },
  badgeCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
  },
  allBadgeItem: {
    width: '30%',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  allBadgeIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.borderLight,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  allBadgeIconContainerRepresentative: {
    backgroundColor: COLORS.primary + '33',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  allBadgeIcon: {
    fontSize: 32,
  },
  allBadgeName: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
  },
  representativeLabel: {
    marginTop: SPACING.xs,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
  },
  representativeLabelText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.backgroundLight,
  },
});

export default UserProfileScreen;



