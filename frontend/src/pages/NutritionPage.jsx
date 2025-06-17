// src/pages/NutritionPage.jsx
import UploadForm from "../components/UploadForm";
import NutritionAnalysis from "../components/NutritionAnalysis";
import { useState } from "react";

function NutritionPage({ user }) {
  const [image, setImage] = useState(null);
  const [result, setResult] = useState(null);

  const handleSubmit = async () => {
    if (!image) {
      alert("이미지를 선택해주세요.");
      return;
    }

    const formData = new FormData();
    formData.append("image", image);
    formData.append("user_id", user.id); //  사용자 ID를 서버로 전송

    try {
      const res = await fetch("http://localhost:8000/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      console.log("응답 데이터:", data);
      setResult(data);
    } catch (error) {
      console.error("요청 실패:", error);
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
          className="mt-6 w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700"
        >
          분석 요청하기
        </button>
      </div>

      {/* 오른쪽 결과 영역 */}
      <div className="w-full md:w-1/2 p-6 bg-white overflow-y-auto">
        <h2 className="text-xl font-bold mb-4 text-center">영양 분석 결과</h2>
        <NutritionAnalysis result={result} />
      </div>
    </div>
  );
}

export default NutritionPage;
