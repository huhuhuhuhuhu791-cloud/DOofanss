import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Import routes
import newsRoutes from './routes/news.js';
import dictionaryRoutes from './routes/dictionary.js';
import translateRoutes from './routes/translate.js';
import aiRoutes from './routes/ai.js';

// --- TẠM THỜI ẨN CÁC FILE CHƯA CÓ ĐỂ SERVER KHÔNG BỊ LỖI ---
// import vocabularyRoutes from './routes/vocabulary.js'; 
// import authRoutes from './routes/auth.js'; 

// Import middleware
// SỬA LẠI ĐƯỜNG DẪN: Trong ảnh bạn gửi, errorHandler nằm chung thư mục routes
import { errorHandler } from './routes/errorHandler.js'; 
// Nếu file errorHandler.js thực sự nằm trong folder middleware thì bạn đổi lại nhé.

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected successfully'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'SmartNews English API',
    version: '1.0.0',
    endpoints: {
      news: '/api/news',
      dictionary: '/api/dictionary',
      translate: '/api/translate',
      ai: '/api/ai',
      // vocabulary: '/api/vocabulary',
      // auth: '/api/auth'
    }
  });
});

app.use('/api/news', newsRoutes);
app.use('/api/dictionary', dictionaryRoutes);
app.use('/api/translate', translateRoutes);
app.use('/api/ai', aiRoutes);

// --- ẨN DÒNG NÀY ĐI VÌ BÊN TRÊN ĐÃ ẨN IMPORT RỒI ---
// app.use('/api/vocabulary', vocabularyRoutes);
// app.use('/api/auth', authRoutes);

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📚 Environment: ${process.env.NODE_ENV}`);
});