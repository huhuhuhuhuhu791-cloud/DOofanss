import React, { useEffect, useState } from 'react';
import Navbar from './components/Navbar';
import DictionaryPopup from './components/DictionaryPopup';
import FlashcardList from './components/FlashcardList';
import QuizModal from './components/QuizModal';
// Import các API từ file service đã tạo
import { newsAPI, aiAPI, dictionaryAPI } from './services/api';

function App() {
  // --- STATE QUẢN LÝ MÀN HÌNH ---
  const [currentView, setCurrentView] = useState('home'); // 'home' hoặc 'flashcards'

  // --- STATE DỮ LIỆU ---
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedArticle, setSelectedArticle] = useState(null);
  const [dictData, setDictData] = useState(null);
  const [popupPos, setPopupPos] = useState({ x: 0, y: 0 });

  // --- STATE CHO AI (GEMINI + HUGGING FACE) ---
  const [summary, setSummary] = useState(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  
  const [quizData, setQuizData] = useState(null);
  const [isCreatingQuiz, setIsCreatingQuiz] = useState(false);
  
  const [isSpeaking, setIsSpeaking] = useState(false); // State cho nút Nghe
  const [sentiment, setSentiment] = useState(null);    // State cho Phân tích cảm xúc
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Hàm tiện ích: Lọc bỏ thẻ HTML để lấy text thuần cho AI
  const getRawText = (htmlContent) => {
    const div = document.createElement("div");
    div.innerHTML = htmlContent;
    return div.textContent || div.innerText || "";
  };

  // --- HÀM 1: GỌI AI TÓM TẮT ---
  const handleSummarize = async () => {
    if (!selectedArticle) return;
    setIsSummarizing(true);
    try {
      const textContent = getRawText(selectedArticle.content);
      const res = await aiAPI.summarize(textContent);
      setSummary(res.summary);
    } catch (err) {
      console.error(err);
      alert("Lỗi khi tóm tắt");
    } finally {
      setIsSummarizing(false);
    }
  };

  // --- HÀM 2: GỌI AI TẠO QUIZ ---
  const handleCreateQuiz = async () => {
    if (!selectedArticle) return;
    setIsCreatingQuiz(true);
    try {
      const textContent = getRawText(selectedArticle.content);
      const res = await aiAPI.generateQuiz(textContent);
      setQuizData(res.quiz);
    } catch (err) {
      console.error(err);
      alert("Lỗi khi tạo câu hỏi");
    } finally {
      setIsCreatingQuiz(false);
    }
  };


// --- HÀM 3: GỌI AI ĐỌC BÀI (Dùng Hugging Face) ---
// --- HÀM 3: GỌI AI ĐỌC BÀI (Phiên bản Google siêu tốc) ---
  const handleTextToSpeech = async () => {
    // 1. Logic bật/tắt: Nếu đang nói thì tắt đi
    if (isSpeaking) {
        if (window.currentAudio) {
            window.currentAudio.pause();
            window.currentAudio = null;
        }
        setIsSpeaking(false);
        return;
    }

    if (!selectedArticle) return;
    setIsSpeaking(true);

    try {
      // Google đọc được dài hơn Hugging Face, lấy 1000 ký tự ok
      const textContent = getRawText(selectedArticle.content).substring(0, 1000);
      
      console.log("Đang gọi Google TTS...");
      const res = await aiAPI.textToSpeech(textContent);
      
      if (res.success && res.audioUrl) {
        const audio = new Audio(res.audioUrl);
        window.currentAudio = audio; // Lưu vào biến toàn cục để có thể pause được
        
        audio.play();
        
        audio.onended = () => {
            setIsSpeaking(false);
            window.currentAudio = null;
        };

        audio.onerror = () => {
            alert("Không tải được file âm thanh.");
            setIsSpeaking(false);
        };
      }
    } catch (err) {
      console.error(err);
      alert("Lỗi kết nối server TTS.");
      setIsSpeaking(false);
    }
  };
  // --- HÀM 4: GỌI AI PHÂN TÍCH CẢM XÚC ---
  const handleSentiment = async () => {
    if (!selectedArticle) return;
    setIsAnalyzing(true);
    try {
      const textContent = getRawText(selectedArticle.content);
      const res = await aiAPI.analyzeSentiment(textContent);
      setSentiment(res);
    } catch (err) {
      console.error(err);
      alert("Lỗi phân tích cảm xúc");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // --- HÀM 5: TRA TỪ ĐIỂN (Khi bôi đen) ---
// --- HÀM 5: TRA TỪ ĐIỂN (ĐÃ SỬA LỖI) ---
  const handleTextSelection = async () => {
    const selection = window.getSelection();
    const rawText = selection.toString(); // Không trim vội để check length chuẩn hơn

    // 1. Kiểm tra cơ bản
    if (!rawText || rawText.trim().length < 2) return;

    // 2. Làm sạch từ: CHỈ trim khoảng trắng thừa đầu đuôi, giữ nguyên cụm từ
    // Thay vì xóa hết ký tự lạ, ta chỉ xóa dấu câu ở cuối câu (ví dụ "apple." -> "apple")
    const cleanText = rawText.trim().replace(/[.,!?;:()"]/g, "");

    console.log("Đang tra từ:", cleanText); // Check log xem đúng từ không

    // 3. Tính toán vị trí popup (Dùng Fixed Position để không bị lệch)
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    
    // Lưu ý: Không cộng window.scrollY nữa nếu dùng position: fixed
    setPopupPos({ 
      x: rect.left + (rect.width / 2), 
      y: rect.bottom + 10 
    });

    try {
      const res = await dictionaryAPI.lookupWord(cleanText);

      if (res && (Array.isArray(res) || res.word)) {
         const data = Array.isArray(res) ? res[0] : res;
         setDictData(data); 
      } else {
         console.warn("Không tìm thấy từ");
         setDictData(null);
      }
    } catch (err) {
      console.error("Lỗi tra từ:", err);
      setDictData(null); 
    }
  };

  // --- HÀM 6: LẤY TIN TỨC ---
  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        // Dùng newsAPI từ file service
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

  // --- RESET STATE KHI ĐỔI BÀI ---
  const resetArticleState = () => {
    setSelectedArticle(null);
    setDictData(null);
    setSummary(null);
    setQuizData(null);
    setSentiment(null);
    setIsSpeaking(false);
  };

  // --- RENDER CHI TIẾT BÀI BÁO ---
  const renderArticleDetail = () => {
    if (!selectedArticle) return null;

    return (
      <div className="container mx-auto p-6 max-w-4xl relative">
        <button
          onClick={resetArticleState}
          className="mb-6 flex items-center text-blue-600 hover:text-blue-800 font-bold text-lg sticky top-20 bg-gray-50/90 backdrop-blur-sm p-2 rounded z-40 shadow-sm"
        >
          &larr; Quay lại danh sách
        </button>

        <article className="bg-white rounded-xl shadow-2xl overflow-hidden p-6 md:p-12 relative">
          <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-6 leading-tight">
            {selectedArticle.title}
          </h1>

          {/* TOOLBAR CÁC CHỨC NĂNG AI */}
          <div className="flex flex-wrap gap-3 mb-8 border-b pb-6">
            <button
              onClick={handleSummarize}
              disabled={isSummarizing}
              className="flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full font-bold hover:bg-purple-200 transition disabled:opacity-50"
            >
              {isSummarizing ? "⏳ Đang viết..." : "✨ AI Tóm tắt"}
            </button>

            <button
              onClick={handleSentiment}
              disabled={isAnalyzing}
              className="flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full font-bold hover:bg-blue-200 transition disabled:opacity-50"
            >
              {isAnalyzing ? "⏳ Đang soi..." : "🔍 Cảm xúc"}
            </button>

            <button
              onClick={handleTextToSpeech}
              disabled={isSpeaking}
              className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold transition disabled:opacity-50 ${
                isSpeaking ? 'bg-green-500 text-white animate-pulse' : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
            >
              {isSpeaking ? "🔊 Đang đọc..." : "🔈 Nghe bài báo"}
            </button>

            <button
              onClick={handleCreateQuiz}
              disabled={isCreatingQuiz}
              className="flex items-center gap-2 bg-orange-100 text-orange-700 px-4 py-2 rounded-full font-bold hover:bg-orange-200 transition disabled:opacity-50"
            >
              {isCreatingQuiz ? "⏳ Đang tạo..." : "📝 Làm Quiz"}
            </button>
          </div>

          {/* HIỂN THỊ KẾT QUẢ AI */}
          <div className="space-y-4 mb-8">
            {summary && (
              <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded-r animate-fade-in">
                <h4 className="font-bold text-purple-800 mb-1">Tóm tắt bởi AI:</h4>
                <p className="text-gray-700 italic">{summary}</p>
              </div>
            )}

            {sentiment && (
              <div className={`border-l-4 p-4 rounded-r animate-fade-in ${
                sentiment.sentiment === 'Positive' ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'
              }`}>
                <h4 className="font-bold mb-1">
                  {sentiment.emoji} Sắc thái: <span className={sentiment.sentiment === 'Positive' ? 'text-green-700' : 'text-red-700'}>{sentiment.sentiment}</span>
                </h4>
                <p className="text-gray-600 text-sm">Độ tin cậy: {sentiment.confidence}%</p>
                <p className="text-gray-700 italic mt-1">"{sentiment.explanation}"</p>
              </div>
            )}
          </div>

          {/* ẢNH BÀI BÁO */}
          <div className="w-full h-auto mb-10 rounded-lg overflow-hidden shadow-sm">
            <img
              src={selectedArticle.urlToImage}
              alt={selectedArticle.title}
              className="w-full object-cover"
              onError={(e) => { e.target.src = 'https://via.placeholder.com/800x400?text=News+Image' }}
            />
          </div>

          {/* NỘI DUNG BÀI BÁO (Bôi đen để tra từ) */}
          <div className="relative">
            <div
              className="prose prose-lg max-w-none text-gray-800 leading-9 font-serif"
              dangerouslySetInnerHTML={{ __html: selectedArticle.content }}
              onMouseUp={handleTextSelection} // Sự kiện bôi đen
            />
            
            {/* POPUP TRA TỪ ĐIỂN */}
            {dictData && (
              <DictionaryPopup
                data={dictData}
                position={popupPos}
                onClose={() => setDictData(null)}
              />
            )}
          </div>
        </article>

        {/* MODAL QUIZ */}
        {quizData && (
          <QuizModal quizData={quizData} onClose={() => setQuizData(null)} />
        )}
      </div>
    );
  };

  // --- GIAO DIỆN CHÍNH ---
  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
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
            <main className="container mx-auto p-6">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900 pl-3 border-l-8 border-blue-600">
                  Tin tức mới nhất (SmartNews AI)
                </h2>
                <p className="text-gray-500 mt-2 pl-3">Đọc báo tiếng Anh, tra từ điển, luyện nghe và làm Quiz với AI.</p>
              </div>

              {loading ? (
                <div className="text-center py-20 text-gray-500">Đang tải tin tức...</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {news.map((item, index) => (
                    <div
                      key={index}
                      className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer flex flex-col h-full group"
                      onClick={() => setSelectedArticle(item)}
                    >
                      <div className="h-56 overflow-hidden relative">
                        <img
                          src={item.urlToImage}
                          alt={item.title}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          onError={(e) => { e.target.src = 'https://via.placeholder.com/400x200?text=News' }}
                        />
                        <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                          {item.source || 'News'}
                        </div>
                      </div>

                      <div className="p-6 flex flex-col flex-grow">
                        <h3 className="font-bold text-xl text-gray-900 mb-3 leading-snug group-hover:text-blue-700 transition-colors">
                          {item.title}
                        </h3>
                        <div
                          className="text-gray-600 text-sm line-clamp-3 mb-4 flex-grow prose prose-sm"
                          dangerouslySetInnerHTML={{ __html: item.summary || item.description }}
                        />
                        <button className="mt-auto w-full bg-gray-50 text-blue-700 font-bold py-3 rounded-lg hover:bg-blue-600 hover:text-white transition shadow-sm border border-gray-100">
                          Đọc ngay &rarr;
                        </button>
                      </div>
                    </div>
                  ))}
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