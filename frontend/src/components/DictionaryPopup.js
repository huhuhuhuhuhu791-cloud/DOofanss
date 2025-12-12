import React, { useState } from 'react';

const DictionaryPopup = ({ data, onClose, position }) => {
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);

  // Safety check: Don't render if there's no data
  if (!data) return null;

  // Handle data structure variations (some APIs return an array, some an object)
  const wordData = Array.isArray(data) ? data[0] : data;
  const meanings = Array.isArray(wordData.meanings) ? wordData.meanings : [];
  const word = wordData.word || "Unknown";
  const phonetic = wordData.phonetic || (wordData.phonetics && wordData.phonetics[0] ? wordData.phonetics[0].text : "");

  // --- 1. Function to Speak the Word ---
  const handleSpeak = () => {
    // Try to use audio from API first
    const audioUrl = wordData.phonetics?.find(p => p.audio)?.audio;
    
    if (audioUrl) {
        new Audio(audioUrl).play();
    } else if ('speechSynthesis' in window) {
        // Fallback to browser TTS
        const utterance = new SpeechSynthesisUtterance(word);
        utterance.lang = 'en-US';
        window.speechSynthesis.speak(utterance);
    }
  };

  // --- 2. Function to Save Flashcard ---
  const handleSaveFlashcard = async () => {
    try {
      setIsSaving(true);
      setSaveStatus(null);

      // Get the first definition safely
      let firstDefinition = "No definition found";
      let firstExample = "";
      
      if (meanings.length > 0 && meanings[0].definitions.length > 0) {
        firstDefinition = meanings[0].definitions[0].definition;
        firstExample = meanings[0].definitions[0].example || "";
      }

      // Call API
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
      className="fixed bg-white border border-blue-200 shadow-2xl rounded-xl p-5 w-80 text-left animate-fade-in-up"
      style={{
        // Use fixed positioning relative to viewport
        position: 'fixed',
        top: position.y + 10, 
        left: position.x,
        transform: 'translateX(-50%)', // Center horizontally on the click
        zIndex: 9999, // Ensure it's on top of everything
        maxHeight: '400px',
        overflowY: 'auto'
      }}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-3 border-b border-gray-100 pb-2">
        <div>
          <h3 className="text-2xl font-bold text-blue-800 capitalize tracking-tight">{word}</h3>
          {phonetic && (
              <span className="text-gray-500 text-sm font-mono bg-gray-100 px-2 py-0.5 rounded">{phonetic}</span>
          )}
        </div>
        <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-red-500 text-2xl leading-none font-bold p-1"
        >
            &times;
        </button>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={handleSpeak}
          className="flex-1 flex items-center justify-center gap-1 bg-blue-50 text-blue-600 font-semibold py-2 rounded-lg hover:bg-blue-100 transition text-sm"
        >
          🔊 Listen
        </button>

        <button
          onClick={handleSaveFlashcard}
          disabled={isSaving || saveStatus === 'success'}
          className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg transition text-sm font-semibold text-white shadow-sm
            ${saveStatus === 'success' ? 'bg-green-500' : 'bg-indigo-600 hover:bg-indigo-700'}
            ${isSaving ? 'opacity-70 cursor-not-allowed' : ''}
          `}
        >
          {isSaving ? 'Saving...' : (saveStatus === 'success' ? '✅ Saved' : '💾 Save Word')}
        </button>
      </div>

      {/* Definitions */}
      <div className="space-y-4">
        {meanings.length > 0 ? (
            meanings.slice(0, 3).map((m, index) => (
            <div key={index}>
                <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded uppercase">{m.partOfSpeech}</span>
                <ul className="mt-2 list-disc list-inside space-y-1">
                {m.definitions.slice(0, 2).map((def, idx) => (
                    <li key={idx} className="text-gray-700 text-sm">
                        <span>{def.definition}</span>
                    </li>
                ))}
                </ul>
            </div>
            ))
        ) : (
            <p className="text-gray-500 text-sm italic">No definitions found.</p>
        )}
      </div>

      <div className="mt-4 pt-2 border-t text-right">
        <span className="text-[10px] text-gray-400">Gemini AI</span>
      </div>
    </div>
  );
};

export default DictionaryPopup;