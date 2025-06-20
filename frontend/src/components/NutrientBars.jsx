import React from "react";

// 로딩 상태를 위한 스켈레톤 바 컴포넌트
function SkeletonBar() {
  return (
    <div className="mb-3 sm:mb-4 animate-pulse">
      <div className="h-4 bg-gray-200 rounded-md w-1/3 mb-2"></div>
      <div className="h-4 bg-gray-200 rounded-full w-full"></div>
    </div>
  );
}

function NutrientBars({ nutrients }) {
  const targetNutrients = ["열량", "단백질", "나트륨", "당류", "지방", "포화지방"];
  const units = { "열량": "kcal", "단백질": "g", "나트륨": "mg", "당류": "g", "지방": "g", "포화지방": "g" };

  // 로딩 상태 UI
  if (!nutrients) {
    return (
      <div className="mt-6 bg-white p-4 rounded-lg border border-gray-200">
        <h3 className="text-sm sm:text-base font-semibold text-green-700 mb-4">
          오늘 섭취한 영양소 비율 (%)
        </h3>
        <p className="text-center text-sm text-gray-500 mb-4">
          오늘 섭취한 영양소를 계산하고 있습니다...
        </p>
        <div>
          {targetNutrients.map(name => <SkeletonBar key={name} />)}
        </div>
      </div>
    );
  }

  // 데이터가 있을 때의 UI
  return (
    <div className="mt-6 bg-white p-4 rounded-lg border border-gray-200">
      <h3 className="text-sm sm:text-base font-semibold text-green-700 mb-4">
        오늘 섭취한 영양소 비율 (%)
      </h3>

      {targetNutrients.map((name) => {
        const nutrient = nutrients.find((n) => n.name === name) || {
          value: 0,
          unit: units[name] || "",
          percentage: 0,
        };

        const percent = Math.min(parseFloat(nutrient.percentage), 999);

        return (
          <div key={name} className="mb-3 sm:mb-4">
            <div className="flex justify-between items-center text-xs sm:text-sm font-medium mb-1">
              <span className="truncate">{name}</span>
              <span className="text-right">
                {nutrient.value} {nutrient.unit}
              </span>
            </div>

            <div className="relative w-full bg-gray-200 rounded-full h-2.5 sm:h-3 md:h-4 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ease-out ${
                  percent < 30 ? "bg-red-400"
                    : percent < 80 ? "bg-yellow-400"
                    : percent <= 120 ? "bg-green-500"
                    : "bg-red-600"
                }`}
                style={{ width: `${Math.min(percent, 100)}%` }}
              ></div>

              <span className="absolute left-1 right-1 text-[8px] sm:text-[10px] md:text-xs text-black font-semibold text-center top-0.5">
                {percent}%
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default NutrientBars;
