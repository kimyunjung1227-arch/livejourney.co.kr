import React from 'react';
import { getDisplayImageUrl } from '../api/upload';

/**
 * 게시물의 첫 미디어(이미지 또는 동영상)를 썸네일로 표시.
 * - 이미지 있음 → img
 * - 이미지 없고 동영상만 있음 → video (첫 프레임이 썸네일처럼 보임)
 * - 둘 다 없음 → placeholder
 */
export default function PostThumbnail({ post, className = '', style = {}, alt, ...props }) {
  const hasImage = (post?.images && post.images.length > 0) || post?.image || post?.thumbnail || post?.imageUrl;
  const hasVideo = post?.videos && post.videos.length > 0;
  const imgUrl = hasImage
    ? getDisplayImageUrl(post.images?.[0] || post.image || post.thumbnail || post.imageUrl || '')
    : '';
  const videoUrl = hasVideo ? getDisplayImageUrl(post.videos[0]) : '';
  const label = alt ?? post?.location ?? '미디어';

  if (hasImage && imgUrl) {
    return (
      <img
        src={imgUrl}
        alt={label}
        className={className}
        style={{ objectFit: 'cover', ...style }}
        {...props}
      />
    );
  }

  if (hasVideo && videoUrl) {
    return (
      <video
        src={videoUrl}
        muted
        playsInline
        preload="metadata"
        className={className}
        style={{ objectFit: 'cover', ...style }}
        {...props}
      />
    );
  }

  return (
    <div
      className={className}
      style={{ background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', ...style }}
      {...props}
    >
      <span className="material-symbols-outlined text-4xl text-gray-400">image</span>
    </div>
  );
}
