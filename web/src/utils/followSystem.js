/**
 * 팔로우 시스템 유틸리티 (localStorage)
 * follows_v1: [ { followerId, followingId }, ... ]
 */

const STORAGE_KEY = 'follows_v1';

const getRaw = () => {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    return s ? JSON.parse(s) : [];
  } catch {
    return [];
  }
};

const setRaw = (arr) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
    window.dispatchEvent(new CustomEvent('followsUpdated'));
  } catch (e) {
    console.warn('followSystem setRaw:', e);
  }
};

const getCurrentUserId = () => {
  try {
    const u = localStorage.getItem('user');
    if (!u) return null;
    const o = JSON.parse(u);
    return o?.id ? String(o.id) : null;
  } catch {
    return null;
  }
};

/** 특정 사용자를 팔로우 */
export const follow = (targetUserId) => {
  const me = getCurrentUserId();
  if (!me) return { success: false, isFollowing: false };
  const t = String(targetUserId);
  if (me === t) return { success: false, isFollowing: false };
  const arr = getRaw();
  if (arr.some((x) => String(x.followerId) === me && String(x.followingId) === t)) {
    return { success: true, isFollowing: true };
  }
  arr.push({ followerId: me, followingId: t });
  setRaw(arr);
  return { success: true, isFollowing: true };
};

/** 팔로우 해제 */
export const unfollow = (targetUserId) => {
  const me = getCurrentUserId();
  if (!me) return { success: false, isFollowing: false };
  const t = String(targetUserId);
  const arr = getRaw().filter(
    (x) => !(String(x.followerId) === me && String(x.followingId) === t)
  );
  setRaw(arr);
  return { success: true, isFollowing: false };
};

/** 팔로우 토글. returns { isFollowing } */
export const toggleFollow = (targetUserId) => {
  if (isFollowing(null, targetUserId)) {
    unfollow(targetUserId);
    return { isFollowing: false };
  }
  follow(targetUserId);
  return { isFollowing: true };
};

/** followerId가 followingId를 팔로우 중인지. followerId null이면 현재 로그인 사용자 */
export const isFollowing = (followerId, followingId) => {
  const fid = followerId ? String(followerId) : getCurrentUserId();
  if (!fid || !followingId) return false;
  const t = String(followingId);
  return getRaw().some(
    (x) => String(x.followerId) === fid && String(x.followingId) === t
  );
};

/** userId를 팔로우하는 사람 수 */
export const getFollowerCount = (userId) => {
  if (!userId) return 0;
  const t = String(userId);
  return getRaw().filter((x) => String(x.followingId) === t).length;
};

/** userId가 팔로우하는 사람 수 */
export const getFollowingCount = (userId) => {
  if (!userId) return 0;
  const t = String(userId);
  return getRaw().filter((x) => String(x.followerId) === t).length;
};

/** userId를 팔로우하는 사람 ID 목록 (팔로워) */
export const getFollowerIds = (userId) => {
  if (!userId) return [];
  const t = String(userId);
  return [...new Set(getRaw().filter((x) => String(x.followingId) === t).map((x) => String(x.followerId)))];
};

/** userId가 팔로우하는 사람 ID 목록 (팔로잉) */
export const getFollowingIds = (userId) => {
  if (!userId) return [];
  const t = String(userId);
  return [...new Set(getRaw().filter((x) => String(x.followerId) === t).map((x) => String(x.followingId)))];
};

/** 현재 로그인 사용자 id (없으면 null) */
export { getCurrentUserId };
