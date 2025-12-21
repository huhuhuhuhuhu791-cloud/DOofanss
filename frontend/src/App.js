import React, { useEffect, useState } from 'react';
import Navbar from './components/Navbar';
import DictionaryPopup from './components/DictionaryPopup';
import FlashcardList from './components/FlashcardList';
import QuizModal from './components/QuizModal';
import { newsAPI, aiAPI, dictionaryAPI } from './services/api';

function App() {
  const [currentView, setCurrentView] = useState('home');
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [dictData, setDictData] = useState(null);
  const [popupPos, setPopupPos] = useState({ x: 0, y: 0 });
  const [summary, setSummary] = useState(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [quizData, setQuizData] = useState(null);
  const [isCreatingQuiz, setIsCreatingQuiz] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [sentiment, setSentiment] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const getRawText = (htmlContent) => {
    const div = document.createElement("div");
    div.innerHTML = htmlContent;
    return div.textContent || div.innerText || "";
  };

  const handleSummarize = async () => {
    if (!selectedArticle) return;
    setIsSummarizing(true);
    try {
      const textContent = getRawText(selectedArticle.content);
      const res = await aiAPI.summarize(textContent);
      setSummary(res.summary);
    } catch (err) {
      alert("❌ Lỗi tóm tắt. Vui lòng thử lại!");
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleCreateQuiz = async () => {
    if (!selectedArticle) return;
    setIsCreatingQuiz(true);
    try {
      const textContent = getRawText(selectedArticle.content);
      const res = await aiAPI.generateQuiz(textContent);
      setQuizData(res.quiz);
    } catch (err) {
      alert("❌ Lỗi tạo quiz. Vui lòng thử lại!");
    } finally {
      setIsCreatingQuiz(false);
    }
  };

  const handleTextToSpeech = async () => {
    if (isSpeaking) {
      if (window.currentAudio) {
        window.currentAudio.pause();
        window.currentAudio = null;
      }
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }
      setIsSpeaking(false);
      return;
    }

    if (!selectedArticle) return;
    setIsSpeaking(true);

    try {
      const textContent = getRawText(selectedArticle.content).substring(0, 300);
      const res = await aiAPI.textToSpeech(textContent);
      
      if (res.useWebSpeech) {
        const utterance = new SpeechSynthesisUtterance(textContent);
        utterance.lang = 'en-US';
        utterance.rate = 0.9;
        utterance.onend = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utterance);
      } else if (res.success && res.audioBase64) {
        const audioData = `data:audio/wav;base64,${res.audioBase64}`;
        const audio = new Audio(audioData);
        window.currentAudio = audio;
        audio.play().catch(() => {
          const utterance = new SpeechSynthesisUtterance(textContent);
          utterance.lang = 'en-US';
          window.speechSynthesis.speak(utterance);
          utterance.onend = () => setIsSpeaking(false);
        });
        audio.onended = () => setIsSpeaking(false);
      }
    } catch (err) {
      alert("❌ Lỗi phát âm. Vui lòng thử lại!");
      setIsSpeaking(false);
    }
  };

  const handleSentiment = async () => {
    if (!selectedArticle) return;
    setIsAnalyzing(true);
    try {
      const textContent = getRawText(selectedArticle.content);
      const res = await aiAPI.analyzeSentiment(textContent);
      setSentiment(res);
    } catch (err) {
      alert("❌ Lỗi phân tích. Vui lòng thử lại!");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleTextSelection = async () => {
    const selection = window.getSelection();
    const rawText = selection.toString();
    if (!rawText || rawText.trim().length < 2) return;

    const cleanText = rawText.trim().replace(/[.,!?;:()"]/g, "");
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    setPopupPos({ x: rect.left + (rect.width / 2), y: rect.bottom + 10 });

    try {
      const res = await dictionaryAPI.lookupWord(cleanText);
      if (res && (Array.isArray(res) || res.word)) {
        const data = Array.isArray(res) ? res[0] : res;
        setDictData(data);
      } else {
        setDictData(null);
      }
    } catch (err) {
      setDictData(null);
    }
  };

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        const data = await newsAPI.getTopHeadlines();
        if (data.success) setNews(data.articles);
        else setError(data.message);
      } catch (err) {
        setError('Lỗi kết nối tới Server Backend');
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, []);

  const resetArticleState = () => {
    setSelectedArticle(null);
    setDictData(null);
    setSummary(null);
    setQuizData(null);
    setSentiment(null);
    setIsSpeaking(false);
  };

  const renderArticleDetail = () => {
    if (!selectedArticle) return null;

    return (
      <div className="container-fluid container-max py-8">
        {/* BACK BUTTON */}
        <button
          onClick={resetArticleState}
          className="btn btn-primary btn-sm mb-8 animate-slide-in-left"
        >
          <span>←</span> Quay lại
        </button>

        {/* MAIN ARTICLE */}
        <article className="card-elevated p-8 md:p-12 animate-fade-in-up">
          {/* HEADER */}
          <div className="mb-8">
            <h1 className="text-gradient mb-4">{selectedArticle.title}</h1>
            
            {/* META */}
            <div className="flex flex-wrap items-center gap-3 pb-6 border-b-2 border-slate-300">
              <span className="badge badge-blue">
                {selectedArticle.source || 'News'}
              </span>
              <span className="text-sm text-slate-600">
                📅 {new Date(selectedArticle.publishedAt).toLocaleDateString('vi-VN')}
              </span>
              {selectedArticle.author && (
                <span className="text-sm text-slate-600">✍️ {selectedArticle.author}</span>
              )}
            </div>
          </div>

          {/* AI TOOLBAR */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            <button
              onClick={handleSummarize}
              disabled={isSummarizing}
              className="btn bg-gradient-secondary text-white hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSummarizing ? "⏳" : "✨"} <span className="hidden sm:inline">Tóm tắt</span>
            </button>

            <button
              onClick={handleSentiment}
              disabled={isAnalyzing}
              className="btn bg-gradient-primary text-white hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAnalyzing ? "⏳" : "🔍"} <span className="hidden sm:inline">Cảm xúc</span>
            </button>

            <button
              onClick={handleTextToSpeech}
              className={`btn text-white transition-all ${
                isSpeaking 
                  ? 'bg-gradient-success shadow-xl animate-pulse-glow' 
                  : 'bg-gradient-success hover:shadow-xl hover:scale-105'
              }`}
            >
              {isSpeaking ? "🔊" : "🔈"} <span className="hidden sm:inline">Nghe</span>
            </button>

            <button
              onClick={handleCreateQuiz}
              disabled={isCreatingQuiz}
              className="btn bg-gradient-warning text-white hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreatingQuiz ? "⏳" : "📝"} <span className="hidden sm:inline">Quiz</span>
            </button>
          </div>

          {/* AI RESULTS */}
          <div className="space-y-4 mb-10">
            {summary && (
              <div className="alert alert-info animate-slide-in-down">
                <div className="alert-icon">✨</div>
                <div className="alert-content">
                  <div className="alert-title">Tóm tắt bởi AI</div>
                  <p className="text-slate-800">{summary}</p>
                </div>
              </div>
            )}

            {sentiment && (
              <div className={`alert ${
                sentiment.sentiment === 'Positive' ? 'alert-success' :
                sentiment.sentiment === 'Negative' ? 'alert-danger' :
                'alert-warning'
              } animate-slide-in-down`}>
                <div className="alert-icon">{sentiment.emoji}</div>
                <div className="alert-content">
                  <div className="alert-title">
                    Sắc thái: <strong>{sentiment.sentiment}</strong>
                  </div>
                  <p className="text-sm">💯 Độ tin cậy: {sentiment.confidence}%</p>
                  <p className="mt-2 italic">"{sentiment.explanation}"</p>
                </div>
              </div>
            )}
          </div>

          {/* FEATURED IMAGE */}
          <div className="mb-10 rounded-2xl overflow-hidden shadow-xl h-96">
            <img
              src={selectedArticle.urlToImage}
              alt={selectedArticle.title}
              className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
              onError={(e) => { e.target.src = 'https://via.placeholder.com/800x400?text=News+Image' }}
            />
          </div>

          {/* CONTENT */}
          <div className="prose prose-lg max-w-none bg-white p-8 rounded-2xl shadow-md border-2 border-slate-200">
            <div
              dangerouslySetInnerHTML={{ __html: selectedArticle.content }}
              onMouseUp={handleTextSelection}
              className="text-slate-800"
            />
            {dictData && (
              <DictionaryPopup
                data={dictData}
                position={popupPos}
                onClose={() => setDictData(null)}
              />
            )}
          </div>
        </article>

        {quizData && (
          <QuizModal quizData={quizData} onClose={() => setQuizData(null)} />
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-cool">
      <Navbar onNavigate={(view) => {
        setCurrentView(view);
        resetArticleState();
      }} />

      {currentView === 'flashcards' ? (
        <FlashcardList />
      ) : (
        <>
          {selectedArticle ? (
            renderArticleDetail()
          ) : (
            <main className="container-fluid container-max py-12">
              {/* HEADER SECTION */}
              <div className="mb-12 animate-fade-in-up">
                <h1 className="text-gradient flex items-center gap-3 mb-3">
                  <span>📰</span> Tin Tức Mới Nhất
                </h1>
                <p className="text-slate-600 text-lg">
                  Đọc bài báo tiếng Anh, tra từ điển, luyện nghe và làm Quiz với AI
                </p>
              </div>

              {/* LOADING STATE */}
              {loading && (
                <div className="flex items-center justify-center py-24">
                  <div className="text-center">
                    <div className="spinner spinner-lg mb-4 mx-auto text-blue-600"></div>
                    <p className="text-slate-600 text-lg font-medium">Đang tải tin tức...</p>
                  </div>
                </div>
              )}

              {/* ERROR STATE */}
              {error && !loading && (
                <div className="alert alert-danger mb-8 animate-slide-in-down">
                  <div className="alert-icon">❌</div>
                  <div className="alert-content">
                    <div className="alert-title">Lỗi tải dữ liệu</div>
                    <p>{error}</p>
                  </div>
                </div>
              )}

              {/* NEWS GRID */}
              {!loading && news.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {news.map((item, index) => (
                    <div
                      key={index}
                      className="card group cursor-pointer overflow-hidden animate-fade-in"
                      onClick={() => setSelectedArticle(item)}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      {/* IMAGE */}
                      <div className="h-56 overflow-hidden relative bg-slate-200">
                        <img
                          src={item.urlToImage}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                          onError={(e) => { e.target.src = 'https://via.placeholder.com/400x200?text=News' }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent group-hover:from-black/50 transition-all"></div>
                        <div className="absolute top-4 right-4 badge badge-blue">
                          {item.source || 'News'}
                        </div>
                      </div>

                      {/* CONTENT */}
                      <div className="p-6 flex flex-col flex-grow">
                        <h3 className="font-bold text-lg text-slate-900 mb-3 leading-snug group-hover:text-blue-600 transition-colors line-clamp-2">
                          {item.title}
                        </h3>
                        <p className="text-slate-600 text-sm line-clamp-3 mb-4 flex-grow">
                          {item.summary || item.description || 'Không có mô tả'}
                        </p>
                        <button className="btn btn-primary w-full group-hover:shadow-lg">
                          Đọc ngay →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* EMPTY STATE */}
              {!loading && news.length === 0 && !error && (
                <div className="text-center py-24">
                  <p className="text-xl text-slate-500">📭 Không tìm thấy bài báo</p>
                </div>
              )}
            </main>
          )}
        </>
      )}
    </div>
  );
}

export default App;