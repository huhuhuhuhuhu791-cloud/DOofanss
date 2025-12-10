import React from 'react';

const DictionaryPopup = ({ data, onClose, position }) => {
  if (!data) return null;

  const meanings = Array.isArray(data.meanings) ? data.meanings : [];

  // Hàm đọc từ vựng (Dùng trình duyệt)
  const handleSpeak = () => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(data.word);
      utterance.lang = 'en-US'; // Giọng Mỹ
      window.speechSynthesis.speak(utterance);
    } else {
      alert("Trình duyệt của bạn không hỗ trợ đọc âm thanh.");
    }
  };

  return (
    <div 
      className="fixed z-50 bg-white border border-blue-200 shadow-2xl rounded-xl p-5 w-80 text-left transform transition-all animate-fade-in-up"
      style={{ 
        top: position.y + 15, 
        left: position.x,
        maxHeight: '350px',
        overflowY: 'auto'
      }}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-3 border-b border-gray-100 pb-2">
        <div>
            <h3 className="text-2xl font-bold text-blue-800 capitalize tracking-tight">
                {data.word}
            </h3>
            <span className="text-gray-500 text-sm font-mono bg-gray-100 px-2 py-0.5 rounded">
                {data.phonetic || ''}
            </span>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-red-500 text-2xl leading-none">
            &times;
        </button>
      </div>

      {/* Nút Loa (Text-to-Speech) */}
      <button 
        onClick={handleSpeak}
        className="mb-4 flex items-center justify-center gap-2 w-full bg-blue-50 text-blue-600 font-semibold py-2 rounded-lg hover:bg-blue-100 transition duration-200"
      >
        🔊 Nghe phát âm (AI)
      </button>

      {/* Nghĩa của từ */}
      <div className="space-y-4">
        {meanings.length > 0 ? (
            meanings.map((m, index) => (
            <div key={index}>
                <span className="inline-block bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded uppercase mb-1">
                    {m.partOfSpeech}
                </span>
                <ul className="mt-1 list-none space-y-2">
                    {Array.isArray(m.definitions) && m.definitions.map((def, idx) => (
                        <li key={idx} className="text-gray-700 text-sm">
                            <p className="font-medium">Run: {def.definition}</p>
                            {def.example && (
                                <p className="text-gray-500 text-xs mt-1 italic pl-3 border-l-2 border-blue-200">
                                    "{def.example}"
                                </p>
                            )}
                        </li>
                    ))}
                </ul>
            </div>
            ))
        ) : (
            <p className="text-gray-500 text-sm italic">Gemini đang suy nghĩ...</p>
        )}
      </div>
      
      <div className="mt-3 text-right">
        <span className="text-[10px] text-gray-400">Powered by Gemini AI</span>
      </div>
    </div>
  );
};

export default DictionaryPopup;