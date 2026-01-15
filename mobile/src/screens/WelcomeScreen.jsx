import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import LiveJourneyLogo from '../components/LiveJourneyLogo';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../constants/styles';
import { ScreenLayout, ScreenContent, ScreenHeader, ScreenBody } from '../components/ScreenLayout';

const WelcomeScreen = () => {
  const navigation = useNavigation();
  const { testerLogin } = useAuth();

  const handleStart = () => {
    navigation.navigate('Start');
  };

  const handleTesterLogin = async () => {
    try {
      const result = await testerLogin();
      if (result.success) {
        navigation.replace('MainTabs');
      } else {
        // 실패해도 로그인 화면으로 이동
        navigation.navigate('Start');
      }
    } catch (error) {
      console.error('테스터 로그인 오류:', error);
      navigation.navigate('Start');
    }
  };

  return (
    <ScreenLayout>
      <ScreenContent>
        <ScreenBody>
      {/* 중앙 컨텐츠 */}
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <LiveJourneyLogo size={180} showText={true} />
        </View>
      </View>

      {/* 하단 버튼 */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.testerButton]}
          onPress={handleTesterLogin}
          activeOpacity={0.8}
        >
          <Ionicons name="bug" size={20} color={COLORS.textWhite} />
          <Text style={styles.buttonText}>테스터 계정으로 바로 시작</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          onPress={handleStart}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>앱 시작하기</Text>
        </TouchableOpacity>
      </View>
        </ScreenBody>
      </ScreenContent>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundLight,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xxl,
  },
  logoContainer: {
    alignItems: 'center',
    gap: SPACING.xl,
  },
  subtitle: {
    fontSize: 20,
    color: '#666',
    textAlign: 'center',
    lineHeight: 28,
    fontWeight: '600',
    maxWidth: 280,
    letterSpacing: -0.015,
  },
  buttonContainer: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xxl,
    gap: SPACING.md,
  },
  button: {
    backgroundColor: COLORS.primary,
    height: 56,
    borderRadius: BORDER_RADIUS.full,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: SPACING.sm,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 12,
  },
  testerButton: {
    backgroundColor: '#9333ea',
  },
  buttonText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textWhite,
    fontWeight: 'bold',
    letterSpacing: 0.015,
  },
});

export default WelcomeScreen;
