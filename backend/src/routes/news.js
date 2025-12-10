import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// Hàm lấy Key an toàn
const getApiKey = () => {
  const key = process.env.NEWS_API_KEY; // Đảm bảo bạn đã paste Key Guardian vào .env
  if (!key) {
    console.error("❌ LỖI: Không tìm thấy API KEY trong file .env");
    return null;
  }
  return key;
};

// URL của The Guardian
const GUARDIAN_API_BASE = 'https://content.guardianapis.com/search';

/**
 * GET /api/news
 * Lấy danh sách tin tức TỪ THE GUARDIAN (Full nội dung)
 */
router.get('/', async (req, res) => {
  try {
    const apiKey = getApiKey();
    if (!apiKey) {
      return res.status(500).json({ success: false, message: 'Thiếu API Key' });
    }

    const { 
      page = 1, 
      q = '',      // Từ khóa tìm kiếm
      section = '' // Chủ đề (world, technology, science...)
    } = req.query;

    console.log(`📡 Đang gọi The Guardian... (Page: ${page})`);

    // Gọi API
    const response = await axios.get(GUARDIAN_API_BASE, {
      params: {
        'api-key': apiKey,
        'page': page,
        'q': q, 
        'show-fields': 'headline,thumbnail,body,trailText,byline', // <--- QUAN TRỌNG: Lấy body (nội dung chính)
        'page-size': 12,
        'order-by': 'newest' // Lấy bài mới nhất
      }
    });

    // The Guardian trả về cấu trúc hơi khác, ta map lại cho Frontend dễ dùng
    const rawData = response.data.response.results;
    
    const articles = rawData.map(item => ({
      id: item.id,
      title: item.fields.headline,
      // The Guardian trả về nội dung dạng HTML (có thẻ <p>), ta giữ nguyên để Frontend hiển thị
      content: item.fields.body, 
      summary: item.fields.trailText, // Tóm tắt ngắn
      url: item.webUrl,
      // Nếu không có ảnh thì dùng ảnh placeholder
      urlToImage: item.fields.thumbnail || 'https://via.placeholder.com/800x400?text=The+Guardian',
      publishedAt: item.webPublicationDate,
      source: 'The Guardian',
      author: item.fields.byline || 'Unknown'
    }));

    res.json({
      success: true,
      totalResults: response.data.response.total,
      articles,
      page: parseInt(page)
    });

  } catch (error) {
    console.error('❌ Lỗi gọi Guardian API:', error.message);
    res.status(500).json({ 
      success: false,
      message: 'Lỗi khi lấy tin tức',
      error: error.message 
    });
  }
});

export default router;