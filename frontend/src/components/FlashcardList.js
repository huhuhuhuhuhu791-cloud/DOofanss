import React, { useEffect, useState } from 'react';

const FlashcardList = () => {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);

  // Gọi API lấy danh sách Flashcard
  useEffect(() => {
    const fetchCards = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/flashcards');
        const data = await res.json();
        setCards(data);
      } catch (error) {
        console.error("Lỗi tải flashcard:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCards();
  }, []);

  if (loading) return <div className="text-center p-10">Đang tải bộ nhớ của bạn...</div>;

  return (
    <div className="container mx-auto p-6">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 border-l-8 border-green-500 pl-3">
        Kho Từ Vựng Của Tôi ({cards.length})
      </h2>

      {cards.length === 0 ? (
        <p className="text-gray-500 text-lg">Bạn chưa lưu từ nào cả. Hãy đọc báo và tra từ đi nhé!</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {cards.map((card) => (
            <FlashcardItem key={card._id} card={card} />
          ))}
        </div>
      )}
    </div>
  );
};

// Component con: Một chiếc thẻ bài (có hiệu ứng lật)
const FlashcardItem = ({ card }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  // Xử lý phát âm
  const handleSpeak = (e) => {
    e.stopPropagation(); // Ngăn không cho thẻ bị lật khi bấm nút loa
    const utterance = new SpeechSynthesisUtterance(card.front);
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div 
      className="relative h-64 w-full cursor-pointer perspective-1000 group"
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <div className={`relative w-full h-full duration-500 preserve-3d transition-transform ${isFlipped ? 'rotate-y-180' : ''}`}
           style={{ transformStyle: 'preserve-3d', transform: isFlipped ? 'rotateY(180deg)' : '' }}
      >
        
        {/* MẶT TRƯỚC (Từ tiếng Anh) */}
        <div className="absolute w-full h-full bg-white border-2 border-blue-200 rounded-xl shadow-lg flex flex-col items-center justify-center backface-hidden p-4"
             style={{ backfaceVisibility: 'hidden' }}
        >
          <span className="text-xs text-blue-500 uppercase font-bold tracking-widest mb-2">Word</span>
          <h3 className="text-3xl font-extrabold text-gray-800 text-center mb-4">{card.front}</h3>
          
          <button 
            onClick={handleSpeak}
            className="mt-2 bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-sm hover:bg-blue-100 transition"
          >
            🔊 Nghe
          </button>
          <p className="absolute bottom-4 text-gray-400 text-xs">Bấm để lật</p>
        </div>

        {/* MẶT SAU (Nghĩa + Ví dụ) */}
        <div className="absolute w-full h-full bg-blue-600 text-white rounded-xl shadow-lg flex flex-col items-center justify-center backface-hidden p-4 rotate-y-180"
             style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <span className="text-xs text-blue-200 uppercase font-bold tracking-widest mb-2">Meaning</span>
          <p className="text-xl font-bold text-center mb-4">{card.back}</p>
          
          {card.example && (
            <div className="bg-blue-700 p-2 rounded text-xs text-center italic w-full">
              "{card.example}"
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default FlashcardList;