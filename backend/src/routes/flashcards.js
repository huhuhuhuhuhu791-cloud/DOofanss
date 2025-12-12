import express from 'express';
import Flashcard from '../models/Flashcard.js';

const router = express.Router();

// API: Lưu Flashcard mới
// POST /api/flashcards
router.post('/', async (req, res) => {
  try {
    const { front, back, example } = req.body;

    if (!front || !back) {
      return res.status(400).json({ message: 'Thiếu mặt trước hoặc mặt sau' });
    }

    // Kiểm tra xem từ này đã lưu chưa (tránh trùng lặp)
    const existing = await Flashcard.findOne({ front: front });
    if (existing) {
        return res.status(400).json({ message: 'Từ vựng này đã có trong bộ nhớ của bạn rồi!' });
    }

    const newCard = new Flashcard({ front, back, example });
    await newCard.save();

    res.status(201).json({ success: true, data: newCard });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// API: Lấy danh sách Flashcard (để sau này làm trang ôn tập)
router.get('/', async (req, res) => {
    try {
        const cards = await Flashcard.find().sort({ createdAt: -1 });
        res.json(cards);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;