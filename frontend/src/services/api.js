import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor (có thể thêm token nếu cần auth)
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

// Response interceptor
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

// ========== AI API - TÍCH HỢP AI ==========
export const aiAPI = {
  // Tóm tắt bài báo bằng AI
  summarizeText: (text, options = {}) => 
    api.post('/ai/summarize', { 
      text, 
      maxLength: options.maxLength || 150,
      minLength: options.minLength || 50
    }),

  // Trích xuất từ khóa quan trọng
  extractKeywords: (text, topK = 10) => 
    api.post('/ai/extract-keywords', { text, topK }),

  // Tạo câu hỏi quiz từ bài báo
  generateQuiz: (text, numQuestions = 5) => 
    api.post('/ai/generate-quiz', { text, numQuestions }),

  // Phân tích độ khó của bài báo
  analyzeDifficulty: (text) => 
    api.post('/ai/difficulty-level', { text })
};

// ========== VOCABULARY API (nếu có backend cho vocabulary) ==========
export const vocabularyAPI = {
  getUserVocabulary: () => api.get('/vocabulary'),
  addVocabulary: (word, meaning, context) => 
    api.post('/vocabulary', { word, meaning, context }),
  removeVocabulary: (id) => api.delete(`/vocabulary/${id}`),
  updateVocabularyLevel: (id, level) => 
    api.patch(`/vocabulary/${id}`, { level })
};

export default api;