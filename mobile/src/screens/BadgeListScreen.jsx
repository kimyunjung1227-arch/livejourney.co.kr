import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants/styles';
import { ScreenLayout, ScreenContent, ScreenHeader, ScreenBody } from '../components/ScreenLayout';
import { getAvailableBadges, getEarnedBadges } from '../utils/badgeSystem';
import { useScrollTabBar } from '../hooks/useScrollTabBar';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BADGE_ITEM_WIDTH = (SCREEN_WIDTH - SPACING.md * 3) / 2;

const BadgeListScreen = () => {
  const navigation = useNavigation();
  const handleScroll = useScrollTabBar();
  const [filter, setFilter] = useState('acquired'); // 'acquired' or 'all'
  const [selectedBadge, setSelectedBadge] = useState(null);
  const [badges, setBadges] = useState([]);
  const [earnedBadges, setEarnedBadges] = useState([]);

  // 뱃지 데이터 로드
  const loadBadges = async () => {
    try {
      console.log('🔄 뱃지 목록 로드 시작');
      const allBadges = await getAvailableBadges();
      const earned = await getEarnedBadges();
      
      console.log('📋 로드된 뱃지:', {
        전체: allBadges.length,
        획득: earned.length,
      });
      
      setBadges(allBadges);
      setEarnedBadges(earned);
    } catch (error) {
      console.error('뱃지 로드 실패:', error);
    }
  };

  useEffect(() => {
    loadBadges();
    
    // 화면 포커스 시 뱃지 다시 로드
    const unsubscribe = navigation.addListener('focus', () => {
      loadBadges();
    });
    
    return unsubscribe;
  }, [navigation]);

  // 필터링된 뱃지
  const filteredBadges = filter === 'acquired' 
    ? badges.filter(b => b.isEarned)
    : badges;

  const handleBadgeClick = (badge) => {
    setSelectedBadge(badge);
  };

  const closeModal = () => {
    setSelectedBadge(null);
  };

  // 뱃지 난이도별 보조 컬러 매핑
  const getBadgeColor = (difficulty) => {
    const colorMap = {
      '하': COLORS.secondary2,      // Green - 쉬운 뱃지
      '중': COLORS.secondary5,       // Cyan - 중간 뱃지
      '상': COLORS.secondary1,       // Purple - 어려운 뱃지
    };
    return colorMap[difficulty] || COLORS.primary;
  };
  
  const getBadgeColorSoft = (difficulty) => {
    const colorMap = {
      '하': COLORS.secondary2Soft,
      '중': COLORS.secondary5Soft,
      '상': COLORS.secondary1Soft,
    };
    return colorMap[difficulty] || COLORS.primary + '20';
  };

  const renderBadgeItem = ({ item: badge, index }) => {
    const badgeColor = getBadgeColor(badge.difficulty || '중');
    const badgeColorSoft = getBadgeColorSoft(badge.difficulty || '중');
    
    return (
      <TouchableOpacity
        style={[
          styles.badgeItem,
          badge.isEarned && [
            styles.badgeItemEarned,
            { backgroundColor: badgeColorSoft, borderColor: badgeColor }
          ]
        ]}
        onPress={() => handleBadgeClick(badge)}
        activeOpacity={0.7}
      >
        {/* 뱃지 아이콘 */}
        <View style={[
          styles.badgeIconContainer,
          !badge.isEarned && styles.badgeIconContainerLocked,
          badge.isEarned && { backgroundColor: badgeColorSoft }
        ]}>
          <Text style={styles.badgeIcon}>
            {badge.icon || '🏆'}
          </Text>
        </View>
        
        {/* 뱃지 정보 */}
        <View style={styles.badgeInfo}>
          <Text style={[
            styles.badgeName,
            !badge.isEarned && styles.badgeNameLocked,
            badge.isEarned && { color: badgeColor }
          ]} numberOfLines={2}>
            {badge.name}
          </Text>
          
          {badge.isEarned ? (
            <View style={styles.earnedBadge}>
              <Ionicons name="checkmark-circle" size={16} color={badgeColor} />
              <Text style={[styles.earnedText, { color: badgeColor }]}>획득</Text>
            </View>
          ) : (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill,
                    { width: `${badge.progress || 0}%`, backgroundColor: badgeColor }
                  ]}
                />
              </View>
              <Text style={styles.progressText}>{badge.progress || 0}%</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScreenLayout>
      {/* 헤더 - 웹과 동일한 구조 (ScreenContent 밖) */}
      <ScreenHeader>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.textPrimaryLight} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>뱃지 목록</Text>
          <View style={styles.headerPlaceholder} />
        </View>
      </ScreenHeader>

      <ScreenContent>

        {/* 필터 토글 */}
        <View style={styles.filterContainer}>
          <View style={styles.filterToggle}>
            <TouchableOpacity
              style={[
                styles.filterButton,
                filter === 'acquired' && styles.filterButtonActive
              ]}
              onPress={() => setFilter('acquired')}
            >
              <Text style={[
                styles.filterText,
                filter === 'acquired' && styles.filterTextActive
              ]}>
                획득
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterButton,
                filter === 'all' && styles.filterButtonActive
              ]}
              onPress={() => setFilter('all')}
            >
              <Text style={[
                styles.filterText,
                filter === 'all' && styles.filterTextActive
              ]}>
                전체
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 뱃지 그리드 */}
        <ScreenBody>
          {filteredBadges.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🏆</Text>
              <Text style={styles.emptyText}>
                {filter === 'acquired' 
                  ? '획득한 뱃지가 없습니다'
                  : '뱃지가 없습니다'}
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredBadges}
              renderItem={renderBadgeItem}
              keyExtractor={(item, index) => item.name || `badge-${index}`}
              numColumns={2}
              contentContainerStyle={styles.badgeList}
              columnWrapperStyle={styles.badgeRow}
              showsVerticalScrollIndicator={false}
              onScroll={handleScroll}
              scrollEventThrottle={16}
            />
          )}
        </ScreenBody>
      </ScreenContent>

      {/* 뱃지 상세 모달 */}
      <Modal
        visible={selectedBadge !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedBadge && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{selectedBadge.name}</Text>
                  <TouchableOpacity onPress={closeModal}>
                    <Ionicons name="close" size={24} color={COLORS.textPrimaryLight} />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.modalBody}>
                  <View style={styles.modalBadgeIcon}>
                    <Text style={styles.modalBadgeIconText}>
                      {selectedBadge.icon || '🏆'}
                    </Text>
                  </View>
                  
                  <Text style={styles.modalDescription}>
                    {selectedBadge.description}
                  </Text>
                  
                  <View style={styles.modalInfo}>
                    <View style={styles.modalInfoRow}>
                      <Text style={styles.modalInfoLabel}>난이도:</Text>
                      <Text style={styles.modalInfoValue}>
                        {selectedBadge.difficulty === '하' ? '⭐' : 
                         selectedBadge.difficulty === '중' ? '⭐⭐' : '⭐⭐⭐'}
                      </Text>
                    </View>
                    
                    {selectedBadge.isEarned ? (
                      <View style={styles.modalInfoRow}>
                        <Text style={styles.modalInfoLabel}>상태:</Text>
                        <Text style={[styles.modalInfoValue, styles.earnedStatus]}>
                          획득 완료
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.modalInfoRow}>
                        <Text style={styles.modalInfoLabel}>진행률:</Text>
                        <Text style={styles.modalInfoValue}>
                          {selectedBadge.progress || 0}%
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textPrimaryLight,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  headerPlaceholder: {
    width: 40,
  },
  filterContainer: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  filterToggle: {
    flexDirection: 'row',
    backgroundColor: COLORS.backgroundLight,
    borderRadius: 24,
    padding: 4,
  },
  filterButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    borderRadius: 20,
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
  },
  filterText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textPrimaryLight,
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  badgeList: {
    padding: SPACING.md,
    paddingBottom: 120, // 하단 네비게이션 바(80px) + 여유 공간(40px)
  },
  badgeRow: {
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  badgeItem: {
    width: BADGE_ITEM_WIDTH,
    backgroundColor: COLORS.backgroundLight,
    borderRadius: 16,
    padding: SPACING.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  badgeItemEarned: {
    // backgroundColor와 borderColor는 동적으로 설정됨
    borderWidth: 2,
  },
  badgeIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  badgeIconContainerLocked: {
    opacity: 0.4,
  },
  badgeIcon: {
    fontSize: 32,
  },
  badgeInfo: {
    width: '100%',
    alignItems: 'center',
  },
  badgeName: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.primary,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: SPACING.xs,
    // color는 동적으로 설정됨 (획득한 뱃지의 경우)
  },
  badgeNameLocked: {
    color: COLORS.textSubtle,
  },
  earnedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  earnedText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
    fontWeight: '600',
    // color는 동적으로 설정됨
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: COLORS.borderLight,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    // backgroundColor는 동적으로 설정됨
  },
  progressText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSubtle,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xxl * 2,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: SPACING.md,
  },
  emptyText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSubtle,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md,
  },
  modalContent: {
    backgroundColor: COLORS.backgroundLight,
    borderRadius: 20,
    padding: SPACING.lg,
    width: '90%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  modalTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textPrimaryLight,
    fontWeight: 'bold',
    flex: 1,
  },
  modalBody: {
    alignItems: 'center',
  },
  modalBadgeIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
    // backgroundColor는 동적으로 설정 가능 (필요시)
  },
  modalBadgeIconText: {
    fontSize: 48,
  },
  modalDescription: {
    ...TYPOGRAPHY.body,
    color: COLORS.textPrimaryLight,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  modalInfo: {
    width: '100%',
    gap: SPACING.sm,
  },
  modalInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalInfoLabel: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSubtle,
  },
  modalInfoValue: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textPrimaryLight,
    fontWeight: '600',
  },
  earnedStatus: {
    color: COLORS.primary,
    // color는 동적으로 설정 가능 (필요시)
  },
});

export default BadgeListScreen;






