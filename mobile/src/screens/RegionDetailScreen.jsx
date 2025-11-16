import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants/styles';

const RegionDetailScreen = ({ route }) => {
  const { regionName } = route.params || {};

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <Text style={styles.title}>지역 상세: {regionName}</Text>
          {/* 지역 상세 내용 */}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: SPACING.md,
  },
  title: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text,
  },
});

export default RegionDetailScreen;


