import React, { useState, useEffect, useRef } from 'react';
import Calendar from 'react-calendar';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
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
  // 트렌드 분석 관련 상태
  const [trendNutrient, setTrendNutrient] = useState('단백질');
  const [trendDays, setTrendDays] = useState(30);
  // 뷰 타입 상태 (month/week/day)
  const [viewType, setViewType] = useState('month');
  // 사진/메모 임시 상태 (날짜별 관리)
  const [photoMap, setPhotoMap] = useState({}); // { 'YYYY-MM-DD': [base64, ...] }
  const [memoMap, setMemoMap] = useState({});  // { 'YYYY-MM-DD': '메모내용' }
  const photoInputRef = useRef();
  // 팝업용 별도 상태 추가
  const [popupDiaryDate, setPopupDiaryDate] = useState(null);
  // 무한 스크롤과 월별 선택을 위한 상태 추가
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [diaryPage, setDiaryPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const itemsPerPage = 20;

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

  // 모든 날짜의 사진/메모 불러오기 (초기 로딩)
  useEffect(() => {
    if (!user || !statsData) return;
    
    const loadAllPhotosAndMemos = async () => {
      const allDates = Object.keys(statsData);
      
      // 모든 날짜의 사진 불러오기
      const photoPromises = allDates.map(date => 
        fetch(`http://localhost:8000/meal-photo?user_id=${user.id}&date=${date}`)
          .then(res => res.json())
          .then(data => ({ date, photos: data.photos || [] }))
          .catch(() => ({ date, photos: [] }))
      );
      
      // 모든 날짜의 메모 불러오기
      const memoPromises = allDates.map(date => 
        fetch(`http://localhost:8000/meal-memo?user_id=${user.id}&date=${date}`)
          .then(res => res.json())
          .then(data => ({ date, memo: data.memo || '' }))
          .catch(() => ({ date, memo: '' }))
      );
      
      try {
        const [photoResults, memoResults] = await Promise.all([
          Promise.all(photoPromises),
          Promise.all(memoPromises)
        ]);
        
        // photoMap 업데이트
        const newPhotoMap = {};
        photoResults.forEach(({ date, photos }) => {
          if (photos.length > 0) {
            newPhotoMap[date] = photos;
          }
        });
        setPhotoMap(prev => ({ ...prev, ...newPhotoMap }));
        
        // memoMap 업데이트
        const newMemoMap = {};
        memoResults.forEach(({ date, memo }) => {
          if (memo) {
            newMemoMap[date] = memo;
          }
        });
        setMemoMap(prev => ({ ...prev, ...newMemoMap }));
      } catch (error) {
        console.error('사진/메모 로딩 중 오류:', error);
      }
    };
    
    loadAllPhotosAndMemos();
  }, [user, statsData]);

  // 선택된 날짜의 사진/메모 불러오기 (날짜 변경 시)
  useEffect(() => {
    if (!user || !selectedDate) return;
    // 이미 로드된 데이터가 있으면 추가로 불러오지 않음
    if (photoMap[selectedDate] !== undefined && memoMap[selectedDate] !== undefined) return;
    
    // 사진 불러오기
    fetch(`http://localhost:8000/meal-photo?user_id=${user.id}&date=${selectedDate}`)
      .then(res => res.json())
      .then(data => {
        setPhotoMap(prev => ({ ...prev, [selectedDate]: data.photos || [] }));
      });
    // 메모 불러오기
    fetch(`http://localhost:8000/meal-memo?user_id=${user.id}&date=${selectedDate}`)
      .then(res => res.json())
      .then(data => {
        setMemoMap(prev => ({ ...prev, [selectedDate]: data.memo || '' }));
      });
  }, [user, selectedDate, photoMap, memoMap]);

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

  // 최근 N일 데이터 추출 함수
  const getRecentDaysData = (days) => {
    if (!statsData) return [];
    const sortedDates = Object.keys(statsData).sort((a, b) => new Date(b) - new Date(a));
    return sortedDates.slice(0, days).map(date => statsData[date]);
  };

  // 평균 계산 함수
  const calcAverage = (dataArr, nutrientName) => {
    const values = dataArr.map(dayArr => {
      const found = dayArr.find(n => n.name === nutrientName);
      return found ? found.value : 0;
    });
    return values.length ? (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1) : '-';
  };

  // 주간/월간 평균 데이터
  const weekData = getRecentDaysData(7);
  const monthData = getRecentDaysData(30);

  // 단위 추출 함수
  const getNutrientUnit = (nutrientName) => {
    if (!statsData) return '';
    const sortedDates = Object.keys(statsData).sort((a, b) => new Date(b) - new Date(a));
    for (const date of sortedDates) {
      const found = statsData[date].find(n => n.name === nutrientName);
      if (found) return found.unit;
    }
    return '';
  };

  // 영양소별 목표값(기본값)
  const nutrientGoals = {
    "열량": 2000,      // kcal
    "단백질": 55,      // g
    "나트륨": 2000,    // mg
    "당류": 50,        // g
    "지방": 54,        // g
    "포화지방": 15     // g
  };

  // 달성률 계산 함수
  const calcPercent = (avg, goal) => {
    if (!avg || !goal || isNaN(avg)) return '-';
    return Math.round((avg / goal) * 100);
  };

  // 트렌드 데이터 가공
  const getTrendData = () => {
    if (!statsData) return [];
    const sortedDates = Object.keys(statsData).sort((a, b) => new Date(a) - new Date(b));
    const recentDates = sortedDates.slice(-trendDays);
    return recentDates.map(date => {
      const found = statsData[date].find(n => n.name === trendNutrient);
      return {
        date,
        value: found ? found.value : 0
      };
    });
  };
  const trendData = getTrendData();

  // 통계 정보 계산
  const trendValues = trendData.map(d => d.value);
  const trendMax = trendValues.length ? Math.max(...trendValues) : '-';
  const trendMin = trendValues.length ? Math.min(...trendValues) : '-';
  const trendAvg = trendValues.length ? (trendValues.reduce((a, b) => a + b, 0) / trendValues.length).toFixed(1) : '-';
  const trendStd = trendValues.length ? (Math.sqrt(trendValues.reduce((a, b) => a + Math.pow(b - trendAvg, 2), 0) / trendValues.length)).toFixed(1) : '-';

  // 사진 업로드 핸들러
  const handlePhotoUpload = (e) => {
    const targetDate = popupDiaryDate || selectedDate;
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        // 서버 업로드
        fetch('http://localhost:8000/meal-photo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: user.id,
            date: targetDate,
            image_base64: reader.result
          })
        }).then(() => {
          // 업로드 후 다시 불러오기
          fetch(`http://localhost:8000/meal-photo?user_id=${user.id}&date=${targetDate}`)
            .then(res => res.json())
            .then(data => {
              setPhotoMap(prev => ({ ...prev, [targetDate]: data.photos || [] }));
            });
        });
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  // 사진 삭제
  const handlePhotoDelete = (idx) => {
    const targetDate = popupDiaryDate || selectedDate;
    setPhotoMap(prev => {
      const arr = (prev[targetDate] || []).slice();
      arr.splice(idx, 1);
      return { ...prev, [targetDate]: arr };
    });
  };

  // 메모 저장
  const handleMemoSave = () => {
    const targetDate = popupDiaryDate || selectedDate;
    const targetMemo = popupDiaryDate ? (memoMap[popupDiaryDate] || '') : memoDraft;
    
    fetch('http://localhost:8000/meal-memo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: user.id,
        date: targetDate,
        memo: targetMemo
      })
    }).then(() => {
      setMemoMap(prev => ({ ...prev, [targetDate]: targetMemo }));
      if (popupDiaryDate) {
        // 팝업에서 저장한 경우 팝업 닫기
        setPopupDiaryDate(null);
      } else {
        // 일반 화면에서 저장한 경우 편집 모드 종료
        setMemoEditMode(false);
      }
    });
  };
  const [memoEditMode, setMemoEditMode] = useState(false);
  const memoInput = memoEditMode ? (memoMap[selectedDate] || '') : (memoMap[selectedDate] || '');
  const [memoDraft, setMemoDraft] = useState('');

  useEffect(() => {
    setMemoDraft(memoMap[selectedDate] || '');
  }, [selectedDate, memoMap]);

  // 모든 일기 날짜 수집 (statsData + photoMap + memoMap)
  const getAllDiaryDates = () => {
    const allDates = new Set([
      ...Object.keys(statsData || {}),
      ...Object.keys(photoMap),
      ...Object.keys(memoMap)
    ]);
    return Array.from(allDates).sort((a, b) => new Date(b) - new Date(a));
  };

  // 월별 필터링
  const getFilteredDates = () => {
    const allDates = getAllDiaryDates();
    if (selectedMonth === 'all') return allDates;
    return allDates.filter(date => date.startsWith(selectedMonth));
  };

  // 사용 가능한 년월 목록 생성
  const getAvailableMonths = () => {
    const allDates = getAllDiaryDates();
    const months = new Set(allDates.map(date => date.substring(0, 7))); // YYYY-MM
    return Array.from(months).sort((a, b) => b.localeCompare(a));
  };

  // 무한 스크롤 핸들러
  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    if (scrollTop + clientHeight >= scrollHeight - 5 && !isLoadingMore) {
      loadMoreDiaries();
    }
  };

  // 더 많은 일기 로드
  const loadMoreDiaries = () => {
    const filteredDates = getFilteredDates();
    const currentDisplayed = diaryPage * itemsPerPage;
    if (currentDisplayed < filteredDates.length) {
      setIsLoadingMore(true);
      setTimeout(() => {
        setDiaryPage(prev => prev + 1);
        setIsLoadingMore(false);
      }, 500); // 0.5초 딜레이로 로딩 효과
    }
  };

  // 월 변경 핸들러
  const handleMonthChange = (e) => {
    setSelectedMonth(e.target.value);
    setDiaryPage(1); // 페이지 리셋
  };

  return (
    <>
      <div className="bg-green-600 text-white p-4 shadow flex-shrink-0 flex justify-between items-center">
          <h2 className="text-lg font-bold">통계</h2>
          <div className="flex gap-2">
            <button onClick={() => setViewType('month')} className={`px-3 py-1 rounded ${viewType === 'month' ? 'bg-white text-green-600 font-bold' : 'bg-green-500 text-white'}`}>분석</button>
            <button onClick={() => setViewType('week')} className={`px-3 py-1 rounded ${viewType === 'week' ? 'bg-white text-green-600 font-bold' : 'bg-green-500 text-white'}`}>일기</button>
          </div>
      </div>
      <div className="flex-1 overflow-y-auto bg-gray-100 dark:bg-gray-900">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500 dark:text-gray-400">통계 데이터를 불러오는 중입니다...</p>
          </div>
        ) : (
          <>
            {/* 뷰 타입별 표시 */}
            {viewType === 'month' && (
              <div className="p-6">
                {/* 달력 */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm mb-6">
              <h3 className="font-bold text-lg mb-2 text-gray-700 dark:text-gray-300">일일 섭취 기록</h3>
              <Calendar
                onChange={handleDateChange}
                    value={new Date(selectedDate)}
                className={theme === 'dark' ? 'dark-calendar' : ''}
                tileClassName={({ date, view }) => {
                  if (view === 'month' && statsData && statsData[formatDateToUTCString(date)]) {
                    return 'has-data';
                  }
                }}
              />
            </div>
                {/* 선택한 날짜의 사진 + 영양소 섭취량 차트 */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm mb-6">
                  <h3 className="font-bold text-lg mb-2 text-gray-700 dark:text-gray-300">{selectedDate} 섭취 영양소</h3>
                  {/* 사진 미리보기 */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {(photoMap[selectedDate] || []).length > 0 ? (
                      photoMap[selectedDate].map((src, idx) => (
                        <img key={idx} src={src} alt="식단" className="w-16 h-16 object-cover rounded border" />
                      ))
                    ) : (
                      <span className="text-gray-400 text-sm">사진 없음</span>
                    )}
                  </div>
                  {/* 영양소 섭취량 차트 */}
              {selectedDayData ? (
                    <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <XAxis dataKey="name" fontSize={12} stroke={chartColor} />
                    <YAxis fontSize={12} stroke={chartColor}/>
                    <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(156, 163, 175, 0.2)' }} />
                    <Legend wrapperStyle={{ color: chartColor }} />
                    <Bar dataKey="섭취량" fill="#4ade80" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                    <div className="text-gray-400">선택한 날짜에 기록된 데이터가 없습니다.</div>
                  )}
                </div>
                {/* 주간/월간 평균 표 */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm mt-6">
                  <h3 className="font-bold text-lg mb-2 text-gray-700 dark:text-gray-300">주간/월간 평균 섭취량</h3>
                  <table className="w-full text-sm text-center">
                    <thead>
                      <tr>
                        <th className="py-2">영양소(단위)</th>
                        <th className="py-2">주간 평균</th>
                        <th className="py-2">주간 달성률(%)</th>
                        <th className="py-2">월간 평균</th>
                        <th className="py-2">월간 달성률(%)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {targetNutrients.map(name => {
                        const weekAvg = parseFloat(calcAverage(weekData, name));
                        const monthAvg = parseFloat(calcAverage(monthData, name));
                        const goal = nutrientGoals[name];
                        return (
                          <tr key={name}>
                            <td className="py-1 font-semibold">{name} {getNutrientUnit(name) && `(${getNutrientUnit(name)})`}</td>
                            <td className="py-1">{isNaN(weekAvg) ? '-' : weekAvg} {getNutrientUnit(name)}</td>
                            <td className="py-1">{calcPercent(weekAvg, goal) !== '-' ? `${calcPercent(weekAvg, goal)}%` : '-'}</td>
                            <td className="py-1">{isNaN(monthAvg) ? '-' : monthAvg} {getNutrientUnit(name)}</td>
                            <td className="py-1">{calcPercent(monthAvg, goal) !== '-' ? `${calcPercent(monthAvg, goal)}%` : '-'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {/* 영양소 트렌드 분석(선 그래프) */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm mt-6">
                  <h3 className="font-bold text-lg mb-2 text-gray-700 dark:text-gray-300">영양소 트렌드 분석</h3>
                  <div className="flex flex-wrap gap-4 mb-4 items-center">
                    <label>
                      <span className="mr-2">영양소 선택:</span>
                      <select value={trendNutrient} onChange={e => setTrendNutrient(e.target.value)} className="border rounded px-2 py-1">
                        {targetNutrients.map(n => <option key={n} value={n}>{n}</option>)}
                      </select>
                    </label>
                    <label>
                      <span className="mr-2">기간:</span>
                      <select value={trendDays} onChange={e => setTrendDays(Number(e.target.value))} className="border rounded px-2 py-1">
                        <option value={7}>7일</option>
                        <option value={14}>14일</option>
                        <option value={30}>30일</option>
                        <option value={90}>90일</option>
                      </select>
                    </label>
                  </div>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={trendData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                      <XAxis dataKey="date" fontSize={12} stroke={chartColor} tickFormatter={d => d.slice(5)} />
                      <YAxis fontSize={12} stroke={chartColor}/>
                      <Tooltip contentStyle={tooltipStyle} formatter={(v) => `${v} ${getNutrientUnit(trendNutrient)}`}/>
                      <Legend wrapperStyle={{ color: chartColor }} />
                      <Line type="monotone" dataKey="value" stroke="#4ade80" strokeWidth={2} dot={false} name={trendNutrient} />
                    </LineChart>
                  </ResponsiveContainer>
                  {/* 통계 정보 */}
                  <div className="flex flex-wrap gap-6 mt-4 text-sm text-gray-700 dark:text-gray-200">
                    <div>최고: <span className="font-bold">{trendMax} {getNutrientUnit(trendNutrient)}</span></div>
                    <div>최저: <span className="font-bold">{trendMin} {getNutrientUnit(trendNutrient)}</span></div>
                    <div>평균: <span className="font-bold">{trendAvg} {getNutrientUnit(trendNutrient)}</span></div>
                    <div>표준편차: <span className="font-bold">{trendStd} {getNutrientUnit(trendNutrient)}</span></div>
                  </div>
                </div>
              </div>
            )}
            {viewType === 'week' && (
              <div className="px-6 pt-6">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg mb-6 overflow-hidden">
                {/* 헤더 */}
                <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4">
                  <h3 className="font-bold text-xl text-white flex items-center gap-2">
                    <span>📝</span>
                    오늘의 일기
                    <span className="text-sm font-normal opacity-90">({selectedDate})</span>
                  </h3>
                </div>
                
                {/* 오늘 일기 작성 */}
                <div className="p-6">
                  {/* 사진 업로드/미리보기 */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                          <span>📸</span>
                          식단 사진
                        </span>
                        <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                          {(photoMap[selectedDate] || []).length}장
                        </span>
                      </div>
                      <button 
                        onClick={() => photoInputRef.current.click()} 
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg text-sm font-medium hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-md hover:shadow-lg"
                      >
                        <span>+</span>
                        사진 추가
                      </button>
                      <input type="file" accept="image/*" multiple ref={photoInputRef} className="hidden" onChange={handlePhotoUpload} />
                    </div>
                    
                    {/* 사진 그리드 */}
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                      {(photoMap[selectedDate] || []).map((src, idx) => (
                        <div key={idx} className="relative group aspect-square">
                          <img 
                            src={src} 
                            alt="식단" 
                            className="w-full h-full object-cover rounded-lg border-2 border-gray-200 dark:border-gray-600 shadow-sm hover:shadow-md transition-shadow duration-200" 
                          />
                          <button 
                            onClick={() => handlePhotoDelete(idx)} 
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg hover:bg-red-600 flex items-center justify-center"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                      
                      {/* 사진 추가 버튼 (빈 슬롯) */}
                      {(photoMap[selectedDate] || []).length === 0 && (
                        <div className="aspect-square border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:border-green-400 hover:text-green-400 transition-colors duration-200 cursor-pointer"
                             onClick={() => photoInputRef.current.click()}>
                          <span className="text-2xl mb-1">📸</span>
                          <span className="text-xs">사진 추가</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* 메모 입력/보기 */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <span>💭</span>
                        메모
                      </span>
                      <div className="flex gap-2">
                        {!memoEditMode && (
                          <button 
                            onClick={() => { setMemoEditMode(true); setMemoDraft(memoMap[selectedDate] || ''); }} 
                            className="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors duration-200 shadow-sm"
                          >
                            ✏️ 수정
                          </button>
                        )}
                        {memoEditMode && (
                          <>
                            <button 
                              onClick={() => setMemoEditMode(false)} 
                              className="px-3 py-1.5 bg-gray-500 text-white rounded-lg text-sm font-medium hover:bg-gray-600 transition-colors duration-200 shadow-sm"
                            >
                              취소
                            </button>
                            <button 
                              onClick={handleMemoSave} 
                              className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors duration-200 shadow-sm"
                            >
                              💾 저장
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    
                    {memoEditMode ? (
                      <textarea 
                        className="w-full border-2 border-gray-200 dark:border-gray-600 rounded-lg p-4 text-sm bg-gray-50 dark:bg-gray-700 focus:border-green-400 focus:ring-2 focus:ring-green-200 dark:focus:ring-green-800 transition-all duration-200 resize-none" 
                        rows={4} 
                        value={memoDraft} 
                        onChange={e => setMemoDraft(e.target.value)}
                        placeholder="오늘의 식사는 어땠나요? 느낌이나 생각을 자유롭게 적어보세요..."
                      />
                    ) : (
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 min-h-[100px] border-2 border-gray-200 dark:border-gray-600">
                        {memoMap[selectedDate] ? (
                          <p className="text-gray-700 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
                            {memoMap[selectedDate]}
                          </p>
                        ) : (
                          <div className="flex items-center justify-center h-full text-gray-400">
                            <div className="text-center">
                              <span className="text-3xl mb-2 block">📝</span>
                              <span className="text-sm">아직 메모가 없습니다</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* 월별 선택 및 일기 리스트 헤더 */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg mb-6 overflow-hidden">
                  {/* 헤더 */}
                  <div className="bg-gradient-to-r from-purple-500 to-pink-600 px-6 py-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-bold text-xl text-white flex items-center gap-2">
                        <span>📚</span>
                        일기 목록
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className="text-white text-sm opacity-90">기간:</span>
                        <select 
                          value={selectedMonth} 
                          onChange={handleMonthChange}
                          className="bg-white bg-opacity-20 border border-white border-opacity-30 rounded-lg px-4 py-2 text-sm text-white font-medium focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 backdrop-blur-sm"
                        >
                          <option value="all" className="text-gray-800">전체</option>
                          {getAvailableMonths().map(month => (
                            <option key={month} value={month} className="text-gray-800">
                              {month.replace('-', '년 ')}월
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                  
                  {/* 통계 정보 */}
                  <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                    <div className="flex justify-center items-center gap-6 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 bg-green-400 rounded-full"></span>
                        <span className="text-gray-600 dark:text-gray-300">
                          총 <span className="font-semibold text-green-600 dark:text-green-400">{getFilteredDates().length}</span>개의 일기
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 bg-blue-400 rounded-full"></span>
                        <span className="text-gray-600 dark:text-gray-300">
                          사진 <span className="font-semibold text-blue-600 dark:text-blue-400">
                            {getFilteredDates().reduce((total, date) => total + (photoMap[date] || []).length, 0)}
                          </span>장
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 bg-purple-400 rounded-full"></span>
                        <span className="text-gray-600 dark:text-gray-300">
                          메모 <span className="font-semibold text-purple-600 dark:text-purple-400">
                            {getFilteredDates().filter(date => memoMap[date]).length}
                          </span>개
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* 일기 리스트 (무한 스크롤) */}
                <div className="bg-white dark:bg-gray-800 rounded-t-xl shadow-lg overflow-hidden mb-0">
                  <div 
                    className="max-h-[600px] overflow-y-auto divide-y divide-gray-200 dark:divide-gray-600"
                    onScroll={handleScroll}
                  >
                    {(() => {
                      const filteredDates = getFilteredDates();
                      const displayedDates = filteredDates.slice(0, diaryPage * itemsPerPage);
                      
                      return displayedDates.map(date => (
                        <div 
                          key={date} 
                          className="p-6 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                          onClick={() => setPopupDiaryDate(date)}
                        >
                        {/* 헤더 - 날짜와 배지들 */}
                        <div className="flex justify-between items-center mb-4">
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-lg text-gray-800 dark:text-gray-100">{date}</span>
                            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                          </div>
                          <div className="flex items-center gap-2">
                            {(photoMap[date] || []).length > 0 && (
                              <span className="bg-gradient-to-r from-green-100 to-green-200 text-green-700 text-xs px-3 py-1.5 rounded-full font-medium">
                                📷 {(photoMap[date] || []).length}장
                              </span>
                            )}
                            {memoMap[date] && (
                              <span className="bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700 text-xs px-3 py-1.5 rounded-full font-medium">
                                📝 메모
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {/* 사진 미리보기 */}
                        <div className="mb-4">
                          {(photoMap[date] || []).length > 0 ? (
                            <div className="flex gap-3 overflow-x-auto pb-2">
                              {photoMap[date].slice(0, 6).map((src, idx) => (
                                <div key={idx} className="flex-shrink-0">
                                  <img 
                                    src={src} 
                                    alt="식단" 
                                    className="w-16 h-16 object-cover rounded-lg border-2 border-gray-200 dark:border-gray-600 shadow-sm hover:shadow-md transition-shadow duration-200" 
                                  />
                                </div>
                              ))}
                              {(photoMap[date] || []).length > 6 && (
                                <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-600 dark:to-gray-700 rounded-lg border-2 border-gray-200 dark:border-gray-600 flex items-center justify-center">
                                  <span className="text-xs text-gray-600 dark:text-gray-300 font-medium">
                                    +{(photoMap[date] || []).length - 6}
                                  </span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-center py-4 text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
                              <span className="text-2xl mb-1 block">📷</span>
                              <span className="text-sm">사진 없음</span>
                            </div>
                          )}
                        </div>
                        
                        {/* 메모 미리보기 */}
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                          {memoMap[date] ? (
                            <p className="text-gray-700 dark:text-gray-200 text-sm leading-relaxed line-clamp-3">
                              {memoMap[date]}
                            </p>
                          ) : (
                            <div className="text-center text-gray-400 py-2">
                              <span className="text-lg mb-1 block">💭</span>
                              <span className="text-sm">메모 없음</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ));
                  })()}
                  
                  {/* 로딩 인디케이터 */}
                  {isLoadingMore && (
                    <div className="text-center py-4">
                      <span className="text-gray-500">더 많은 일기를 불러오는 중...</span>
                    </div>
                  )}
                  
                  {/* 더 이상 로드할 일기가 없을 때 */}
                  {(() => {
                    const filteredDates = getFilteredDates();
                    const displayedCount = diaryPage * itemsPerPage;
                    if (displayedCount >= filteredDates.length && filteredDates.length > 0) {
                      return (
                        <div className="text-center py-4">
                          <span className="text-gray-400 text-sm">모든 일기를 불러왔습니다.</span>
                        </div>
                      );
                    }
                    return null;
                  })()}
                  </div>
                </div>
                
                {/* 팝업: 일기 상세/수정 */}
                {popupDiaryDate && (
                  <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden">
                      {/* 팝업 헤더 */}
                      <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-4 relative">
                        <h3 className="font-bold text-xl text-white flex items-center gap-2">
                          <span>📖</span>
                          {popupDiaryDate} 일기
                        </h3>
                        <button 
                          onClick={() => setPopupDiaryDate(null)} 
                          className="absolute top-4 right-4 text-white hover:text-gray-200 transition-colors duration-200 bg-white bg-opacity-20 rounded-full w-8 h-8 flex items-center justify-center font-bold"
                        >
                          ✕
                        </button>
                      </div>
                      
                      {/* 팝업 내용 */}
                      <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
                        {/* 사진 수정 */}
                        <div className="mb-6">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                              <span>📸</span>
                              사진
                              <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                                {(photoMap[popupDiaryDate] || []).length}장
                              </span>
                            </h4>
                            <button 
                              onClick={() => photoInputRef.current.click()} 
                              className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg text-sm font-medium hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-sm"
                            >
                              <span>+</span>
                              추가
                            </button>
                          </div>
                          
                          {/* 사진 그리드 */}
                          <div className="grid grid-cols-3 gap-3">
                            {(photoMap[popupDiaryDate] || []).map((src, idx) => (
                              <div key={idx} className="relative group aspect-square">
                                <img 
                                  src={src} 
                                  alt="식단" 
                                  className="w-full h-full object-cover rounded-lg border-2 border-gray-200 dark:border-gray-600 shadow-sm hover:shadow-md transition-shadow duration-200" 
                                />
                                <button 
                                  onClick={() => handlePhotoDelete(idx)} 
                                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg hover:bg-red-600 flex items-center justify-center"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                            
                            {/* 사진 추가 버튼 */}
                            {(photoMap[popupDiaryDate] || []).length < 6 && (
                              <div 
                                className="aspect-square border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:border-blue-400 hover:text-blue-400 transition-colors duration-200 cursor-pointer"
                                onClick={() => photoInputRef.current.click()}
                              >
                                <span className="text-xl mb-1">+</span>
                                <span className="text-xs">추가</span>
                              </div>
                            )}
                          </div>
                          
                          {(photoMap[popupDiaryDate] || []).length === 0 && (
                            <div className="text-center py-8 text-gray-400">
                              <span className="text-4xl mb-2 block">📷</span>
                              <span className="text-sm">아직 사진이 없습니다</span>
                            </div>
                          )}
                          
                          <input type="file" accept="image/*" multiple ref={photoInputRef} className="hidden" onChange={handlePhotoUpload} />
                        </div>
                        
                        {/* 메모 수정 */}
                        <div className="mb-6">
                          <h4 className="font-semibold mb-3 text-gray-700 dark:text-gray-300 flex items-center gap-2">
                            <span>💭</span>
                            메모
                          </h4>
                          <textarea 
                            className="w-full border-2 border-gray-200 dark:border-gray-600 rounded-lg p-4 text-sm bg-gray-50 dark:bg-gray-700 focus:border-blue-400 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all duration-200 resize-none" 
                            rows={4} 
                            value={memoMap[popupDiaryDate] || ''} 
                            onChange={e => setMemoMap(prev => ({ ...prev, [popupDiaryDate]: e.target.value }))}
                            placeholder="이 날의 식사는 어땠나요? 기억하고 싶은 것들을 적어보세요..."
                          />
                        </div>
                        
                        {/* 저장 버튼 */}
                        <button 
                          onClick={handleMemoSave} 
                          className="w-full py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-bold text-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                        >
                          <span>💾</span>
                          저장하기
                        </button>
                      </div>
                    </div>
                </div>
              )}
            </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

export default StatisticsPage; 