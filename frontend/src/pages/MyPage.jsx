import React, { useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

function Section({ title, children }) {
  return (
    <div className="mb-8">
      <h2 className="text-lg font-bold text-gray-800 dark:text-gray-300 border-b pb-2 mb-4">{title}</h2>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function SettingItem({ children }) {
  return (
    <div className="flex justify-between items-center p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition">
      {children}
    </div>
  );
}

function MyPage() {
  const { user, handleLogout } = useOutletContext();
  const { theme, setTheme } = useTheme();
  const [profile, setProfile] = useState({
    username: '',
    gender: '',
    ageGroup: '',
    activity_level: '좌식 생활',
    health_goal: '현재 체중 유지',
    profileImage: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!user || !user.id) return;
    setIsLoading(true);
    fetch(`http://localhost:8000/user-status/${user.id}`)
      .then(res => res.json())
      .then(data => {
        if (data) {
          setProfile(prev => ({
            ...prev,
            username: data.username,
            gender: data.gender,
            ageGroup: data.ageGroup,
            activity_level: data.activity_level || '좌식 생활',
            health_goal: data.health_goal || '현재 체중 유지',
            profileImage: data.profile_image || null
          }));
        }
      })
      .finally(() => setIsLoading(false));
  }, [user?.id]);

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Image = reader.result;
        setProfile(prev => ({ ...prev, profileImage: base64Image }));

        try {
          await fetch(`http://localhost:8000/users/${user.id}/profile-image`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ profile_image: base64Image }),
          });
        } catch (error) {
          console.error("이미지 업로드 실패:", error);
          alert("이미지 업로드에 실패했습니다.");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAccountDelete = () => {
    if (window.confirm("정말로 탈퇴하시겠습니까? 모든 데이터가 영구적으로 삭제됩니다.")) {
      fetch(`http://localhost:8000/users/${user.id}`, { method: 'DELETE' })
        .then(res => {
          if (res.ok) {
            alert("회원 탈퇴가 완료되었습니다.");
            handleLogout();
          } else {
            alert("탈퇴 처리 중 오류가 발생했습니다.");
          }
        });
    }
  };

  const handleSettingChange = (e) => {
    const { name, value } = e.target;
    const updatedProfile = { ...profile, [name]: value };
    setProfile(updatedProfile);
    
    fetch(`http://localhost:8000/users/${user.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [name]: value })
    });
  };

  // 스켈레톤 UI 컴포넌트
  const ProfileSkeleton = () => (
    <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-xl shadow p-6 mb-8 animate-pulse">
      <div className="flex items-center gap-5">
        <div className="relative w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-full" />
        <div>
          <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
          <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      </div>
      <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
    </div>
  );

  return (
    <div className="flex-1 p-6 overflow-y-auto bg-gray-100 dark:bg-gray-900">
      <div className="bg-green-600 text-white p-4 shadow flex-shrink-0 flex justify-between items-center -m-6 mb-6">
        <h2 className="text-lg font-bold">마이페이지</h2>
        <button
            onClick={handleLogout}
            className="text-xs font-semibold bg-white/20 hover:bg-white/30 text-white py-1 px-3 rounded-md transition"
        >
            로그아웃
        </button>
      </div>
      {/* --- 프로필 정보 카드 (로딩/실데이터) --- */}
      {isLoading || !profile.username ? (
        <ProfileSkeleton />
      ) : (
        <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-xl shadow p-6 mb-8">
          <div className="flex items-center gap-5">
            {/* 프로필 이미지 */}
            <div className="relative w-20 h-20">
              <img
                src={profile.profileImage || `https://ui-avatars.com/api/?name=${profile.username}&background=random&size=128`}
                alt="프로필"
                className="w-full h-full rounded-full object-cover border-2 border-green-400"
              />
              <button
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
                className="absolute bottom-0 right-0 bg-green-600 text-white rounded-full p-1 border-2 border-white dark:border-gray-800 shadow hover:bg-green-700 transition"
                title="프로필 이미지 변경"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>
              </button>
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                className="hidden"
                onChange={handleImageChange}
              />
            </div>
            {/* 회원 정보 */}
            <div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{profile.username}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {profile.gender} / {profile.ageGroup}대
              </p>
            </div>
          </div>
        </div>
      )}

      {/* --- 기존 기능 섹션 --- */}
      <Section title="회원 프로필 관리">
        <SettingItem>
          <span className="font-semibold text-gray-700 dark:text-gray-200">회원 정보 수정</span>
          <button onClick={() => alert('개발 예정입니다.')} className="text-sm text-green-600 font-bold">수정하기</button>
        </SettingItem>
        <SettingItem>
          <span className="font-semibold text-gray-700 dark:text-gray-200">비밀번호 변경</span>
          <button onClick={() => alert('개발 예정입니다.')} className="text-sm text-green-600 font-bold">변경하기</button>
        </SettingItem>
        <SettingItem>
          <span className="font-semibold text-gray-700 dark:text-gray-200">회원 탈퇴</span>
          <button onClick={handleAccountDelete} className="text-sm text-red-500 font-bold">탈퇴하기</button>
        </SettingItem>
      </Section>

      <Section title="앱 설정 및 개인화">
        <SettingItem>
          <span className="font-semibold text-gray-700 dark:text-gray-200">활동 수준 설정</span>
          <select name="activity_level" value={profile.activity_level} onChange={handleSettingChange} className="text-sm border-gray-300 rounded-md bg-white dark:bg-gray-700 dark:text-white dark:border-gray-600">
            <option>좌식 생활</option>
            <option>가벼운 활동</option>
            <option>활발한 활동</option>
          </select>
        </SettingItem>
        <SettingItem>
          <span className="font-semibold text-gray-700 dark:text-gray-200">건강 목표 설정</span>
           <select name="health_goal" value={profile.health_goal} onChange={handleSettingChange} className="text-sm border-gray-300 rounded-md bg-white dark:bg-gray-700 dark:text-white dark:border-gray-600">
            <option>체중 감량</option>
            <option>근력 증가</option>
            <option>현재 체중 유지</option>
          </select>
        </SettingItem>
         <SettingItem>
          <span className="font-semibold text-gray-700 dark:text-gray-200">알림 설정</span>
          <button onClick={() => alert('개발 예정입니다.')} className="text-sm text-green-600 font-bold">설정</button>
        </SettingItem>
        <SettingItem>
          <span className="font-semibold text-gray-700 dark:text-gray-200">테마 설정</span>
          <div className="flex items-center gap-2 text-sm">
              <button onClick={() => setTheme('light')} className={theme === 'light' ? 'font-bold text-green-600' : 'text-gray-400 dark:text-gray-500'}>라이트</button>
              <span className="text-gray-300 dark:text-gray-600">/</span>
              <button onClick={() => setTheme('dark')} className={theme === 'dark' ? 'font-bold text-green-600' : 'text-gray-400 dark:text-gray-500'}>다크</button>
          </div>
        </SettingItem>
      </Section>
    </div>
  );
}

export default MyPage; 