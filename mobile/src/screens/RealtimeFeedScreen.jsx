
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    FlatList,
    TouchableOpacity,
    Image,
    Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../constants/styles';
import { filterRecentPosts, getTimeAgo } from '../utils/timeUtils';
import { ScreenLayout, ScreenContent, ScreenHeader, ScreenBody } from '../components/ScreenLayout';
import { isPostLiked } from '../utils/socialInteractions';

const SCREEN_WIDTH = Dimensions.get('window').width;

const PostItem = ({ item, index, onPress }) => {
    const [isLiked, setIsLiked] = useState(false);
    const imageUrl = item.imageUrl || item.images?.[0] || item.image;
    const likeCount = item.likes || item.likeCount || 0;

    useEffect(() => {
        const checkLike = async () => {
            const liked = await isPostLiked(item.id);
            setIsLiked(liked);
        };
        checkLike();
    }, [item.id]);

    return (
        <TouchableOpacity
            style={styles.postItem}
            onPress={() => onPress(item, index)}
            activeOpacity={0.9}
        >
            <View style={styles.postImageContainer}>
                {imageUrl ? (
                    <Image
                        source={{ uri: imageUrl }}
                        style={styles.postImage}
                        resizeMode="cover"
                    />
                ) : (
                    <View style={[styles.postImage, styles.postImagePlaceholder]}>
                        <Ionicons name="image-outline" size={32} color={COLORS.textSubtle} />
                    </View>
                )}
                <View style={styles.likeBadge}>
                    <Ionicons
                        name={isLiked ? 'heart' : 'heart-outline'}
                        size={16}
                        color={isLiked ? COLORS.error : COLORS.text}
                    />
                    <Text style={styles.likeCount}>{likeCount}</Text>
                </View>
            </View>
            <View style={styles.postTextContainer}>
                <View style={styles.locationRow}>
                    <Text style={styles.locationText} numberOfLines={1}>
                        {item.detailedLocation || item.placeName || item.location || '여행지'}
                    </Text>
                    {item.time && (
                        <Text style={styles.timeText}>{item.time}</Text>
                    )}
                </View>
                <Text style={styles.noteText} numberOfLines={2}>
                    {item.note || item.content}
                </Text>
            </View>
        </TouchableOpacity>
    );
};

const RealtimeFeedScreen = () => {
    const navigation = useNavigation();
    const [displayedItems, setDisplayedItems] = useState([]);
    const [currentUserCount, setCurrentUserCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [allData, setAllData] = useState([]);
    const pageRef = useRef(0);

    const loadAllData = useCallback(async () => {
        try {
            const postsJson = await AsyncStorage.getItem('uploadedPosts');
            let posts = postsJson ? JSON.parse(postsJson) : [];
            posts = filterRecentPosts(posts, 2);

            // 사용자 수 계산
            const uniqueUserIds = new Set();
            posts.forEach(post => {
                const userId = post.userId || (typeof post.user === 'string' ? post.user : post.user?.id) || post.user;
                if (userId) uniqueUserIds.add(String(userId));
            });
            setCurrentUserCount(uniqueUserIds.size);

            const formatted = posts.map((post) => ({
                id: post.id,
                images: post.images || [],
                image: post.images?.[0] || '',
                location: post.location,
                detailedLocation: post.detailedLocation || post.placeName || post.location,
                time: post.timeLabel || getTimeAgo(post.timestamp || post.createdAt || post.time),
                note: post.note || post.content,
                likes: post.likes || post.likeCount || 0,
                timestamp: post.timestamp || post.createdAt || post.time,
                // ... 필요한 필드
            }));

            setAllData(formatted);

            // 초기 데이터 로드 (첫 페이지)
            setDisplayedItems(formatted.slice(0, 12));
            pageRef.current = 1;

        } catch (error) {
            console.error('데이터 로드 실패:', error);
        }
    }, []);

    const loadMoreItems = useCallback(() => {
        const itemsPerPage = 12;
        const startIndex = pageRef.current * itemsPerPage;
        if (startIndex >= allData.length) return;

        const newItems = allData.slice(startIndex, startIndex + itemsPerPage);
        setDisplayedItems(prev => [...prev, ...newItems]);
        pageRef.current += 1;
    }, [allData]);

    useEffect(() => {
        loadAllData();
    }, [loadAllData]);

    const handleItemPress = useCallback((item, index) => {
        navigation.navigate('PostDetail', {
            postId: item.id,
            post: item,
            allPosts: allData, // 전체 데이터 전달
        });
    }, [navigation, allData]);

    const renderPostItem = useCallback(({ item, index }) => {
        return <PostItem item={item} index={index} onPress={handleItemPress} />;
    }, [handleItemPress]);

    return (
        <ScreenLayout>
            <ScreenContent>
                <ScreenHeader>
                    <View style={styles.headerContent}>
                        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                            <Ionicons name="arrow-back" size={24} color={COLORS.textPrimaryLight} />
                        </TouchableOpacity>
                        <View style={styles.headerTitleContainer}>
                            <Text style={styles.headerTitle}>지금 여기는!</Text>
                            {currentUserCount > 0 && (
                                <Text style={styles.headerSubtitle}>현재 {currentUserCount}명이 활동 중</Text>
                            )}
                        </View>
                        <View style={styles.headerPlaceholder} />
                    </View>
                </ScreenHeader>

                <ScreenBody>
                    {displayedItems.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="time-outline" size={64} color={COLORS.textSubtle} />
                            <Text style={styles.emptyTitle}>아직 게시물이 없어요</Text>
                        </View>
                    ) : (
                        <FlatList
                            data={displayedItems}
                            renderItem={renderPostItem}
                            keyExtractor={(item) => item.id.toString()}
                            numColumns={2}
                            contentContainerStyle={styles.gridContainer}
                            columnWrapperStyle={styles.gridRow}
                            onEndReached={loadMoreItems}
                            onEndReachedThreshold={0.5}
                        />
                    )}
                </ScreenBody>
            </ScreenContent>
        </ScreenLayout>
    );
};

const styles = StyleSheet.create({
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.md,
        backgroundColor: COLORS.backgroundLight,
        borderBottomWidth: 1,
        borderBottomColor: '#E4E4E7',
    },
    backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
    headerTitleContainer: { flex: 1, alignItems: 'center' },
    headerTitle: { fontSize: 22, fontWeight: 'bold', color: COLORS.text },
    headerSubtitle: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
    headerPlaceholder: { width: 40 },
    gridContainer: { padding: SPACING.md },
    gridRow: { justifyContent: 'space-between' },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.xl, marginTop: 100 },
    emptyTitle: { fontSize: 16, color: '#6B7280', marginTop: SPACING.md },

    postItem: { width: (SCREEN_WIDTH - SPACING.md * 3) / 2, marginBottom: SPACING.md },
    postImageContainer: { width: '100%', aspectRatio: 4 / 5, borderRadius: 12, overflow: 'hidden', marginBottom: 12, backgroundColor: COLORS.borderLight, position: 'relative' },
    postImage: { width: '100%', height: '100%' },
    postImagePlaceholder: { backgroundColor: COLORS.borderLight, justifyContent: 'center', alignItems: 'center' },
    likeBadge: { position: 'absolute', bottom: 12, right: 12, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
    likeCount: { fontSize: 14, fontWeight: '600', color: '#374151' },
    postTextContainer: { gap: SPACING.xs },
    locationRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
    locationText: { fontSize: 16, fontWeight: 'bold', color: COLORS.text, flex: 1 },
    timeText: { fontSize: 12, color: COLORS.textSecondary },
    noteText: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 20 },
});

export default RealtimeFeedScreen;
