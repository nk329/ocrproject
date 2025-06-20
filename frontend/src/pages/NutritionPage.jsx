// src/pages/NutritionPage.jsx
import UploadForm from "../components/UploadForm";
import NutritionAnalysis from "../components/NutritionAnalysis";
import { useState } from "react";
import NutrientBars from "../components/NutrientBars";

function NutritionPage({user, setUser, handleLogout  }) {
  const [image, setImage] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false); //로딩바

  const handleSubmit = async () => {
    if (!image) {
      alert("이미지를 선택해주세요.");
      return;
    }   
  
    const formData = new FormData();
    formData.append("image", image);
    formData.append("user_id", user.id);
  
    setLoading(true); //  로딩 시작
  
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
      setLoading(false); // 로딩 종료
    }
  };
  

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row">
      {/* 왼쪽 입력 영역 */}
      <div className="w-full lg:w-1/2 p-4 lg:p-6 flex-shrink-0 bg-transparent">
        {/* 앱 이름 */}
        <h1 className="text-2xl lg:text-3xl font-extrabold text-green-600 mb-6 lg:mb-8 text-center">DailyValue</h1>

        <UploadForm onImageSelect={setImage} />

        <button
          onClick={handleSubmit}
          disabled={loading}
          className={`mt-6 w-full py-2 px-4 font-semibold rounded-md transition ${
            loading
              ? "bg-gray-400 cursor-not-allowed text-white"
              : "bg-green-600 text-white hover:bg-green-700"
          }`}
        >
          {loading ? "분석 중..." : "분석 요청하기"}
        </button>
        
        {result && (
          <div className="flex flex-col gap-1 p-4 mb-4 bg-gray-100 rounded-lg shadow-sm text-sm text-gray-800">
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 15c2.362 0 4.578.57 6.879 1.804M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <p className="space-x-1">
                <span className="font-semibold">{result.username}</span>님 /
                <span className="text-gray-700">{result.gender}</span> /
                <span className="text-gray-700">{result.ageGroup}대</span>
              </p>
            </div>

            {/* 로그아웃 버튼 */}
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
        {/* 하루 누적 퍼센트 바 */}
        {result && <NutrientBars nutrients={result.nutrients} />}
      </div>

      {/* 오른쪽 결과 영역 */}
      <div className="w-full lg:w-1/2 p-4 lg:p-6 bg-white shadow-xl lg:rounded-l-xl overflow-y-auto min-h-0 flex-1">
        <h2 className="text-lg lg:text-xl font-bold text-white text-center bg-green-600 py-3 rounded-t-md shadow mb-4">
          영양 분석 결과
        </h2>

        {loading ? (
          <div className="flex flex-col items-center mt-10">
            <div className="animate-spin h-12 w-12 border-4 border-green-500 border-t-transparent rounded-full" />
            <p className="mt-4 text-gray-500">분석 중입니다. 잠시만 기다려주세요...</p>
          </div>
        ) : (
          <NutritionAnalysis result={result} handleLogout={handleLogout} />
          
        )}
      </div>
    </div>
  );
}

export default NutritionPage;