import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import NutritionAnalysis from './NutritionAnalysis';
import StatisticsPage from '../pages/StatisticsPage';
import MyPage from '../pages/MyPage';
import BottomNavBar from './BottomNavBar';
import ChatModal from './ChatModal';
import UploadForm from './UploadForm';
import EditNutrientsModal from './EditNutrientsModal';

function RightPanel({ 
  user, result, messages, onAskAI, handleLogout, isInitialLoading,
  onImageSelect, handleSubmit, isLoading, isSubmitting,
  image,
  isModalOpen, ocrResult, handleFinalSubmit, setIsModalOpen
}) {
  const [isChatOpen, setIsChatOpen] = useState(false);

  const Header = ({ title }) => (
     <div className="bg-green-600 text-white p-4 shadow flex-shrink-0 flex justify-between items-center">
        <h2 className="text-lg font-bold">{title}</h2>
         { title !== "영양 분석 결과" && 
            <button
                onClick={handleLogout}
                className="text-xs font-semibold bg-white/20 hover:bg-white/30 text-white py-1 px-3 rounded-md transition"
            >
                로그아웃
            </button>
         }
    </div>
  );

  return (
    <div className="w-full lg:w-1/2 bg-white shadow-xl flex flex-col overflow-hidden relative">
        <Routes>
            <Route path="/" element={
                <>
                    {/* 홈 화면 헤더 */}
                    <div className="bg-green-600 text-white p-4 shadow flex-shrink-0 flex justify-between items-center">
                        {result ? (
                            <div className="flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 15c2.362 0 4.578.57 6.879 1.804M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                <div className="text-sm">
                                    <span className="font-bold">{result.username}</span>님
                                    <span className="text-xs text-green-200 ml-2">({result.gender} / {result.ageGroup}대)</span>
                                </div>
                            </div>
                        ) : <h2 className="text-lg font-bold">영양 분석 결과</h2>}
                        <button onClick={handleLogout} className="text-xs font-semibold bg-white/20 hover:bg-white/30 text-white py-1 px-3 rounded-md transition">로그아웃</button>
                    </div>

                    {/* 홈 화면 콘텐츠 */}
                    <div className="flex-1 p-4 lg:p-6 flex flex-col overflow-y-auto no-scrollbar">
                        <UploadForm image={image} onImageSelect={onImageSelect} />
                        <button
                            onClick={handleSubmit}
                            disabled={!image || isLoading}
                            className={`mt-6 w-full py-2 px-4 font-semibold rounded-md transition ${
                                (!image || isLoading)
                                    ? "bg-gray-400 cursor-not-allowed text-white"
                                    : "bg-green-600 text-white hover:bg-green-700"
                            }`}
                        >
                            {isSubmitting ? "분석 중..." : "분석 요청하기"}
                        </button>

                        <hr className="my-6 border-gray-200" />
                        
                        {isInitialLoading ? (
                            <div className="m-auto flex flex-col items-center"><div className="animate-spin h-12 w-12 border-4 border-green-500 border-t-transparent rounded-full" /><p className="mt-4 text-gray-500">데이터를 불러오는 중입니다...</p></div>
                        ) : <NutritionAnalysis result={result} /> }
                    </div>
                </>
            } />
            <Route path="/statistics" element={
                <>
                    <Header title="통계" />
                    <StatisticsPage user={user} />
                </>
            } />
            <Route path="/mypage" element={
                <>
                    <Header title="마이페이지" />
                    <MyPage user={user} handleLogout={handleLogout}/>
                </>
            } />
        </Routes>
        
        {/* 플로팅 버튼 */}
        <button
          onClick={() => setIsChatOpen(true)}
          className="absolute bottom-20 right-6 bg-green-600 text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center hover:bg-green-700 transition z-30"
          aria-label="AI 챗봇 열기"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </button>

        <div className="flex-shrink-0">
            <BottomNavBar />
        </div>

        {/* 챗봇 모달 */}
        <ChatModal 
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          messages={messages}
          onAskAI={onAskAI}
        />
        {/* 영양소 수정 모달 */}
        <EditNutrientsModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          ocrData={ocrResult}
          onSubmit={handleFinalSubmit}
        />
    </div>
  );
}

export default RightPanel; 