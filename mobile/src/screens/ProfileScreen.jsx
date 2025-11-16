import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants/styles';

const ProfileScreen = () => {
  const { user, logout } = useAuth();
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <View style={styles.profileHeader}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={40} color={COLORS.textSubtle} />
            </View>
            <Text style={styles.username}>{user?.username || '사용자'}</Text>
            <Text style={styles.email}>{user?.email || ''}</Text>
          </View>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('Settings')}
          >
            <Ionicons name="settings" size={24} color={COLORS.text} />
            <Text style={styles.menuText}>설정</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textSubtle} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={logout}>
            <Ionicons name="log-out" size={24} color={COLORS.error} />
            <Text style={[styles.menuText, { color: COLORS.error }]}>로그아웃</Text>
          </TouchableOpacity>
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
  profileHeader: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  username: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  email: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.backgroundLight,
    borderRadius: 12,
    marginBottom: SPACING.sm,
    gap: SPACING.md,
  },
  menuText: {
    flex: 1,
    ...TYPOGRAPHY.body,
    color: COLORS.text,
  },
});

export default ProfileScreen;


