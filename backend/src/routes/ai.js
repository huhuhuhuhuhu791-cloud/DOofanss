import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import axios from 'axios';

// --- SỬA LỖI IMPORT Ở ĐÂY ---
// Dùng createRequire để tải thư viện google-tts-api theo chuẩn CommonJS cũ
// Cách này đảm bảo 100% không bị lỗi "is not a function"
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const googleTTS = require('google-tts-api');

dotenv.config();

const router = express.Router();

// Khởi tạo Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// --- HELPER: Cấu hình Gemini ---
const getGeminiModel = (jsonMode = false) => {
  const config = jsonMode ? { responseMimeType: "application/json" } : {};
  return genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash", 
    generationConfig: config 
  });
};

// ==========================================
// 1. API TÓM TẮT (SUMMARIZE)
// ==========================================
router.post('/summarize', async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ message: 'Thiếu nội dung' });

    const model = getGeminiModel(false);
    const prompt = `
      Act as an English teacher. Summarize the following article for an A2-B1 English learner.
      Requirements:
      - Simple vocabulary.
      - Under 150 words.
      Article: "${content.substring(0, 8000)}"
    `;

    const result = await model.generateContent(prompt);
    res.json({ summary: result.response.text() });

  } catch (error) {
    console.error("Summarize Error:", error);
    res.status(503).json({ message: 'AI đang bận, thử lại sau.' });
  }
});

// ==========================================
// 2. API TẠO QUIZ (JSON MODE)
// ==========================================
router.post('/quiz', async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ message: 'Thiếu nội dung' });

    const model = getGeminiModel(true); 
    const prompt = `
      Generate 5 multiple-choice questions based on this article.
      Output strictly a JSON Array.
      Schema:
      [
        {
          "question": "String",
          "options": ["String", "String", "String", "String"],
          "answer": "String (Must match exactly one option)"
        }
      ]
      Article: "${content.substring(0, 8000)}"
    `;

    const result = await model.generateContent(prompt);
    const quiz = JSON.parse(result.response.text());
    
    res.json({ quiz });

  } catch (error) {
    console.error("Quiz Error:", error);
    res.status(500).json({ message: 'Lỗi tạo câu hỏi.' });
  }
});

// ==========================================
// 3. API GIẢI THÍCH TỪ VỰNG
// ==========================================
router.post('/explain', async (req, res) => {
  try {
    const { text, context } = req.body;
    const model = getGeminiModel(false);

    const prompt = `
      Explain the word/phrase "${text}" in the context: "${context}".
      Explain in Vietnamese. Keep it short.
    `;

    const result = await model.generateContent(prompt);
    res.json({ explanation: result.response.text() });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi giải thích.' });
  }
});

// ==========================================
// 4. API PHÂN TÍCH CẢM XÚC
// ==========================================
router.post('/analyze-sentiment', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ message: 'Thiếu nội dung' });

    const model = getGeminiModel(true);
    const prompt = `
      Analyze the sentiment of this news article.
      Output strictly a JSON Object with this schema:
      {
        "sentiment": "String (Positive, Negative, or Neutral)",
        "confidence": "Number (0-100)",
        "emoji": "String (a relevant emoji)",
        "explanation": "String (Short explanation in Vietnamese)"
      }
      Article: "${text.substring(0, 5000)}"
    `;

    const result = await model.generateContent(prompt);
    const analysis = JSON.parse(result.response.text());

    res.json(analysis);

  } catch (error) {
    console.error("Sentiment Error:", error);
    res.status(500).json({ message: 'Lỗi phân tích cảm xúc.' });
  }
});

// ==========================================
// 5. API TEXT TO SPEECH (GOOGLE TTS - FIX LỖI IMPORT)
// ==========================================
router.post('/text-to-speech', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ message: 'Text is required' });

    // Google TTS giới hạn độ dài, cắt ngắn cho an toàn
    const safeText = text.substring(0, 1000); 

    // Gọi hàm từ object googleTTS đã require ở trên
    const url = googleTTS.getAudioUrl(safeText, {
      lang: 'en',
      slow: false,
      host: 'https://translate.google.com',
    });

    res.json({
      success: true,
      audioUrl: url, 
      type: 'url'
    });

  } catch (error) {
    console.error('TTS error:', error);
    res.status(500).json({ message: 'Lỗi tạo giọng nói' });
  }
});

export default router;