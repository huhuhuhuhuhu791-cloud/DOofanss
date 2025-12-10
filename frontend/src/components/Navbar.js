// src/components/Navbar.js
import React from 'react';

const Navbar = () => {
  return (
    <nav className="bg-blue-600 text-white p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-2xl font-bold">SmartNews English</h1>
        <ul className="flex space-x-4">
          <li className="hover:underline cursor-pointer">Trang chủ</li>
          <li className="hover:underline cursor-pointer">Từ vựng</li>
          <li className="hover:underline cursor-pointer">Dịch</li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;