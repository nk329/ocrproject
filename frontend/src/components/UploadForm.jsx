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
      <label className="block text-lg font-semibold mb-2">식품 라벨 이미지 업로드</label>

      <div className="w-full h-48 border-2 border-dashed border-gray-400 flex items-center justify-center bg-white rounded-md mb-2">
        {preview ? (
          <img src={preview} alt="Preview" className="h-full object-contain" />
        ) : (
          <span className="text-gray-400">이미지를 선택하세요</span>
        )}
      </div>

      <input
        type="file"
        accept="image/*"
        onChange={handleImageChange}
        className="w-full text-sm text-gray-700 file:mr-4 file:py-1 file:px-4 file:border file:rounded-md file:bg-gray-200 hover:file:bg-gray-300"
      />
    </div>
  );
}

export default UploadForm;
