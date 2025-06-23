// src/pages/NutritionPage.jsx
import UploadForm from "../components/UploadForm";
import { useState, useEffect } from "react";
import NutrientBars from "../components/NutrientBars";
import RightPanel from "../components/RightPanel";
import EditNutrientsModal from "../components/EditNutrientsModal";

function NutritionPage({ user, handleLogout }) {
  const [image, setImage] = useState(null);
  const [result, setResult] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [ocrResult, setOcrResult] = useState(null);

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
      const res = await fetch("http://localhost:8000/upload", {
        method: "POST",
        body: formData,
      });

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

  const isLoading = isInitialLoading || isSubmitting;

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
        body: JSON.stringify({
          user_id: user.id,
          question: question,
          history: messages,
        }),
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

  return (
    <>
      <div className="min-h-screen lg:h-screen w-full flex flex-col lg:flex-row overflow-hidden">
        {/* 왼쪽 입력 영역 */}
        <div className="w-full lg:w-1/2 p-4 lg:p-6 overflow-y-auto bg-transparent no-scrollbar">
          <h1 className="text-2xl lg:text-3xl font-extrabold text-green-600 mb-6 lg:mb-8 text-center">
            DailyValue
          </h1>
          <NutrientBars nutrients={result?.nutrients} />
        </div>

        {/* 오른쪽 결과 영역 */}
        <RightPanel 
          user={user}
          result={result}
          messages={messages}
          onAskAI={handleAskAI}
          handleLogout={handleLogout}
          isInitialLoading={isInitialLoading}
          onImageSelect={setImage}
          handleSubmit={handleAnalysis}
          isLoading={isLoading}
          isSubmitting={isSubmitting}
          image={image}
          isModalOpen={isModalOpen}
          setIsModalOpen={setIsModalOpen}
          ocrResult={ocrResult}
          handleFinalSubmit={handleFinalSubmit}
        />
      </div>
    </>
  );
}

export default NutritionPage;