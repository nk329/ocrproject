import React from "react";

function NutritionAnalysis({ result, handleLogout }) {
  if (!result) {
    return (
      <div className="text-center text-gray-400 py-8">
        분석 결과가 여기에 표시됩니다.
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* 사용자 정보 + 로그아웃 */}

      {/* 이번 음식의 영양소 */}
      {result.latestNutrients && (
        <>
          <h3 className="text-sm font-semibold text-green-700 mb-2">이번 음식의 영양소</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm border border-gray-300 mb-6">
              <thead className="bg-green-600 text-white">
                <tr>
                  <th className="border px-1 sm:px-2 py-2">영양소</th>
                  <th className="border px-1 sm:px-2 py-2">섭취량</th>
                  <th className="border px-1 sm:px-2 py-2">충족률</th>
                </tr>
              </thead>
              <tbody>
                {result.latestNutrients.map((n, i) => (
                  <tr key={i}>
                    <td className={`border px-1 sm:px-2 py-2 ${["열량", "단백질", "나트륨", "당류", "지방", "포화지방"].includes(n.name) ? "font-bold" : ""}`}>
                      {n.name}
                    </td>
                    <td className="border px-1 sm:px-2 py-2">{n.value} {n.unit}</td>
                    <td className="border px-1 sm:px-2 py-2">{n.percentage}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}


      {/* 피드백 */}
      <div className="mt-4 space-y-2">
        {result.warnings.map((msg, i) => (
          <p key={i} className="text-xs sm:text-sm text-red-500">{msg}</p>
        ))}
        {result.advices.map((msg, i) => (
          <p key={i} className="text-xs sm:text-sm text-green-600">{msg}</p>
        ))}
      </div>
    </div>
  );
}

export default NutritionAnalysis;
