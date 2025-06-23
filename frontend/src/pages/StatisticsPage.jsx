import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useTheme } from '../contexts/ThemeContext';
import 'react-calendar/dist/Calendar.css'; 
import { useOutletContext } from 'react-router-dom';

// 시간대 문제를 피하기 위해 'YYYY-MM-DD' 형식의 문자열로 날짜를 포맷하는 함수
const formatDateToUTCString = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

function StatisticsPage() {
  const { user } = useOutletContext();
  const { theme } = useTheme();
  const [statsData, setStatsData] = useState(null);
  // 선택된 날짜를 'YYYY-MM-DD' 문자열로 관리
  const [selectedDate, setSelectedDate] = useState(formatDateToUTCString(new Date()));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStatsData = async () => {
      try {
        const response = await fetch(`http://localhost:8000/statistics/${user.id}`);
        const data = await response.json();
        setStatsData(data);
      } catch (error) {
        console.error("통계 데이터 로딩 실패:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStatsData();
  }, [user.id]);

  // 선택된 날짜의 데이터 (문자열 키로 직접 접근)
  const selectedDayData = statsData ? statsData[selectedDate] : null;
  const targetNutrients = ["열량", "단백질", "나트륨", "당류", "지방", "포화지방"];
  const chartData = selectedDayData
    ? targetNutrients.map(name => {
        const nutrient = selectedDayData.find(n => n.name === name);
        return { name, 섭취량: nutrient ? nutrient.value : 0 };
      })
    : [];

  const handleDateChange = (date) => {
    setSelectedDate(formatDateToUTCString(date));
  };
  
  const chartColor = theme === 'dark' ? '#9CA3AF' : '#6B7280';
  const tooltipStyle = theme === 'dark' 
    ? { backgroundColor: '#1F2937', border: '1px solid #374151', color: '#E5E7EB' }
    : { backgroundColor: '#FFFFFF', color: '#374151' };

  return (
    <>
      <div className="bg-green-600 text-white p-4 shadow flex-shrink-0 flex justify-between items-center">
          <h2 className="text-lg font-bold">통계</h2>
      </div>
      <div className="flex-1 p-6 overflow-y-auto bg-gray-100 dark:bg-gray-900">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500 dark:text-gray-400">통계 데이터를 불러오는 중입니다...</p>
          </div>
        ) : (
          <>
            {/* 캘린더 */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm mb-6">
              <h3 className="font-bold text-lg mb-2 text-gray-700 dark:text-gray-300">일일 섭취 기록</h3>
              <Calendar
                onChange={handleDateChange}
                value={new Date(selectedDate)} // Calendar의 value prop은 Date 객체를 필요로 함
                className={theme === 'dark' ? 'dark-calendar' : ''}
                tileClassName={({ date, view }) => {
                  // 캘린더의 각 날짜도 UTC 문자열로 변환하여 비교
                  if (view === 'month' && statsData && statsData[formatDateToUTCString(date)]) {
                    return 'has-data';
                  }
                }}
              />
            </div>

            {/* 주간/월간 리포트 (차트) */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm min-h-[300px]">
              <h3 className="font-bold text-lg mb-4 text-gray-700 dark:text-gray-300">
                {new Date(selectedDate).toLocaleDateString()} 영양소 섭취량
              </h3>
              {selectedDayData ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <XAxis dataKey="name" fontSize={12} stroke={chartColor} />
                    <YAxis fontSize={12} stroke={chartColor}/>
                    <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(156, 163, 175, 0.2)' }} />
                    <Legend wrapperStyle={{ color: chartColor }} />
                    <Bar dataKey="섭취량" fill="#4ade80" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-500">
                  선택한 날짜에 기록된 데이터가 없습니다.
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}

export default StatisticsPage; 