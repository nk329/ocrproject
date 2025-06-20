import React, { useState, useEffect } from 'react';

function EditNutrientsModal({ isOpen, onClose, ocrData, onSubmit }) {
  const [nutrients, setNutrients] = useState([]);

  useEffect(() => {
    // 부모로부터 받은 ocrData로 상태 초기화
    if (ocrData) {
      setNutrients(ocrData);
    }
  }, [ocrData]);

  if (!isOpen) return null;

  const handleValueChange = (index, value) => {
    const updatedNutrients = [...nutrients];
    // 사용자가 음수나 숫자가 아닌 값을 입력하지 못하도록 방지
    updatedNutrients[index].value = Math.max(0, parseFloat(value) || 0);
    setNutrients(updatedNutrients);
  };

  const handleSubmit = () => {
    onSubmit(nutrients);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md m-4">
        <div className="p-4 border-b dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200">영양 정보 확인 및 수정</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">OCR 분석 결과를 확인하고, 필요하다면 값을 수정해주세요.</p>
        </div>
        <div className="p-4 max-h-[60vh] overflow-y-auto">
          <div className="space-y-4">
            {nutrients.map((n, index) => (
              <div key={n.name} className="flex items-center justify-between">
                <label className="font-semibold text-gray-700 dark:text-gray-300 w-1/3">{n.name} ({n.unit})</label>
                <input
                  type="number"
                  value={n.value}
                  onChange={(e) => handleValueChange(index, e.target.value)}
                  className="w-2/3 p-2 border rounded-md dark:bg-gray-700 dark:text-white dark:border-gray-600"
                />
              </div>
            ))}
          </div>
        </div>
        <div className="p-4 border-t dark:border-gray-700 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300">취소</button>
          <button onClick={handleSubmit} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">입력 완료</button>
        </div>
      </div>
    </div>
  );
}

export default EditNutrientsModal; 