
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
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

const SCREEN_WIDTH = Dimensions.get('window').width;

const CrowdedPlaceItem = ({ item, index, onPress }) => {
    const imageUrl = item.imageUrl || item.images?.[0] || item.image;

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
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>붐빔</Text>
                </View>
            </View>
            <View style={styles.postTextContainer}>
                <Text style={styles.locationText} numberOfLines={1}>{item.location}</Text>
                <Text style={styles.statusText}>현장 분위기 활발해요!</Text>
            </View>
        </TouchableOpacity>
    );
};

const CrowdedPlaceScreen = () => {
    const navigation = useNavigation();
    const [displayedItems, setDisplayedItems] = useState([]);
    const [allData, setAllData] = useState([]);
    const pageRef = useRef(0);

    const loadAllData = useCallback(async () => {
        try {
            const postsJson = await AsyncStorage.getItem('uploadedPosts');
            let posts = postsJson ? JSON.parse(postsJson) : [];
            posts = filterRecentPosts(posts, 2);

            // 혼잡도 데이터 (mock logic: even indices)
            const formatted = posts
                .filter((_, idx) => idx % 2 === 0)
                .map((post) => ({
                    id: post.id,
                    images: post.images || [],
                    image: post.images?.[0] || '',
                    location: post.location,
                    time: post.timeLabel || getTimeAgo(post.timestamp || post.createdAt || post.time),
                    note: post.note || post.content,
                    likes: post.likes || post.likeCount || 0,
                }));

            setAllData(formatted);
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
            allPosts: allData,
        });
    }, [navigation, allData]);

    const renderItem = useCallback(({ item, index }) => {
        return <CrowdedPlaceItem item={item} index={index} onPress={handleItemPress} />;
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
                            <Text style={styles.headerTitle}>지금 사람 많은 곳!</Text>
                        </View>
                        <View style={styles.headerPlaceholder} />
                    </View>
                </ScreenHeader>

                <ScreenBody>
                    {displayedItems.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="people-outline" size={64} color={COLORS.textSubtle} />
                            <Text style={styles.emptyTitle}>아직 붐비는 곳 정보가 없어요</Text>
                        </View>
                    ) : (
                        <FlatList
                            data={displayedItems}
                            renderItem={renderItem}
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
    headerPlaceholder: { width: 40 },
    gridContainer: { padding: SPACING.md },
    gridRow: { justifyContent: 'space-between' },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.xl, marginTop: 100 },
    emptyTitle: { fontSize: 16, color: '#6B7280', marginTop: SPACING.md },

    postItem: { width: (SCREEN_WIDTH - SPACING.md * 3) / 2, marginBottom: SPACING.md },
    postImageContainer: { width: '100%', aspectRatio: 4 / 5, borderRadius: 12, overflow: 'hidden', marginBottom: 12, backgroundColor: COLORS.borderLight, position: 'relative' },
    postImage: { width: '100%', height: '100%' },
    postImagePlaceholder: { backgroundColor: COLORS.borderLight, justifyContent: 'center', alignItems: 'center' },
    badge: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(239, 68, 68, 0.9)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    badgeText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
    postTextContainer: { gap: 2 },
    locationText: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
    statusText: { fontSize: 12, color: COLORS.textSecondary },
});

export default CrowdedPlaceScreen;
