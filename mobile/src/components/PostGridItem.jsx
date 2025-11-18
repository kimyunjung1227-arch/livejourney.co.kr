import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../constants/styles';
import { isPostLiked } from '../utils/socialInteractions';

const PostGridItem = ({ post, index, isEditMode, isSelected, onPress, onToggleSelection }) => {
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
              size={14}
              color={isLiked ? COLORS.error : COLORS.text}
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
            {post.tags.slice(0, 3).map((tag, tagIndex) => (
              <Text key={tagIndex} style={styles.tag}>
                #{typeof tag === 'string' ? tag.replace('#', '') : tag}
              </Text>
            ))}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  postCard: {
    width: '48%',
    marginBottom: SPACING.md,
  },
  postImageContainer: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: SPACING.sm,
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
    top: 8,
    right: 8,
    zIndex: 10,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.backgroundLight,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  likeBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  likeCount: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
  },
  postTextContainer: {
    gap: SPACING.xs,
  },
  postTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
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



