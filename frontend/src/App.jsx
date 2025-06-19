// App.jsx
import { useState,useEffect } from "react";
import NutritionPage from "./pages/NutritionPage";
import LoginRegisterPage from "./pages/LoginRegisterPage";
import { motion, AnimatePresence } from "framer-motion";

function App() {
  const [user, setUser] = useState(null);
  
  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
  };
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);
 



  return (
    <div className="relative min-h-screen bg-black flex justify-center items-start py-8 overflow-hidden">
      {/*  배경 이미지 */}
      {user && (
        <>
          <div
            className="absolute inset-0 bg-cover bg-center z-0"
            style={{
              backgroundImage: "url('/images/bg.png')",
            }}
          />
          <div className="absolute inset-0 bg-black/40 z-0" />  
        </>
      )}

      {/*  콘텐츠 */}
      <AnimatePresence mode="wait">
        {!user ? (
          <motion.div
            key="auth"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-2xl z-10"
          >
            <LoginRegisterPage setUser={setUser} />
          </motion.div>
        ) : (
          <motion.div
            key="main"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-6xl z-10"
          >
            <NutritionPage user={user} handleLogout={handleLogout} />
            
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
