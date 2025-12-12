import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();
const MW_API_KEY = process.env.MW_API_KEY;
const MW_URL = 'https://www.dictionaryapi.com/api/v3/references/learners/json';

router.get('/:word', async (req, res) => {
  try {
    const { word } = req.params;

    if (!MW_API_KEY) {
      return res.status(500).json({ message: 'Chưa cấu hình Merriam-Webster API Key' });
    }
    const response = await axios.get(`${MW_URL}/${word}?key=${MW_API_KEY}`);
    const data = response.data;
    if (!data || data.length === 0 || typeof data[0] === 'string') {
      return res.status(404).json({ message: 'Không tìm thấy từ này trong từ điển.' });
    }

    // Lấy kết quả đầu tiên chuẩn nhất
    const entry = data[0];

    // --- XỬ LÝ DỮ LIỆU CỦA MERRIAM-WEBSTER ---
    // 1. Từ vựng (Xóa các ký tự thừa như dấu *)
    const cleanWord = entry.hwi.hw.replace(/\*/g, '');

    // 2. Phiên âm (IPA)
    const phonetic = entry.hwi.prs ? `/${entry.hwi.prs[0].ipa}/` : '';

    // 3. Audio (MW có file audio nhưng đường dẫn rất phức tạp, ta dùng tạm null để Frontend dùng AI đọc)
    // Nếu muốn dùng audio thật của MW thì cần logic phức tạp hơn để ghép link.
    
    // 4. Định nghĩa (Dùng trường 'shortdef' cho gọn và dễ hiểu)
    const definitions = entry.shortdef || [];
    
    // Tạo cấu trúc dữ liệu chuẩn cho Frontend
    const result = {
      word: cleanWord,
      phonetic: phonetic,
      meanings: [
        {
          partOfSpeech: entry.fl || 'unknown', // Loại từ (noun, verb...)
          definitions: definitions.slice(0, 3).map(def => ({
            definition: def,
            example: null // 'shortdef' của MW không kèm ví dụ, nhưng định nghĩa rất chuẩn
          }))
        }
      ]
    };

    res.json(result);

  } catch (error) {
    console.error('Lỗi Merriam-Webster:', error.message);
    res.status(500).json({ message: 'Lỗi server từ điển' });
  }
});

export default router;