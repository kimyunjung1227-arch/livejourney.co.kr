import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../constants/styles';
import { isPostLiked } from '../utils/socialInteractions';

const PostGridItem = ({ post, index, isEditMode, isSelected, onPress, onToggleSelection, onTagPress }) => {
  const [isLiked, setIsLiked] = useState(false);
  const imageUrl = post.imageUrl || post.images?.[0] || post.image;
  const likeCount = post.likes || post.likeCount || 0;

  useEffect(() => {
    const checkLike = async () => {
      const liked = await isPostLiked(post.id);
      setIsLiked(liked);
    };
    checkLike();
  }, [post.id]);

  return (
    <TouchableOpacity
      style={styles.postCard}
      onPress={() => {
        if (isEditMode) {
          onToggleSelection(post.id);
        } else {
          onPress(post, index);
        }
      }}
      activeOpacity={0.9}
    >
      <View style={[styles.postImageContainer, isSelected && styles.postImageContainerSelected]}>
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={styles.postImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.postImage, styles.postImagePlaceholder]}>
            <Ionicons name="image-outline" size={32} color={COLORS.textSubtle} />
          </View>
        )}

        {/* 편집 모드 체크박스 */}
        {isEditMode && (
          <View style={styles.checkboxContainer}>
            <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
              {isSelected && (
                <Ionicons name="checkmark" size={16} color={COLORS.backgroundLight} />
              )}
            </View>
          </View>
        )}

        {/* 우측 하단 하트 아이콘 (편집 모드가 아닐 때만) */}
        {!isEditMode && (
          <View style={styles.likeBadge}>
            <Ionicons
              name={isLiked ? 'heart' : 'heart-outline'}
              size={14} // text-sm = 14px
              color={isLiked ? '#EF4444' : '#4B5563'} // text-red-500 (활성화) / text-gray-600 (비활성화)
            />
            <Text style={styles.likeCount}>{likeCount}</Text>
          </View>
        )}
      </View>

      {/* 이미지 밖 하단 텍스트 */}
      <View style={styles.postTextContainer}>
        <Text style={styles.postTitle} numberOfLines={2}>
          {post.note || post.location || '여행 기록'}
        </Text>
        {post.tags && post.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {post.tags.slice(0, 3).map((tag, tagIndex) => {
              const t = typeof tag === 'string' ? tag.replace(/^#+/, '') : tag;
              return onTagPress ? (
                <TouchableOpacity key={tagIndex} onPress={() => onTagPress(t)} activeOpacity={0.7}>
                  <Text style={styles.tag}>#{t}</Text>
                </TouchableOpacity>
              ) : (
                <Text key={tagIndex} style={styles.tag}>#{t}</Text>
              );
            })}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  postCard: {
    width: '48%', // grid-cols-2 gap-4 (2열 그리드, 16px 간격)
    marginBottom: 0, // gap으로 처리
  },
  postImageContainer: {
    width: '100%',
    aspectRatio: 1, // aspect-square (1:1 비율)
    borderRadius: 12, // rounded-lg
    overflow: 'hidden',
    marginBottom: SPACING.sm, // mb-2 = 8px
    backgroundColor: COLORS.borderLight,
    position: 'relative',
  },
  postImageContainerSelected: {
    borderWidth: 3,
    borderColor: COLORS.primary,
    opacity: 0.7,
  },
  postImage: {
    width: '100%',
    height: '100%',
  },
  postImagePlaceholder: {
    backgroundColor: COLORS.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxContainer: {
    position: 'absolute',
    top: 8, // top-2 = 8px
    right: 8, // right-2 = 8px
    zIndex: 10,
  },
  checkbox: {
    width: 24, // w-6 = 24px
    height: 24, // h-6 = 24px
    borderRadius: 12, // rounded-full
    borderWidth: 2, // border-2
    borderColor: '#D1D5DB', // border-gray-300 (비활성화)
    backgroundColor: 'white', // bg-white (비활성화)
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: COLORS.primary, // bg-primary
    borderColor: COLORS.primary, // border-primary
  },
  likeBadge: {
    position: 'absolute',
    bottom: 8, // bottom-2 = 8px
    right: 8, // right-2 = 8px
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4, // gap-1 = 4px
    backgroundColor: 'rgba(255,255,255,0.8)', // bg-white/80 backdrop-blur-sm (backdrop-blur는 React Native에서 지원 안 함)
    paddingHorizontal: 8, // px-2 = 8px
    paddingVertical: 4, // py-1 = 4px
    borderRadius: 999, // rounded-full
  },
  likeCount: {
    fontSize: 12, // text-xs = 12px
    fontWeight: '600', // font-semibold
    color: '#374151', // text-gray-700 (웹과 동일)
  },
  postTextContainer: {
    gap: SPACING.xs, // space-y-1 = 4px
  },
  postTitle: {
    fontSize: 14, // text-sm = 14px
    fontWeight: '600', // font-semibold
    color: COLORS.text, // text-text-primary-light
    lineHeight: 20,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  tag: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
});

export default PostGridItem;



