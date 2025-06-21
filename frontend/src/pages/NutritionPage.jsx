// src/pages/NutritionPage.jsx
import UploadForm from "../components/UploadForm";
import NutritionAnalysis from "../components/NutritionAnalysis";
import { useState, useEffect } from "react";
import NutrientBars from "../components/NutrientBars";

function NutritionPage({ user, handleLogout }) {
  const [image, setImage] = useState(null);
  const [result, setResult] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [messages, setMessages] = useState([]);

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

  const handleSubmit = async () => {
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
      setResult(data);
    } catch (error) {
      console.error("요청 실패:", error);
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
    <div className="min-h-screen w-full flex flex-col lg:flex-row">
      {/* 왼쪽 입력 영역 */}
      <div className="w-full lg:w-1/2 p-4 lg:p-6 flex-shrink-0 bg-transparent">
        <h1 className="text-2xl lg:text-3xl font-extrabold text-green-600 mb-6 lg:mb-8 text-center">
          DailyValue
        </h1>

        <UploadForm onImageSelect={setImage} />

        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className={`mt-6 w-full py-2 px-4 font-semibold rounded-md transition ${
            isLoading
              ? "bg-gray-400 cursor-not-allowed text-white"
              : "bg-green-600 text-white hover:bg-green-700"
          }`}
        >
          {isSubmitting ? "분석 중..." : "분석 요청하기"}
        </button>

        {result && (
          <div className="flex flex-col gap-1 p-4 mt-4 bg-gray-100 rounded-lg shadow-sm text-sm text-gray-800">
            <div className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5 text-purple-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5.121 17.804A13.937 13.937 0 0112 15c2.362 0 4.578.57 6.879 1.804M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <p className="space-x-1">
                <span className="font-semibold">{result.username}</span>님 /
                <span className="text-gray-700">{result.gender}</span> /
                <span className="text-gray-700">{result.ageGroup}대</span>
              </p>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleLogout}
                className="text-xs text-gray-500 hover:text-red-500 underline"
              >
                로그아웃
              </button>
            </div>
          </div>
        )}
        <NutrientBars nutrients={result?.nutrients} />
      </div>

      {/* 오른쪽 결과 영역 */}
      <div className="w-full lg:w-1/2 p-4 lg:p-6 bg-white shadow-xl lg:rounded-l-xl overflow-y-auto min-h-0 flex-1">
        <h2 className="text-lg lg:text-xl font-bold text-white text-center bg-green-600 py-3 rounded-t-md shadow mb-4">
          영양 분석 결과
        </h2>
        {isInitialLoading ? (
          <div className="flex flex-col items-center mt-10">
            <div className="animate-spin h-12 w-12 border-4 border-green-500 border-t-transparent rounded-full" />
            <p className="mt-4 text-gray-500">데이터를 불러오는 중입니다...</p>
          </div>
        ) : (
          <NutritionAnalysis
            result={result}
            messages={messages}
            onAskAI={handleAskAI}
          />
        )}
      </div>
    </div>
  );
}

export default NutritionPage;