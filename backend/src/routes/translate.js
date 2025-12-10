import express from 'express';
import axios from 'axios';

const router = express.Router();

const LIBRE_TRANSLATE_URL = process.env.LIBRE_TRANSLATE_URL || 'https://libretranslate.com/translate';

/**
 * POST /api/translate
 * Dịch văn bản từ tiếng Anh sang tiếng Việt
 */
router.post('/', async (req, res) => {
  try {
    const { 
      text, 
      source = 'en', 
      target = 'vi',
      format = 'text' 
    } = req.body;

    if (!text) {
      return res.status(400).json({ 
        message: 'Text is required',
        example: { text: 'Hello world', source: 'en', target: 'vi' }
      });
    }

    // Gọi LibreTranslate API
    const response = await axios.post(
      LIBRE_TRANSLATE_URL,
      {
        q: text,
        source,
        target,
        format
      },
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 15000 // 15 seconds
      }
    );

    const translatedText = response.data.translatedText;

    res.json({
      success: true,
      originalText: text,
      translatedText,
      sourceLang: source,
      targetLang: target,
      service: 'LibreTranslate'
    });

  } catch (error) {
    console.error('Translation error:', error.response?.data || error.message);

    // Nếu LibreTranslate không hoạt động, dùng fallback dictionary
    if (error.code === 'ECONNREFUSED' || error.response?.status >= 500) {
      return res.status(503).json({
        success: false,
        message: 'Translation service temporarily unavailable',
        hint: 'You can self-host LibreTranslate or use alternative service',
        fallback: 'Using dictionary for word translation'
      });
    }

    res.status(500).json({ 
      success: false,
      message: 'Error translating text',
      error: error.message 
    });
  }
});

/**
 * GET /api/translate/languages
 * Lấy danh sách ngôn ngữ hỗ trợ
 */
router.get('/languages', async (req, res) => {
  try {
    const response = await axios.get(`${LIBRE_TRANSLATE_URL.replace('/translate', '/languages')}`);
    
    res.json({
      success: true,
      languages: response.data
    });
  } catch (error) {
    // Fallback: trả về danh sách cố định
    res.json({
      success: true,
      languages: [
        { code: 'en', name: 'English' },
        { code: 'vi', name: 'Vietnamese' },
        { code: 'es', name: 'Spanish' },
        { code: 'fr', name: 'French' },
        { code: 'de', name: 'German' },
        { code: 'ja', name: 'Japanese' },
        { code: 'ko', name: 'Korean' },
        { code: 'zh', name: 'Chinese' }
      ],
      note: 'Default language list (LibreTranslate API unavailable)'
    });
  }
});

/**
 * POST /api/translate/detect
 * Phát hiện ngôn ngữ của văn bản
 */
router.post('/detect', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ message: 'Text is required' });
    }

    const detectUrl = LIBRE_TRANSLATE_URL.replace('/translate', '/detect');
    
    const response = await axios.post(
      detectUrl,
      { q: text },
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );

    res.json({
      success: true,
      detectedLanguage: response.data[0],
      allDetections: response.data
    });

  } catch (error) {
    console.error('Language detection error:', error.message);
    
    // Simple fallback detection
    const hasVietnamese = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(text);
    
    res.json({
      success: true,
      detectedLanguage: {
        language: hasVietnamese ? 'vi' : 'en',
        confidence: 0.5
      },
      note: 'Fallback detection (API unavailable)'
    });
  }
});

export default router;