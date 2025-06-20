// src/components/UploadForm.jsx
import React, { useState } from "react";

function UploadForm({ onImageSelect }) {
  const [preview, setPreview] = useState(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const imageUrl = URL.createObjectURL(file);
    setPreview(imageUrl);
    onImageSelect(file); // 부모로 전달
  };

  return (
    <div className="w-full">
      {/* <label className="block text-lg font-semibold mb-2">식품 라벨 이미지 업로드</label> */}
  
      {/* 클릭 가능한 박스 */}
      <label
        htmlFor="image-upload"
        className="w-full h-40 sm:h-48 cursor-pointer border-2 border-dashed border-purple-400 flex items-center justify-center bg-white rounded-xl mb-4"
      >
        {preview ? (
          <img src={preview} alt="미리보기" className="h-full w-full object-contain rounded-lg" />
        ) : (
          <div className="flex flex-col items-center text-purple-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 sm:h-8 sm:w-8 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="font-medium text-sm sm:text-base">이곳에 이미지 업로드</span>
          </div>
        )}
      </label>
  
      {/* 실제 파일 선택 input (숨김 처리) */}
      <input
        id="image-upload"
        type="file"
        accept="image/*"
        onChange={handleImageChange}
        className="hidden"
      />
    </div>
  );
  
}

export default UploadForm;
