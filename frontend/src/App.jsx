// App.jsx
import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import NutritionPage from "./pages/NutritionPage";
import LoginRegisterPage from "./pages/LoginRegisterPage";
import { motion, AnimatePresence } from "framer-motion";

function App() {
  const [user, setUser] = useState(null);
  const [isAuthChecked, setIsAuthChecked] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
  };

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsAuthChecked(true);
  }, []);

  if (!isAuthChecked) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <Router>
      <div className={`relative min-h-screen bg-[#f5f5f5] flex justify-center overflow-hidden ${user ? 'items-start' : 'items-center py-4 lg:py-8'}`}>

        {/*  콘텐츠 */}
        <AnimatePresence mode="wait">
          <Routes>
            {!user ? (
              <>
                <Route path="/auth" element={<LoginRegisterPage setUser={setUser} />} />
                <Route path="*" element={<Navigate to="/auth" />} />
              </>
            ) : (
              <Route path="/*" element={<NutritionPage user={user} handleLogout={handleLogout} />} />
            )}
          </Routes>
        </AnimatePresence>
      </div>
    </Router>
  );
}

export default App;
