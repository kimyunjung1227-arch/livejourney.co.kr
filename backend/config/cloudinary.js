const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Cloudinary 설정 (환경 변수 사용)
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Multer Storage 설정 (이미지 전용)
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'livejourney/posts', // 클라우드 내 저장 폴더
        allowed_formats: ['jpg', 'png', 'jpeg', 'webp', 'gif'],
        transformation: [{ width: 1280, height: 1280, crop: 'limit' }] // 이미지 리사이징 (최적화)
    }
});

// 비디오용 Storage 설정 (옵션)
const videoStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'livejourney/videos',
        resource_type: 'video',
        allowed_formats: ['mp4', 'mov', 'webm']
    }
});

module.exports = {
    cloudinary,
    storage,
    videoStorage
};
