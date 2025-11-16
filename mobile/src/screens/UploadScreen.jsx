import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants/styles';

const UploadScreen = () => {
  const [images, setImages] = useState([]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('권한 필요', '사진을 선택하려면 권한이 필요합니다.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
      allowsMultipleSelection: true,
    });

    if (!result.canceled) {
      setImages([...images, ...result.assets]);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <Text style={styles.title}>업로드</Text>
          
          <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
            <Ionicons name="camera" size={32} color={COLORS.primary} />
            <Text style={styles.uploadButtonText}>사진 선택</Text>
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
  title: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text,
    marginBottom: SPACING.lg,
  },
  uploadButton: {
    height: 200,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  uploadButtonText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
});

export default UploadScreen;

