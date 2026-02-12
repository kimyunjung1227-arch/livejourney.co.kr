import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../constants/styles';
import { 
  toggleInterestPlace, 
  isInterestPlace, 
  getInterestPlaces 
} from '../utils/interestPlaces';
import { ScreenLayout, ScreenContent, ScreenHeader, ScreenBody } from '../components/ScreenLayout';

const InterestPlacesScreen = () => {
  const navigation = useNavigation();
  const [placeInput, setPlaceInput] = useState('');
  const [interestPlaces, setInterestPlaces] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(null); // 선택된 관심지역 카드 인덱스

  const popularPlaces = [
    '서울', '부산', '제주', '강릉', '경주', 
    '전주', '인천', '대구', '광주', '속초',
    '성산일출봉', '남산타워', '해운대', '감천문화마을'
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const places = await getInterestPlaces();
    setInterestPlaces(places);
  };

  const handleToggle = async (place) => {
    await toggleInterestPlace(place);
    await loadData();
  };

  const handleAdd = async () => {
    if (!placeInput.trim()) {
      alert('지역이나 장소명을 입력해주세요');
      return;
    }
    
    await toggleInterestPlace(placeInput.trim());
    setPlaceInput('');
    await loadData();
  };

  const checkIfInterested = async (placeName) => {
    return await isInterestPlace(placeName);
  };

  return (
    <ScreenLayout>
      {/* 헤더 - 웹과 동일한 구조 (ScreenContent 밖) */}
      <ScreenHeader>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>관심 지역/장소</Text>
          <View style={{width: 40}} />
        </View>
      </ScreenHeader>

      <ScreenContent>
        <ScreenBody>
          <ScrollView 
            style={styles.content} 
            contentContainerStyle={styles.scrollViewContent}
            showsVerticalScrollIndicator={false}
          >
        {/* 설명 */}
        <View style={styles.description}>
          <Text style={styles.descTitle}>⭐ 관심 지역/장소란?</Text>
          <Text style={styles.descText}>
            관심있는 지역이나 장소를 추가하면, 새로운 실시간 정보가 올라올 때 알림을 받아요!
          </Text>
          <View style={styles.descList}>
            <Text style={styles.descItem}>• 지역: 제주, 부산, 강릉 등</Text>
            <Text style={styles.descItem}>• 장소: 성산일출봉, 남산타워 등</Text>
          </View>
        </View>

        {/* 추가 입력 */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={placeInput}
            onChangeText={setPlaceInput}
            placeholder="지역 또는 장소명 입력"
            placeholderTextColor={COLORS.textSecondary}
            onSubmitEditing={handleAdd}
          />
          <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
            <Text style={styles.addButtonText}>추가</Text>
          </TouchableOpacity>
        </View>

        {/* 추천 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔥 인기 지역/장소</Text>
          <View style={styles.tagsContainer}>
            {popularPlaces.map((place) => {
              const isEnabled = interestPlaces.some(p => p.name === place || p.region === place);
              
              return (
                <TouchableOpacity
                  key={place}
                  style={[styles.tag, isEnabled && styles.tagActive]}
                  onPress={() => handleToggle(place)}
                >
                  <Text style={[styles.tagText, isEnabled && styles.tagTextActive]}>
                    {isEnabled && '⭐ '}
                    {place}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 내 관심 목록 */}
        {interestPlaces.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>⭐</Text>
            <Text style={styles.emptyText}>아직 관심 지역/장소가 없어요</Text>
            <Text style={styles.emptySubText}>관심있는 지역이나 장소를 추가해보세요!</Text>
          </View>
        ) : (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⭐ 내 관심 지역/장소 ({interestPlaces.length})</Text>
            {interestPlaces.map((place, index) => (
              <TouchableOpacity
                key={index}
                style={styles.placeCard}
                activeOpacity={0.9}
                onPress={() =>
                  setSelectedIndex(selectedIndex === index ? null : index)
                }
              >
                <View style={styles.placeInfo}>
                  <View style={styles.placeHeader}>
                    <Ionicons name="star" size={20} color={COLORS.primary} />
                    <Text style={styles.placeName}>{place.name}</Text>
                  </View>
                  {place.region && place.name !== place.region && (
                    <Text style={styles.placeRegion}>📍 {place.region}</Text>
                  )}
                  <Text style={styles.placeDate}>
                    {new Date(place.addedAt).toLocaleDateString('ko-KR')} 추가
                  </Text>
                </View>
                {selectedIndex === index && (
                  <TouchableOpacity
                    style={styles.deleteCircle}
                    onPress={() => handleToggle(place)}
                  >
                    <Ionicons name="close" size={16} color="#ffffff" />
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
          </ScrollView>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  backButton: {
    padding: SPACING.sm,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  content: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 100, // 하단 네비게이션 바(80px) + 여유 공간(20px)
  },
  description: {
    margin: SPACING.md,
    padding: SPACING.md,
    backgroundColor: COLORS.primarySoft,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primary + '40',
  },
  descTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  descText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  descList: {
    marginTop: SPACING.xs,
  },
  descItem: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginVertical: 2,
  },
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  input: {
    flex: 1,
    height: 48,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    fontSize: 14,
    color: COLORS.text,
    backgroundColor: COLORS.surface,
  },
  addButton: {
    paddingHorizontal: 20,
    height: 48,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  section: {
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  tag: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: COLORS.surfaceSecondary,
    borderRadius: 20,
  },
  tagActive: {
    backgroundColor: COLORS.primary,
  },
  tagText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  tagTextActive: {
    color: 'white',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: SPACING.md,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  emptySubText: {
    fontSize: 12,
    color: COLORS.textTertiary,
  },
  placeCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.primarySoft,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primary + '40',
    marginBottom: SPACING.sm,
    position: 'relative', // X 버튼을 카드 상단에 띄우기 위해
  },
  placeInfo: {
    flex: 1,
  },
  placeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: 4,
  },
  placeName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  placeRegion: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginLeft: 28,
    marginBottom: 2,
  },
  placeDate: {
    fontSize: 10,
    color: COLORS.textTertiary,
    marginLeft: 28,
  },
  deleteCircle: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    width: 28,
    height: 28,
    borderRadius: 14, // 완전한 구 형태
    backgroundColor: '#FF4B4B', // 눈에 잘 보이는 삭제 색상
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
});

export default InterestPlacesScreen;


