import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { MaterialIcons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../constants/styles';

const StartScreen = () => {
  const navigation = useNavigation();
  const { login, signup, isAuthenticated, testerLogin } = useAuth();
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [isLogin, setIsLogin] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    passwordConfirm: '',
    username: '',
  });
  const [agreements, setAgreements] = useState({
    terms: false,
    privacy: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigation.replace('MainTabs');
    }
  }, [isAuthenticated, navigation]);

  const handleSocialLogin = async (provider) => {
    setLoading(true);
    setError('');
    
    try {
      const apiUrl = __DEV__ ? 'http://localhost:5000' : 'https://your-api-server.com';
      const providerLower = provider.toLowerCase();
      const authEndpoint = `${apiUrl}/api/auth/${providerLower}`;
      
      const canOpen = await Linking.canOpenURL(authEndpoint);
      if (canOpen) {
        await Linking.openURL(authEndpoint);
      } else {
        setError(`${provider} 로그인에 실패했습니다.`);
        setLoading(false);
      }
    } catch (error) {
      console.error('소셜 로그인 실패:', error);
      setError(`${provider} 로그인에 실패했습니다.`);
      setLoading(false);
    }
  };

  const handleTesterLogin = async () => {
    setLoading(true);
    setError('');
    
    try {
      const result = await testerLogin();
      if (result.success) {
        navigation.replace('MainTabs');
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('테스터 계정 로그인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailClick = () => {
    setShowEmailForm(true);
  };

  const handleChange = (field, value) => {
    setFormData({
      ...formData,
      [field]: value,
    });
    setError('');
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      let result;
      if (isLogin) {
        result = await login(formData.email, formData.password);
      } else {
        if (!formData.username) {
          setError('닉네임을 입력해주세요.');
          setLoading(false);
          return;
        }
        if (formData.password !== formData.passwordConfirm) {
          setError('비밀번호가 일치하지 않습니다.');
          setLoading(false);
          return;
        }
        if (!agreements.terms || !agreements.privacy) {
          setError('필수 약관에 동의해주세요.');
          setLoading(false);
          return;
        }
        result = await signup(formData.email, formData.password, formData.username);
      }

      if (result.success) {
        navigation.replace('MainTabs');
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = () => {
    if (isLogin) {
      return formData.email && formData.password;
    } else {
      return (
        formData.email &&
        formData.password &&
        formData.passwordConfirm &&
        formData.username &&
        agreements.terms &&
        agreements.privacy
      );
    }
  };

  // 이메일 가입/로그인 화면
  if (showEmailForm) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => setShowEmailForm(false)}
            style={styles.backButton}
          >
            <MaterialIcons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        <Text style={styles.title}>회원가입/로그인</Text>

        <View style={styles.toggleContainer}>
          <View style={styles.toggleWrapper}>
            <TouchableOpacity
              style={[styles.toggleButton, !isLogin && styles.toggleButtonActive]}
              onPress={() => {
                setIsLogin(false);
                setError('');
              }}
            >
              <Text style={[styles.toggleText, !isLogin && styles.toggleTextActive]}>
                회원가입
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleButton, isLogin && styles.toggleButtonActive]}
              onPress={() => {
                setIsLogin(true);
                setError('');
              }}
            >
              <Text style={[styles.toggleText, isLogin && styles.toggleTextActive]}>
                로그인
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>이메일</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="이메일 주소를 입력해주세요"
                placeholderTextColor={COLORS.textSubtle}
                value={formData.email}
                onChangeText={(value) => handleChange('email', value)}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <MaterialIcons name="mail" size={20} color={COLORS.textSubtle} style={styles.inputIcon} />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>비밀번호</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="영문, 숫자 포함 8자 이상"
                placeholderTextColor={COLORS.textSubtle}
                value={formData.password}
                onChangeText={(value) => handleChange('password', value)}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.inputIcon}
              >
                <MaterialIcons
                  name={showPassword ? 'visibility' : 'visibility-off'}
                  size={20}
                  color={COLORS.textSubtle}
                />
              </TouchableOpacity>
            </View>
          </View>

          {!isLogin && (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>비밀번호 확인</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="비밀번호를 다시 입력해주세요"
                    placeholderTextColor={COLORS.textSubtle}
                    value={formData.passwordConfirm}
                    onChangeText={(value) => handleChange('passwordConfirm', value)}
                    secureTextEntry={!showPasswordConfirm}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPasswordConfirm(!showPasswordConfirm)}
                    style={styles.inputIcon}
                  >
                    <MaterialIcons
                      name={showPasswordConfirm ? 'visibility' : 'visibility-off'}
                      size={20}
                      color={COLORS.textSubtle}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>닉네임</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="닉네임을 입력해주세요"
                    placeholderTextColor={COLORS.textSubtle}
                    value={formData.username}
                    onChangeText={(value) => handleChange('username', value)}
                  />
                  <MaterialIcons name="person" size={20} color={COLORS.textSubtle} style={styles.inputIcon} />
                </View>
              </View>
            </>
          )}

          {!isLogin && (
            <View style={styles.agreementsContainer}>
              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => setAgreements({ ...agreements, terms: !agreements.terms })}
              >
                <MaterialIcons
                  name={agreements.terms ? 'check-box' : 'check-box-outline-blank'}
                  size={16}
                  color={agreements.terms ? COLORS.primary : COLORS.textSubtle}
                />
                <Text style={styles.checkboxText}>이용약관 동의 (필수)</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => setAgreements({ ...agreements, privacy: !agreements.privacy })}
              >
                <MaterialIcons
                  name={agreements.privacy ? 'check-box' : 'check-box-outline-blank'}
                  size={16}
                  color={agreements.privacy ? COLORS.primary : COLORS.textSubtle}
                />
                <Text style={styles.checkboxText}>개인정보 처리방침 동의 (필수)</Text>
              </TouchableOpacity>
            </View>
          )}

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
        </ScrollView>

        <View style={styles.submitContainer}>
          <TouchableOpacity
            style={[styles.submitButton, (!isFormValid() || loading) && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={!isFormValid() || loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.textWhite} />
            ) : (
              <Text style={styles.submitButtonText}>
                {isLogin ? '로그인' : '회원가입'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // 메인 시작 화면 (웹과 동일)
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.welcomeContainer}>
          <Text style={styles.welcomeTitle}>환영합니다!</Text>
          <Text style={styles.welcomeSubtitle}>
            가장 현명한 여행을 지금 바로 시작하세요.
          </Text>
        </View>

        <View style={styles.socialButtonsContainer}>
          {/* 테스터 계정 버튼 (개발용) */}
          {__DEV__ && (
            <TouchableOpacity
              style={[styles.socialButton, styles.testerButton]}
              onPress={handleTesterLogin}
              disabled={loading}
            >
              <MaterialIcons name="bug-report" size={20} color={COLORS.textWhite} />
              <Text style={[styles.socialButtonText, styles.testerButtonText]}>
                테스터 계정으로 시작하기
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.socialButton, styles.googleButton]}
            onPress={() => handleSocialLogin('Google')}
            disabled={loading}
          >
            <GoogleIcon />
            <Text style={[styles.socialButtonText, styles.googleButtonText]}>
              Google로 계속하기
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.socialButton, styles.kakaoButton]}
            onPress={() => handleSocialLogin('Kakao')}
            disabled={loading}
          >
            <KakaoIcon />
            <Text style={[styles.socialButtonText, styles.kakaoButtonText]}>
              카카오로 계속하기
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.socialButton, styles.naverButton]}
            onPress={() => handleSocialLogin('Naver')}
            disabled={loading}
          >
            <NaverIcon />
            <Text style={[styles.socialButtonText, styles.naverButtonText]}>
              네이버로 계속하기
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>또는</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity
          style={[styles.socialButton, styles.emailButton]}
          onPress={handleEmailClick}
          disabled={loading}
        >
          <MaterialIcons name="mail" size={20} color={COLORS.primary} />
          <Text style={[styles.socialButtonText, styles.emailButtonText]}>
            이메일로 가입/로그인
          </Text>
        </TouchableOpacity>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={COLORS.primary} />
            <Text style={styles.loadingText}>로그인 중...</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

// Google 아이콘
const GoogleIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24">
    <Path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <Path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <Path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <Path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </Svg>
);

// Kakao 아이콘
const KakaoIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="#000000">
    <Path d="M12 3c5.799 0 10.5 3.664 10.5 8.185 0 4.52-4.701 8.184-10.5 8.184a13.5 13.5 0 0 1-1.727-.11l-4.408 2.883c-.501.265-.678.236-.472-.413l.892-3.678c-2.88-1.46-4.785-3.99-4.785-6.866C1.5 6.665 6.201 3 12 3z"/>
  </Svg>
);

// Naver 아이콘
const NaverIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="#FFFFFF">
    <Path d="M16.273 12.845L7.376 0H0v24h7.726V11.156L16.624 24H24V0h-7.727v12.845z"/>
  </Svg>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundLight,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xl,
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  backButton: {
    padding: SPACING.sm,
  },
  title: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.md,
  },
  toggleContainer: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  toggleWrapper: {
    flexDirection: 'row',
    backgroundColor: 'rgba(224, 224, 224, 0.5)',
    borderRadius: BORDER_RADIUS.full,
    padding: 4,
    height: 48,
  },
  toggleButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.full,
  },
  toggleButtonActive: {
    backgroundColor: COLORS.backgroundLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
    fontWeight: 'bold',
  },
  toggleTextActive: {
    color: COLORS.primary,
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
  },
  inputGroup: {
    marginBottom: SPACING.md,
  },
  label: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.text,
    fontWeight: '600',
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.xl,
    backgroundColor: COLORS.backgroundLight,
    paddingHorizontal: SPACING.md,
    height: 44,
  },
  input: {
    flex: 1,
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.text,
    paddingRight: SPACING.sm,
  },
  inputIcon: {
    marginLeft: SPACING.sm,
  },
  agreementsContainer: {
    marginTop: SPACING.md,
    gap: 10,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkboxText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text,
    fontWeight: '500',
  },
  submitContainer: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    height: 48,
    borderRadius: BORDER_RADIUS.xl,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: '#E0E0E0',
  },
  submitButtonText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textWhite,
    fontWeight: 'bold',
  },
  welcomeContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
    marginTop: SPACING.xxl,
  },
  welcomeTitle: {
    fontSize: 30,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  welcomeSubtitle: {
    ...TYPOGRAPHY.body,
    color: '#1c140d',
    textAlign: 'center',
    lineHeight: 24,
  },
  socialButtonsContainer: {
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: BORDER_RADIUS.xl,
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  testerButton: {
    backgroundColor: COLORS.primary,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  testerButtonText: {
    color: COLORS.textWhite,
    fontWeight: 'bold',
  },
  googleButton: {
    backgroundColor: COLORS.backgroundLight,
    borderWidth: 2,
    borderColor: '#D1D5DB',
  },
  googleButtonText: {
    color: '#1F1F1F',
    fontWeight: 'bold',
  },
  kakaoButton: {
    backgroundColor: COLORS.kakao,
  },
  kakaoButtonText: {
    color: COLORS.kakaoText,
    fontWeight: 'bold',
  },
  naverButton: {
    backgroundColor: COLORS.naver,
  },
  naverButtonText: {
    color: COLORS.textWhite,
    fontWeight: 'bold',
  },
  emailButton: {
    backgroundColor: COLORS.backgroundLight,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  emailButtonText: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  socialButtonText: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: 'bold',
    letterSpacing: 0.015,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.md,
    gap: SPACING.sm,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#D1D5DB',
  },
  dividerText: {
    ...TYPOGRAPHY.caption,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
    marginTop: SPACING.md,
  },
  errorText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.error,
    textAlign: 'center',
    fontWeight: '500',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  loadingText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.primary,
    fontWeight: '500',
  },
});

export default StartScreen;
