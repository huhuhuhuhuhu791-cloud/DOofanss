import React, { useEffect, useState } from 'react';
import Navbar from './components/Navbar'; 
import DictionaryPopup from './components/DictionaryPopup'; // Đảm bảo bạn đã tạo file này ở bước trước

function App() {
  // --- KHAI BÁO STATE (TRẠNG THÁI) ---
  const [news, setNews] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State quản lý việc đọc báo
  const [selectedArticle, setSelectedArticle] = useState(null);

  // State quản lý từ điển (Popup)
  const [dictData, setDictData] = useState(null);
  const [popupPos, setPopupPos] = useState({ x: 0, y: 0 });

  // --- HÀM 1: XỬ LÝ TRA TỪ ĐIỂN (KHI BÔI ĐEN/CLICK ĐÚP) ---
  const handleTextSelection = async () => {
    const selection = window.getSelection();
    const text = selection.toString().trim();

    // Chỉ tra cứu nếu text là 1 từ tiếng Anh (không chứa số hay ký tự lạ)
    if (text && /^[a-zA-Z]+$/.test(text)) {
      
      // Tính toán vị trí để hiện Popup ngay bên dưới từ được chọn
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setPopupPos({ x: rect.left, y: rect.bottom }); 

      try {
        // Gọi API Dictionary từ Backend của bạn
        // Lưu ý: Đảm bảo backend đã có route /api/dictionary
        const res = await fetch(`http://localhost:5000/api/dictionary/${text}`);
        
        if (res.ok) {
            const data = await res.json();
            setDictData(data); // Có dữ liệu -> Hiện Popup
        } else {
            console.log("Không tìm thấy từ này trong từ điển");
            setDictData(null); // Không thấy -> Ẩn Popup
        }
      } catch (err) {
        console.error("Lỗi gọi API từ điển:", err);
        setDictData(null);
      }
    }
  };

  // --- HÀM 2: LẤY DANH SÁCH TIN TỨC (KHI MỞ APP) ---
  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        // Gọi API News từ Backend (The Guardian)
        const response = await fetch('http://localhost:5000/api/news');
        const data = await response.json();

        if (data.success) {
          setNews(data.articles); 
        } else {
          setError(data.message || 'Không tải được tin tức');
        }
      } catch (err) {
        console.error("Lỗi kết nối:", err);
        setError('Lỗi kết nối tới Server Backend (Hãy kiểm tra xem backend chạy chưa)');
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  // --- HÀM 3: GIAO DIỆN CHI TIẾT BÀI BÁO (READING MODE) ---
  const renderArticleDetail = () => {
    if (!selectedArticle) return null;

    return (
      <div className="container mx-auto p-6 max-w-4xl relative"> 
        {/* Nút quay lại */}
        <button 
          onClick={() => {
            setSelectedArticle(null); // Thoát chế độ đọc
            setDictData(null); // Tắt popup từ điển nếu đang mở
          }}
          className="mb-6 flex items-center text-blue-600 hover:text-blue-800 font-bold text-lg sticky top-20 bg-gray-50/80 backdrop-blur-sm p-2 rounded"
        >
          &larr; Quay lại danh sách
        </button>

        <article className="bg-white rounded-xl shadow-2xl overflow-hidden p-6 md:p-12">
           {/* Tiêu đề lớn */}
          <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-6 leading-tight">
            {selectedArticle.title}
          </h1>

          {/* Thông tin bài viết */}
          <div className="flex items-center text-gray-500 mb-8 border-b pb-4 text-sm md:text-base">
             <span className="font-bold text-blue-600 mr-2 uppercase">
                {selectedArticle.source}
             </span>
             <span className="mx-2">•</span>
             <span>{new Date(selectedArticle.publishedAt).toLocaleDateString()}</span>
             <span className="mx-2">•</span>
             <span className="italic">Bởi {selectedArticle.author}</span>
          </div>

          {/* Ảnh bài báo */}
          <div className="w-full h-auto mb-10 rounded-lg overflow-hidden shadow-sm">
             <img 
                src={selectedArticle.urlToImage} 
                alt={selectedArticle.title}
                className="w-full object-cover"
                onError={(e) => {e.target.src = 'https://via.placeholder.com/800x400?text=The+Guardian'}} 
              />
          </div>

          {/* === NỘI DUNG CHÍNH (HTML) & TRA TỪ ĐIỂN === */}
          <div className="relative">
            <div 
                className="prose prose-lg max-w-none text-gray-800 leading-9 font-serif"
                // 1. Hiển thị HTML từ The Guardian
                dangerouslySetInnerHTML={{ __html: selectedArticle.content }}
                // 2. Bắt sự kiện nhả chuột để tra từ điển
                onMouseUp={handleTextSelection} 
            />
            
            {/* 3. Popup từ điển hiện ở đây */}
            {dictData && (
                <DictionaryPopup 
                    data={dictData} 
                    position={popupPos} 
                    onClose={() => setDictData(null)} 
                />
            )}
          </div>
          
          {/* Link gốc */}
          <div className="mt-10 pt-6 border-t border-gray-200 bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">Bạn đang đọc bản Full-Text qua API.</p>
            <a 
              href={selectedArticle.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline font-bold"
            >
              Xem bài gốc tại website The Guardian &rarr;
            </a>
          </div>
        </article>
      </div>
    );
  };

  // --- GIAO DIỆN CHÍNH (MAIN RENDER) ---
  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Navbar />

      {/* ĐIỀU KIỆN: Nếu có bài được chọn -> Hiện bài đó. Nếu không -> Hiện danh sách */}
      {selectedArticle ? (
        renderArticleDetail()
      ) : (
        <main className="container mx-auto p-6">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 pl-3 border-l-8 border-blue-600">
              Tin tức The Guardian (Full Text)
            </h2>
            <p className="text-gray-500 mt-2 pl-3">Double-click vào bất kỳ từ nào để tra nghĩa ngay lập tức.</p>
          </div>

          {/* Hiển thị lỗi nếu có */}
          {error && (
            <div className="text-red-700 bg-red-100 border border-red-300 p-4 rounded mb-8">
                <strong>Lỗi kết nối: </strong> {error}
            </div>
          )}

          {/* Hiển thị Loading hoặc Danh sách */}
          {loading ? (
            <div className="text-center py-20">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600 font-medium">Đang kết nối tới server Anh Quốc...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {news.map((item) => (
                <div key={item.id} 
                  className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer flex flex-col h-full group"
                  onClick={() => setSelectedArticle(item)} // Bấm vào là mở bài báo
                >
                  <div className="h-56 overflow-hidden relative">
                    <img 
                      src={item.urlToImage} 
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      onError={(e) => {e.target.src = 'https://via.placeholder.com/400x200?text=SmartNews'}} 
                    />
                    <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                        {item.source}
                    </div>
                  </div>
                  
                  <div className="p-6 flex flex-col flex-grow">
                    <h3 className="font-bold text-xl text-gray-900 mb-3 leading-snug group-hover:text-blue-700 transition-colors">
                        {item.title}
                    </h3>
                    
                    {/* Tóm tắt ngắn (xóa thẻ HTML trong tóm tắt) */}
                    <div className="text-gray-600 text-sm line-clamp-3 mb-4 flex-grow prose prose-sm"
                       dangerouslySetInnerHTML={{__html: item.summary}} 
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
    </div>
  );
}

export default App;