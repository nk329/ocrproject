import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';

function EditProfileModal({ isOpen, onClose, profile, onUpdate }) {
  const { theme } = useTheme();
  const [formData, setFormData] = useState({
    username: '',
    gender: '',
    ageGroup: '',
    activity_level: '좌식 생활',
    health_goal: '현재 체중 유지'
  });
  const [isLoading, setIsLoading] = useState(false);

  // 모달이 열릴 때마다 최신 profile 데이터로 폼 업데이트
  useEffect(() => {
    if (isOpen && profile) {
      setFormData({
        username: profile.username || '',
        gender: profile.gender || '',
        ageGroup: profile.ageGroup || '',
        activity_level: profile.activity_level || '좌식 생활',
        health_goal: profile.health_goal || '현재 체중 유지'
      });
    }
  }, [isOpen, profile]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // 백엔드 API와 일치하도록 데이터 변환
      const requestData = {
        username: formData.username,
        gender: formData.gender === '남성' ? 'male' : 'female',
        age_group: formData.ageGroup.replace('대', ''),
        activity_level: formData.activity_level,
        health_goal: formData.health_goal
      };

      const response = await fetch(`http://localhost:8000/users/${profile.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });

      if (response.ok) {
        // 프론트엔드 상태 업데이트를 위해 원래 형식으로 변환
        const updatedData = {
          username: formData.username,
          gender: formData.gender,
          ageGroup: formData.ageGroup,
          activity_level: formData.activity_level,
          health_goal: formData.health_goal
        };
        onUpdate(updatedData);
        onClose();
        alert('회원 정보가 성공적으로 수정되었습니다.');
      } else {
        const errorData = await response.json();
        alert(`수정 실패: ${errorData.detail || '알 수 없는 오류가 발생했습니다.'}`);
      }
    } catch (error) {
      console.error('회원 정보 수정 오류:', error);
      alert('회원 정보 수정 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
        {/* 헤더 */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold">회원 정보 수정</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* 사용자명 */}
          <div>
            <label className="block text-sm font-medium mb-2">사용자명</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            />
          </div>

          {/* 성별 */}
          <div>
            <label className="block text-sm font-medium mb-2">성별</label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            >
              <option value="">선택하세요</option>
              <option value="남성">남성</option>
              <option value="여성">여성</option>
            </select>
          </div>

          {/* 연령대 */}
          <div>
            <label className="block text-sm font-medium mb-2">연령대</label>
            <select
              name="ageGroup"
              value={formData.ageGroup}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            >
              <option value="">선택하세요</option>
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="30">30</option>
              <option value="40">40</option>
              <option value="50">50</option>
              <option value="60 이상">60 이상</option>
            </select>
          </div>

          {/* 활동 수준 */}
          <div>
            <label className="block text-sm font-medium mb-2">활동 수준</label>
            <select
              name="activity_level"
              value={formData.activity_level}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="좌식 생활">좌식 생활</option>
              <option value="가벼운 활동">가벼운 활동</option>
              <option value="활발한 활동">활발한 활동</option>
            </select>
          </div>

          {/* 건강 목표 */}
          <div>
            <label className="block text-sm font-medium mb-2">건강 목표</label>
            <select
              name="health_goal"
              value={formData.health_goal}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="체중 감량">체중 감량</option>
              <option value="근력 증가">근력 증가</option>
              <option value="현재 체중 유지">현재 체중 유지</option>
            </select>
          </div>

          {/* 버튼 */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {isLoading ? '수정 중...' : '수정하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditProfileModal; 