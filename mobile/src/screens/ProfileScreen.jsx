import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants/styles';
import { getUserDailyTitle } from '../utils/dailyTitleSystem';
import { getEarnedBadges } from '../utils/badgeSystem';
import { getUserLevel } from '../utils/levelSystem';
import PostGridItem from '../components/PostGridItem';
import { Modal } from 'react-native';
import { ScreenLayout, ScreenContent, ScreenHeader, ScreenBody } from '../components/ScreenLayout';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ProfileScreen = () => {
  const { user: authUser, logout } = useAuth();
  const navigation = useNavigation();
  const [user, setUser] = useState(null);
  const [myPosts, setMyPosts] = useState([]);
  const [dailyTitle, setDailyTitle] = useState(null);
  const [earnedBadges, setEarnedBadges] = useState([]);
  const [representativeBadge, setRepresentativeBadge] = useState(null);
  const [showBadgeSelector, setShowBadgeSelector] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('my'); // 'my' | 'map' | 'timeline'
  const [levelInfo, setLevelInfo] = useState(null);

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      
      // 사용자 정보 로드
      const savedUserJson = await AsyncStorage.getItem('user');
      const savedUser = savedUserJson ? JSON.parse(savedUserJson) : authUser;
      setUser(savedUser);

      // 24시간 타이틀 로드
      if (savedUser?.id) {
        const title = await getUserDailyTitle(savedUser.id);
        setDailyTitle(title);
      }

      // 뱃지 로드
      const badges = await getEarnedBadges();
      setEarnedBadges(badges);

      // 레벨 정보 로드
      const userLevelInfo = await getUserLevel();
      setLevelInfo(userLevelInfo);

      // 대표 뱃지 로드
      const userId = savedUser?.id;
      if (userId) {
        let repBadge = null;
        const repBadgeJson = await AsyncStorage.getItem(`representativeBadge_${userId}`);
        if (repBadgeJson) {
          try {
            repBadge = JSON.parse(repBadgeJson);
          } catch {
            repBadge = null;
          }
        }
        
        // 개발 단계: 대표 뱃지가 없고 획득한 뱃지가 있다면, 그 중 하나를 자동으로 대표 뱃지로 사용
        if (!repBadge && badges && badges.length > 0) {
          repBadge = badges[0];
          await AsyncStorage.setItem(`representativeBadge_${userId}`, JSON.stringify(repBadge));
        }

        if (repBadge) {
          setRepresentativeBadge(repBadge);
        }
      }

      // 내가 업로드한 게시물 로드 (영구 보관 - 필터링 없음)
      const uploadedPostsJson = await AsyncStorage.getItem('uploadedPosts');
      const uploadedPosts = uploadedPostsJson ? JSON.parse(uploadedPostsJson) : [];
      const userPosts = uploadedPosts.filter(post => post.userId === userId);
      
      setMyPosts(userPosts);
    } catch (error) {
      console.error('프로필 데이터 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      '로그아웃',
      '정말 로그아웃하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '로그아웃',
          style: 'destructive',
          onPress: () => {
            logout();
          },
        },
      ]
    );
  };

  const toggleEditMode = () => {
    if (isEditMode) {
      setSelectedPhotos([]);
    }
    setIsEditMode(!isEditMode);
  };

  const togglePhotoSelection = (postId) => {
    if (selectedPhotos.includes(postId)) {
      setSelectedPhotos(selectedPhotos.filter(id => id !== postId));
    } else {
      setSelectedPhotos([...selectedPhotos, postId]);
    }
  };

  const deleteSelectedPhotos = async () => {
    if (selectedPhotos.length === 0) {
      Alert.alert('알림', '삭제할 사진을 선택해주세요.');
      return;
    }

    Alert.alert(
      '사진 삭제',
      `선택한 ${selectedPhotos.length}개의 사진을 삭제하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              const allPostsJson = await AsyncStorage.getItem('uploadedPosts');
              const allPosts = allPostsJson ? JSON.parse(allPostsJson) : [];
              const filteredPosts = allPosts.filter(post => !selectedPhotos.includes(post.id));
              await AsyncStorage.setItem('uploadedPosts', JSON.stringify(filteredPosts));

              const userId = user?.id;
              const updatedMyPosts = filteredPosts.filter(post => post.userId === userId);
              setMyPosts(updatedMyPosts);

              setSelectedPhotos([]);
              setIsEditMode(false);

              Alert.alert('완료', `${selectedPhotos.length}개의 사진이 삭제되었습니다.`);
            } catch (error) {
              console.error('사진 삭제 실패:', error);
              Alert.alert('오류', '사진 삭제에 실패했습니다.');
            }
          },
        },
      ]
    );
  };

  const handlePostPress = (post, index) => {
    if (isEditMode) {
      togglePhotoSelection(post.id);
    } else {
      navigation.navigate('PostDetail', {
        postId: post.id,
        post: post,
        allPosts: myPosts,
        currentPostIndex: index,
      });
    }
  };

  // 대표 뱃지 선택
  const selectRepresentativeBadge = async (badge) => {
    try {
      const userId = user?.id;
      if (userId) {
        await AsyncStorage.setItem(`representativeBadge_${userId}`, JSON.stringify(badge));
      }
      setRepresentativeBadge(badge);
      setShowBadgeSelector(false);
      
      // user 정보 업데이트
      const updatedUser = { ...user, representativeBadge: badge };
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      Alert.alert('완료', `대표 뱃지가 "${badge.name}"로 설정되었습니다.`);
    } catch (error) {
      console.error('대표 뱃지 설정 실패:', error);
      Alert.alert('오류', '대표 뱃지 설정에 실패했습니다.');
    }
  };

  // 대표 뱃지 제거
  const removeRepresentativeBadge = async () => {
    try {
      const userId = user?.id;
      if (userId) {
        await AsyncStorage.removeItem(`representativeBadge_${userId}`);
      }
      setRepresentativeBadge(null);
      
      const updatedUser = { ...user, representativeBadge: null };
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      Alert.alert('완료', '대표 뱃지가 제거되었습니다.');
    } catch (error) {
      console.error('대표 뱃지 제거 실패:', error);
    }
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
              style={styles.headerButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color={COLORS.textPrimaryLight} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>프로필</Text>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => navigation.navigate('Settings')}
            >
              <Ionicons name="settings-outline" size={24} color={COLORS.textPrimaryLight} />
            </TouchableOpacity>
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
            <View style={styles.profileInfo}>
              <View style={styles.usernameRow}>
                <Text style={styles.username}>{user.username || '모사모'}</Text>
                {representativeBadge && (
                  <View style={styles.representativeBadge}>
                    <Text style={styles.representativeBadgeIcon}>{representativeBadge.icon}</Text>
                    <Text style={styles.representativeBadgeText}>{representativeBadge.name}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.levelText}>
                {levelInfo ? `Lv. ${levelInfo.level} ${levelInfo.title}` : 'Lv. 1 여행 입문자'}
              </Text>
              {/* 경험치 바 */}
              {levelInfo && levelInfo.level < 100 && (
                <View style={styles.expBarContainer}>
                  <View style={styles.expBarHeader}>
                    <Text style={styles.expBarText}>
                      EXP {levelInfo.expInCurrentLevel.toLocaleString()} / {levelInfo.expNeededForNextLevel.toLocaleString()}
                    </Text>
                    <Text style={styles.expBarPercent}>{levelInfo.progress}%</Text>
                  </View>
                  <View style={styles.expBar}>
                    <View style={[styles.expBarFill, { width: `${levelInfo.progress}%` }]} />
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* 프로필 편집 버튼 */}
          <TouchableOpacity
            style={styles.editProfileButton}
            onPress={() => {
              // 프로필 편집 화면으로 이동 (나중에 구현)
              Alert.alert('알림', '프로필 편집 화면은 준비 중입니다.');
            }}
          >
            <Text style={styles.editProfileButtonText}>프로필 편집</Text>
          </TouchableOpacity>
        </View>

        {/* 획득한 뱃지 섹션 - 웹과 동일하게 */}
        <View style={styles.badgesSection}>
          <View style={styles.badgesHeaderRow}>
            <View style={styles.badgesHeader}>
              <Ionicons name="trophy" size={20} color={COLORS.primary} />
              <Text style={styles.badgesTitle}>획득한 뱃지</Text>
            </View>
            {/* 뱃지 모아보기 버튼 - 작게, 옆으로 */}
            <TouchableOpacity
              style={styles.badgesViewButton}
              onPress={() => navigation.navigate('BadgeList')}
            >
              <Text style={styles.badgesViewButtonText}>모아보기</Text>
              <Text style={styles.badgesViewButtonCount}>{earnedBadges.length}</Text>
              <Ionicons name="chevron-forward" size={14} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          {earnedBadges.length === 0 ? (
            <View style={styles.badgesEmpty}>
              <View style={styles.badgesEmptyIconContainer}>
                <View style={styles.badgesEmptyIcon}>
                  <Ionicons name="trophy-outline" size={48} color={COLORS.textSubtle} />
                </View>
                <View style={styles.badgesEmptyBadge}>
                  <Text style={styles.badgesEmptyBadgeText}>0</Text>
                </View>
              </View>
              <Text style={styles.badgesEmptyTitle}>아직 획득한 뱃지가 없어요</Text>
              <Text style={styles.badgesEmptySubtitle}>여행 기록을 남기고 뱃지를 획득해보세요!</Text>
              <TouchableOpacity
                style={styles.badgesEmptyButton}
                onPress={() => navigation.navigate('Upload')}
              >
                <Ionicons name="add-circle" size={20} color="white" />
                <Text style={styles.badgesEmptyButtonText}>첫 여행 기록하기</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              {/* 대표 뱃지 선택 버튼 */}
              <TouchableOpacity
                style={styles.representativeBadgeButton}
                onPress={() => setShowBadgeSelector(true)}
              >
                <View style={styles.representativeBadgeButtonContent}>
                  <Ionicons name="star" size={24} color={COLORS.primary} />
                  <View style={styles.representativeBadgeButtonText}>
                    <Text style={styles.representativeBadgeButtonTitle}>대표 뱃지</Text>
                    <Text style={styles.representativeBadgeButtonSubtitle}>
                      {representativeBadge ? representativeBadge.name : '뱃지를 선택해주세요'}
                    </Text>
                  </View>
                  {representativeBadge && (
                    <Text style={styles.representativeBadgeButtonIcon}>{representativeBadge.icon}</Text>
                  )}
                </View>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* 여행 기록 탭 */}
        <View style={styles.tabsSection}>
          {/* 탭 전환 */}
          <View style={styles.tabsContainer}>
            <TouchableOpacity
              style={[
                styles.tab, 
                activeTab === 'my' && styles.tabActive
              ]}
              onPress={() => setActiveTab('my')}
            >
              <Text style={[
                styles.tabText, 
                activeTab === 'my' && styles.tabTextActive
              ]}>📸 내 사진</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tab, 
                activeTab === 'map' && styles.tabActive
              ]}
              onPress={() => setActiveTab('map')}
            >
              <Text style={[
                styles.tabText, 
                activeTab === 'map' && styles.tabTextActive
              ]}>🗺️ 여행지도</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tab, 
                activeTab === 'timeline' && styles.tabActive
              ]}
              onPress={() => setActiveTab('timeline')}
            >
              <Text style={[
                styles.tabText, 
                activeTab === 'timeline' && styles.tabTextActive
              ]}>📅 타임라인</Text>
            </TouchableOpacity>
          </View>

          {/* 편집 버튼 (내 사진 탭에서만) */}
          {activeTab === 'my' && myPosts.length > 0 && (
            <View style={styles.editButtonContainer}>
              {isEditMode && selectedPhotos.length > 0 && (
                <TouchableOpacity onPress={deleteSelectedPhotos}>
                  <Text style={styles.deleteButtonText}>삭제 ({selectedPhotos.length})</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={toggleEditMode}>
                <Text style={[styles.editButtonText, isEditMode && styles.editButtonTextActive]}>
                  {isEditMode ? '완료' : '편집'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* 내 사진 탭 */}
          {activeTab === 'my' && myPosts.length === 0 && (
            <View style={styles.emptyContainer}>
              <Ionicons name="add-photo-alternate" size={64} color={COLORS.textSubtle} />
              <Text style={styles.emptyText}>아직 올린 사진이 없어요</Text>
              <Text style={styles.emptySubtext}>첫 번째 여행 사진을 공유해보세요!</Text>
              <TouchableOpacity
                style={styles.uploadButton}
                onPress={() => navigation.navigate('UploadTab')}
              >
                <Ionicons name="add-circle" size={20} color="white" />
                <Text style={styles.uploadButtonText}>첫 사진 올리기</Text>
              </TouchableOpacity>
            </View>
          )}

          {activeTab === 'my' && myPosts.length > 0 && (
            <View style={styles.postsGrid}>
              {myPosts.map((post, index) => (
                <PostGridItem
                  key={post.id || index}
                  post={post}
                  index={index}
                  isEditMode={isEditMode}
                  isSelected={selectedPhotos.includes(post.id)}
                  onPress={handlePostPress}
                  onToggleSelection={togglePhotoSelection}
                />
              ))}
            </View>
          )}

          {/* 여행 지도 탭 */}
          {activeTab === 'map' && (
            <View>
              {myPosts.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="map" size={64} color={COLORS.textSubtle} />
                  <Text style={styles.emptyText}>아직 여행 기록이 없어요</Text>
                  <Text style={styles.emptySubtext}>사진을 올리면 여기에 지도로 표시돼요!</Text>
                </View>
              ) : (
                <View>
                  {/* 지도 영역 - React Native Maps 사용 */}
                  <View style={styles.mapContainer}>
                    <Text style={styles.mapPlaceholder}>지도 기능은 준비 중입니다</Text>
                    <Text style={styles.mapPlaceholderSubtext}>
                      {myPosts.length}개의 사진이 지도에 표시됩니다
                    </Text>
                  </View>

                  {/* 오늘의 타이틀 영역 */}
                  {dailyTitle && (
                    <View style={styles.dailyTitleCard}>
                      <View style={styles.dailyTitleIconContainer}>
                        <Text style={styles.dailyTitleIcon}>{dailyTitle.icon || '👑'}</Text>
                      </View>
                      <View style={styles.dailyTitleContent}>
                        <Text style={styles.dailyTitleName}>{dailyTitle.name}</Text>
                        <Text style={styles.dailyTitleDescription}>
                          {dailyTitle.description || '오늘 하루 동안 유지되는 명예 타이틀입니다.'}
                        </Text>
                      </View>
                    </View>
                  )}

                  {/* 지역별 사진 수 */}
                  <View style={styles.regionList}>
                    <Text style={styles.regionListTitle}>📍 방문한 지역</Text>
                    {Object.entries(
                      myPosts.reduce((acc, post) => {
                        const location = post.location || '기타';
                        acc[location] = (acc[location] || 0) + 1;
                        return acc;
                      }, {})
                    )
                      .sort((a, b) => b[1] - a[1])
                      .map(([location, count]) => (
                        <TouchableOpacity
                          key={location}
                          style={styles.regionItem}
                          onPress={() => setActiveTab('my')}
                        >
                          <Ionicons name="location" size={20} color={COLORS.primary} />
                          <Text style={styles.regionItemText}>{location}</Text>
                          <View style={styles.regionItemCount}>
                            <Text style={styles.regionItemCountText}>{count}장</Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                  </View>
                </View>
              )}
            </View>
          )}

          {/* 타임라인 탭 */}
          {activeTab === 'timeline' && (
            <View>
              {myPosts.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="calendar" size={64} color={COLORS.textSubtle} />
                  <Text style={styles.emptyText}>아직 여행 기록이 없어요</Text>
                  <Text style={styles.emptySubtext}>사진을 올리면 타임라인으로 정리돼요!</Text>
                </View>
              ) : (
                <View style={styles.timelineContainer}>
                  {Object.entries(
                    myPosts.reduce((acc, post) => {
                      const date = new Date(post.createdAt || post.timestamp || Date.now());
                      const dateKey = date.toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      });
                      if (!acc[dateKey]) acc[dateKey] = [];
                      acc[dateKey].push(post);
                      return acc;
                    }, {})
                  )
                    .sort((a, b) => new Date(b[1][0].createdAt || b[1][0].timestamp) - new Date(a[1][0].createdAt || a[1][0].timestamp))
                    .map(([date, posts]) => (
                      <View key={date} style={styles.timelineDateGroup}>
                        <View style={styles.timelineDateHeader}>
                          <Ionicons name="calendar" size={20} color={COLORS.primary} />
                          <Text style={styles.timelineDateText}>{date}</Text>
                          <View style={styles.timelineDateLine} />
                          <Text style={styles.timelineDateCount}>{posts.length}장</Text>
                        </View>
                        <View style={styles.timelinePostsGrid}>
                          {posts.map((post, index) => (
                            <TouchableOpacity
                              key={post.id || index}
                              style={styles.timelinePostItem}
                              onPress={() => handlePostPress(post, index)}
                            >
                              <Image
                                source={{ uri: post.images?.[0] || post.image }}
                                style={styles.timelinePostImage}
                                resizeMode="cover"
                              />
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                    ))}
                </View>
              )}
            </View>
          )}
        </View>

        {/* 설정 메뉴 */}
        <View style={styles.menuSection}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('Settings')}
          >
            <Ionicons name="settings-outline" size={24} color={COLORS.text} />
            <Text style={styles.menuText}>설정</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textSubtle} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color={COLORS.error} />
            <Text style={[styles.menuText, { color: COLORS.error }]}>로그아웃</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textSubtle} />
          </TouchableOpacity>
        </View>

        {/* 대표 뱃지 선택 모달 */}
      <Modal
        visible={showBadgeSelector}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowBadgeSelector(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>대표 뱃지 선택</Text>
              <TouchableOpacity
                onPress={() => setShowBadgeSelector(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScrollView}>
              <View style={styles.badgeGrid}>
                {earnedBadges.map((badge, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.badgeCard,
                      representativeBadge?.name === badge.name && styles.badgeCardSelected
                    ]}
                    onPress={() => selectRepresentativeBadge(badge)}
                  >
                    <Text style={styles.badgeCardIcon}>{badge.icon}</Text>
                    <Text style={styles.badgeCardName}>{badge.name}</Text>
                    <View style={[
                      styles.badgeCardDifficulty,
                      badge.difficulty === '상' && styles.badgeCardDifficultyHigh,
                      badge.difficulty === '중' && styles.badgeCardDifficultyMedium,
                      badge.difficulty === '하' && styles.badgeCardDifficultyLow,
                    ]}>
                      <Text style={styles.badgeCardDifficultyText}>{badge.difficulty}</Text>
                    </View>
                    {representativeBadge?.name === badge.name && (
                      <View style={styles.badgeCardSelectedIndicator}>
                        <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {representativeBadge && (
              <TouchableOpacity
                style={styles.removeBadgeButton}
                onPress={() => {
                  removeRepresentativeBadge();
                  setShowBadgeSelector(false);
                }}
              >
                <Text style={styles.removeBadgeButtonText}>대표 뱃지 제거</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
        </ScreenBody>
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
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md, // p-4 = 16px
    paddingVertical: SPACING.md, // p-4 = 16px
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md, // p-4 = 16px
    paddingVertical: SPACING.md, // p-4 = 16px
    backgroundColor: COLORS.backgroundLight, // bg-white
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight + '80', // border-border-light/50
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    zIndex: 20,
  },
  headerTitle: {
    fontSize: 16, // text-base = 16px
    fontWeight: '600', // font-semibold
    color: COLORS.text, // text-text-primary-light
  },
  headerButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  headerButton: {
    width: 48, // size-12 = 48px
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8, // rounded-lg
  },
  headerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  profileSection: {
    backgroundColor: COLORS.backgroundLight, // bg-white
    paddingHorizontal: SPACING.lg, // px-6 = 24px
    paddingVertical: SPACING.lg, // py-6 = 24px
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md, // gap-4 = 16px
    marginBottom: SPACING.md, // mb-4 = 16px
  },
  avatar: {
    width: 64, // w-16 = 64px
    height: 64, // h-16 = 64px
    borderRadius: 32, // rounded-full
    backgroundColor: '#CCFBF1', // bg-teal-100 (웹과 동일)
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 32,
  },
  profileInfo: {
    flex: 1,
  },
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  username: {
    fontSize: 18, // text-lg = 18px
    fontWeight: 'bold',
    color: COLORS.text, // text-text-primary-light
  },
  representativeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs, // gap-1 = 4px
    paddingHorizontal: SPACING.sm, // px-2 = 8px
    paddingVertical: SPACING.xs, // py-1 = 4px
    // bg-gradient-to-r from-primary-soft to-accent-soft (그라데이션은 LinearGradient 사용 필요)
    backgroundColor: COLORS.primary + '20', // primary-soft 대략값
    borderRadius: 999, // rounded-full
    borderWidth: 2,
    borderColor: COLORS.primary + '4D', // border-primary/30
  },
  representativeBadgeIcon: {
    fontSize: 16, // text-base = 16px
  },
  representativeBadgeText: {
    fontSize: 12, // text-xs = 12px
    fontWeight: 'bold',
    color: COLORS.primary, // text-primary
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
  levelText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  expBarContainer: {
    marginTop: SPACING.sm,
  },
  expBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  expBarText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  expBarPercent: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  expBar: {
    width: '100%',
    height: 8, // h-2 = 8px (웹과 동일)
    backgroundColor: '#E5E7EB', // bg-gray-200 (웹과 동일)
    borderRadius: 999, // rounded-full (웹과 동일)
    overflow: 'hidden',
  },
  expBarFill: {
    height: '100%',
    // bg-gradient-to-r from-primary to-accent (그라데이션은 LinearGradient 사용 필요)
    backgroundColor: COLORS.primary, // 기본값
    borderRadius: 999, // rounded-full
  },
  editProfileButton: {
    width: '100%', // w-full
    backgroundColor: '#F3F4F6', // bg-gray-100
    paddingVertical: 10, // py-2.5 = 10px
    paddingHorizontal: SPACING.md, // px-4 = 16px
    borderRadius: 8, // rounded-lg
    marginTop: SPACING.md,
  },
  editProfileButtonText: {
    fontSize: 14, // text-base (웹에서는 font-medium이지만 모바일에서는 기본)
    fontWeight: '500', // font-medium
    color: COLORS.text, // text-text-primary-light
    textAlign: 'center',
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
  tabsSection: {
    paddingHorizontal: SPACING.lg, // px-6 = 24px
    paddingVertical: SPACING.lg, // py-6 = 24px
    backgroundColor: COLORS.backgroundLight, // bg-white
    borderTopWidth: 1, // border-t
    borderTopColor: COLORS.border, // border-gray-100
  },
  tabsContainer: {
    flexDirection: 'row',
    gap: SPACING.sm, // gap-2 = 8px
    marginBottom: SPACING.lg, // mb-6 = 24px
  },
  tab: {
    flex: 1, // flex-1
    paddingVertical: 12, // py-3 = 12px
    paddingHorizontal: SPACING.sm, // px-2 = 8px
    borderRadius: 12, // rounded-xl
    backgroundColor: '#F3F4F6', // bg-gray-100 (비활성화)
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: COLORS.primary, // bg-primary (활성화)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, // shadow-lg
    shadowRadius: 8,
    elevation: 5,
  },
  tabText: {
    fontSize: 14, // text-sm
    fontWeight: '600', // font-semibold
    color: COLORS.textSecondary, // text-text-secondary-light (비활성화)
  },
  tabTextActive: {
    color: 'white', // text-white (활성화)
    fontWeight: '600', // font-semibold
  },
  helpfulSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12, // gap-3 = 12px
    paddingHorizontal: SPACING.md, // px-4 = 16px
    paddingVertical: SPACING.md, // py-4 = 16px
    borderRadius: 16, // rounded-2xl
    // bg-gradient-to-r from-primary-soft to-accent-soft (그라데이션은 LinearGradient 사용 필요)
    backgroundColor: COLORS.primary + '20', // primary-soft 대략값
    borderWidth: 2,
    borderColor: COLORS.primary + '33', // border-primary/20
    marginBottom: SPACING.md, // mb-4 = 16px
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1, // shadow-sm
  },
  helpfulIcon: {
    width: 48, // w-12 h-12 = 48px
    height: 48,
    borderRadius: 24, // rounded-full
    // bg-gradient-to-br from-primary to-accent (그라데이션은 LinearGradient 사용 필요)
    backgroundColor: COLORS.primary, // 기본값
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5, // shadow-lg
  },
  helpfulContent: {
    flex: 1,
  },
  helpfulSubtext: {
    fontSize: 14, // text-sm
    color: '#4B5563', // text-gray-600 (웹과 동일)
    marginBottom: SPACING.xs, // mb-1 = 4px
  },
  helpfulText: {
    fontSize: 20, // text-xl
    fontWeight: 'bold',
    color: '#9333EA', // text-purple-700 (웹과 동일)
  },
  helpfulNumber: {
    fontSize: 24, // text-2xl
  },
  editButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: SPACING.md,
    gap: SPACING.md,
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.error,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  editButtonTextActive: {
    color: COLORS.primary,
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
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textSubtle,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: 999,
  },
  uploadButtonText: {
    color: COLORS.backgroundLight,
    fontSize: 16,
    fontWeight: '600',
  },
  mapContainer: {
    width: '100%',
    height: 384,
    borderRadius: 12,
    backgroundColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  mapPlaceholder: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  mapPlaceholderSubtext: {
    fontSize: 14,
    color: COLORS.textSubtle,
  },
  dailyTitleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING.md,
    borderRadius: 16,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FCD34D',
    marginBottom: SPACING.md,
  },
  dailyTitleIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dailyTitleIcon: {
    fontSize: 24,
  },
  dailyTitleContent: {
    flex: 1,
    gap: SPACING.xs,
  },
  dailyTitleName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#92400E',
  },
  dailyTitleDescription: {
    fontSize: 12,
    color: '#B45309',
  },
  regionList: {
    gap: SPACING.sm,
  },
  regionListTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  regionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    marginBottom: SPACING.sm,
  },
  regionItemText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  },
  regionItemCount: {
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 999,
  },
  regionItemCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  timelineContainer: {
    gap: SPACING.lg,
  },
  timelineDateGroup: {
    marginBottom: SPACING.lg,
  },
  timelineDateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  timelineDateText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  timelineDateLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  timelineDateCount: {
    fontSize: 12,
    color: COLORS.textSubtle,
  },
  timelinePostsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  timelinePostItem: {
    width: (SCREEN_WIDTH - SPACING.md * 2 - SPACING.sm * 2) / 3,
    aspectRatio: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  timelinePostImage: {
    width: '100%',
    height: '100%',
  },
  postsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md, // gap-4 = 16px (웹과 동일)
    justifyContent: 'space-between',
  },
  menuSection: {
    padding: SPACING.md,
    paddingTop: SPACING.lg,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.backgroundLight,
    borderRadius: 12,
    marginBottom: SPACING.sm,
    gap: SPACING.md,
  },
  menuText: {
    flex: 1,
    ...TYPOGRAPHY.body,
    color: COLORS.text,
  },
  badgesSection: {
    backgroundColor: COLORS.backgroundLight,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
  },
  badgesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm, // gap-2 = 8px
    marginBottom: SPACING.lg, // mb-6 = 24px
  },
  badgesTitle: {
    fontSize: 16, // text-base = 16px
    fontWeight: 'bold',
    color: COLORS.text, // text-text-primary-light
  },
  badgesEmpty: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl, // py-6 = 24px
  },
  badgesEmptyIconContainer: {
    position: 'relative',
    marginBottom: SPACING.md, // mb-4 = 16px
  },
  badgesEmptyIcon: {
    width: 80, // w-20 = 80px
    height: 80, // h-20 = 80px
    borderRadius: 40, // rounded-full
    backgroundColor: '#F3F4F6', // bg-gray-100
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgesEmptyBadge: {
    position: 'absolute',
    top: -4, // -top-1 = -4px
    right: -4, // -right-1 = -4px
    width: 24, // h-6 w-6 = 24px
    height: 24,
    borderRadius: 12, // rounded-full
    backgroundColor: '#EF4444', // bg-red-500
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgesEmptyBadgeText: {
    fontSize: 12, // text-xs = 12px
    fontWeight: 'bold',
    color: 'white', // text-white
  },
  badgesEmptyTitle: {
    fontSize: 14, // text-sm = 14px
    fontWeight: '500', // font-medium
    color: COLORS.text, // text-text-primary-light
    marginBottom: SPACING.xs, // mb-1 = 4px
    textAlign: 'center',
  },
  badgesEmptySubtitle: {
    fontSize: 12, // text-xs = 12px
    color: COLORS.textSecondary, // text-text-secondary-light
    marginBottom: SPACING.md, // mb-4 = 16px
    textAlign: 'center',
  },
  badgesEmptyButton: {
    width: '100%', // w-full
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm, // gap-2 = 8px
    backgroundColor: COLORS.primary, // bg-primary
    paddingHorizontal: SPACING.lg, // px-6 = 24px
    paddingVertical: SPACING.md, // py-3 = 12px
    borderRadius: 12, // rounded-xl
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5, // shadow-lg
  },
  badgesEmptyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  representativeBadgeButton: {
    // bg-gradient-to-r from-primary-soft to-accent-soft (그라데이션은 LinearGradient 사용 필요)
    backgroundColor: COLORS.primary + '20', // primary-soft 대략값
    borderRadius: 12, // rounded-xl
    padding: SPACING.md, // p-4 = 16px
    marginBottom: SPACING.sm, // space-y-3 = 12px
    borderWidth: 2,
    borderColor: COLORS.primary + '4D', // border-primary/30
  },
  representativeBadgeButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between', // justify-between (웹과 동일)
  },
  representativeBadgeButtonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12, // gap-3 = 12px
    flex: 1,
  },
  representativeBadgeButtonText: {
    flex: 1,
  },
  representativeBadgeButtonTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 2,
  },
  representativeBadgeButtonSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  representativeBadgeButtonIcon: {
    fontSize: 30, // text-3xl = 30px (웹과 동일)
  },
  viewAllBadgesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between', // justify-between (웹과 동일)
    backgroundColor: '#F9FAFB', // bg-gray-50 (웹과 동일)
    borderRadius: 12, // rounded-xl
    padding: SPACING.md, // p-4 = 16px
    gap: SPACING.sm, // gap-2 = 8px
  },
  viewAllBadgesText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  viewAllBadgesCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm, // gap-2 = 8px
  },
  viewAllBadgesCountText: {
    fontSize: 14, // text-base = 14px
    fontWeight: 'bold',
    color: COLORS.primary, // text-primary (웹과 동일)
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.backgroundLight,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: SPACING.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    ...TYPOGRAPHY.h2,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  modalCloseButton: {
    padding: SPACING.xs,
  },
  modalScrollView: {
    padding: SPACING.md,
  },
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  badgeCard: {
    width: (SCREEN_WIDTH - SPACING.md * 4) / 2,
    backgroundColor: COLORS.backgroundLight,
    borderRadius: 12,
    padding: SPACING.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
    position: 'relative',
  },
  badgeCardSelected: {
    backgroundColor: COLORS.primary + '20',
    borderColor: COLORS.primary,
  },
  badgeCardIcon: {
    fontSize: 48,
    marginBottom: SPACING.sm,
  },
  badgeCardName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  badgeCardDifficulty: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
  },
  badgeCardDifficultyHigh: {
    backgroundColor: '#9333ea',
  },
  badgeCardDifficultyMedium: {
    backgroundColor: '#3b82f6',
  },
  badgeCardDifficultyLow: {
    backgroundColor: '#10b981',
  },
  badgeCardDifficultyText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.backgroundLight,
  },
  badgeCardSelectedIndicator: {
    position: 'absolute',
    top: SPACING.xs,
    right: SPACING.xs,
  },
  removeBadgeButton: {
    margin: SPACING.md,
    padding: SPACING.md,
    backgroundColor: COLORS.error + '20',
    borderRadius: 12,
    alignItems: 'center',
  },
  removeBadgeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.error,
  },
  badgesHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  badgesViewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: COLORS.primary + '1A',
    borderRadius: 20,
  },
  badgesViewButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  badgesViewButtonCount: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
});

export default ProfileScreen;
