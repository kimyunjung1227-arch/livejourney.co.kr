import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthProvider } from './src/contexts/AuthContext';
import { TabBarProvider } from './src/contexts/TabBarContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  // 앱 시작 시 모든 목업 데이터 및 사진 데이터 완전 삭제
  useEffect(() => {
    const clearAllData = async () => {
      try {
        // 모든 게시물 데이터 삭제 (목업 데이터 포함)
        await AsyncStorage.removeItem('uploadedPosts');
        console.log('🗑️ 모든 게시물 데이터 삭제 완료 (목업 데이터 포함)');
        
        // 기타 목업 관련 데이터도 삭제
        const allKeys = await AsyncStorage.getAllKeys();
        const keysToRemove = allKeys.filter(key => 
          key.includes('mock') || 
          key.includes('Mock') || 
          key.includes('uploadedPosts')
        );
        
        if (keysToRemove.length > 0) {
          await AsyncStorage.multiRemove(keysToRemove);
          console.log(`🗑️ 목업 관련 데이터 ${keysToRemove.length}개 삭제 완료`);
        }
      } catch (error) {
        console.warn('데이터 정리 중 오류:', error);
      }
    };
    
    clearAllData();
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <TabBarProvider>
        <StatusBar style="dark" />
        <AppNavigator />
        </TabBarProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}


