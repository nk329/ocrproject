// src/pages/NutritionPage.jsx
import UploadForm from "../components/UploadForm";
import NutritionAnalysis from "../components/NutritionAnalysis";
import { useState } from "react";

function NutritionPage({ user }) {
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
    <div className="flex flex-col md:flex-row w-full h-screen">
      {/* 왼쪽 입력 영역 */}
      <div className="w-full md:w-1/2 p-6 bg-gray-100 border-r overflow-y-auto">
        <h2 className="text-xl font-bold mb-4 text-center">사진 업로드</h2>
        <UploadForm onImageSelect={setImage} />
        <button
          onClick={handleSubmit}
          disabled={loading}
          className={`mt-6 w-full py-2 px-4 font-semibold rounded-md ${
            loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-blue-700"
             }`}>
          {loading ? "분석 중..." : "분석 요청하기"}
        </button>
      </div>

      {/* 오른쪽 결과 영역 */}
      <div className="w-full md:w-1/2 p-6 bg-white overflow-y-auto">
        <h2 className="text-xl font-bold mb-4 text-center">영양 분석 결과</h2>

        {loading ? (
          <div className="flex flex-col items-center mt-10">
            <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full" />
            <p className="mt-4 text-gray-500">분석 중입니다. 잠시만 기다려주세요...</p>
          </div>
        ) : (
          <NutritionAnalysis result={result} />
        )}
      </div>
    </div>   
  );
}

export default NutritionPage;
