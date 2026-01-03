/**
 * 웹과 동일한 레이아웃 구조 컴포넌트
 * screen-layout, screen-content, screen-body 구조를 React Native로 구현
 */
import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../constants/styles';

export const ScreenLayout = ({ children, style }) => {
  return (
    <SafeAreaView style={[styles.screenLayout, style]} edges={['top']}>
      {children}
    </SafeAreaView>
  );
};

export const ScreenContent = ({ children, style, scrollable = true, refreshControl, onScroll }) => {
  if (scrollable) {
    return (
      <ScrollView 
        style={[styles.screenContent, style]}
        contentContainerStyle={styles.screenContentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={refreshControl}
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        {children}
      </ScrollView>
    );
  }
  
  return (
    <View style={[styles.screenContent, style]}>
      {children}
    </View>
  );
};

export const ScreenHeader = ({ children, style }) => {
  return (
    <View style={[styles.screenHeader, style]}>
      {children}
    </View>
  );
};

export const ScreenBody = ({ children, style }) => {
  return (
    <View style={[styles.screenBody, style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  screenLayout: {
    flex: 1,
    width: '100%',
    backgroundColor: COLORS.backgroundLight,
  },
  screenContent: {
    flex: 1,
  },
  screenContentContainer: {
    flexGrow: 1,
    paddingBottom: 100, // 하단 네비게이션 바(80px) + 여유 공간(20px)
  },
  screenHeader: {
    backgroundColor: 'transparent', // 웹과 동일: background: transparent
    // 웹에서는 border와 shadow가 없음
  },
  screenBody: {
    paddingBottom: 100, // 하단 네비게이션 바(80px) + 여유 공간(20px) (웹: paddingBottom: '100px')
    flex: 1, // 랜딩페이지: flex: 1
  },
});

