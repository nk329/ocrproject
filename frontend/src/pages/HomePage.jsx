import React from 'react';
import { useOutletContext } from 'react-router-dom';
import NutritionAnalysis from '../components/NutritionAnalysis';
import UploadForm from '../components/UploadForm';
import NutrientBars from '../components/NutrientBars';

function HomePage() {
  const { 
    user, result, handleLogout,
    isInitialLoading, isLoading, isSubmitting,
    image, onImageSelect, handleSubmit,
    isChatOpen, setIsChatOpen
  } = useOutletContext();

  return (
    <>
      {/* Header */}
      <div className="bg-green-600 text-white p-4 shadow flex-shrink-0 flex justify-between items-center">
          <h2 className="text-lg font-bold">DailyValue</h2>
          {result && (
              <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 15c2.362 0 4.578.57 6.879 1.804M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  <div className="text-sm">
                      <span className="font-bold">{result.username}</span>님
                      <span className="text-xs text-green-200 ml-2">({result.gender} / {result.ageGroup}대)</span>
                  </div>
              </div>
          )}
      </div>
      
      <div className="p-4 lg:p-6">
        <div className="lg:hidden mb-6">
          <NutrientBars nutrients={result?.nutrients} />
        </div>
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

        <hr className="my-6 border-gray-200 dark:border-gray-700" />
        
        {isInitialLoading ? (
            <div className="m-auto flex flex-col items-center"><div className="animate-spin h-12 w-12 border-4 border-green-500 border-t-transparent rounded-full" /><p className="mt-4 text-gray-500 dark:text-gray-400">데이터를 불러오는 중입니다...</p></div>
        ) : <NutritionAnalysis result={result} /> }
      </div>
      
      <button
        onClick={() => setIsChatOpen(true)}
        className="absolute bottom-20 right-6 bg-green-600 text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center hover:bg-green-700 transition z-30"
        aria-label="AI 챗봇 열기"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </button>
    </>
  );
}

export default HomePage; 