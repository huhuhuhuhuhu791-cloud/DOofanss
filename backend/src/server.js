import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

// --- 1. IMPORT ROUTES (Chỉ import mỗi thứ 1 lần) ---
import newsRoutes from './routes/news.js';
import dictionaryRoutes from './routes/dictionary.js';
import flashcardRoutes from './routes/flashcards.js';
import aiRoutes from './routes/ai.js';
import translateRoutes from './routes/translate.js';

// Import middleware xử lý lỗi
import { errorHandler } from './routes/errorHandler.js';

// Cấu hình biến môi trường
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// --- 2. MIDDLEWARE (Bắt buộc phải đặt TRƯỚC các route) ---
app.use(cors()); // Cho phép Frontend gọi vào
app.use(express.json()); // Cho phép đọc dữ liệu JSON gửi lên
app.use(express.urlencoded({ extended: true }));

// --- 3. KẾT NỐI DATABASE ---
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected successfully'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// --- 4. CÁC ROUTES ---
// Route kiểm tra server sống hay chết
app.get('/', (req, res) => {
  res.json({ 
    message: 'SmartNews English API is running',
    version: '1.0.0',
    endpoints: {
      news: '/api/news',
      dictionary: '/api/dictionary',
      flashcards: '/api/flashcards',
      ai: '/api/ai',
      translate: '/api/translate'
    }
  });
});

// Đăng ký các API chính
app.use('/api/news', newsRoutes);
app.use('/api/dictionary', dictionaryRoutes);
app.use('/api/flashcards', flashcardRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/translate', translateRoutes);

// --- 5. XỬ LÝ LỖI (Phải đặt SAU cùng) ---
app.use(errorHandler);

// Xử lý lỗi 404 (Không tìm thấy đường dẫn)
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// --- 6. KHỞI ĐỘNG SERVER ---
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📚 Environment: ${process.env.NODE_ENV || 'development'}`);
});