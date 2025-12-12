import React from 'react';

const Navbar = ({ onNavigate }) => {
  return (
    <nav className="bg-blue-600 text-white p-4 shadow-md sticky top-0 z-50">
      <div className="container mx-auto flex justify-between items-center">
        {/* Logo - Bấm vào thì về trang chủ (home) */}
        <h1 
            className="text-2xl font-bold cursor-pointer hover:text-blue-100 flex items-center gap-2"
            onClick={() => onNavigate('home')}
        >
            <span>📰</span> SmartNews English
        </h1>
        
        <ul className="flex space-x-6 text-sm md:text-base font-medium">
          {/* Menu 1: Đọc báo */}
          <li 
            className="hover:text-blue-200 cursor-pointer transition hover:scale-105 transform duration-200"
            onClick={() => onNavigate('home')}
          >
            Đọc báo
          </li>

          {/* Menu 2: Flashcard (NÚT BẠN ĐANG TÌM Ở ĐÂY) */}
          <li 
            className="hover:text-blue-200 cursor-pointer transition hover:scale-105 transform duration-200 flex items-center gap-1 bg-blue-700 px-3 py-1 rounded-full shadow-sm"
            onClick={() => onNavigate('flashcards')}
          >
            <span>📚</span> Từ vựng của tôi
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;