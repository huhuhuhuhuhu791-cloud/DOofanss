import mongoose from 'mongoose';

const flashcardSchema = new mongoose.Schema({
  front: { type: String, required: true }, // Mặt trước (Từ vựng)
  back: { type: String, required: true },  // Mặt sau (Nghĩa)
  example: { type: String },               // Ví dụ (nếu có)
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Flashcard', flashcardSchema);