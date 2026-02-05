/**
 * 팔로우 시스템 유틸리티 (AsyncStorage)
 * follows_v1: [ { followerId, followingId }, ... ]
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'follows_v1';

const getRaw = async () => {
  try {
    const s = await AsyncStorage.getItem(STORAGE_KEY);
    return s ? JSON.parse(s) : [];
  } catch {
    return [];
  }
};

const setRaw = async (arr) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
    // 이벤트는 RN에서 제한적; 콜백이나 상태 갱신으로 처리
  } catch (e) {
    console.warn('followSystem setRaw:', e);
  }
};

const getCurrentUserId = async () => {
  try {
    const u = await AsyncStorage.getItem('user');
    if (!u) return null;
    const o = JSON.parse(u);
    return o?.id ? String(o.id) : null;
  } catch {
    return null;
  }
};

/** 특정 사용자를 팔로우 */
export const follow = async (targetUserId) => {
  const me = await getCurrentUserId();
  if (!me) return { success: false, isFollowing: false };
  const t = String(targetUserId);
  if (me === t) return { success: false, isFollowing: false };
  const arr = await getRaw();
  if (arr.some((x) => String(x.followerId) === me && String(x.followingId) === t)) {
    return { success: true, isFollowing: true };
  }
  arr.push({ followerId: me, followingId: t });
  await setRaw(arr);
  return { success: true, isFollowing: true };
};

/** 팔로우 해제 */
export const unfollow = async (targetUserId) => {
  const me = await getCurrentUserId();
  if (!me) return { success: false, isFollowing: false };
  const t = String(targetUserId);
  const arr = (await getRaw()).filter(
    (x) => !(String(x.followerId) === me && String(x.followingId) === t)
  );
  await setRaw(arr);
  return { success: true, isFollowing: false };
};

/** 팔로우 토글. returns { isFollowing } */
export const toggleFollow = async (targetUserId) => {
  const now = await isFollowing(null, targetUserId);
  if (now) {
    await unfollow(targetUserId);
    return { isFollowing: false };
  }
  await follow(targetUserId);
  return { isFollowing: true };
};

/** followerId가 followingId를 팔로우 중인지. followerId null이면 현재 로그인 사용자 */
export const isFollowing = async (followerId, followingId) => {
  const fid = followerId ? String(followerId) : await getCurrentUserId();
  if (!fid || !followingId) return false;
  const t = String(followingId);
  const arr = await getRaw();
  return arr.some(
    (x) => String(x.followerId) === fid && String(x.followingId) === t
  );
};

/** userId를 팔로우하는 사람 수 */
export const getFollowerCount = async (userId) => {
  if (!userId) return 0;
  const t = String(userId);
  const arr = await getRaw();
  return arr.filter((x) => String(x.followingId) === t).length;
};

/** userId가 팔로우하는 사람 수 */
export const getFollowingCount = async (userId) => {
  if (!userId) return 0;
  const t = String(userId);
  const arr = await getRaw();
  return arr.filter((x) => String(x.followerId) === t).length;
};

/** 현재 로그인 사용자 id (없으면 null) */
export { getCurrentUserId };
