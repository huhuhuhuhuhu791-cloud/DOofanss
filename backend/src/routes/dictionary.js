import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// Khởi tạo Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.get('/:word', async (req, res) => {
  try {
    const { word } = req.params;

    // Cấu hình Model
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Prompt: Yêu cầu Gemini đóng vai từ điển và trả về JSON chuẩn
    const prompt = `
      Define the English word "${word}" for an English learner.
      Return ONLY a valid JSON object. Do not use Markdown code blocks.
      The JSON structure must be exactly like this:
      {
        "word": "${word}",
        "phonetic": "/IPA transcription/",
        "meanings": [
          {
            "partOfSpeech": "noun/verb/adj...",
            "definitions": [
              {
                "definition": "Simple definition in English",
                "example": "A simple example sentence using the word"
              }
            ]
          }
        ]
      }
      Provide at most 2 distinct meanings (e.g. one noun, one verb) and 1 definition per meaning.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // Làm sạch chuỗi JSON (đề phòng Gemini thêm ```json vào)
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();

    const dictionaryData = JSON.parse(text);

    // Trả về cho Frontend
    res.json(dictionaryData);

  } catch (error) {
    console.error('Lỗi Gemini Dictionary:', error);
    res.status(500).json({ message: 'Lỗi khi tra từ với AI' });
  }
});

export default router;