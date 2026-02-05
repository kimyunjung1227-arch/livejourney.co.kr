/**
 * StatusBar 유틸리티
 * 핸드폰 상단 상태바 제어
 */

import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';

// StatusBar 초기화
export const initStatusBar = async () => {
  if (!Capacitor.isNativePlatform()) return;

  try {
    await StatusBar.show();
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: '#ffffff' });
    await StatusBar.setOverlaysWebView({ overlay: false });
  } catch (error) {
    logger.error('StatusBar 설정 실패:', error);
  }
};

// StatusBar 숨기기
export const hideStatusBar = async () => {
  if (!Capacitor.isNativePlatform()) return;
  
  try {
    await StatusBar.hide();
  } catch (error) {
    logger.error('StatusBar 숨기기 실패:', error);
  }
};

// StatusBar 보이기
export const showStatusBar = async () => {
  if (!Capacitor.isNativePlatform()) return;
  
  try {
    await StatusBar.show();
  } catch (error) {
    logger.error('StatusBar 표시 실패:', error);
  }
};

// StatusBar 스타일 변경
export const setStatusBarStyle = async (isDark = true) => {
  if (!Capacitor.isNativePlatform()) return;
  
  try {
    await StatusBar.setStyle({ 
      style: isDark ? Style.Dark : Style.Light 
    });
  } catch (error) {
    console.error('StatusBar 스타일 변경 실패:', error);
  }
};

// StatusBar 배경색 변경
export const setStatusBarColor = async (color) => {
  if (!Capacitor.isNativePlatform()) return;
  
  try {
    await StatusBar.setBackgroundColor({ color });
  } catch (error) {
    logger.error('StatusBar 색상 변경 실패:', error);
  }
};

