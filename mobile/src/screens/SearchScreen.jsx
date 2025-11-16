import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants/styles';

const SearchScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <Ionicons name="search" size={20} color={COLORS.textSubtle} />
          <TextInput
            style={styles.searchInput}
            placeholder="검색어를 입력하세요"
            placeholderTextColor={COLORS.textSubtle}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>검색</Text>
        {/* 검색 결과 */}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  searchContainer: {
    padding: SPACING.md,
    backgroundColor: COLORS.backgroundLight,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    height: 44,
    gap: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.text,
  },
  content: {
    flex: 1,
    padding: SPACING.md,
  },
  title: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text,
  },
});

export default SearchScreen;


