import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // Tăng timeout để xử lý bài báo lớn
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor
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
    
    // Xử lý lỗi PayloadTooLarge
    if (error.response?.status === 413) {
      return Promise.reject({
        message: 'Bài báo quá dài. Vui lòng chọn bài khác!',
        status: 413
      });
    }
    
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

// ========== AI API (OPTIMIZED) ==========
export const aiAPI = {
  // 1. Tóm tắt - Giới hạn 5000 ký tự để tránh payload quá lớn
  summarize: (content) => {
    const trimmedContent = content.substring(0, 5000);
    return api.post('/ai/summarize', { content: trimmedContent });
  },

  // 2. Quiz - Giới hạn 5000 ký tự
  generateQuiz: (content) => {
    const trimmedContent = content.substring(0, 5000);
    return api.post('/ai/quiz', { content: trimmedContent });
  },

  // 3. Giải thích từ vựng
  explain: (text, context) => 
    api.post('/ai/explain', { text, context }),

  // 4. Phân tích cảm xúc - Giới hạn 3000 ký tự
  analyzeSentiment: (text) => {
    const trimmedText = text.substring(0, 3000);
    return api.post('/ai/analyze-sentiment', { text: trimmedText });
  },

  // 5. Text to Speech - Giới hạn 300 ký tự (giọng nói)
  textToSpeech: (text) => {
    const trimmedText = text.substring(0, 300);
    return api.post('/ai/text-to-speech', { text: trimmedText });
  }
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

// ========== UTILITY FUNCTIONS ==========
/**
 * Hàm cắt ngắn text một cách thông minh
 * Không cắt giữa một từ
 */
export const smartTruncate = (text, maxLength = 5000) => {
  if (text.length <= maxLength) return text;
  
  const truncated = text.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  
  return truncated.substring(0, lastSpace > maxLength / 2 ? lastSpace : maxLength) + '...';
};

/**
 * Hàm kiểm tra kích thước payload trước khi gửi
 */
export const getPayloadSize = (data) => {
  const json = JSON.stringify(data);
  const bytes = new TextEncoder().encode(json).length;
  return {
    bytes,
    kb: (bytes / 1024).toFixed(2),
    mb: (bytes / 1024 / 1024).toFixed(2)
  };
};

/**
 * Debug: Log payload size
 */
export const logPayloadSize = (label, data) => {
  const size = getPayloadSize(data);
  console.log(`📦 [${label}] Size: ${size.kb}KB (${size.mb}MB)`);
};

export default api;