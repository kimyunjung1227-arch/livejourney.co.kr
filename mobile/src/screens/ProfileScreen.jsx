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
import PostGridItem from '../components/PostGridItem';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ProfileScreen = () => {
  const { user: authUser, logout } = useAuth();
  const navigation = useNavigation();
  const [user, setUser] = useState(null);
  const [myPosts, setMyPosts] = useState([]);
  const [dailyTitle, setDailyTitle] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [loading, setLoading] = useState(true);

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

      // 내가 업로드한 게시물 로드 (영구 보관 - 필터링 없음)
      const uploadedPostsJson = await AsyncStorage.getItem('uploadedPosts');
      const uploadedPosts = uploadedPostsJson ? JSON.parse(uploadedPostsJson) : [];
      
      const userId = savedUser?.id;
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

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>로딩 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>사용자 정보를 불러올 수 없습니다.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>프로필</Text>
        <View style={styles.headerButtons}>
          {isEditMode ? (
            <>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={deleteSelectedPhotos}
                disabled={selectedPhotos.length === 0}
              >
                <Ionicons
                  name="trash-outline"
                  size={24}
                  color={selectedPhotos.length > 0 ? COLORS.error : COLORS.textSubtle}
                />
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerButton} onPress={toggleEditMode}>
                <Text style={styles.headerButtonText}>완료</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity style={styles.headerButton} onPress={toggleEditMode}>
              <Text style={styles.headerButtonText}>편집</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
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
              <Text style={styles.username}>{user.username || '사용자'}</Text>
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
              <Text style={styles.statNumber}>{myPosts.length}</Text>
              <Text style={styles.statLabel}>게시물</Text>
            </View>
          </View>
        </View>

        {/* 여행 기록 그리드 */}
        <View style={styles.postsSection}>
          {myPosts.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="images-outline" size={64} color={COLORS.textSubtle} />
              <Text style={styles.emptyText}>아직 업로드한 사진이 없습니다</Text>
              <TouchableOpacity
                style={styles.uploadButton}
                onPress={() => navigation.navigate('UploadTab')}
              >
                <Text style={styles.uploadButtonText}>첫 사진 올리기</Text>
              </TouchableOpacity>
            </View>
          ) : (
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
      </ScrollView>
    </SafeAreaView>
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
  headerTitle: {
    ...TYPOGRAPHY.h2,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  headerButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  headerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
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
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 32,
  },
  profileInfo: {
    flex: 1,
  },
  username: {
    ...TYPOGRAPHY.h3,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.xs,
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
    marginBottom: SPACING.lg,
  },
  uploadButton: {
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
  postsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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
});

export default ProfileScreen;
