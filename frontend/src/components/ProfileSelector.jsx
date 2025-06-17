// src/components/ProfileSelector.jsx
import React, { useState } from "react";

function ProfileSelector({ onProfileChange }) {
  const [gender, setGender] = useState("");
  const [ageGroup, setAgeGroup] = useState("");

  const handleChange = (field, value) => {
    if (field === "gender") setGender(value);
    if (field === "ageGroup") setAgeGroup(value);

    onProfileChange({
      gender: field === "gender" ? value : gender,
      ageGroup: field === "ageGroup" ? value : ageGroup,
    });
  };

  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold mb-4">👤 사용자 정보 입력</h3>

      {/* 성별 선택 */}
      <div className="mb-4">
        <label className="block mb-2 text-sm font-medium text-gray-700">성별</label>
        <div className="flex gap-6">
          <label className="inline-flex items-center">
            <input
              type="radio"
              name="gender"
              value="남성"
              checked={gender === "남성"}
              onChange={(e) => handleChange("gender", e.target.value)}
              className="form-radio text-blue-600"
            />
            <span className="ml-2">남성</span>
          </label>

          <label className="inline-flex items-center">
            <input
              type="radio"
              name="gender"
              value="여성"
              checked={gender === "여성"}
              onChange={(e) => handleChange("gender", e.target.value)}
              className="form-radio text-pink-600"
            />
            <span className="ml-2">여성</span>
          </label>
        </div>
      </div>

      {/* 나이 선택 */}
      <div>
        <label className="block mb-2 text-sm font-medium text-gray-700">나이</label>
        <select
          value={ageGroup}
          onChange={(e) => handleChange("ageGroup", e.target.value)}
          className="w-full border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <option value="">나이대를 선택하세요</option>
          <option value="10대">10대</option>
          <option value="20대">20대</option>
          <option value="30대">30대</option>
          <option value="40대">40대</option>
          <option value="50대">50대</option>
          <option value="60대 이상">60대 이상</option>
        </select>
      </div>
    </div>
  );
}

export default ProfileSelector;
