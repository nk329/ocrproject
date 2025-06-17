// src/components/NutritionAnalysis.jsx
import React from "react";

function NutritionAnalysis({ result }) {
  if (!result) {
    return (
      <div className="text-center text-gray-400">
        분석 결과가 여기에 표시됩니다.
      </div>
    );
  }

  return (
    <div className="w-full">
      <p className="mb-4 text-sm text-gray-600">
        분석 대상: <span className="font-medium">{result.gender}</span> / <span className="font-medium">{result.ageGroup}</span>
      </p>

      {/* 결과 테이블 */}
      <table className="w-full text-sm border border-gray-300">
        <thead className="bg-gray-100">
          <tr>
            <th className="border px-2 py-2">영양소</th>
            <th className="border px-2 py-2">섭취량</th>
            <th className="border px-2 py-2">충족률</th>
          </tr>
        </thead>
        <tbody>
          {result.nutrients.map((n, i) => (
            <tr key={i}>
              <td className="border px-2 py-2">{n.name}</td>
              <td className="border px-2 py-2">{n.value} {n.unit}</td>
              <td className="border px-2 py-2">{n.percentage}%</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 피드백 */}
      <div className="mt-4 space-y-2">
        {result.warnings.map((msg, i) => (
          <p key={i} className="text-sm text-red-500 flex items-center">
            안되요 !{msg}
          </p>
        ))}
        {result.advices.map((msg, i) => (
          <p key={i} className="text-sm text-green-600 flex items-center">
            가능 !{msg}
          </p>
        ))}
      </div>
    </div>
  );
}

export default NutritionAnalysis;
