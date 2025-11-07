import api from './axios';

// 게시물 목록 조회
export const getPosts = async (params = {}) => {
  try {
    const response = await api.get('/posts', { params });
    return response.data;
  } catch (error) {
    // 백엔드 없이도 작동하도록 조용히 처리
    if (error.code === 'ERR_NETWORK' || error.code === 'ERR_CONNECTION_REFUSED') {
      // 개발 모드에서만 로그 출력
      if (import.meta.env.MODE === 'development') {
        console.log('💡 백엔드 서버 미연결 (localStorage 사용 중)');
      }
      return { success: false, posts: [] };
    }
    console.error('게시물 조회 실패:', error);
    throw error;
  }
};

// 게시물 상세 조회
export const getPost = async (postId) => {
  try {
    const response = await api.get(`/posts/${postId}`);
    return response.data;
  } catch (error) {
    // 네트워크 오류는 조용히 처리
    if (error.code === 'ERR_NETWORK' || error.code === 'ERR_CONNECTION_REFUSED') {
      return { success: false, post: null };
    }
    console.error('게시물 상세 조회 실패:', error);
    throw error;
  }
};

// 게시물 작성
export const createPost = async (postData) => {
  try {
    const response = await api.post('/posts', postData);
    return response.data;
  } catch (error) {
    // 네트워크 오류는 조용히 처리
    if (error.code === 'ERR_NETWORK' || error.code === 'ERR_CONNECTION_REFUSED') {
      return { success: false };
    }
    console.error('게시물 작성 실패:', error);
    throw error;
  }
};

// 좋아요
export const likePost = async (postId) => {
  try {
    const response = await api.post(`/posts/${postId}/like`);
    return response.data;
  } catch (error) {
    // 네트워크 오류는 조용히 처리
    if (error.code === 'ERR_NETWORK' || error.code === 'ERR_CONNECTION_REFUSED') {
      return { success: false };
    }
    console.error('좋아요 실패:', error);
    throw error;
  }
};

// 댓글 작성
export const addComment = async (postId, content) => {
  try {
    const response = await api.post(`/posts/${postId}/comment`, { content });
    return response.data;
  } catch (error) {
    // 네트워크 오류는 조용히 처리
    if (error.code === 'ERR_NETWORK' || error.code === 'ERR_CONNECTION_REFUSED') {
      return { success: false };
    }
    console.error('댓글 작성 실패:', error);
    throw error;
  }
};

// 질문 작성
export const addQuestion = async (postId, question) => {
  try {
    const response = await api.post(`/posts/${postId}/question`, { question });
    return response.data;
  } catch (error) {
    // 네트워크 오류는 조용히 처리
    if (error.code === 'ERR_NETWORK' || error.code === 'ERR_CONNECTION_REFUSED') {
      return { success: false };
    }
    console.error('질문 작성 실패:', error);
    throw error;
  }
};

// 질문 답변
export const answerQuestion = async (questionId, answer) => {
  try {
    const response = await api.post(`/posts/questions/${questionId}/answer`, { answer });
    return response.data;
  } catch (error) {
    // 네트워크 오류는 조용히 처리
    if (error.code === 'ERR_NETWORK' || error.code === 'ERR_CONNECTION_REFUSED') {
      return { success: false };
    }
    console.error('답변 작성 실패:', error);
    throw error;
  }
};















