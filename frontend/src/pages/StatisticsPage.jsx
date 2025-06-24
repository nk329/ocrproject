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

  // 사진/메모 불러오기 (날짜 변경 시)
  useEffect(() => {
    if (!user || !selectedDate) return;
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
  }, [user, selectedDate]);

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
            date: selectedDate,
            image_base64: reader.result
          })
        }).then(() => {
          // 업로드 후 다시 불러오기
          fetch(`http://localhost:8000/meal-photo?user_id=${user.id}&date=${selectedDate}`)
            .then(res => res.json())
            .then(data => {
              setPhotoMap(prev => ({ ...prev, [selectedDate]: data.photos || [] }));
            });
        });
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  // 사진 삭제
  const handlePhotoDelete = (idx) => {
    setPhotoMap(prev => {
      const arr = (prev[selectedDate] || []).slice();
      arr.splice(idx, 1);
      return { ...prev, [selectedDate]: arr };
    });
  };

  // 메모 저장
  const handleMemoSave = () => {
    fetch('http://localhost:8000/meal-memo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: user.id,
        date: selectedDate,
        memo: memoDraft
      })
    }).then(() => {
      setMemoMap(prev => ({ ...prev, [selectedDate]: memoDraft }));
      setMemoEditMode(false);
    });
  };
  const [memoEditMode, setMemoEditMode] = useState(false);
  const memoInput = memoEditMode ? (memoMap[selectedDate] || '') : (memoMap[selectedDate] || '');
  const [memoDraft, setMemoDraft] = useState('');

  useEffect(() => {
    setMemoDraft(memoMap[selectedDate] || '');
  }, [selectedDate, memoMap]);

  return (
    <>
      <div className="bg-green-600 text-white p-4 shadow flex-shrink-0 flex justify-between items-center">
          <h2 className="text-lg font-bold">통계</h2>
          <div className="flex gap-2">
            <button onClick={() => setViewType('month')} className={`px-3 py-1 rounded ${viewType === 'month' ? 'bg-white text-green-600 font-bold' : 'bg-green-500 text-white'}`}>월간</button>
            <button onClick={() => setViewType('week')} className={`px-3 py-1 rounded ${viewType === 'week' ? 'bg-white text-green-600 font-bold' : 'bg-green-500 text-white'}`}>주간</button>
            <button onClick={() => setViewType('day')} className={`px-3 py-1 rounded ${viewType === 'day' ? 'bg-white text-green-600 font-bold' : 'bg-green-500 text-white'}`}>일간</button>
          </div>
      </div>
      <div className="flex-1 p-6 overflow-y-auto bg-gray-100 dark:bg-gray-900">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500 dark:text-gray-400">통계 데이터를 불러오는 중입니다...</p>
          </div>
        ) : (
          <>
            {/* 뷰 타입별 표시 */}
            {viewType === 'month' && (
              <>
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
              </>
            )}
            {viewType === 'week' && (
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm mb-6">
                <h3 className="font-bold text-lg mb-2 text-gray-700 dark:text-gray-300">주간 요약</h3>
                {/* 한 주간 날짜별 주요 영양소 요약 */}
                <div className="overflow-x-auto mb-4">
                  <table className="w-full text-xs text-center">
                    <thead>
                      <tr>
                        <th className="py-2">날짜</th>
                        {targetNutrients.map(n => <th key={n} className="py-2">{n}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        if (!statsData) return null;
                        const sortedDates = Object.keys(statsData).sort((a, b) => new Date(a) - new Date(b));
                        const recent7 = sortedDates.slice(-7);
                        return recent7.map(date => (
                          <tr key={date}>
                            <td className="py-1 font-semibold">{date}</td>
                            {targetNutrients.map(n => {
                              const found = statsData[date].find(x => x.name === n);
                              return <td key={n}>{found ? `${found.value} ${found.unit}` : '-'}</td>;
                            })}
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>
                {/* 미니 차트: 예시로 단백질만 */}
                <div className="mb-4">
                  <h4 className="font-bold mb-2 text-green-700 dark:text-green-300">주간 단백질 섭취량 추이</h4>
                  <ResponsiveContainer width="100%" height={120}>
                    <LineChart data={(() => {
                      if (!statsData) return [];
                      const sortedDates = Object.keys(statsData).sort((a, b) => new Date(a) - new Date(b));
                      const recent7 = sortedDates.slice(-7);
                      return recent7.map(date => {
                        const found = statsData[date].find(x => x.name === '단백질');
                        return { date, value: found ? found.value : 0 };
                      });
                    })()}>
                      <XAxis dataKey="date" fontSize={10} tickFormatter={d => d.slice(5)} />
                      <YAxis fontSize={10}/>
                      <Tooltip/>
                      <Line type="monotone" dataKey="value" stroke="#4ade80" strokeWidth={2} dot={true} name="단백질" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                {/* 주간 식단 사진/메모 모아보기 - 카드형 UI */}
                <div className="mb-4">
                  <h4 className="font-bold mb-2 text-green-700 dark:text-green-300">주간 식단 사진/메모 모아보기</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {(() => {
                      if (!statsData) return null;
                      const sortedDates = Object.keys(statsData).sort((a, b) => new Date(a) - new Date(b));
                      const recent7 = sortedDates.slice(-7);
                      return recent7.map(date => (
                        <div key={date} className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 flex flex-col">
                          <div className="flex items-center mb-2">
                            <span className="font-bold text-green-700 dark:text-green-300 mr-2">{date}</span>
                            <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">{photoMap[date]?.length || 0}장</span>
                          </div>
                          <div className="flex gap-1 overflow-x-auto mb-2">
                            {(photoMap[date] || []).length > 0 ? (
                              photoMap[date].map((src, idx) => (
                                <img key={idx} src={src} alt="식단" className="w-16 h-16 object-cover rounded border" />
                              ))
                            ) : (
                              <button className="w-16 h-16 flex items-center justify-center border rounded bg-gray-50 text-gray-400 hover:bg-gray-100">
                                <span className="material-icons">add_a_photo</span>
                              </button>
                            )}
                          </div>
                          <div className="mt-auto">
                            <div className="bg-green-50 dark:bg-green-900 text-green-800 dark:text-green-200 rounded p-2 text-xs min-h-[32px]">
                              {memoMap[date] ? memoMap[date] : <span className="text-gray-400">메모 없음</span>}
                            </div>
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              </div>
            )}
            {viewType === 'day' && (
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm mb-6">
                <h3 className="font-bold text-lg mb-2 text-gray-700 dark:text-gray-300">일간 타임라인</h3>
                {selectedDayData ? (
                  <div className="space-y-4">
                    {/* 영양소 카드 */}
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 shadow">
                      <h4 className="font-bold mb-2 text-green-700 dark:text-green-300">영양소 섭취량</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {selectedDayData.map(n => (
                          <div key={n.name} className="flex flex-col items-center bg-white dark:bg-gray-700 rounded p-2 shadow-sm">
                            <span className="text-xs text-gray-500 dark:text-gray-400">{n.name}</span>
                            <span className="font-bold text-lg">{n.value} {n.unit}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* 사진 업로드/미리보기 */}
                    <div className="bg-white dark:bg-gray-700 rounded-lg p-4 shadow flex flex-col gap-2">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-bold text-green-700 dark:text-green-300">식단 사진</span>
                        <button onClick={() => photoInputRef.current.click()} className="px-2 py-1 bg-green-500 text-white rounded text-xs">사진 추가</button>
                        <input type="file" accept="image/*" multiple ref={photoInputRef} className="hidden" onChange={handlePhotoUpload} />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {(photoMap[selectedDate] || []).map((src, idx) => (
                          <div key={idx} className="relative group">
                            <img src={src} alt="식단" className="w-20 h-20 object-cover rounded border" />
                            <button onClick={() => handlePhotoDelete(idx)} className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 text-xs opacity-80 group-hover:opacity-100">×</button>
                          </div>
                        ))}
                        {!(photoMap[selectedDate] && photoMap[selectedDate].length) && <span className="text-gray-400">사진 없음</span>}
                      </div>
                    </div>
                    {/* 메모 입력/보기 */}
                    <div className="bg-white dark:bg-gray-700 rounded-lg p-4 shadow flex flex-col gap-2">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-bold text-green-700 dark:text-green-300">메모</span>
                        {!memoEditMode && <button onClick={() => { setMemoEditMode(true); setMemoDraft(memoMap[selectedDate] || ''); }} className="px-2 py-1 bg-green-500 text-white rounded text-xs">수정</button>}
                        {memoEditMode && <button onClick={handleMemoSave} className="px-2 py-1 bg-green-500 text-white rounded text-xs">저장</button>}
                      </div>
                      {memoEditMode ? (
                        <textarea className="w-full border rounded p-2 text-sm" rows={2} value={memoDraft} onChange={e => setMemoDraft(e.target.value)} />
                      ) : (
                        <div className="text-gray-700 dark:text-gray-200 min-h-[32px]">{memoMap[selectedDate] || <span className="text-gray-400">메모 없음</span>}</div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-400">선택한 날짜에 기록된 데이터가 없습니다.</div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

export default StatisticsPage; 