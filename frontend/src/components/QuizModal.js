import React, { useState } from 'react';

const QuizModal = ({ quizData, onClose }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [showScore, setShowScore] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null); // null, true, false

  const handleAnswerClick = (option) => {
    if (selectedOption) return; // Không cho chọn lại

    setSelectedOption(option);
    const correct = option === quizData[currentQuestion].answer;
    setIsCorrect(correct);

    if (correct) {
      setScore(score + 1);
    }

    // Tự động chuyển câu sau 1.5 giây
    setTimeout(() => {
      const nextQuestion = currentQuestion + 1;
      if (nextQuestion < quizData.length) {
        setCurrentQuestion(nextQuestion);
        setSelectedOption(null);
        setIsCorrect(null);
      } else {
        setShowScore(true);
      }
    }, 1500);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-xl shadow-2xl max-w-lg w-full m-4">
        
        {/* HEADER */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-blue-800">Review Quiz</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500 font-bold text-xl">&times;</button>
        </div>

        {showScore ? (
          // MÀN HÌNH KẾT QUẢ
          <div className="text-center py-8">
            <div className="text-6xl mb-4">🏆</div>
            <h3 className="text-2xl font-bold text-gray-800">Hoàn thành!</h3>
            <p className="text-lg mt-2">Bạn trả lời đúng <span className="text-green-600 font-bold">{score} / {quizData.length}</span> câu.</p>
            <button 
              onClick={onClose}
              className="mt-6 bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700 transition"
            >
              Đóng
            </button>
          </div>
        ) : (
          // MÀN HÌNH CÂU HỎI
          <div>
            <div className="mb-4">
              <span className="text-sm text-gray-500">Câu hỏi {currentQuestion + 1}/{quizData.length}</span>
              <h3 className="text-lg font-semibold mt-1">{quizData[currentQuestion].question}</h3>
            </div>

            <div className="space-y-3">
              {quizData[currentQuestion].options.map((option, index) => {
                // Xử lý màu sắc nút bấm
                let btnClass = "w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition";
                if (selectedOption === option) {
                    btnClass = isCorrect 
                        ? "w-full text-left p-3 rounded-lg bg-green-100 border-green-500 text-green-800 font-bold" // Đúng
                        : "w-full text-left p-3 rounded-lg bg-red-100 border-red-500 text-red-800"; // Sai
                }

                return (
                  <button 
                    key={index} 
                    onClick={() => handleAnswerClick(option)}
                    className={btnClass}
                    disabled={selectedOption !== null}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
            
            {/* Thông báo đúng sai */}
            {selectedOption && (
                <div className={`mt-4 text-center text-sm font-bold ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                    {isCorrect ? "🎉 Chính xác!" : `❌ Sai rồi! Đáp án là: ${quizData[currentQuestion].answer}`}
                </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizModal;