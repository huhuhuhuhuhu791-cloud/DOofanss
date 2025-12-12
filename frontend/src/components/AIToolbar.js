import React, { useState } from 'react';
import { aiService } from '../services/api';

const AIToolbar = ({ text }) => {
  // ... state cũ
  const [isSpeaking, setIsSpeaking] = useState(false); // State cho nút nghe

  // ... hàm handleSummarize, handleSentiment cũ ...

  // HÀM MỚI: Xử lý đọc bài báo
  const handleTextToSpeech = async () => {
    if (isSpeaking) return; // Tránh bấm liên tục
    setIsSpeaking(true);

    try {
      // Chỉ lấy 500 ký tự đầu để demo (để API không bị quá tải/lỗi timeout)
      const textToRead = text.substring(0, 500); 

      const res = await aiService.textToSpeech(textToRead);
      
      if (res.data.success && res.data.audioBase64) {
        // Tạo audio từ chuỗi Base64
        const audio = new Audio(`data:audio/flac;base64,${res.data.audioBase64}`);
        audio.play();
        
        // Khi đọc xong thì reset nút
        audio.onended = () => setIsSpeaking(false);
      }
    } catch (error) {
      console.error(error);
      alert("Lỗi khi tạo giọng nói AI");
      setIsSpeaking(false);
    }
  };

  return (
    <div className="mb-6 p-4 bg-gray-100 rounded-lg">
      <div className="flex gap-4 mb-4">
        {/* ... Nút Tóm tắt, Phân tích cũ ... */}

        {/* THÊM NÚT NÀY: */}
        <button 
          onClick={handleTextToSpeech}
          disabled={isSpeaking}
          className={`px-4 py-2 text-white rounded flex items-center gap-2 ${isSpeaking ? 'bg-green-400' : 'bg-green-600 hover:bg-green-700'}`}
        >
           {isSpeaking ? '🔊 Đang đọc...' : '🔈 Nghe AI đọc'}
        </button>
      </div>

      {/* ... Phần hiển thị kết quả cũ ... */}
    </div>
  );
};

export default AIToolbar;