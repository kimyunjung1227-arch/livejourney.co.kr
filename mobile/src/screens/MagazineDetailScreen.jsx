import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants/styles';
import { ScreenLayout, ScreenContent, ScreenHeader, ScreenBody } from '../components/ScreenLayout';

const MagazineDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { magazine } = route.params || {};

  if (!magazine) {
    return (
      <ScreenLayout>
        <ScreenContent>
          <ScreenHeader>
            <View style={styles.headerContent}>
              <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                <Ionicons name="arrow-back" size={24} color={COLORS.text} />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>여행 매거진</Text>
              <View style={styles.headerPlaceholder} />
            </View>
          </ScreenHeader>
          <ScreenBody>
            <View style={styles.emptyContainer}>
              <Ionicons name="book-outline" size={48} color={COLORS.textSubtle} />
              <Text style={styles.emptyTitle}>매거진 정보를 불러올 수 없어요</Text>
              <Text style={styles.emptySubtitle}>잠시 후 다시 시도해 주세요.</Text>
            </View>
          </ScreenBody>
        </ScreenContent>
      </ScreenLayout>
    );
  }

  const createdDate = magazine.createdAt
    ? new Date(magazine.createdAt).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : '';

  return (
    <ScreenLayout>
      <ScreenContent>
        <ScreenHeader>
          <View style={styles.headerContent}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>여행 매거진</Text>
            <View style={styles.headerPlaceholder} />
          </View>
        </ScreenHeader>

        <ScreenBody>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* 커버 이미지 */}
            <View style={styles.coverContainer}>
              {magazine.coverImage ? (
                <Image
                  source={{ uri: magazine.coverImage }}
                  style={styles.coverImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={[styles.coverImage, styles.coverPlaceholder]}>
                  <Ionicons name="book" size={48} color={COLORS.textSubtle} />
                </View>
              )}
              <View style={styles.coverBadge}>
                <Text style={styles.coverBadgeText}>📖 매거진</Text>
              </View>
            </View>

            {/* 타이틀 & 메타 정보 */}
            <View style={styles.infoContainer}>
              <Text style={styles.title}>{magazine.title}</Text>
              {magazine.summary ? (
                <Text style={styles.summary}>{magazine.summary}</Text>
              ) : null}

              <View style={styles.metaRow}>
                <Text style={styles.metaAuthor}>{magazine.author || 'LiveJourney'}</Text>
                {createdDate ? <Text style={styles.metaDate}>{createdDate}</Text> : null}
              </View>

              {/* 현재 사진 보기 버튼 */}
              {magazine.regionName && (
                <TouchableOpacity
                  style={styles.livePhotosButton}
                  activeOpacity={0.9}
                  onPress={() => {
                    navigation.navigate('RegionDetail', {
                      regionName: magazine.regionName,
                      region: { name: magazine.regionName },
                      focusLocation: magazine.detailedLocation || magazine.regionName,
                    });
                  }}
                >
                  <Ionicons name="image" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.livePhotosButtonText}>
                    {magazine.regionName} 지금 사진 보기
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* 본문 */}
            <View style={styles.contentContainer}>
              <Text style={styles.contentText}>
                {magazine.content || '아직 준비 중인 매거진입니다. 곧 생생한 여행 이야기를 만나보실 수 있어요.'}
              </Text>
            </View>
          </ScrollView>
        </ScreenBody>
      </ScreenContent>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.backgroundLight,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  headerPlaceholder: {
    width: 40,
  },
  scrollContent: {
    paddingBottom: SPACING.xl * 2,
  },
  coverContainer: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.lg,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: COLORS.borderLight,
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: 220,
  },
  coverPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverBadge: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  coverBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  infoContainer: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  summary: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: SPACING.md,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  metaAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  metaDate: {
    fontSize: 13,
    color: COLORS.textSubtle,
  },
  livePhotosButton: {
    marginTop: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: 999,
    backgroundColor: COLORS.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  livePhotosButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  contentContainer: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  contentText: {
    fontSize: 15,
    color: COLORS.text,
    lineHeight: 22,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});

export default MagazineDetailScreen;


