import React, { useState } from 'react';

const Navbar = ({ onNavigate }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 shadow-2xl backdrop-blur-md border-b-2 border-blue-500">
      <div className="container-fluid container-max py-4 flex justify-between items-center">
        {/* LOGO */}
        <button
          onClick={() => {
            onNavigate('home');
            setIsOpen(false);
          }}
          className="flex items-center gap-2 group"
        >
          <span className="text-3xl group-hover:animate-bounce-soft transition-transform">📰</span>
          <h1 className="text-2xl font-black text-white group-hover:text-blue-100 transition-colors">
            SmartNews
          </h1>
        </button>

        {/* DESKTOP MENU */}
        <ul className="hidden md:flex space-x-1 items-center">
          <li>
            <button
              onClick={() => onNavigate('home')}
              className="btn btn-sm px-4 py-2 text-white hover:bg-blue-500 rounded-lg transition-all"
            >
              📚 Đọc báo
            </button>
          </li>
          <li>
            <button
              onClick={() => onNavigate('flashcards')}
              className="btn btn-sm px-4 py-2 bg-white text-blue-600 font-bold rounded-lg hover:shadow-lg hover:scale-105 transition-all"
            >
              📚 Từ vựng
            </button>
          </li>
        </ul>

        {/* MOBILE MENU BUTTON */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg bg-blue-500 hover:bg-blue-400 transition-colors"
        >
          <span className="text-2xl text-white">{isOpen ? '✕' : '☰'}</span>
        </button>
      </div>

      {/* MOBILE MENU */}
      {isOpen && (
        <div className="md:hidden bg-gradient-to-b from-blue-700 to-blue-800 border-t border-blue-500 p-4 animate-slide-in-down">
          <div className="space-y-3">
            <button
              onClick={() => {
                onNavigate('home');
                setIsOpen(false);
              }}
              className="w-full btn btn-primary btn-sm justify-start"
            >
              📚 Đọc báo
            </button>
            <button
              onClick={() => {
                onNavigate('flashcards');
                setIsOpen(false);
              }}
              className="w-full btn bg-white text-blue-600 font-bold btn-sm justify-start"
            >
              📚 Từ vựng
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;