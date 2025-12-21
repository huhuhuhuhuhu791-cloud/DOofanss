import React, { useState } from 'react';

const DictionaryPopup = ({ data, onClose, position }) => {
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);

  if (!data) return null;

  const wordData = Array.isArray(data) ? data[0] : data;
  const meanings = Array.isArray(wordData.meanings) ? wordData.meanings : [];
  const word = wordData.word || "Unknown";
  const phonetic = wordData.phonetic || (wordData.phonetics && wordData.phonetics[0] ? wordData.phonetics[0].text : "");

  // --- Phát âm từ ---
  const handleSpeak = () => {
    const audioUrl = wordData.phonetics?.find(p => p.audio)?.audio;
    
    if (audioUrl) {
      new Audio(audioUrl).play();
    } else if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  };

  // --- Lưu Flashcard ---
  const handleSaveFlashcard = async () => {
    try {
      setIsSaving(true);
      setSaveStatus(null);

      let firstDefinition = "No definition found";
      let firstExample = "";
      
      if (meanings.length > 0 && meanings[0].definitions.length > 0) {
        firstDefinition = meanings[0].definitions[0].definition;
        firstExample = meanings[0].definitions[0].example || "";
      }

      const response = await fetch('http://localhost:5000/api/flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          front: word,
          back: firstDefinition,
          example: firstExample
        })
      });

      const result = await response.json();

      if (response.ok) {
        setSaveStatus('success');
        setTimeout(() => setSaveStatus(null), 2000);
      } else {
        alert(result.message || "Failed to save");
        setSaveStatus('error');
      }
    } catch (err) {
      console.error(err);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed bg-white rounded-2xl shadow-2xl p-6 w-96 text-left animate-fade-in-up border border-slate-200 backdrop-blur-sm"
      style={{
        position: 'fixed',
        top: position.y + 10, 
        left: position.x,
        transform: 'translateX(-50%)',
        zIndex: 9999,
        maxHeight: '500px',
        overflowY: 'auto',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)'
      }}
    >
      {/* HEADER */}
      <div className="flex justify-between items-start mb-4 pb-4 border-b-2 border-slate-200">
        <div className="flex-1">
          <h3 className="text-3xl font-black text-blue-700 capitalize tracking-tight">
            {word}
          </h3>
          {phonetic && (
            <span className="text-slate-600 text-sm font-mono bg-slate-100 px-3 py-1 rounded-full inline-block mt-2">
              {phonetic}
            </span>
          )}
        </div>
        <button 
          onClick={onClose} 
          className="text-slate-400 hover:text-red-500 text-3xl leading-none font-bold p-1 transition-colors"
        >
          ✕
        </button>
      </div>

      {/* ACTION BUTTONS */}
      <div className="flex gap-3 mb-5">
        <button
          onClick={handleSpeak}
          className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-100 to-blue-50 text-blue-700 font-bold py-3 rounded-xl hover:shadow-lg hover:scale-105 transition-all text-sm border border-blue-200"
        >
          🔊 Nghe phát âm
        </button>

        <button
          onClick={handleSaveFlashcard}
          disabled={isSaving || saveStatus === 'success'}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all text-sm font-bold text-white shadow-md ${
            saveStatus === 'success' 
              ? 'bg-gradient-to-r from-green-500 to-green-600 scale-105' 
              : 'bg-gradient-to-r from-indigo-600 to-indigo-700 hover:shadow-lg hover:scale-105'
          } ${isSaving ? 'opacity-70 cursor-not-allowed' : ''}`}
        >
          {isSaving ? '💾 Lưu...' : (saveStatus === 'success' ? '✅ Đã lưu' : '💾 Lưu từ')}
        </button>
      </div>

      {/* DEFINITIONS */}
      <div className="space-y-4">
        {meanings.length > 0 ? (
          meanings.slice(0, 3).map((m, index) => (
            <div key={index} className="bg-gradient-to-br from-slate-50 to-slate-100 p-4 rounded-xl border border-slate-200">
              <span className="inline-block bg-gradient-to-r from-blue-600 to-blue-700 text-white text-xs font-bold px-3 py-1 rounded-full mb-3">
                {m.partOfSpeech || 'Word'}
              </span>
              
              <ul className="space-y-2 mt-3">
                {m.definitions.slice(0, 2).map((def, idx) => (
                  <li key={idx} className="flex gap-2 text-slate-800 text-sm leading-relaxed">
                    <span className="text-blue-600 font-bold flex-shrink-0 mt-0.5">•</span>
                    <span>{def.definition}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))
        ) : (
          <p className="text-slate-600 text-sm italic text-center py-6">
            📚 Không tìm thấy định nghĩa. Thử từ khác nhé!
          </p>
        )}
      </div>

      {/* FOOTER */}
      <div className="mt-5 pt-4 border-t border-slate-200 flex items-center justify-between">
        <span className="text-[11px] text-slate-400 font-medium">
          🤖 Từ điển Merriam-Webster
        </span>
        <span className="text-[11px] text-slate-400">
          SmartNews English
        </span>
      </div>
    </div>
  );
};

export default DictionaryPopup;