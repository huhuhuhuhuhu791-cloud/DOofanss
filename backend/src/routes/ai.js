import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const router = express.Router();

// Khởi tạo Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// --- HELPER: Cấu hình Gemini ---
const getGeminiModel = (jsonMode = false) => {
  const config = jsonMode ? { responseMimeType: "application/json" } : {};
  return genAI.getGenerativeModel({ 
    model: "gemini-2.5-flash", 
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
// 5. API TEXT TO SPEECH (HUGGING FACE - CHUẨN)
// ==========================================
router.post('/text-to-speech', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ message: 'Text is required' });

    // Giới hạn độ dài
    const safeText = text.substring(0, 300);

    console.log('🔊 Đang gọi Hugging Face TTS...');

    // Gọi Hugging Face TTS API (miễn phí, không cần key)
    const response = await axios.post(
      'https://api-inference.huggingface.co/models/espnet/kan-bayashi_ljspeech_fastspeech2_raw',
      { inputs: safeText },
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000,
        responseType: 'arraybuffer'
      }
    );

    // Chuyển thành Base64
    const audioBuffer = Buffer.from(response.data);
    const audioBase64 = audioBuffer.toString('base64');

    res.json({
      success: true,
      audioBase64: audioBase64,
      format: 'wav'
    });

  } catch (error) {
    console.error('TTS error:', error.message);

    // Fallback: dùng Web Speech API (phía client)
    res.json({
      success: true,
      useWebSpeech: true,
      message: 'Using browser speech synthesis as fallback'
    });
  }
});

export default router;