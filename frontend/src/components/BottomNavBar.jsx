import React from "react";
import { NavLink } from 'react-router-dom';

const NavItem = ({ to, icon, label }) => {
    const commonClasses = "flex flex-col items-center justify-center w-full h-full text-xs transition";
    const activeClasses = "text-green-600 dark:text-green-400 font-bold";
    const inactiveClasses = "text-gray-500 dark:text-gray-400 hover:text-green-500 dark:hover:text-green-300";

    return (
        <NavLink 
            to={to} 
            className={({ isActive }) => `${commonClasses} ${isActive ? activeClasses : inactiveClasses}`}
        >
            {icon}
            <span className="mt-1">{label}</span>
        </NavLink>
    );
};

function BottomNavBar() {
  const iconClasses = "w-6 h-6 mb-1";
  
  const navItems = [
    { to: "/", label: "홈", icon: <svg xmlns="http://www.w3.org/2000/svg" className={iconClasses} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg> },
    { to: "/statistics", label: "통계", icon: <svg xmlns="http://www.w3.org/2000/svg" className={iconClasses} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg> },
    { to: "/mypage", label: "마이", icon: <svg xmlns="http://www.w3.org/2000/svg" className={iconClasses} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> }
  ];

  return (
    <div className="h-16 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-t-lg">
      <div className="max-w-md mx-auto h-full flex justify-around">
        {navItems.map(item => <NavItem key={item.to} {...item} />)}
      </div>
    </div>
  );
}

export default BottomNavBar; 