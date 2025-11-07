const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/livejourney';
    
    console.log(`📦 MongoDB 연결 시도: ${mongoURI}`);
    
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000, // 5초 타임아웃
      socketTimeoutMS: 45000
    });

    console.log(`✅ MongoDB 연결 성공: ${conn.connection.host}`);
    
    // 연결 이벤트 리스너
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB 연결 오류:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB 연결 끊김');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB 재연결 성공');
    });

    return conn;
  } catch (error) {
    console.error('❌ MongoDB 연결 실패:', error.message);
    console.error('   MongoDB가 실행 중인지 확인하세요: net start MongoDB');
    throw error; // 오류를 throw하여 server.js에서 처리
  }
};

module.exports = connectDB;





