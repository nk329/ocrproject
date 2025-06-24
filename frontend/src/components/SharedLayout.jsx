import { useState, useEffect } from "react";
import { Outlet } from 'react-router-dom';
import NutrientBars from "./NutrientBars";
import BottomNavBar from './BottomNavBar';
import ChatModal from "./ChatModal";
import EditNutrientsModal from "./EditNutrientsModal";

function SharedLayout({ user, handleLogout }) {
  const [image, setImage] = useState(null);
  const [result, setResult] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [ocrResult, setOcrResult] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    const fetchInitialData = async () => {
      if (!user?.id) {
        setIsInitialLoading(false);
        return;
      }
      try {
        const response = await fetch(`http://localhost:8000/user-status/${user.id}`);
        if (response.ok) {
          const data = await response.json();
          setResult(data);
          if (data.ai_feedback) {
            setMessages([{ role: "assistant", content: data.ai_feedback }]);
          }
        } else {
          console.error("사용자 데이터를 가져오는데 실패했습니다.");
          setResult(null);
        }
      } catch (error) {
        console.error("초기 데이터 로딩 중 오류 발생:", error);
        setResult(null);
      } finally {
        setIsInitialLoading(false);
      }
    };
    fetchInitialData();
  }, [user]);

  const handleAnalysis = async () => {
    if (!image) {
      alert("이미지를 선택해주세요.");
      return;
    }
    const formData = new FormData();
    formData.append("image", image);
    formData.append("user_id", user.id);
    setIsSubmitting(true);
    try {
      const res = await fetch("http://localhost:8000/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.ocr_nutrients) {
        setOcrResult(data.ocr_nutrients);
        setIsModalOpen(true);
      }
    } catch (error) {
      console.error("요청 실패:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinalSubmit = async (finalNutrients) => {
    setIsSubmitting(true);
    try {
      const res = await fetch("http://localhost:8000/add-nutrients", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: String(user.id), nutrients: finalNutrients }),
      });
      const data = await res.json();
      setResult(data);
      if (data.ai_feedback) {
        setMessages(prev => [...prev, { role: "assistant", content: data.ai_feedback }]);
      }
      setImage(null);
    } catch (error) {
      console.error("최종 제출 실패:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAskAI = async (question) => {
    if (!question.trim()) return;
    const userMessage = { role: "user", content: question };
    setMessages(prev => [...prev, userMessage]);
    try {
      const aiThinkingMessage = { role: "assistant", content: "...", isTyping: true };
      setMessages(prev => [...prev, aiThinkingMessage]);
      const response = await fetch("http://localhost:8000/ask-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, question, history: messages }),
      });
      if (!response.ok) throw new Error("AI 응답 생성 실패");
      const data = await response.json();
      setMessages(prev => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = { role: "assistant", content: data.answer };
        return newMessages;
      });
    } catch (error) {
      console.error(error);
      const errorMessage = { role: "assistant", content: "죄송해요, 답변을 생성하는 데 문제가 발생했어요." };
      setMessages(prev => {
         const newMessages = [...prev];
        newMessages[newMessages.length - 1] = errorMessage;
        return newMessages;
      });
    }
  };
  
  const isLoading = isInitialLoading || isSubmitting;

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900 font-sans">
      <div className="hidden lg:flex flex-col lg:w-1/2 bg-[#f5f5f5] dark:bg-[#0d1b2a] p-6">
          <h1 className="text-2xl lg:text-3xl font-extrabold text-green-600 dark:text-green-400 mb-6 lg:mb-8 text-center">
              DailyValue
          </h1>
          <NutrientBars nutrients={result?.nutrients} />
      </div>
      
      <div className="w-full lg:w-1/2 flex flex-col relative bg-white dark:bg-gray-900 shadow-xl">
        <main className="flex-1 overflow-y-auto no-scrollbar">
          <Outlet context={{ 
            user, result, messages, handleLogout, isInitialLoading, isLoading, isSubmitting,
            image, onImageSelect: setImage, handleSubmit: handleAnalysis,
            isModalOpen, setIsModalOpen, ocrResult, handleFinalSubmit,
            isChatOpen, setIsChatOpen, onAskAI: handleAskAI
          }} />
        </main>
        
        <div className="flex-shrink-0">
            <BottomNavBar />
        </div>

        <ChatModal 
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          messages={messages}
          onAskAI={handleAskAI}
        />
        <EditNutrientsModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          ocrData={ocrResult}
          onSubmit={handleFinalSubmit}
        />
      </div>
    </div>
  );
}

export default SharedLayout; 