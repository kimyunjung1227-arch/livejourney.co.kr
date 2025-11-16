import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import LiveJourneyLogo from '../components/LiveJourneyLogo';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../constants/styles';

const WelcomeScreen = () => {
  const navigation = useNavigation();

  const handleStart = () => {
    navigation.navigate('Start');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 중앙 컨텐츠 */}
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <LiveJourneyLogo size={180} showText={true} />
          <Text style={styles.subtitle}>
            가기 전에 확인하고,{'\n'}실망 없이 즐기세요
          </Text>
        </View>
      </View>

      {/* 하단 버튼 */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={handleStart}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>앱 시작하기</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
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
  },
  button: {
    backgroundColor: COLORS.primary,
    height: 56,
    borderRadius: BORDER_RADIUS.full,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 12,
  },
  buttonText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textWhite,
    fontWeight: 'bold',
    letterSpacing: 0.015,
  },
});

export default WelcomeScreen;
