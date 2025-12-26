import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants/styles';
import { ScreenLayout, ScreenContent, ScreenHeader, ScreenBody } from '../components/ScreenLayout';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const MapScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    loadLocation();
    loadPosts();
  }, []);

  const loadLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('위치 권한이 거부되었습니다.');
        setLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setCurrentLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    } catch (error) {
      console.error('위치 가져오기 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPosts = async () => {
    try {
      const postsJson = await AsyncStorage.getItem('uploadedPosts');
      const allPosts = postsJson ? JSON.parse(postsJson) : [];
      
      const postsWithLocation = allPosts.filter(
        post => post.coordinates && post.coordinates.lat && post.coordinates.lng
      );
      
      setPosts(postsWithLocation);
    } catch (error) {
      console.error('게시물 로드 실패:', error);
    }
  };

  return (
    <ScreenLayout>
      <ScreenContent>
        <ScreenHeader>
          <View style={styles.headerContent}>
            <View style={styles.headerPlaceholder} />
            <Text style={styles.headerTitle}>지도</Text>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => navigation.navigate('SearchTab')}
            >
              <Ionicons name="search" size={24} color={COLORS.textPrimaryLight} />
            </TouchableOpacity>
          </View>
        </ScreenHeader>

        <ScreenBody>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loadingText}>지도를 불러오는 중...</Text>
            </View>
          ) : (
            <View style={styles.mapContainer}>
              <View style={styles.mapPlaceholder}>
                <Ionicons name="map-outline" size={64} color={COLORS.textSubtle} />
                <Text style={styles.placeholderText}>지도 기능 준비 중</Text>
                <Text style={styles.placeholderSubtext}>
                  {posts.length}개의 게시물이 지도에 표시됩니다
                </Text>
              </View>
            </View>
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
    height: 64,
    paddingHorizontal: SPACING.md,
  },
  headerPlaceholder: {
    width: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimaryLight,
    flex: 1,
    textAlign: 'center',
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.md,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  mapContainer: {
    flex: 1,
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    gap: SPACING.md,
  },
  placeholderText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: SPACING.md,
  },
  placeholderSubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
});

export default MapScreen;






