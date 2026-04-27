import React, { useState, useEffect } from 'react';
import { MY_COURSES, PERIODS, CAMPUS_BUILDINGS } from './data/constants';

function App() {
  const days = ['日', '月', '火', '水', '木', '金', '土'];
  const now = new Date();

  // いただいた日程に基づいてクォーターを正確に判定する関数
  const getQuarterByDate = (dateObj) => {
    const m = dateObj.getMonth() + 1;
    const d = dateObj.getDate();
    const md = m * 100 + d; // 例: 4月27日 -> 427, 11月20日 -> 1120

    // 指定された期間内の判定
    if (md >= 413 && md <= 603) return 1; // 1Q: 4/13 〜 6/3
    if (md >= 608 && md <= 724) return 2; // 2Q: 6/8 〜 7/24
    if (md >= 924 && md <= 1111) return 3; // 3Q: 9/24 〜 11/11
    if (md >= 1120 || md <= 125) return 4; // 4Q: 11/20 〜 1/25 (年またぎ)

    // 期間外（休校・テスト期間など）の場合は直近のクォーターを返す
    if (md > 125 && md < 413) return 1;
    if (md > 603 && md < 608) return 2;
    if (md > 724 && md < 924) return 3;
    if (md > 1111 && md < 1120) return 4;
    return 1;
  };

  const [currentView, setCurrentView] = useState('home');
  const [selectedDay, setSelectedDay] = useState(now.getDay());
  const [selectedQuarter, setSelectedQuarter] = useState(getQuarterByDate(now));
  const [logs, setLogs] = useState([]);
  const [mapCampus, setMapCampus] = useState('tsudanuma');
  const [showModal, setShowModal] = useState(false);
  const [pendingRecord, setPendingRecord] = useState(null);
  const [editModalLog, setEditModalLog] = useState(null);
  const [editPendingStatus, setEditPendingStatus] = useState(null);
  const [expandedSections, setExpandedSections] = useState({});

  const getWeekOfMonth = (date) => {
    const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    return Math.ceil((date.getDate() + firstDayOfMonth) / 7);
  };

  const currentMonth = now.getMonth() + 1;
  const currentWeek = getWeekOfMonth(now);

  const getClassDateStr = (targetDayOfWeek) => {
    const currentDate = new Date();
    const today = currentDate.getDay();
    const diff = targetDayOfWeek - today;
    const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + diff);
    return `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}-${String(targetDate.getDate()).padStart(2, '0')}`;
  };

  useEffect(() => {
    const savedLogs = localStorage.getItem('attendance_logs');
    if (savedLogs) setLogs(JSON.parse(savedLogs));
  }, []);

  const requestRecord = (courseId, status, quarter) => {
    const classDateStr = getClassDateStr(selectedDay);
    setPendingRecord({ courseId, status, classDateStr, selectedDay, quarter });
    setShowModal(true);
  };

  const confirmRecord = () => {
    if (!pendingRecord) return;
    const recordDate = new Date();
    const dateStr = `${recordDate.getFullYear()}-${String(recordDate.getMonth() + 1).padStart(2, '0')}-${String(recordDate.getDate()).padStart(2, '0')}`;
    const timeStr = `${String(recordDate.getHours()).padStart(2, '0')}:${String(recordDate.getMinutes()).padStart(2, '0')}`;
    const newLog = {
      id: Date.now().toString(), courseId: pendingRecord.courseId,
      date: pendingRecord.classDateStr, recordedAt: `${dateStr} ${timeStr}`, status: pendingRecord.status,
      quarter: pendingRecord.quarter
    };
    const updatedLogs = [...logs, newLog];
    setLogs(updatedLogs);
    localStorage.setItem('attendance_logs', JSON.stringify(updatedLogs));
    setShowModal(false);
    setPendingRecord(null);
  };

  const openEditModal = (log) => { setEditModalLog(log); setEditPendingStatus(null); };
  const closeEditModal = () => { setEditModalLog(null); setEditPendingStatus(null); };

  const executeEdit = () => {
    if (!editModalLog || !editPendingStatus) return;
    const updatedLogs = logs.map(l => l.id === editModalLog.id ? { ...l, status: editPendingStatus } : l);
    setLogs(updatedLogs);
    localStorage.setItem('attendance_logs', JSON.stringify(updatedLogs));
    closeEditModal();
  };

  const getLogForClassDate = (courseId, targetDayOfWeek) => {
    const targetDateStr = getClassDateStr(targetDayOfWeek);
    return logs.find(log => log.courseId === courseId && log.date === targetDateStr);
  };

  const groupedLogs = logs.reduce((acc, log) => {
    const dateObj = new Date(log.date);
    const month = dateObj.getMonth() + 1;
    const week = getWeekOfMonth(dateObj);
    const dateKey = log.date;
    if (!acc[month]) acc[month] = {};
    if (!acc[month][week]) acc[month][week] = {};
    if (!acc[month][week][dateKey]) acc[month][week][dateKey] = [];
    acc[month][week][dateKey].push({ ...log, dayName: days[dateObj.getDay()] });
    return acc;
  }, {});

  const sortedMonths = Object.keys(groupedLogs).sort((a, b) => b - a);
  const totalRecords = logs.length;
  const totalPresent = logs.filter(l => l.status === '出席').length;
  const totalLate = logs.filter(l => l.status === '遅刻').length;
  const totalAbsent = logs.filter(l => l.status === '欠席').length;
  const overallRate = totalRecords === 0 ? 0 : Math.round(((totalPresent + totalLate) / totalRecords) * 100);

  const uniqueCourseNames = [...new Set(MY_COURSES.map(c => c.name))];
  const courseAnalytics = uniqueCourseNames.map(name => {
    const relatedCourses = MY_COURSES.filter(c => c.name === name);
    const relatedCourseIds = relatedCourses.map(c => c.id);
    const periodGroups = {};
    relatedCourses.forEach(c => {
      if (!periodGroups[c.period]) periodGroups[c.period] = [];
      periodGroups[c.period].push(days[c.dayOfWeek]);
    });
    const scheduleStr = Object.entries(periodGroups).map(([p, dArr]) => `${dArr.join('・')}曜 ${p}限`).join(' / ');
    const subjectLogs = logs.filter(l => relatedCourseIds.includes(l.courseId));
    const tTotal = subjectLogs.length;
    const tPresent = subjectLogs.filter(l => l.status === '出席').length;
    const tLate = subjectLogs.filter(l => l.status === '遅刻').length;
    const tAbsent = subjectLogs.filter(l => l.status === '欠席').length;
    const tRate = tTotal === 0 ? 0 : Math.round(((tPresent + tLate) / tTotal) * 100);
    return { id: name, name, scheduleStr, total: tTotal, present: tPresent, late: tLate, absent: tAbsent, rate: tRate };
  }).filter(c => c.total > 0);

  const toggleAccordion = (key) => {
    setExpandedSections(prev => ({ ...prev, [key]: prev[key] === undefined ? false : !prev[key] }));
  };

  const renderLogCard = (log) => {
    const courseInfo = MY_COURSES.find(c => c.id === log.courseId);
    return (
      <div key={log.id} style={{ background: 'white', padding: '12px', borderRadius: '8px', marginBottom: '8px', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <div style={{ fontSize: '0.75rem', color: '#1d4ed8', fontWeight: 'bold' }}>
            {courseInfo ? `${courseInfo.period}時限 (${PERIODS[courseInfo.period].start}〜${PERIODS[courseInfo.period].end})` : ''}
          </div>
          <div style={{ padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold', fontSize: '0.75rem', background: log.status === '出席' ? '#dcfce7' : log.status === '遅刻' ? '#fef3c7' : '#fee2e2', color: log.status === '出席' ? '#16a34a' : log.status === '遅刻' ? '#d97706' : '#dc2626' }}>{log.status}</div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontWeight: 'bold', color: '#334155', fontSize: '0.95rem', marginBottom: '4px' }}>{courseInfo?.name || '不明'}</div>
            <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>打刻: {log.recordedAt || log.date}</div>
          </div>
          <button onClick={() => openEditModal(log)} style={{ padding: '4px 10px', background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold', marginTop: '2px' }}>修正</button>
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding: '15px', fontFamily: 'sans-serif', width: '100%', minHeight: '100vh', backgroundColor: '#fdfdfd', boxSizing: 'border-box', margin: 0, position: 'relative' }}>
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', width: '85%', maxWidth: '400px', padding: '25px', borderRadius: '15px', textAlign: 'center' }}>
            <p style={{ fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '10px' }}>記録の確認</p>
            <p style={{ color: '#4b5563', fontSize: '0.9rem', marginBottom: '20px' }}>
              <span style={{ fontWeight: 'bold', color: '#1d4ed8' }}>{pendingRecord.classDateStr} ({days[pendingRecord.selectedDay]}曜)</span> の授業を<br />
              <span style={{ fontWeight: 'bold', color: '#1e293b' }}>{pendingRecord.status}</span> として記録します。
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', borderRadius: '8px', fontWeight: 'bold', color: '#64748b' }}>キャンセル</button>
              <button onClick={confirmRecord} style={{ flex: 1, padding: '12px', border: 'none', background: '#1e293b', borderRadius: '8px', fontWeight: 'bold', color: 'white' }}>確定する</button>
            </div>
          </div>
        </div>
      )}

      {editModalLog && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', width: '85%', maxWidth: '400px', padding: '25px', borderRadius: '15px', textAlign: 'center' }}>
            <p style={{ fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '10px' }}>記録の修正</p>
            {editPendingStatus ? (
              <div style={{ background: '#f1f5f9', padding: '15px', borderRadius: '8px' }}>
                <p style={{ fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '15px' }}>【 {editPendingStatus} 】に変更しますか？</p>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => setEditPendingStatus(null)} style={{ flex: 1, padding: '10px', background: 'white', border: '1px solid #cbd5e1', borderRadius: '6px' }}>戻る</button>
                  <button onClick={executeEdit} style={{ flex: 1, padding: '10px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '6px' }}>確定</button>
                </div>
              </div>
            ) : (
              <div>
                <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '15px' }}>{editModalLog.date} の状態を変更</p>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                  {['出席', '遅刻', '欠席'].filter(s => s !== editModalLog.status).map(status => (
                    <button key={status} onClick={() => setEditPendingStatus(status)} style={{ flex: 1, padding: '12px', background: '#e2e8f0', border: 'none', borderRadius: '8px', fontWeight: 'bold' }}>{status}</button>
                  ))}
                </div>
                <button onClick={closeEditModal} style={{ background: 'none', border: 'none', color: '#64748b' }}>キャンセル</button>
              </div>
            )}
          </div>
        </div>
      )}

      <h2 style={{ borderBottom: '2px solid #ccc', paddingBottom: '10px', textAlign: 'center', margin: '0 0 5px 0' }}>授業管理アプリ</h2>
      <div style={{ textAlign: 'center', marginBottom: '15px', color: '#64748b', fontSize: '0.9rem', fontWeight: 'bold' }}>{currentMonth}月 第{currentWeek}週</div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {['home', 'history', 'analytics', 'map'].map(view => (
          <button key={view} onClick={() => setCurrentView(view)} style={{ flex: 1, padding: '10px 0', background: currentView === view ? '#1e293b' : '#e2e8f0', color: currentView === view ? '#fff' : '#475569', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.85rem' }}>
            {view === 'home' ? '時間割' : view === 'history' ? '履歴' : view === 'analytics' ? '分析' : 'マップ'}
          </button>
        ))}
      </div>

      {currentView === 'home' && (
        <div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '15px' }}>
            {[1, 2, 3, 4].map(q => (
              <button key={q} onClick={() => setSelectedQuarter(q)} style={{ flex: 1, padding: '8px 0', border: '1px solid #e2e8f0', borderRadius: '8px', fontWeight: 'bold', backgroundColor: selectedQuarter === q ? '#1e293b' : '#f8fafc', color: selectedQuarter === q ? 'white' : '#64748b', fontSize: '0.85rem' }}>第{q}Q</button>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', background: '#f1f5f9', padding: '5px', borderRadius: '10px' }}>
            {days.map((day, index) => (
              <button key={day} onClick={() => setSelectedDay(index)} style={{ flex: 1, padding: '10px 0', border: 'none', borderRadius: '8px', fontWeight: 'bold', backgroundColor: selectedDay === index ? '#1d4ed8' : 'transparent', color: selectedDay === index ? 'white' : '#64748b' }}>{day}</button>
            ))}
          </div>
          {MY_COURSES.filter(c => c.dayOfWeek === selectedDay && (!c.quarter || c.quarter === selectedQuarter || (Array.isArray(c.quarter) && c.quarter.includes(selectedQuarter)))).sort((a, b) => a.period - b.period).map(course => {
            const classDateStr = getClassDateStr(selectedDay);
            const targetDateQuarter = getQuarterByDate(new Date(classDateStr));
            const isSameQuarter = selectedQuarter === targetDateQuarter;
            const todayLog = getLogForClassDate(course.id, selectedDay);
            
            return (
              <div key={course.id} style={{ background: 'white', padding: '18px', borderRadius: '12px', marginTop: '15px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 'bold', color: '#64748b' }}>
                  <span>{course.room}</span>
                  <span>{course.period}時限 ({PERIODS[course.period].start}〜{PERIODS[course.period].end})</span>
                </div>
                <h3 style={{ margin: '10px 0', fontSize: '1.1rem', color: '#1e293b' }}>{course.name}</h3>
                
                {!isSameQuarter ? (
                  <div style={{ padding: '10px', background: '#f8fafc', borderRadius: '8px', textAlign: 'center', fontWeight: 'bold', color: '#94a3b8', border: '1px dashed #cbd5e1' }}>
                    期間外（現在は第{targetDateQuarter}Qです）
                  </div>
                ) : todayLog ? (
                  <div style={{ padding: '10px', background: '#f1f5f9', borderRadius: '8px', textAlign: 'center', fontWeight: 'bold', color: '#16a34a' }}>{todayLog.status} 記録済み</div>
                ) : (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {['出席', '遅刻', '欠席'].map(status => (
                      <button key={status} onClick={() => requestRecord(course.id, status, targetDateQuarter)} style={{ flex: 1, padding: '10px', background: status === '出席' ? '#22c55e' : status === '遅刻' ? '#f59e0b' : '#ef4444', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold' }}>{status}</button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {currentView === 'history' && (
        <div style={{ paddingBottom: '30px' }}>
          {sortedMonths.map(month => {
            const mKey = `m-${month}`;
            const isMOpen = expandedSections[mKey] !== false;
            return (
              <div key={month} style={{ marginBottom: '15px', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                <div onClick={() => toggleAccordion(mKey)} style={{ padding: '12px 15px', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, fontSize: '1rem' }}>{month}月</h3>
                  <span style={{ transform: isMOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: '0.3s' }}>▼</span>
                </div>
                {isMOpen && (
                  <div style={{ padding: '10px' }}>
                    {Object.keys(groupedLogs[month]).sort((a, b) => b - a).map(week => {
                      const wKey = `w-${month}-${week}`;
                      const isWOpen = expandedSections[wKey] !== false;
                      return (
                        <div key={week} style={{ marginBottom: '10px', border: '1px solid #f1f5f9', borderRadius: '8px' }}>
                          <div onClick={() => toggleAccordion(wKey)} style={{ padding: '8px 12px', background: '#f1f5f9', display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                            <span style={{fontWeight:'bold'}}>第{week}週</span>
                            <span style={{ transform: isWOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
                          </div>
                          {isWOpen && (
                            <div style={{ padding: '10px' }}>
                              {Object.keys(groupedLogs[month][week]).sort((a, b) => new Date(a) - new Date(b)).map(date => {
                                const dKey = `d-${date}`;
                                const isDOpen = expandedSections[dKey] === true;
                                const dayLogs = groupedLogs[month][week][date];
                                return (
                                  <div key={date} style={{ marginBottom: '8px' }}>
                                    <div onClick={() => toggleAccordion(dKey)} style={{ padding: '5px 10px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#64748b' }}>
                                      <span>{date} ({dayLogs[0].dayName})</span>
                                      <span style={{ transform: isDOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
                                    </div>
                                    {isDOpen && <div style={{ paddingTop: '8px' }}>{dayLogs.map(renderLogCard)}</div>}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {currentView === 'analytics' && (
        <div style={{ paddingBottom: '30px' }}>
          <div style={{ background: '#1e293b', padding: '20px', borderRadius: '12px', color: 'white', marginBottom: '20px', display: 'flex', justifyContent: 'space-between' }}>
            <div><p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>出席率</p><p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>{overallRate}%</p></div>
            <div style={{ textAlign: 'right', fontSize: '0.8rem' }}>
              <p>出席: {totalPresent}</p><p>遅刻: {totalLate}</p><p>欠席: {totalAbsent}</p>
            </div>
          </div>
          {courseAnalytics.map(stat => (
            <div key={stat.id} style={{ background: 'white', padding: '15px', borderRadius: '12px', marginBottom: '10px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>{stat.name}</div>
                  <div style={{ fontWeight: 'bold', color: stat.rate >= 80 ? '#16a34a' : '#dc2626' }}>{stat.rate}%</div>
              </div>
              <div style={{ height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${stat.rate}%`, height: '100%', background: '#22c55e' }}></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {currentView === 'map' && (
        <div style={{ paddingBottom: '30px' }}>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
            {['tsudanuma', 'mimomi'].map(c => (
              <button key={c} onClick={() => setMapCampus(c)} style={{ flex: 1, padding: '10px', background: mapCampus === c ? '#1d4ed8' : '#f1f5f9', color: mapCampus === c ? '#fff' : '#64748b', border: 'none', borderRadius: '8px', fontWeight: 'bold' }}>{c === 'tsudanuma' ? '津田沼' : '実籾'}</button>
            ))}
          </div>
          <div style={{ background: 'white', padding: '10px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <img src={mapCampus === 'tsudanuma' ? '/tsudanuma_campus-map_img_02_sp.jpg' : '/mimomi_campus-map_img_02_sp.jpg'} alt="マップ" style={{ width: '100%', borderRadius: '8px' }} />
          </div>
          <div style={{ marginTop: '15px' }}>
            {CAMPUS_BUILDINGS[mapCampus].map(b => (
              <div key={b.id} style={{ marginBottom: '10px', padding: '10px', borderBottom: '1px dashed #e2e8f0' }}>
                <div style={{ fontWeight: 'bold', color: '#1d4ed8', fontSize: '0.9rem' }}>{b.name}</div>
                <div style={{ fontSize: '0.8rem', color: '#475569' }}>{b.description}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
