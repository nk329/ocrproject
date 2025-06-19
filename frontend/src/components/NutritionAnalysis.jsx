import React from "react";
import NutrientBars from "./NutrientBars";

function NutritionAnalysis({ result, handleLogout }) {
  if (!result) {
    return (
      <div className="text-center text-gray-400">
        분석 결과가 여기에 표시됩니다.
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* 사용자 정보 + 로그아웃 */}
      <div className="flex flex-col gap-1 p-4 mb-4 bg-gray-100 rounded-lg shadow-sm text-sm text-gray-800">
        <div className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 15c2.362 0 4.578.57 6.879 1.804M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p className="space-x-1">
            <span className="font-semibold">{result.username}</span>님 /
            <span className="text-gray-700">{result.gender}</span> /
            <span className="text-gray-700">{result.ageGroup}대</span>
          </p>
        </div>

        {/* 로그아웃 버튼 */}
        <div className="flex justify-end">
          <button
            onClick={handleLogout}
            className="text-xs text-gray-500 hover:text-red-500 underline"
          >
            로그아웃
          </button>
        </div>
      </div>

      {/* 이번 음식의 영양소 */}
      {result.latestNutrients && (
        <>
          <h3 className="text-sm font-semibold text-green-700 mb-2">이번 음식의 영양소</h3>
          <table className="w-full text-sm border border-gray-300 mb-6">
            <thead className="bg-green-600 text-white">
              <tr>
                <th className="border px-2 py-2">영양소</th>
                <th className="border px-2 py-2">섭취량</th>
                <th className="border px-2 py-2">충족률</th>
              </tr>
            </thead>
            <tbody>
              {result.latestNutrients.map((n, i) => (
                <tr key={i}>
                  <td className={`border px-2 py-2 ${["열량", "단백질", "나트륨", "당류", "지방", "포화지방"].includes(n.name) ? "font-bold" : ""}`}>
                    {n.name}
                  </td>
                  <td className="border px-2 py-2">{n.value} {n.unit}</td>
                  <td className="border px-2 py-2">{n.percentage}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* 하루 누적 퍼센트 바 */}
      <NutrientBars nutrients={result.nutrients} />

      {/* 피드백 */}
      <div className="mt-4 space-y-2">
        {result.warnings.map((msg, i) => (
          <p key={i} className="text-sm text-red-500">{msg}</p>
        ))}
        {result.advices.map((msg, i) => (
          <p key={i} className="text-sm text-green-600">{msg}</p>
        ))}
      </div>
    </div>
  );
}

export default NutritionAnalysis;
