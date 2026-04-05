import React, { useState, useEffect, useCallback } from 'react';
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
  TextInput,
  FlatList,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants/styles';
import { getUserDailyTitle } from '../utils/dailyTitleSystem';
import { getEarnedBadges, getBadgeDisplayName } from '../utils/badgeSystem';
import {
  getFollowerCount,
  getFollowingCount,
  getFollowerIds,
  getFollowingIds,
  follow,
  unfollow,
  isFollowing,
} from '../utils/followSystem';
import { getUserLevel } from '../utils/levelSystem';
import PostGridItem from '../components/PostGridItem';
import { Modal } from 'react-native';
import { ScreenLayout, ScreenContent, ScreenHeader, ScreenBody } from '../components/ScreenLayout';
import { getCoordinatesByLocation } from '../utils/regionLocationMapping';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function FollowListFollowButton({ targetId, followListType, onUnfollowFromList, onFollowChange }) {
  const [isF, setIsF] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let c = true;
    (async () => {
      const v = await isFollowing(null, targetId);
      if (c) setIsF(v);
    })();
    return () => {
      c = false;
    };
  }, [targetId]);
  return (
    <TouchableOpacity
      style={[followListStyles.followBtn, isF && followListStyles.followBtnOn]}
      disabled={busy}
      onPress={async () => {
        setBusy(true);
        try {
          if (isF) {
            await unfollow(targetId);
            setIsF(false);
            if (followListType === 'following') onUnfollowFromList();
          } else {
            const r = await follow(targetId);
            if (r.success) setIsF(true);
          }
          onFollowChange();
        } finally {
          setBusy(false);
        }
      }}
    >
      <Text style={[followListStyles.followBtnText, isF && followListStyles.followBtnTextOn]}>
        {isF ? '팔로잉' : '팔로우'}
      </Text>
    </TouchableOpacity>
  );
}

const followListStyles = StyleSheet.create({
  followBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
  },
  followBtnOn: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  followBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  followBtnTextOn: {
    color: '#64748b',
  },
});

const ProfileScreen = () => {
  const { user: authUser, logout } = useAuth();
  const navigation = useNavigation();
  const [user, setUser] = useState(null);
  const [myPosts, setMyPosts] = useState([]);
  const [levelInfo, setLevelInfo] = useState(null);
  const [dailyTitle, setDailyTitle] = useState(null);
  const [earnedBadges, setEarnedBadges] = useState([]);
  const [representativeBadge, setRepresentativeBadge] = useState(null);
  const [showBadgeSelector, setShowBadgeSelector] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('my'); // 'my' | 'map'

  // 날짜 필터
  const [selectedDate, setSelectedDate] = useState('');
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [mapRegion, setMapRegion] = useState(null);
  const [availableDates, setAvailableDates] = useState([]);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [showFollowListModal, setShowFollowListModal] = useState(false);
  const [followListType, setFollowListType] = useState('follower'); // 'follower' | 'following'
  const [followListIds, setFollowListIds] = useState([]);
  const [followResolvePosts, setFollowResolvePosts] = useState([]);

  useEffect(() => {
    if (!showFollowListModal) return;
    (async () => {
      try {
        const postsJson = await AsyncStorage.getItem('uploadedPosts');
        setFollowResolvePosts(postsJson ? JSON.parse(postsJson) : []);
      } catch {
        setFollowResolvePosts([]);
      }
    })();
  }, [showFollowListModal]);

  const refreshFollowCounts = useCallback(async () => {
    const uid = (user || authUser)?.id;
    if (!uid) return;
    setFollowerCount(await getFollowerCount(uid));
    setFollowingCount(await getFollowingCount(uid));
  }, [user?.id, authUser?.id]);

  useEffect(() => {
    loadProfileData();
  }, []);

  useEffect(() => {
    refreshFollowCounts();
  }, [refreshFollowCounts]);

  useFocusEffect(
    useCallback(() => {
      refreshFollowCounts();
    }, [refreshFollowCounts])
  );

  // 날짜 필터 적용
  useEffect(() => {
    if (activeTab === 'map') {
      let filtered = [...myPosts];

      if (selectedDate) {
        filtered = filtered.filter(post => {
          const postDate = new Date(post.createdAt || post.timestamp || Date.now());
          const dateKey = postDate.toISOString().split('T')[0];
          return dateKey === selectedDate;
        });
      }

      setFilteredPosts(filtered);

      // 필터링된 게시물로 지도 영역 재계산
      if (filtered.length > 0) {
        const postsWithCoords = filtered.filter(post => post.coordinates && post.coordinates.lat && post.coordinates.lng);
        if (postsWithCoords.length > 0) {
          const lats = postsWithCoords.map(p => p.coordinates.lat);
          const lngs = postsWithCoords.map(p => p.coordinates.lng);
          const minLat = Math.min(...lats);
          const maxLat = Math.max(...lats);
          const minLng = Math.min(...lngs);
          const maxLng = Math.max(...lngs);

          setMapRegion({
            latitude: (minLat + maxLat) / 2,
            longitude: (minLng + maxLng) / 2,
            latitudeDelta: Math.max((maxLat - minLat) * 1.5, 0.01),
            longitudeDelta: Math.max((maxLng - minLng) * 1.5, 0.01),
          });
        }
      }
    } else {
      setFilteredPosts(myPosts);
    }
  }, [myPosts, selectedDate, activeTab]);

  // 지도 탭을 처음 열 때: 가장 최근에 올린 날짜로 자동 선택
  useEffect(() => {
    if (activeTab === 'map' && !selectedDate && availableDates.length > 0) {
      setSelectedDate(availableDates[0]);
    }
  }, [activeTab, availableDates, selectedDate]);

  const loadProfileData = async () => {
    try {
      setLoading(true);

      // 사용자 정보 로드
      const savedUserJson = await AsyncStorage.getItem('user');
      const savedUser = savedUserJson ? JSON.parse(savedUserJson) : authUser;
      setUser(savedUser);

      // 레벨 정보 로드
      const levelData = await getUserLevel();
      setLevelInfo(levelData);

      // 24시간 타이틀 로드
      if (savedUser?.id) {
        const title = await getUserDailyTitle(savedUser.id);
        setDailyTitle(title);
      }


      // 뱃지 로드
      const badges = await getEarnedBadges();
      setEarnedBadges(badges);

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
      setFilteredPosts(userPosts);

      // 사용 가능한 날짜 목록 추출
      const updateAvailableDates = (posts) => {
        const dates = [...new Set(
          posts
            .map(post => {
              const date = new Date(post.createdAt || post.timestamp || Date.now());
              return date.toISOString().split('T')[0]; // YYYY-MM-DD 형식
            })
            .filter(Boolean)
        )].sort((a, b) => new Date(b) - new Date(a));
        setAvailableDates(dates);
      };

      updateAvailableDates(userPosts);

      // 게시물 업데이트 감지를 위한 주기적 체크
      const checkInterval = setInterval(async () => {
        try {
          const updatedPostsJson = await AsyncStorage.getItem('uploadedPosts');
          const updatedPosts = updatedPostsJson ? JSON.parse(updatedPostsJson) : [];
          const updatedUserPosts = updatedPosts.filter(post => post.userId === userId);

          if (updatedUserPosts.length !== userPosts.length) {
            setMyPosts(updatedUserPosts);
            updateAvailableDates(updatedUserPosts);

            // 새 게시물이 추가되면 해당 날짜로 자동 선택 (선택된 날짜가 없을 때만)
            if (updatedUserPosts.length > userPosts.length && !selectedDate) {
              const newPost = updatedUserPosts[0];
              if (newPost) {
                const newPostDate = new Date(newPost.createdAt || newPost.timestamp || Date.now());
                const dateStr = newPostDate.toISOString().split('T')[0];
                setSelectedDate(dateStr);
              }
            }
          }
        } catch (error) {
          console.error('게시물 업데이트 체크 실패:', error);
        }
      }, 1000);

      return () => {
        clearInterval(checkInterval);
      };

      // 지도 영역 계산
      if (userPosts.length > 0) {
        const postsWithCoords = userPosts.filter(post => post.coordinates && post.coordinates.lat && post.coordinates.lng);
        if (postsWithCoords.length > 0) {
          const lats = postsWithCoords.map(p => p.coordinates.lat);
          const lngs = postsWithCoords.map(p => p.coordinates.lng);
          const minLat = Math.min(...lats);
          const maxLat = Math.max(...lats);
          const minLng = Math.min(...lngs);
          const maxLng = Math.max(...lngs);

          setMapRegion({
            latitude: (minLat + maxLat) / 2,
            longitude: (minLng + maxLng) / 2,
            latitudeDelta: Math.max((maxLat - minLat) * 1.5, 0.01),
            longitudeDelta: Math.max((maxLng - minLng) * 1.5, 0.01),
          });
        } else {
          // 좌표가 없고 지역명만 있는 경우: 지역명을 지도 좌표로 변환해서 이동
          const firstPostWithLocation = userPosts.find(
            post => post.location || post.detailedLocation
          );
          if (firstPostWithLocation) {
            const locName = firstPostWithLocation.location || firstPostWithLocation.detailedLocation;
            const coords = getCoordinatesByLocation(locName);
            if (coords) {
              setMapRegion({
                latitude: coords.lat,
                longitude: coords.lng,
                latitudeDelta: 0.1,
                longitudeDelta: 0.1,
              });
            } else {
              // 매핑에 없는 지역이면 서울로 기본 설정
              setMapRegion({
                latitude: 37.5665,
                longitude: 126.9780,
                latitudeDelta: 0.1,
                longitudeDelta: 0.1,
              });
            }
          } else {
            // 지역 정보가 전혀 없으면 서울로 기본 설정
            setMapRegion({
              latitude: 37.5665,
              longitude: 126.9780,
              latitudeDelta: 0.1,
              longitudeDelta: 0.1,
            });
          }
        }
      }
    } catch (error) {
      console.error('프로필 데이터 로드 실패:', error);
    } finally {
      setLoading(false);
    }

    return () => {
      if (checkInterval) {
        clearInterval(checkInterval);
      }
    };
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

              // 날짜 필터 적용
              if (activeTab === 'map') {
                let filtered = [...updatedMyPosts];

                if (selectedDate) {
                  filtered = filtered.filter(post => {
                    const postDate = new Date(post.createdAt || post.timestamp || Date.now());
                    const dateKey = postDate.toISOString().split('T')[0];
                    return dateKey === selectedDate;
                  });
                }

                setFilteredPosts(filtered);
              } else {
                setFilteredPosts(updatedMyPosts);
              }

              // 사용 가능한 날짜 목록 업데이트
              const dates = [...new Set(
                updatedMyPosts
                  .map(post => {
                    const date = new Date(post.createdAt || post.timestamp || Date.now());
                    return date.toISOString().split('T')[0];
                  })
                  .filter(Boolean)
              )].sort((a, b) => new Date(b) - new Date(a));
              setAvailableDates(dates);

              // 삭제된 게시물의 날짜가 선택되어 있고, 그 날짜에 더 이상 게시물이 없으면 날짜 선택 해제
              if (selectedDate && !dates.includes(selectedDate)) {
                setSelectedDate('');
              }

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

      Alert.alert('완료', `대표 뱃지가 "${getBadgeDisplayName(badge)}"로 설정되었습니다.`);
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

  const resolveUserInfoForList = useCallback(
    (uid) => {
      const currentUserData = user || authUser;
      const myId = currentUserData?.id;
      if (String(uid) === String(myId) && currentUserData) {
        return {
          username: currentUserData.username || '사용자',
          profileImage: currentUserData.profileImage || null,
        };
      }
      const p = followResolvePosts.find((post) => {
        const pu = post.userId || (typeof post.user === 'string' ? post.user : post.user?.id);
        return String(pu) === String(uid);
      });
      if (!p) return { username: '사용자', profileImage: null };
      if (!p.user) return { username: '사용자', profileImage: p.userAvatar || null };
      if (typeof p.user === 'string') return { username: p.user, profileImage: p.userAvatar || null };
      return {
        username: p.user?.username || '사용자',
        profileImage: p.user?.profileImage || p.userAvatar || null,
      };
    },
    [user, authUser, followResolvePosts]
  );

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
      {/* 헤더 - 웹과 동일한 구조 (ScreenContent 밖) */}
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

      <ScreenContent>
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
                  <View style={styles.usernameRowLeft}>
                    <Text style={styles.username}>{user.username || '모사모'}</Text>
                    {/* 대표 뱃지 - 클릭 가능 */}
                    <TouchableOpacity
                      style={styles.representativeBadge}
                      onPress={() => {
                        if (earnedBadges.length > 0) {
                          setShowBadgeSelector(true);
                        } else {
                          Alert.alert('알림', '아직 획득한 뱃지가 없습니다.');
                        }
                      }}
                      disabled={earnedBadges.length === 0}
                    >
                      {representativeBadge ? (
                        <>
                          <Text style={styles.representativeBadgeIcon}>{representativeBadge.icon}</Text>
                          <Text style={styles.representativeBadgeText}>{representativeBadge.name}</Text>
                        </>
                      ) : (
                        <Text style={styles.representativeBadgePlaceholder}>뱃지 없음</Text>
                      )}
                    </TouchableOpacity>
                    {/* 뱃지 모아보기 버튼 - 플러스 아이콘 */}
                    <TouchableOpacity
                      style={styles.badgesViewButtonPlus}
                      onPress={() => navigation.navigate('BadgeList')}
                    >
                      <Ionicons name="add" size={16} color={COLORS.primary} />
                    </TouchableOpacity>
                  </View>
                  {/* 프로필 편집 버튼 - 우측 정렬 */}
                  <TouchableOpacity
                    style={styles.editProfileButtonInline}
                    onPress={() => {
                      Alert.alert('알림', '프로필 편집 화면은 준비 중입니다.');
                    }}
                  >
                    <Ionicons name="create-outline" size={18} color={COLORS.primary} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* 팔로워 / 팔로잉 / 게시물 (디자인 개선) */}
            <View style={styles.statsSection}>
              <TouchableOpacity
                style={styles.statItem}
                activeOpacity={0.7}
                onPress={async () => {
                  const uid = (user || authUser)?.id;
                  if (!uid) return;
                  const ids = await getFollowerIds(uid);
                  setFollowListIds(ids);
                  setFollowListType('follower');
                  setShowFollowListModal(true);
                }}
              >
                <Text style={styles.statNumber}>{followerCount}</Text>
                <Text style={styles.statLabel}>팔로워</Text>
              </TouchableOpacity>
              <View style={styles.statDivider} />
              <TouchableOpacity
                style={styles.statItem}
                activeOpacity={0.7}
                onPress={async () => {
                  const uid = (user || authUser)?.id;
                  if (!uid) return;
                  const ids = await getFollowingIds(uid);
                  setFollowListIds(ids);
                  setFollowListType('following');
                  setShowFollowListModal(true);
                }}
              >
                <Text style={styles.statNumber}>{followingCount}</Text>
                <Text style={styles.statLabel}>팔로잉</Text>
              </TouchableOpacity>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{myPosts.length}</Text>
                <Text style={styles.statLabel}>게시물</Text>
              </View>
            </View>

            {/* 레벨 정보 (디자인 크게 개선) */}
            {levelInfo && (
              <View style={styles.levelCard}>
                <LinearGradient
                  colors={[COLORS.primary + '15', COLORS.primary + '05']}
                  style={styles.levelCardGradient}
                >
                  <View style={styles.levelHeader}>
                    <View style={styles.levelBadgeLarge}>
                      <Text style={styles.levelBadgeTextLarge}>{levelInfo.level}</Text>
                    </View>
                    <View style={styles.levelTitleContainer}>
                      <Text style={styles.levelTitleLarge}>{levelInfo.title}</Text>
                      <Text style={styles.levelSubtitle}>다음 레벨까지 {levelInfo.expNeededForNextLevel - levelInfo.expInCurrentLevel} XP 남음</Text>
                    </View>
                  </View>

                  <View style={styles.levelProgressContainer}>
                    <View style={styles.progressBarBg}>
                      <View style={[styles.progressBarFill, { width: `${levelInfo.progress}%` }]} />
                    </View>
                    <View style={styles.progressLabelRow}>
                      <Text style={styles.progressLabel}>현재 {levelInfo.expInCurrentLevel} XP</Text>
                      <Text style={styles.progressLabel}>{levelInfo.expNeededForNextLevel} XP</Text>
                    </View>
                  </View>

                  <Text style={styles.levelQuote}>
                    {levelInfo.level < 5 ? "점점 더 많은 곳을 항해하고 계시네요! ⚓" : "진정한 여행의 고수가 되어가고 있어요! ✨"}
                  </Text>
                </LinearGradient>
              </View>
            )}
          </View>

          {/* 여행 기록 탭 */}
          <View style={styles.tabsSection}>
            <View style={styles.tabsContainer}>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'my' && styles.tabActive]}
                onPress={() => setActiveTab('my')}
              >
                <Text style={[styles.tabText, activeTab === 'my' && styles.tabTextActive]}>📸 내 사진</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'map' && styles.tabActive]}
                onPress={() => setActiveTab('map')}
              >
                <Text style={[styles.tabText, activeTab === 'map' && styles.tabTextActive]}>🗺️ 나의 기록 지도</Text>
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

            {/* 내 사진 탭 (타임라인 형식) */}
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
                          <PostGridItem
                            key={post.id || index}
                            post={post}
                            index={index}
                            isEditMode={isEditMode}
                            isSelected={selectedPhotos.includes(post.id)}
                            onPress={handlePostPress}
                            onToggleSelection={togglePhotoSelection}
                            onTagPress={(t) => navigation.navigate('Search', { initialQuery: '#' + t })}
                          />
                        ))}
                      </View>
                    </View>
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
                    {/* 날짜 필터 - 가벼운 디자인 */}
                    {availableDates.length > 0 && (
                      <View style={styles.dateFilterLight}>
                        <ScrollView
                          horizontal
                          showsHorizontalScrollIndicator={false}
                          contentContainerStyle={styles.dateFilterScrollContent}
                        >
                          <TouchableOpacity
                            style={[
                              styles.dateFilterButton,
                              !selectedDate && styles.dateFilterButtonActive
                            ]}
                            onPress={() => setSelectedDate('')}
                          >
                            <Text style={[
                              styles.dateFilterButtonText,
                              !selectedDate && styles.dateFilterButtonTextActive
                            ]}>전체</Text>
                          </TouchableOpacity>
                          {availableDates.slice(0, 7).map((date) => {
                            const dateObj = new Date(date);
                            const dateStr = dateObj.toLocaleDateString('ko-KR', {
                              month: 'short',
                              day: 'numeric',
                            });
                            const isSelected = selectedDate === date;
                            return (
                              <TouchableOpacity
                                key={date}
                                style={[
                                  styles.dateFilterButton,
                                  isSelected && styles.dateFilterButtonActive
                                ]}
                                onPress={() => setSelectedDate(isSelected ? '' : date)}
                              >
                                <Text style={[
                                  styles.dateFilterButtonText,
                                  isSelected && styles.dateFilterButtonTextActive
                                ]}>{dateStr}</Text>
                              </TouchableOpacity>
                            );
                          })}
                        </ScrollView>
                      </View>
                    )}

                    {/* 지도 영역 */}
                    {mapRegion && (() => {
                      const sortedPosts = [...filteredPosts]
                        .filter(post => post.coordinates && post.coordinates.lat && post.coordinates.lng)
                        .sort((a, b) => new Date(a.createdAt || a.timestamp || 0) - new Date(b.createdAt || b.timestamp || 0));

                      const pathCoordinates = sortedPosts.map(post => ({
                        latitude: post.coordinates.lat,
                        longitude: post.coordinates.lng,
                      }));

                      return (
                        <View style={styles.mapContainer}>
                          <MapView
                            style={styles.map}
                            provider={PROVIDER_GOOGLE}
                            initialRegion={mapRegion}
                            region={mapRegion}
                          >
                            {pathCoordinates.length >= 2 && (
                              <Polyline
                                coordinates={pathCoordinates}
                                strokeColor={COLORS.primary}
                                strokeWidth={3}
                              />
                            )}
                            {sortedPosts.map((post, index) => (
                              <Marker
                                key={post.id || index}
                                coordinate={{
                                  latitude: post.coordinates.lat,
                                  longitude: post.coordinates.lng,
                                }}
                                onPress={() => handlePostPress(post, index)}
                              >
                                <View style={styles.markerContainer}>
                                  <Image
                                    source={{ uri: post.images?.[0] || post.image }}
                                    style={styles.markerImage}
                                    resizeMode="cover"
                                  />
                                </View>
                              </Marker>
                            ))}
                          </MapView>
                        </View>
                      );
                    })()}
                  </View>
                )}
              </View>
            )}
          </View>

          {/* 설정 메뉴 */}
          <View style={styles.menuSection}>
            <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={24} color={COLORS.error} />
              <Text style={[styles.menuText, { color: COLORS.error }]}>로그아웃</Text>
              <Ionicons name="chevron-forward" size={20} color={COLORS.textSubtle} />
            </TouchableOpacity>
          </View>

          {/* 팔로워 / 팔로잉 목록 */}
          <Modal
            visible={showFollowListModal}
            animationType="slide"
            transparent
            onRequestClose={() => setShowFollowListModal(false)}
          >
            <View style={styles.followListOverlay}>
              <TouchableOpacity
                style={styles.followListBackdrop}
                activeOpacity={1}
                onPress={() => setShowFollowListModal(false)}
              />
              <View style={styles.followListSheet} pointerEvents="box-none">
                <View style={styles.followListHeader}>
                  <Text style={styles.followListTitle}>
                    {followListType === 'follower' ? '팔로워' : '팔로잉'}
                  </Text>
                  <TouchableOpacity onPress={() => setShowFollowListModal(false)}>
                    <Text style={styles.followListClose}>닫기</Text>
                  </TouchableOpacity>
                </View>
                <FlatList
                  style={styles.followListScroll}
                  data={followListIds}
                  keyExtractor={(id) => String(id)}
                  contentContainerStyle={
                    followListIds.length === 0
                      ? { flexGrow: 1, justifyContent: 'center', padding: 24 }
                      : { paddingBottom: 24 }
                  }
                  ListEmptyComponent={
                    <Text style={styles.followListEmpty}>
                      {followListType === 'follower'
                        ? '팔로워가 없습니다'
                        : '팔로우 중인 사용자가 없습니다'}
                    </Text>
                  }
                  renderItem={({ item: uid }) => {
                    const { username: uname, profileImage: avatar } = resolveUserInfoForList(uid);
                    const myId = (user || authUser)?.id;
                    return (
                      <View style={styles.followListRow}>
                        <TouchableOpacity
                          style={styles.followListUserBtn}
                          onPress={() => {
                            setShowFollowListModal(false);
                            navigation.navigate('UserProfile', {
                              userId: uid,
                              username: uname,
                            });
                          }}
                        >
                          <View style={styles.followListAvatar}>
                            {avatar ? (
                              <Image source={{ uri: avatar }} style={styles.followListAvatarImg} />
                            ) : (
                              <Ionicons name="person" size={22} color={COLORS.textSubtle} />
                            )}
                          </View>
                          <Text style={styles.followListUsername} numberOfLines={1}>
                            {uname}
                          </Text>
                        </TouchableOpacity>
                        {myId && String(uid) !== String(myId) ? (
                          <FollowListFollowButton
                            targetId={uid}
                            followListType={followListType}
                            onUnfollowFromList={() => {
                              setFollowListIds((prev) => prev.filter((id) => String(id) !== String(uid)));
                              refreshFollowCounts();
                            }}
                            onFollowChange={refreshFollowCounts}
                          />
                        ) : null}
                      </View>
                    );
                  }}
                />
              </View>
            </View>
          </Modal>

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
                  <TouchableOpacity onPress={() => setShowBadgeSelector(false)}>
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
                        <Text style={styles.badgeCardName}>{getBadgeDisplayName(badge)}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
            </View>
          </Modal>
        </ScreenBody>
      </ScreenContent >
    </ScreenLayout >
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
  // Removed old level-related styles here
  statItem: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, height: 24, backgroundColor: '#f0f0f0' },
  statNumber: { fontSize: 18, fontWeight: 'bold', color: COLORS.text, marginBottom: 4 },
  statLabel: { fontSize: 12, color: COLORS.textSubtle },

  // Level Card
  levelCard: { marginVertical: 16, borderRadius: 16, overflow: 'hidden', backgroundColor: '#fff', borderWidth: 1, borderColor: COLORS.primary + '20' },
  levelCardGradient: { padding: 16 },
  levelHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  levelBadgeLarge: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  levelBadgeTextLarge: { color: '#fff', fontSize: 18, fontWeight: '900' },
  levelTitleContainer: { marginLeft: 12, flex: 1 },
  levelTitleLarge: { fontSize: 18, fontWeight: 'bold', color: COLORS.text, marginBottom: 2 },
  levelSubtitle: { fontSize: 12, color: COLORS.textSubtle },
  levelProgressContainer: { marginBottom: 16 },
  progressBarBg: { height: 8, backgroundColor: COLORS.primary + '15', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 4 },
  progressLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  progressLabel: { fontSize: 11, color: COLORS.textSubtle, fontWeight: '500' },
  levelQuote: { fontSize: 13, color: COLORS.primary, fontWeight: '600', textAlign: 'center', fontStyle: 'italic' },
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  usernameRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    flex: 1,
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
    marginLeft: SPACING.xs,
  },
  representativeBadgeIcon: {
    fontSize: 16, // text-base = 16px
  },
  representativeBadgeText: {
    fontSize: 12, // text-xs = 12px
    fontWeight: 'bold',
    color: COLORS.primary, // text-primary
  },
  representativeBadgePlaceholder: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textSubtle,
  },
  badgesViewButtonPlus: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary + '1A',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.xs,
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
  editProfileButtonInline: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary + '1A',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 'auto',
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
    overflow: 'hidden',
    marginBottom: SPACING.md,
    position: 'relative',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  mapStatsOverlay: {
    position: 'absolute',
    bottom: SPACING.sm,
    left: SPACING.sm,
    right: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapStatsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    alignItems: 'center',
  },
  mapStatBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mapStatBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.text,
  },
  dateFilterLight: {
    marginBottom: SPACING.sm,
  },
  dateFilterScrollContent: {
    paddingHorizontal: SPACING.sm,
    gap: SPACING.xs,
  },
  dateFilterButton: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  dateFilterButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  dateFilterButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.text,
  },
  dateFilterButtonTextActive: {
    color: 'white',
  },
  markerContainer: {
    width: 48,
    height: 48,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  markerImage: {
    width: '100%',
    height: '100%',
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
  followListOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  followListBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  followListSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '88%',
    paddingHorizontal: 16,
    paddingBottom: 24,
    zIndex: 2,
    elevation: 10,
  },
  followListScroll: {
    maxHeight: 420,
  },
  followListHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  followListTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  followListClose: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  followListEmpty: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  followListRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  followListUserBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
    gap: 12,
  },
  followListAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#e0f2f1',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  followListAvatarImg: {
    width: '100%',
    height: '100%',
  },
  followListUsername: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
});

export default ProfileScreen;
