import React from "react";

function NutritionAnalysis({ result }) {
  if (!result || !result.latestNutrients) {
    return (
      <div className="text-center text-gray-500 py-4">
        음식 사진을 업로드하고 분석을 요청하면<br />최신 분석 결과가 여기에 표시됩니다.
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* 이번 음식의 영양소 테이블 (고정) */}
      <div>
        <h3 className="text-sm font-semibold text-green-700 mb-2">
          이번 음식의 영양소
        </h3>
        <div className="overflow-x-auto mb-4">
          <table className="w-full text-xs sm:text-sm border border-gray-300">
            <thead className="bg-green-600 text-white">
              <tr>
                <th className="border px-1 sm:px-2 py-2">영양소</th>
                <th className="border px-1 sm:px-2 py-2">섭취량</th>
                <th className="border px-1 sm:px-2 py-2">충족률</th>
              </tr>
            </thead>
            <tbody>
              {result.latestNutrients.map((n, i) => {
                // 누적값에서 같은 영양소의 percentage 찾기
                const matched = result.nutrients?.find(x => x.name === n.name);
                return (
                  <tr key={i}>
                    <td
                      className={`border px-1 sm:px-2 py-2 ${
                        [
                          "열량",
                          "단백질",
                          "나트륨",
                          "당류",
                          "지방",
                          "포화지방",
                        ].includes(n.name)
                          ? "font-bold"
                          : ""
                      }`}
                    >
                      {n.name}
                    </td>
                    <td className="border px-1 sm:px-2 py-2">
                      {n.value} {n.unit}
                    </td>
                    <td className="border px-1 sm:px-2 py-2">
                      {matched && matched.percentage !== undefined ? `${matched.percentage}%` : "-"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default NutritionAnalysis;
