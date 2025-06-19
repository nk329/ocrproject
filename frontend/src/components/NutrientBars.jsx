import React from "react";

function NutrientBars({ nutrients }) {
  const targetNutrients = ["열량", "단백질", "나트륨", "당류", "지방", "포화지방"];

  return (
    <div className="mt-6">
      <h3 className="text-base md:text-md font-semibold text-green-700 mb-2">
        오늘 섭취한 영양소 비율 (%)
      </h3>

      {targetNutrients.map((name) => {
        const nutrient = nutrients.find((n) => n.name === name);
        if (!nutrient) return null;

        const percent = Math.min(parseFloat(nutrient.percentage), 999);

        return (
          <div key={name} className="mb-4">
            <div className="flex justify-between items-center text-xs md:text-sm font-medium mb-1">
              <span className="truncate">{name}</span>
              <span className="text-right">{nutrient.value} {nutrient.unit}</span>
            </div>

            <div className="relative w-full bg-gray-200 rounded-full h-3 md:h-4 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ease-out ${
                  percent < 30
                    ? "bg-red-400"
                    : percent < 80
                    ? "bg-yellow-400"
                    : percent <= 120
                    ? "bg-green-500"
                    : "bg-red-600"
                }`}
                style={{ width: `${Math.min(percent, 100)}%` }}
              ></div>

              {/* ✅ 퍼센트 텍스트 */}
              <span className="absolute left-1 right-1 text-[10px] md:text-xs text-black font-semibold text-center top-0.5">
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
