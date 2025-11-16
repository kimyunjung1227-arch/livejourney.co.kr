import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Rect, Circle, Path, G, Text as SvgText } from 'react-native-svg';

const LiveJourneyLogo = ({ size = 80, showText = true, className = '' }) => {
  return (
    <View style={[styles.container, className]}>
      {/* 나침반 + 카메라 셔터 결합 로고 */}
      <Svg width={size} height={size} viewBox="0 0 200 200">
        {/* 배경 - 오렌지 */}
        <Rect x="0" y="0" width="200" height="200" rx="45" fill="#ff6b35" />
        
        {/* 메인 심볼: 나침반 + 셔터 결합 */}
        <G transform="translate(100, 100)">
          {/* 나침반 외부 원 */}
          <Circle cx="0" cy="0" r="70" stroke="white" strokeWidth="8" fill="none" />
          
          {/* 셔터 날개들 (8개) */}
          <G opacity="0.9">
            <Path d="M 0 -50 L 15 -15 L -15 -15 Z" fill="white" />
            <Path d="M 35 -35 L 15 -15 L 15 15 Z" fill="white" />
            <Path d="M 50 0 L 15 -15 L 15 15 Z" fill="white" />
            <Path d="M 35 35 L 15 15 L -15 15 Z" fill="white" />
            <Path d="M 0 50 L -15 15 L 15 15 Z" fill="white" />
            <Path d="M -35 35 L -15 15 L -15 -15 Z" fill="white" />
            <Path d="M -50 0 L -15 15 L -15 -15 Z" fill="white" />
            <Path d="M -35 -35 L -15 -15 L 15 -15 Z" fill="white" />
          </G>
          
          {/* 중앙 원 (나침반 중심 + 셔터 중심) */}
          <Circle cx="0" cy="0" r="30" fill="white" />
          
          {/* 방향 표시 (N) */}
          <SvgText
            x="0"
            y="-55"
            textAnchor="middle"
            fill="white"
            fontSize="18"
            fontWeight="bold"
            fontFamily="Arial"
          >
            N
          </SvgText>
          
          {/* 셔터 버튼 중앙 */}
          <Circle cx="0" cy="0" r="18" fill="#e85d22" />
        </G>
      </Svg>
      
      {/* 텍스트 로고 */}
      {showText && (
        <View style={styles.textContainer}>
          <Text style={styles.logoText}>LiveJourney</Text>
          <Text style={styles.subtitle}>헛걸음 없는 여행</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 16,
  },
  textContainer: {
    alignItems: 'center',
    gap: 4,
  },
  logoText: {
    fontSize: 36,
    fontWeight: 'bold',
    letterSpacing: -0.5,
    color: '#ff6b35',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
});

export default LiveJourneyLogo;


