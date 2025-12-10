import express from 'express';
import axios from 'axios';

const router = express.Router();

// Hugging Face API configuration
const HF_API_URL = 'https://api-inference.huggingface.co/models';
const HF_API_KEY = process.env.HUGGINGFACE_API_KEY;

/**
 * POST /api/ai/summarize
 * Tóm tắt bài báo bằng AI (tiếng Anh)
 */
router.post('/summarize', async (req, res) => {
  try {
    const { text, maxLength = 150, minLength = 50 } = req.body;

    if (!text) {
      return res.status(400).json({ message: 'Text is required' });
    }

    if (!HF_API_KEY) {
      return res.status(500).json({ 
        message: 'Hugging Face API key not configured',
        hint: 'Add HUGGINGFACE_API_KEY to .env file'
      });
    }

    // Sử dụng model BART cho summarization
    const modelUrl = `${HF_API_URL}/facebook/bart-large-cnn`;

    const response = await axios.post(
      modelUrl,
      {
        inputs: text,
        parameters: {
          max_length: maxLength,
          min_length: minLength,
          do_sample: false
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${HF_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 seconds timeout
      }
    );

    // Hugging Face trả về array
    const summary = response.data[0]?.summary_text || response.data[0]?.generated_text;

    if (!summary) {
      throw new Error('No summary generated');
    }

    res.json({
      success: true,
      summary: summary,
      originalLength: text.length,
      summaryLength: summary.length,
      model: 'facebook/bart-large-cnn'
    });

  } catch (error) {
    console.error('AI Summarization error:', error.response?.data || error.message);
    
    // Handle specific Hugging Face errors
    if (error.response?.status === 503) {
      return res.status(503).json({ 
        message: 'Model is loading. Please try again in a few moments.',
        estimatedTime: error.response.data?.estimated_time || 20
      });
    }

    res.status(500).json({ 
      message: 'Error generating summary',
      error: error.message 
    });
  }
});

/**
 * POST /api/ai/extract-keywords
 * Trích xuất từ khóa quan trọng từ bài báo
 */
router.post('/extract-keywords', async (req, res) => {
  try {
    const { text, topK = 10 } = req.body;

    if (!text) {
      return res.status(400).json({ message: 'Text is required' });
    }

    // Simple keyword extraction using TF-IDF-like approach
    // Trong production, có thể dùng model NLP chuyên dụng
    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 4); // Chỉ lấy từ dài hơn 4 ký tự

    // Đếm tần suất
    const frequency = {};
    words.forEach(word => {
      frequency[word] = (frequency[word] || 0) + 1;
    });

    // Loại bỏ stop words phổ biến
    const stopWords = new Set([
      'which', 'their', 'there', 'would', 'could', 'should',
      'about', 'after', 'before', 'being', 'these', 'those',
      'where', 'while', 'other', 'first', 'years', 'through'
    ]);

    const keywords = Object.entries(frequency)
      .filter(([word]) => !stopWords.has(word))
      .sort((a, b) => b[1] - a[1])
      .slice(0, topK)
      .map(([word, count]) => ({ word, frequency: count }));

    res.json({
      success: true,
      keywords,
      totalWords: words.length,
      uniqueWords: Object.keys(frequency).length
    });

  } catch (error) {
    console.error('Keyword extraction error:', error.message);
    res.status(500).json({ 
      message: 'Error extracting keywords',
      error: error.message 
    });
  }
});

/**
 * POST /api/ai/generate-quiz
 * Tạo câu hỏi quiz từ bài báo bằng AI
 */
router.post('/generate-quiz', async (req, res) => {
  try {
    const { text, numQuestions = 5 } = req.body;

    if (!text) {
      return res.status(400).json({ message: 'Text is required' });
    }

    if (!HF_API_KEY) {
      return res.status(500).json({ 
        message: 'Hugging Face API key not configured'
      });
    }

    // Sử dụng model T5 cho question generation
    const modelUrl = `${HF_API_URL}/valhalla/t5-base-qg-hl`;

    // Chia text thành các câu
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
    const selectedSentences = sentences
      .filter(s => s.split(' ').length > 5) // Chọn câu dài hơn 5 từ
      .slice(0, numQuestions);

    const quizPromises = selectedSentences.map(async (sentence) => {
      try {
        const response = await axios.post(
          modelUrl,
          { inputs: sentence },
          {
            headers: {
              'Authorization': `Bearer ${HF_API_KEY}`,
              'Content-Type': 'application/json'
            },
            timeout: 20000
          }
        );

        return {
          context: sentence.trim(),
          question: response.data[0]?.generated_text || 'Generated question',
          type: 'reading_comprehension'
        };
      } catch (err) {
        console.error('Error generating question:', err.message);
        return null;
      }
    });

    const questions = (await Promise.all(quizPromises)).filter(q => q !== null);

    res.json({
      success: true,
      questions,
      model: 'valhalla/t5-base-qg-hl'
    });

  } catch (error) {
    console.error('Quiz generation error:', error.response?.data || error.message);
    res.status(500).json({ 
      message: 'Error generating quiz',
      error: error.message 
    });
  }
});

/**
 * POST /api/ai/difficulty-level
 * Phân tích độ khó của bài báo (A1-C2)
 */
router.post('/difficulty-level', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ message: 'Text is required' });
    }

    // Phân tích đơn giản dựa trên:
    // - Độ dài trung bình của câu
    // - Độ dài trung bình của từ
    // - Tỷ lệ từ phức tạp (>8 ký tự)

    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
    const words = text.split(/\s+/).filter(w => w.length > 0);
    
    const avgSentenceLength = words.length / sentences.length;
    const avgWordLength = words.reduce((sum, w) => sum + w.length, 0) / words.length;
    const complexWords = words.filter(w => w.length > 8).length;
    const complexWordRatio = complexWords / words.length;

    // Xác định level
    let level = 'B1';
    let description = 'Intermediate';

    if (avgSentenceLength < 15 && avgWordLength < 5 && complexWordRatio < 0.1) {
      level = 'A2';
      description = 'Elementary';
    } else if (avgSentenceLength < 20 && avgWordLength < 6 && complexWordRatio < 0.15) {
      level = 'B1';
      description = 'Intermediate';
    } else if (avgSentenceLength < 25 && avgWordLength < 7 && complexWordRatio < 0.25) {
      level = 'B2';
      description = 'Upper Intermediate';
    } else if (avgSentenceLength >= 25 || complexWordRatio >= 0.25) {
      level = 'C1';
      description = 'Advanced';
    }

    res.json({
      success: true,
      level,
      description,
      stats: {
        totalWords: words.length,
        totalSentences: sentences.length,
        avgSentenceLength: Math.round(avgSentenceLength * 10) / 10,
        avgWordLength: Math.round(avgWordLength * 10) / 10,
        complexWordPercentage: Math.round(complexWordRatio * 100)
      }
    });

  } catch (error) {
    console.error('Difficulty analysis error:', error.message);
    res.status(500).json({ 
      message: 'Error analyzing difficulty',
      error: error.message 
    });
  }
});

export default router;