// App.jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginRegisterPage from "./pages/LoginRegisterPage";
import StatisticsPage from './pages/StatisticsPage';
import MyPage from './pages/MyPage';
import { ThemeProvider } from './contexts/ThemeContext';
import { AnimatePresence } from "framer-motion";
import SharedLayout from './components/SharedLayout';
import HomePage from './pages/HomePage';

function App() {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

  const handleLogout = () => {
    setUser(null);
  };

  return (
    <ThemeProvider>
      <Router>
        <AnimatePresence mode="wait">
          <Routes>
            {!user ? (
              <>
                <Route path="/auth" element={<LoginRegisterPage setUser={setUser} />} />
                <Route path="*" element={<Navigate to="/auth" />} />
              </>
            ) : (
              <Route element={<SharedLayout user={user} handleLogout={handleLogout} />}>
                <Route index element={<HomePage />} />
                <Route path="/statistics" element={<StatisticsPage user={user} />} />
                <Route path="/mypage" element={<MyPage user={user} handleLogout={handleLogout} />} />
                <Route path="*" element={<Navigate to="/" />} />
              </Route>
            )}
          </Routes>
        </AnimatePresence>
      </Router>
    </ThemeProvider>
  );
}

export default App;
