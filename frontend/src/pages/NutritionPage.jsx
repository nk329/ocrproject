// src/pages/NutritionPage.jsx

import UploadForm from "../components/UploadForm";
import ProfileSelector from "../components/ProfileSelector";
import NutritionAnalysis from "../components/NutritionAnalysis";
import { useState } from "react";

function NutritionPage() {
  const [image, setImage] = useState(null);
  const [userProfile, setUserProfile] = useState({ gender: "", ageGroup: "" });
  const [result, setResult] = useState(null);

   // 🔹 분석 요청 함수 추가
   const handleSubmit = async () => {
    if (!image || !userProfile.gender || !userProfile.ageGroup) {
      alert("모든 정보를 입력하세요.");
      return;
    }

    const formData = new FormData();
    formData.append("image", image);
    formData.append("gender", userProfile.gender);
    formData.append("ageGroup", userProfile.ageGroup);

    console.log("업로드 요청 시작:", image.name, userProfile);

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
        <h2 className="text-xl font-bold mb-4 text-center">사진 업로드 & 사용자 입력</h2>
        <UploadForm onImageSelect={setImage} />
        <div className="mt-6">
          <ProfileSelector onProfileChange={setUserProfile} />
        </div>

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
