import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor (gắn token nếu có)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor (xử lý lỗi chung)
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error.response?.data || error);
  }
);

// ========== NEWS API ==========
export const newsAPI = {
  getTopHeadlines: (params) => api.get('/news', { params }),
  searchNews: (query, params) => api.get('/news/search', { params: { q: query, ...params } }),
  getCategories: () => api.get('/news/categories')
};

// ========== DICTIONARY API ==========
export const dictionaryAPI = {
  lookupWord: (word) => api.get(`/dictionary/${word}`),
  batchLookup: (words) => api.post('/dictionary/batch', { words })
};

// ========== TRANSLATE API ==========
export const translateAPI = {
  translate: (text, source = 'en', target = 'vi') => 
    api.post('/translate', { text, source, target }),
  detectLanguage: (text) => api.post('/translate/detect', { text }),
  getSupportedLanguages: () => api.get('/translate/languages')
};

// ========== AI API (ĐÃ CẬP NHẬT CHO BACKEND MỚI) ==========
export const aiAPI = {
  // 1. Tóm tắt bài báo (Gemini)
  summarize: (content) => 
    api.post('/ai/summarize', { content }),

  // 2. Tạo Quiz trắc nghiệm (Gemini JSON Mode)
  generateQuiz: (content) => 
    api.post('/ai/quiz', { content }),

  // 3. Giải thích từ vựng/ngữ pháp (Gemini)
  explain: (text, context) => 
    api.post('/ai/explain', { text, context }),

  // 4. Phân tích cảm xúc (Gemini)
  analyzeSentiment: (text) => 
    api.post('/ai/analyze-sentiment', { text }),

  // 5. Đọc bài báo (Hugging Face TTS)
  textToSpeech: (text) => 
    api.post('/ai/text-to-speech', { text })
};

// ========== VOCABULARY API ==========
export const vocabularyAPI = {
  getUserVocabulary: () => api.get('/vocabulary'),
  addVocabulary: (word, meaning, context) => 
    api.post('/vocabulary', { word, meaning, context }),
  removeVocabulary: (id) => api.delete(`/vocabulary/${id}`),
  updateVocabularyLevel: (id, level) => 
    api.patch(`/vocabulary/${id}`, { level })
};

export default api;