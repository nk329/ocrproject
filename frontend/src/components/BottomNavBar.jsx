import React from "react";
import { Link, useLocation } from 'react-router-dom';

function NavItem({ icon, label, to }) {
  const location = useLocation();
  const isActive = location.pathname === to;
  const activeClass = isActive ? "text-green-600" : "text-gray-500";
  
  return (
    <Link to={to} className={`flex flex-col items-center justify-center p-2 w-1/3 transition-colors duration-200 hover:bg-gray-100 ${activeClass}`}>
      {icon}
      <span className="text-xs font-medium mt-1">{label}</span>
    </Link>
  );
}

function BottomNavBar() {
  return (
    <div className="w-full bg-white border-t border-gray-200 shadow-t-md">
      <div className="flex justify-around items-center h-16">
        <NavItem
          to="/"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-7 4h6" />
            </svg>
          }
          label="홈"
        />
        <NavItem
          to="/statistics"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          }
          label="통계"
        />
        <NavItem
          to="/mypage"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          }
          label="마이"
        />
      </div>
    </div>
  );
}

export default BottomNavBar; 