// src/components/UploadForm.jsx
import React, { useState, useEffect } from "react";

function UploadForm({ image, onImageSelect }) {
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    if (image) {
      const imageUrl = URL.createObjectURL(image);
      setPreview(imageUrl);
      
      // 메모리 누수 방지를 위한 클린업 함수
      return () => URL.revokeObjectURL(imageUrl);
    } else {
      setPreview(null);
    }
  }, [image]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    onImageSelect(file); // 부모로 파일 전달 (상태 변경 트리거)
  };

  return (
    <div className="w-full">
      {/* <label className="block text-lg font-semibold mb-2">식품 라벨 이미지 업로드</label> */}
  
      {/* 클릭 가능한 박스 */}
      <label
        htmlFor="image-upload"
        className="relative w-full h-40 sm:h-48 cursor-pointer border-2 border-dashed border-purple-400 flex items-center justify-center bg-gray-200 rounded-xl mb-4 overflow-hidden"
      >
        {preview ? (
          <img src={preview} alt="미리보기" className="h-full w-full object-contain rounded-lg" />
        ) : (
          <>
            <div
              className="absolute inset-0 bg-cover bg-center z-0"
              style={{ backgroundImage: "url('/images/bg.png')" }}
            />
            <div className="absolute inset-0 bg-black/50 z-10" />
            <div className="relative z-20 flex flex-col items-center text-white/90">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 sm:h-8 sm:w-8 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="font-medium text-sm sm:text-base">이곳에 이미지 업로드</span>
            </div>
          </>
        )}
      </label>
  
      {/* 실제 파일 선택 input (숨김 처리) */}
      <input
        id="image-upload"
        type="file"
        accept="image/*"
        onChange={handleImageChange}
        className="hidden"
        // 파일 선택창을 다시 열 때 동일한 파일을 선택할 수 있도록 value를 초기화
        onClick={(e) => (e.target.value = null)}
      />
    </div>
  );
  
}

export default UploadForm;
