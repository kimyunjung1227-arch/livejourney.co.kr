import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/styles';

// Screens
import WelcomeScreen from '../screens/WelcomeScreen';
import StartScreen from '../screens/StartScreen';
import MainScreen from '../screens/MainScreen';
import SearchScreen from '../screens/SearchScreen';
import UploadScreen from '../screens/UploadScreen';
import MapScreen from '../screens/MapScreen';
import ProfileScreen from '../screens/ProfileScreen';
import PostDetailScreen from '../screens/PostDetailScreen';
import RegionDetailScreen from '../screens/RegionDetailScreen';
import SettingsScreen from '../screens/SettingsScreen';
import UserProfileScreen from '../screens/UserProfileScreen';
import DetailScreen from '../screens/DetailScreen';
import RegionCategoryScreen from '../screens/RegionCategoryScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// 메인 탭 네비게이터
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSubtle,
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
          backgroundColor: COLORS.backgroundLight,
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: 'bold',
        },
      }}
    >
      <Tab.Screen
        name="MainTab"
        component={MainScreen}
        options={{
          tabBarLabel: '홈',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="SearchTab"
        component={SearchScreen}
        options={{
          tabBarLabel: '검색',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="search" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="UploadTab"
        component={UploadScreen}
        options={{
          tabBarLabel: '업로드',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="add-circle" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="MapTab"
        component={MapScreen}
        options={{
          tabBarLabel: '지도',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="map" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          tabBarLabel: '프로필',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// 메인 스택 네비게이터
export default function AppNavigator() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    // 로딩 화면 (나중에 추가)
    return null;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        {!isAuthenticated ? (
          // 인증되지 않은 사용자
          <>
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="Start" component={StartScreen} />
          </>
        ) : (
          // 인증된 사용자
          <>
            <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen 
              name="PostDetail" 
              component={PostDetailScreen}
              options={{ presentation: 'modal' }}
            />
            <Stack.Screen 
              name="RegionDetail" 
              component={RegionDetailScreen}
            />
            <Stack.Screen 
              name="Settings" 
              component={SettingsScreen}
            />
            <Stack.Screen 
              name="UserProfile" 
              component={UserProfileScreen}
            />
            <Stack.Screen 
              name="Detail" 
              component={DetailScreen}
            />
            <Stack.Screen 
              name="RegionCategory" 
              component={RegionCategoryScreen}
            />
            <Stack.Screen 
              name="Search" 
              component={SearchScreen}
            />
            <Stack.Screen 
              name="Upload" 
              component={UploadScreen}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}


