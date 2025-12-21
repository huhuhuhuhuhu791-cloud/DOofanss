import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

// --- 1. IMPORT ROUTES ---
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

// --- 2. MIDDLEWARE (PHẢI ĐẶT TRƯỚC ROUTES) ---
app.use(cors()); // Cho phép Frontend gọi vào

// ⭐ FIX PAYLOAD TOO LARGE ⭐
// Tăng giới hạn request body từ 100KB lên 50MB
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Fallback cho các trường hợp khác
app.use(express.text({ limit: '50mb' }));
app.use(express.raw({ limit: '50mb' }));

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
    limits: {
      maxPayload: '50MB',
      note: 'Tăng từ 100KB để xử lý bài báo lớn'
    },
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

// --- 5. HANDLE PAYLOAD TOO LARGE ERROR ---
app.use((err, req, res, next) => {
  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      success: false,
      message: 'Request payload too large',
      error: 'Bài báo quá dài. Giới hạn 50MB.',
      received: `${(err.length / 1024 / 1024).toFixed(2)}MB`,
      limit: '50MB'
    });
  }
  next(err);
});

// --- 6. XỬ LÝ LỖI CHUNG ---
app.use(errorHandler);

// Xử lý lỗi 404 (Không tìm thấy đường dẫn)
app.use((req, res) => {
  res.status(404).json({ 
    success: false,
    message: 'Route not found',
    path: req.path,
    method: req.method
  });
});

// --- 7. KHỞI ĐỘNG SERVER ---
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📚 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📦 Max Payload: 50MB (nâng từ 100KB)`);
});