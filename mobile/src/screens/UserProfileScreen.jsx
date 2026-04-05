import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Image,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { useAuth } from '../contexts/AuthContext';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants/styles';
import { getUserDailyTitle } from '../utils/dailyTitleSystem';
import { getEarnedBadgesForUser, BADGES, getBadgeDisplayName } from '../utils/badgeSystem';
import { getUserLevel } from '../utils/levelSystem';
import { getCoordinatesByLocation } from '../utils/regionLocationMapping';
import { follow, unfollow, isFollowing, getFollowerCount, getFollowingCount } from '../utils/followSystem';
import { notifyFollowReceived, notifyFollowingStarted } from '../utils/notifications';
import PostGridItem from '../components/PostGridItem';
import { ScreenLayout, ScreenContent, ScreenHeader, ScreenBody } from '../components/ScreenLayout';

const UserProfileScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { userId, username: passedUsername } = route.params || {};
  const { user: currentUser } = useAuth();
  
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
  const [selectedDate, setSelectedDate] = useState('');
  const [availableDates, setAvailableDates] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null); // 여행 지도 핀 클릭 시 가벼운 사진상세 모달용
  const [isFollow, setIsFollow] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [followLoading, setFollowLoading] = useState(false);

  const loadFollowData = useCallback(async () => {
    if (!userId) return;
    const [fc, fing, isf] = await Promise.all([
      getFollowerCount(userId),
      getFollowingCount(userId),
      isFollowing(null, userId),
    ]);
    setFollowerCount(fc);
    setFollowingCount(fing);
    setIsFollow(isf);
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      navigation.goBack();
      return;
    }
    loadUserData();
  }, [userId, navigation]);

  useEffect(() => {
    loadFollowData();
  }, [userId, loadFollowData]);

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
      setSelectedDate('');
      setAvailableDates([]);

      // 해당 사용자의 정보 찾기 (게시물에서)
      const uploadedPostsJson = await AsyncStorage.getItem('uploadedPosts');
      const uploadedPosts = uploadedPostsJson ? JSON.parse(uploadedPostsJson) : [];

      const postsOfUser = uploadedPosts.filter((p) => {
        const postUserId =
          p.userId ||
          (typeof p.user === 'string' ? p.user : p.user?.id) ||
          p.user;
        return String(postUserId) === String(userId);
      });

      const pickProfileImageFromPosts = (posts) => {
        for (const p of posts) {
          if (p.userAvatar) return p.userAvatar;
          if (p.user && typeof p.user === 'object' && p.user.profileImage) return p.user.profileImage;
        }
        return null;
      };

      const avatarFromPosts = pickProfileImageFromPosts(postsOfUser);
      const userPost = postsOfUser[0];

      let resolvedUsername = passedUsername || '사용자';
      if (!passedUsername && userPost) {
        const postUserId =
          userPost.userId ||
          (typeof userPost.user === 'string' ? userPost.user : userPost.user?.id) ||
          userPost.user;
        resolvedUsername =
          (typeof userPost.user === 'string' ? userPost.user : userPost.user?.username) ||
          postUserId ||
          '사용자';
      }

      setUser({
        id: userId,
        username: resolvedUsername,
        profileImage: avatarFromPosts,
      });

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

      // 해당 사용자의 게시물 (위에서 필터한 목록과 동일)
      const posts = postsOfUser;
      setUserPosts(posts);

      // 사용 가능한 날짜 목록 (최신순) - 사진/동영상이 있는 게시물이 있는 날만 표시
      const postsWithMedia = posts.filter(
        (p) => (p.images && p.images.length > 0) || p.image || p.imageUrl || (p.videos && p.videos.length > 0)
      );
      const dates = [...new Set(
        postsWithMedia.map((p) => {
          const d = new Date(p.createdAt || p.timestamp || Date.now());
          return d.toISOString().split('T')[0];
        }).filter(Boolean)
      )].sort((a, b) => new Date(b) - new Date(a));
      setAvailableDates(dates);
      
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

  // 날짜별 필터된 게시물 (지도 + 그리드 공통) + 항상 날짜순(최신순) 정렬
  const filteredUserPosts = useMemo(() => {
    let list = userPosts;
    if (selectedDate) {
      const filterDate = new Date(selectedDate);
      filterDate.setHours(0, 0, 0, 0);
      const nextDay = new Date(filterDate);
      nextDay.setDate(nextDay.getDate() + 1);
      list = userPosts.filter((p) => {
        const postDate = new Date(p.createdAt || p.timestamp || Date.now());
        postDate.setHours(0, 0, 0, 0);
        return postDate >= filterDate && postDate < nextDay;
      });
    }
    // 사용자가 올린 피드를 날짜순(최신순)으로 정렬
    return [...list].sort((a, b) => {
      const ta = (a.createdAt || a.timestamp || 0) ? new Date(a.createdAt || a.timestamp).getTime() : 0;
      const tb = (b.createdAt || b.timestamp || 0) ? new Date(b.createdAt || b.timestamp).getTime() : 0;
      return tb - ta;
    });
  }, [userPosts, selectedDate]);

  const handlePostPress = (post, index) => {
    navigation.navigate('PostDetail', {
      postId: post.id,
      post: post,
      allPosts: filteredUserPosts,
      currentPostIndex: index >= 0 ? index : filteredUserPosts.findIndex(p => p.id === post.id),
    });
  };

  // 지도에 표시할 게시물 (filteredUserPosts 중 coordinates 또는 지역명으로 좌표 추출 가능)
  const postsForMap = useMemo(() => {
    return filteredUserPosts
      .map((p) => {
        const c = p.coordinates || getCoordinatesByLocation(p.detailedLocation || p.location);
        return c && c.lat != null && c.lng != null ? { ...p, _coords: c } : null;
      })
      .filter(Boolean);
  }, [filteredUserPosts]);

  // 여행 지도 영역 (다른 사용자도 볼 수 있음)
  const mapRegion = useMemo(() => {
    if (postsForMap.length === 0) return null;
    const lats = postsForMap.map((p) => p._coords.lat);
    const lngs = postsForMap.map((p) => p._coords.lng);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: Math.max((maxLat - minLat) * 1.5, 0.01),
      longitudeDelta: Math.max((maxLng - minLng) * 1.5, 0.01),
    };
  }, [postsForMap]);

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
                        {getBadgeDisplayName(representativeBadge)}
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
                {/* 팔로우 버튼: 로그인 + 다른 사용자 프로필일 때만 */}
                {currentUser && String(currentUser.id) !== String(userId) && (
                  <TouchableOpacity
                    onPress={async () => {
                      if (followLoading) return;
                      setFollowLoading(true);
                      if (isFollow) {
                        await unfollow(userId);
                        setIsFollow(false);
                        setFollowerCount((c) => Math.max(0, c - 1));
                      } else {
                        const r = await follow(userId);
                        if (r.success) {
                          setIsFollow(true);
                          setFollowerCount((c) => c + 1);
                          const myLabel =
                            currentUser?.username || currentUser?.name || '여행자';
                          const theirName = user?.username || '사용자';
                          await notifyFollowReceived(myLabel, userId);
                          await notifyFollowingStarted(theirName, currentUser.id);
                        }
                      }
                      setFollowLoading(false);
                    }}
                    disabled={followLoading}
                    style={[
                      styles.followButton,
                      isFollow && styles.followButtonFollowing,
                    ]}
                  >
                    <Text style={[styles.followButtonText, isFollow && styles.followButtonTextFollowing]}>
                      {isFollow ? '팔로잉' : '팔로우'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
          </View>

          {/* 통계 정보 */}
          <View style={[styles.statsSection, { flexWrap: 'wrap' }]}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.posts}</Text>
              <Text style={styles.statLabel}>게시물</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{followerCount}</Text>
              <Text style={styles.statLabel}>팔로워</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{followingCount}</Text>
              <Text style={styles.statLabel}>팔로잉</Text>
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

        {/* 날짜별 검색 - 여행 지도와 여행 기록에 공통 적용 */}
        {userPosts.length > 0 && availableDates.length > 0 && (
          <View style={styles.dateFilterSection}>
            <Text style={styles.dateFilterLabel}>날짜별 보기</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateFilterScroll}>
              <TouchableOpacity
                style={[styles.dateFilterChip, !selectedDate && styles.dateFilterChipActive]}
                onPress={() => setSelectedDate('')}
              >
                <Text style={[styles.dateFilterChipText, !selectedDate && styles.dateFilterChipTextActive]}>전체</Text>
              </TouchableOpacity>
              {availableDates.map((date) => {
                const dateObj = new Date(date);
                const label = dateObj.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
                const isSelected = selectedDate === date;
                return (
                  <TouchableOpacity
                    key={date}
                    style={[styles.dateFilterChip, isSelected && styles.dateFilterChipActive]}
                    onPress={() => setSelectedDate(isSelected ? '' : date)}
                  >
                    <Text style={[styles.dateFilterChipText, isSelected && styles.dateFilterChipTextActive]}>{label}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* 여행 지도 - 이 사용자가 다녀온 장소를 지도에 표시 (다른 사용자도 볼 수 있음) */}
        {userPosts.length > 0 && (
          <View style={styles.travelMapSection}>
            <View style={styles.travelMapTitleRow}>
              <Ionicons name="map" size={18} color={COLORS.primary} style={{ marginRight: 6 }} />
              <Text style={styles.travelMapTitle}>{user.username || '사용자'}의 여행 지도</Text>
            </View>
            {filteredUserPosts.length === 0 ? (
              <View style={styles.travelMapPlaceholder}>
                <Text style={styles.travelMapPlaceholderText}>이 날짜에 등록한 게시물이 없습니다</Text>
              </View>
            ) : postsForMap.length === 0 ? (
              <View style={styles.travelMapPlaceholder}>
                <Text style={styles.travelMapPlaceholderText}>
                  {selectedDate ? '이 날짜에 위치 정보가 있는 장소가 없습니다' : '방문한 장소 중 위치 정보가 있는 곳이 없습니다'}
                </Text>
              </View>
            ) : mapRegion ? (
              <View style={styles.travelMapContainer}>
                <MapView
                  style={styles.travelMap}
                  provider={PROVIDER_GOOGLE}
                  initialRegion={mapRegion}
                  region={mapRegion}
                  scrollEnabled={false}
                  zoomEnabled={false}
                  showsUserLocation={false}
                >
                  <Polyline
                    coordinates={[...postsForMap]
                      .sort((a, b) => new Date(a.createdAt || a.timestamp || 0) - new Date(b.createdAt || b.timestamp || 0))
                      .map((p) => ({ latitude: p._coords.lat, longitude: p._coords.lng }))}
                    strokeColor="#14B8A6"
                    strokeWidth={3}
                  />
                  {postsForMap.map((post, index) => (
                    <Marker
                      key={post.id || index}
                      coordinate={{ latitude: post._coords.lat, longitude: post._coords.lng }}
                      onPress={() => {
                        const idx = filteredUserPosts.findIndex((p) => p.id === post.id);
                        setSelectedPost({ post, allPosts: filteredUserPosts, currentPostIndex: idx >= 0 ? idx : 0 });
                      }}
                    >
                      <View style={styles.travelMapMarker}>
                        <Image
                          source={{ uri: post.images?.[0] || post.imageUrl || post.image }}
                          style={styles.travelMapMarkerImage}
                          resizeMode="cover"
                        />
                      </View>
                    </Marker>
                  ))}
                </MapView>
              </View>
            ) : null}
          </View>
        )}

        {/* 여행 기록 그리드 */}
        <View style={styles.postsSection}>
          {userPosts.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="images-outline" size={64} color={COLORS.textSubtle} />
              <Text style={styles.emptyText}>아직 업로드한 사진이 없습니다</Text>
            </View>
          ) : filteredUserPosts.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={64} color={COLORS.textSubtle} />
              <Text style={styles.emptyText}>이 날짜에 등록한 게시물이 없습니다</Text>
            </View>
          ) : (
            <View style={styles.postsGrid}>
              {filteredUserPosts.map((post, index) => (
                <PostGridItem
                  key={post.id || index}
                  post={post}
                  index={index}
                  isEditMode={false}
                  isSelected={false}
                  onPress={handlePostPress}
                  onToggleSelection={() => {}}
                  onTagPress={(t) => navigation.navigate('Search', { initialQuery: '#' + t })}
                />
              ))}
            </View>
          )}
        </View>
        </ScreenBody>

      {/* 여행 지도 핀 클릭 시 가벼운 사진상세 모달 (지도화면과 동일) */}
      <Modal
        visible={!!selectedPost}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setSelectedPost(null)}
      >
        {selectedPost ? (
          <TouchableWithoutFeedback onPress={() => setSelectedPost(null)}>
            <View style={styles.photoDetailOverlay}>
              <TouchableWithoutFeedback onPress={() => {}}>
                <View style={styles.photoDetailCard}>
                  <View style={styles.photoDetailHeader}>
                    <Text style={styles.photoDetailTitle} numberOfLines={1}>
                      {selectedPost.post?.location || selectedPost.post?.detailedLocation || '여행지'}
                    </Text>
                    <TouchableOpacity onPress={() => setSelectedPost(null)} style={styles.photoDetailClose}>
                      <Ionicons name="close" size={22} color={COLORS.text} />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.photoDetailImageWrap}>
                    <Image
                      source={{ uri: selectedPost.post?.images?.[0] || selectedPost.post?.imageUrl || selectedPost.post?.image || selectedPost.post?.thumbnail || '' }}
                      style={styles.photoDetailImage}
                      resizeMode="cover"
                    />
                  </View>
                  <ScrollView style={styles.photoDetailBody} showsVerticalScrollIndicator={false}>
                    {selectedPost.post?.note ? (
                      <Text style={styles.photoDetailNote}>{selectedPost.post.note}</Text>
                    ) : null}
                    <View style={styles.photoDetailLocationRow}>
                      <Ionicons name="location" size={18} color={COLORS.primary} />
                      <Text style={styles.photoDetailLocation}>
                        {selectedPost.post?.detailedLocation || selectedPost.post?.location || '위치 정보 없음'}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.photoDetailFullButton}
                      onPress={() => {
                        setSelectedPost(null);
                        navigation.navigate('PostDetail', {
                          postId: selectedPost.post.id,
                          post: selectedPost.post,
                          allPosts: selectedPost.allPosts,
                          currentPostIndex: selectedPost.currentPostIndex,
                        });
                      }}
                    >
                      <Text style={styles.photoDetailFullButtonText}>전체 보기</Text>
                    </TouchableOpacity>
                  </ScrollView>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        ) : null}
      </Modal>

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
                        {getBadgeDisplayName(earnedBadges[0])}
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
  followButton: {
    marginTop: SPACING.sm,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignSelf: 'flex-start',
  },
  followButtonFollowing: {
    backgroundColor: COLORS.borderLight,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  followButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textWhite,
  },
  followButtonTextFollowing: {
    color: COLORS.text,
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
  photoDetailOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  photoDetailCard: {
    width: '100%',
    maxWidth: 360,
    maxHeight: '80%',
    backgroundColor: COLORS.backgroundLight,
    borderRadius: 20,
    overflow: 'hidden',
  },
  photoDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  photoDetailTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginRight: SPACING.sm,
  },
  photoDetailClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoDetailImageWrap: {
    width: '100%',
    aspectRatio: 4 / 3,
    backgroundColor: COLORS.borderLight,
  },
  photoDetailImage: {
    width: '100%',
    height: '100%',
  },
  photoDetailBody: {
    maxHeight: 200,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.lg,
  },
  photoDetailNote: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 22,
    marginBottom: SPACING.md,
  },
  photoDetailLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  photoDetailLocation: {
    fontSize: 13,
    color: COLORS.textSecondary,
    flex: 1,
  },
  photoDetailFullButton: {
    marginTop: SPACING.md,
    paddingVertical: SPACING.md,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  photoDetailFullButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textWhite,
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
  dateFilterSection: {
    backgroundColor: COLORS.backgroundLight,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  dateFilterLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  dateFilterScroll: {
    flexDirection: 'row',
  },
  dateFilterChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
    backgroundColor: COLORS.borderLight,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: SPACING.sm,
  },
  dateFilterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  dateFilterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  dateFilterChipTextActive: {
    color: COLORS.textWhite,
  },
  travelMapSection: {
    backgroundColor: COLORS.backgroundLight,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  travelMapTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  travelMapTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  travelMapPlaceholder: {
    height: 160,
    borderRadius: 12,
    backgroundColor: COLORS.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  travelMapPlaceholderText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  travelMapContainer: {
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
  },
  travelMap: {
    width: '100%',
    height: '100%',
  },
  travelMapMarker: {
    width: 40,
    height: 40,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'white',
  },
  travelMapMarkerImage: {
    width: '100%',
    height: '100%',
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



