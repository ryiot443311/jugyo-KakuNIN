import { useState, useEffect, useMemo, useCallback } from 'react';
import { MY_COURSES, PERIODS, CAMPUSES, CAMPUS_BUILDINGS } from './data/constants';

const days = ['日', '月', '火', '水', '木', '金', '土'];
const getQuarterByDate = (dateObj) => {
  if (!dateObj || isNaN(dateObj)) return 0;
  const md = (dateObj.getMonth() + 1) * 100 + dateObj.getDate();
  if (md >= 401 && md <= 531) return 1;
  if (md >= 601 && md <= 731) return 2;
  if (md >= 901 && md <= 1031) return 3;
  if (md >= 1101 || (md >= 101 && md <= 131)) return 4;
  return 0;
};
// 'YYYY-MM-DD' をローカル時刻の Date に変換（new Date('YYYY-MM-DD') は UTC 扱いになるため）
const parseDateStr = (str) => { const [y, m, d] = str.split('-').map(Number); return new Date(y, m - 1, d); };
const getWeekOfMonth = (date) => Math.ceil((date.getDate() + new Date(date.getFullYear(), date.getMonth(), 1).getDay()) / 7);

function App() {
  const now = useMemo(() => new Date(), []);
  const currentMonth = useMemo(() => now.getMonth() + 1, [now]);
  const currentWeek = useMemo(() => getWeekOfMonth(now), [now]);

  const [currentView, setCurrentView] = useState('home');
  const [selectedDay, setSelectedDay] = useState(now.getDay());
  const [selectedQuarter, setSelectedQuarter] = useState(getQuarterByDate(now) === 0 ? 3 : getQuarterByDate(now));
  const [logs, setLogs] = useState([]);
  const [courseMemos, setCourseMemos] = useState({});
  const [mapCampus, setMapCampus] = useState(CAMPUSES[0]?.id);
  const [mapImgError, setMapImgError] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [pendingRecord, setPendingRecord] = useState(null);
  const [editModalLog, setEditModalLog] = useState(null);
  const [editPendingStatus, setEditPendingStatus] = useState(null);
  const [expandedSections, setExpandedSections] = useState({});
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCourseForDetail, setSelectedCourseForDetail] = useState(null);
  const [tempMemo, setTempMemo] = useState('');
  const [sysError, setSysError] = useState('');

useEffect(() => {
    const errorHandler = (e) => setSysError(e.message || '予期せぬエラー');
    window.addEventListener('error', errorHandler);
    return () => window.removeEventListener('error', errorHandler);
  }, []);

  const getClassDateStr = useCallback((targetDay) => {
    const d = new Date(); d.setDate(d.getDate() + (targetDay - d.getDay()));
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  useEffect(() => {
    try { const saved = localStorage.getItem('attendance_logs'); if (saved) setLogs(JSON.parse(saved) || []); } 
    catch { localStorage.removeItem('attendance_logs'); }
    try { const savedMemos = localStorage.getItem('course_memos'); if (savedMemos) setCourseMemos(JSON.parse(savedMemos) || {}); }
    catch { localStorage.removeItem('course_memos'); }
  }, []);

  const saveMemo = useCallback((courseId, text) => {
    setCourseMemos(prev => {
      const newMemos = { ...prev, [courseId]: text };
      localStorage.setItem('course_memos', JSON.stringify(newMemos));
      return newMemos;
    });
  }, []);

  const openDetailModal = useCallback((course) => {
    setSelectedCourseForDetail(course);
    setTempMemo(courseMemos[course.id] || '');
    setShowDetailModal(true);
  }, [courseMemos]);

const requestRecord = useCallback((courseId, status, quarter) => { setPendingRecord({ courseId, status, classDateStr: getClassDateStr(selectedDay), selectedDay, quarter }); setShowModal(true); }, [getClassDateStr, selectedDay]);
  
  const confirmRecord = useCallback(() => {
    if (!pendingRecord) return;
    const rd = new Date(); const timeStr = `${String(rd.getHours()).padStart(2, '0')}:${String(rd.getMinutes()).padStart(2, '0')}`;
    const newLog = { id: Date.now().toString(), courseId: pendingRecord.courseId, date: pendingRecord.classDateStr, recordedAt: `${pendingRecord.classDateStr} ${timeStr}`, status: pendingRecord.status, quarter: pendingRecord.quarter };
    setLogs(prev => { const updated = [...prev, newLog]; localStorage.setItem('attendance_logs', JSON.stringify(updated)); return updated; });
    setShowModal(false); setPendingRecord(null);
  }, [pendingRecord]);

  const executeEdit = useCallback(() => {
    if (!editModalLog || !editPendingStatus) return;
    setLogs(prev => {
      const updated = prev.map(l => l.id === editModalLog.id ? { ...l, status: editPendingStatus } : l);
      localStorage.setItem('attendance_logs', JSON.stringify(updated)); return updated;
    });
    setEditModalLog(null); setEditPendingStatus(null);
  }, [editModalLog, editPendingStatus]);

  const getLogForClassDate = useCallback((courseId, targetDay) => logs.find(log => log.courseId === courseId && log.date === getClassDateStr(targetDay)), [logs, getClassDateStr]);

  // 年をまたいでも正しく並ぶよう 'YYYY-MM' をキーにする
  const groupedLogs = useMemo(() => logs.reduce((acc, log) => {
    const d = parseDateStr(log.date); const m = log.date.slice(0, 7); const w = getWeekOfMonth(d);
    if (!acc[m]) acc[m] = {}; if (!acc[m][w]) acc[m][w] = {}; if (!acc[m][w][log.date]) acc[m][w][log.date] = [];
    acc[m][w][log.date].push({ ...log, dayName: days[d.getDay()] }); return acc;
  }, {}), [logs]);
  const sortedMonths = useMemo(() => Object.keys(groupedLogs).sort((a, b) => b.localeCompare(a)), [groupedLogs]);

  const quarterLogs = useMemo(() => logs.filter(l => l.quarter === selectedQuarter), [logs, selectedQuarter]);
  const totalRecords = useMemo(() => quarterLogs.filter(l => l.status !== '休講').length, [quarterLogs]);
  const overallRate = useMemo(() => totalRecords === 0 ? 0 : Math.round(((quarterLogs.filter(l => l.status === '出席').length + quarterLogs.filter(l => l.status === '遅刻').length) / totalRecords) * 100), [quarterLogs, totalRecords]);

  const quarterCourses = useMemo(() => MY_COURSES.filter(c => !c.quarter || c.quarter === selectedQuarter || (Array.isArray(c.quarter) && c.quarter.includes(selectedQuarter))), [selectedQuarter]);
  
  const courseAnalytics = useMemo(() => {
    return [...new Set(quarterCourses.map(c => c.name))].map(name => {
      const rIds = quarterCourses.filter(c => c.name === name).map(c => c.id);
      const sLogs = quarterLogs.filter(l => rIds.includes(l.courseId));
      const tTotal = sLogs.filter(l => l.status !== '休講').length;
      return { name, total: tTotal, present: sLogs.filter(l => l.status === '出席').length, late: sLogs.filter(l => l.status === '遅刻').length, absent: sLogs.filter(l => l.status === '欠席').length, rate: tTotal === 0 ? 0 : Math.round(((sLogs.filter(l => l.status === '出席' || l.status === '遅刻').length) / tTotal) * 100), hasCanceled: sLogs.some(l => l.status === '休講') };
    }).filter(c => c.total > 0 || c.hasCanceled);
  }, [quarterCourses, quarterLogs]);

const toggleAccordion = useCallback((key, defaultOpen) => setExpandedSections(prev => ({ ...prev, [key]: !(prev[key] ?? defaultOpen) })), []);

  const bgColors = { '出席': '#22c55e', '遅刻': '#f59e0b', '欠席': '#ef4444', '休講': '#94a3b8' };
  const renderLogCard = (log) => {
    const courseInfo = MY_COURSES.find(c => c.id === log.courseId);
    return (
      <div key={log.id} style={{ background: 'white', padding: '12px', borderRadius: '8px', marginBottom: '8px', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <div style={{ fontSize: '0.75rem', color: '#1d4ed8', fontWeight: 'bold' }}>{courseInfo ? `${courseInfo.period}時限` : ''}</div>
          <div style={{ padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold', fontSize: '0.75rem', background: log.status === '休講' ? '#f1f5f9' : bgColors[log.status], color: log.status === '休講' ? '#64748b' : 'white' }}>{log.status}</div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div><div style={{ fontWeight: 'bold', color: '#334155', fontSize: '0.95rem', marginBottom: '4px' }}>{courseInfo?.name || '不明'}</div><div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>打刻: {log.recordedAt || log.date}</div></div>
          <button onClick={() => { setEditModalLog(log); setEditPendingStatus(null); }} style={{ padding: '6px 12px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 'bold' }}>修正</button>
        </div>
      </div>
    );
  };

  if (sysError) return <div style={{padding: '30px', color: 'red'}}>Error: {sysError}</div>;

  return (
    <div style={{ padding: '15px', fontFamily: 'sans-serif', minHeight: '100vh', background: '#fdfdfd' }}>
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', width: '85%', maxWidth: '400px', padding: '25px', borderRadius: '15px', textAlign: 'center' }}>
            <p style={{ fontWeight: 'bold' }}>{pendingRecord.classDateStr} を <span style={{color: bgColors[pendingRecord.status]}}>{pendingRecord.status}</span> で記録します。</p>
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: '12px', border: 'none', borderRadius: '8px', background: '#f1f5f9', color: '#64748b', fontWeight: 'bold' }}>キャンセル</button>
              <button onClick={confirmRecord} style={{ flex: 1, padding: '12px', border: 'none', borderRadius: '8px', background: '#1e293b', color: 'white', fontWeight: 'bold' }}>確定</button>
            </div>
          </div>
        </div>
      )}

      {showDetailModal && selectedCourseForDetail && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100 }}>
          <div style={{ backgroundColor: 'white', width: '85%', maxWidth: '400px', padding: '25px', borderRadius: '15px' }}>
            <h3 style={{ margin: '0 0 15px 0', textAlign: 'center' }}>授業詳細</h3>
            <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '10px', marginBottom: '15px', fontSize: '0.9rem' }}>
              <p style={{margin: '0 0 5px 0'}}><b>科目:</b> {selectedCourseForDetail.name}</p>
              <p style={{margin: '0 0 5px 0'}}><b>教室:</b> {selectedCourseForDetail.room}</p>
              <p style={{margin: 0}}><b>担当:</b> {selectedCourseForDetail.teacher}</p>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <p style={{ margin: '0 0 5px 0', fontWeight: 'bold', fontSize: '0.85rem', color: '#64748b' }}>メモ (自動保存)</p>
              <textarea 
                value={tempMemo} onChange={(e) => setTempMemo(e.target.value)} onBlur={() => saveMemo(selectedCourseForDetail.id, tempMemo)}
                placeholder="課題や持ち物などを入力..."
                style={{ width: '100%', height: '80px', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box', fontSize: '0.85rem', resize: 'none', fontFamily: 'inherit' }}
              />
            </div>

            {(() => {
              const tgtQ = getQuarterByDate(parseDateStr(getClassDateStr(selectedDay)));
              const isSame = (selectedQuarter === tgtQ) && (tgtQ !== 0);
              const log = getLogForClassDate(selectedCourseForDetail.id, selectedDay);
              
              if (!isSame) return <div style={{ padding: '12px', background: '#f8fafc', textAlign: 'center', color: '#94a3b8', borderRadius: '8px', marginBottom: '10px' }}>期間外のため記録できません</div>;
              if (log) return <button onClick={() => { setShowDetailModal(false); setEditModalLog(log); setEditPendingStatus(null); }} style={{ width: '100%', padding: '12px', marginBottom: '10px', background: '#1e293b', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold' }}>記録を修正する</button>;
              return (
                <div style={{ marginBottom: '15px' }}>
                  <p style={{ textAlign: 'center', fontSize: '0.85rem', color: '#64748b', marginBottom: '10px', fontWeight: 'bold' }}>記録を追加</p>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {['出席', '遅刻', '欠席', '休講'].map(s => <button key={s} onClick={() => { setShowDetailModal(false); requestRecord(selectedCourseForDetail.id, s, tgtQ); }} style={{ flex: 1, padding: '10px 0', background: bgColors[s], color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.8rem' }}>{s}</button>)}
                  </div>
                </div>
              );
            })()}
            <button onClick={() => { saveMemo(selectedCourseForDetail.id, tempMemo); setShowDetailModal(false); }} style={{ width: '100%', padding: '12px', background: 'transparent', border: 'none', color: '#64748b', fontWeight: 'bold' }}>閉じる</button>
          </div>
        </div>
      )}

      {editModalLog && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', width: '85%', padding: '25px', borderRadius: '15px' }}>
            {editPendingStatus ? (
              <div style={{ textAlign: 'center' }}>
                <p style={{fontWeight: 'bold', marginBottom: '15px'}}>【 {editPendingStatus} 】に変更しますか？</p>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => setEditPendingStatus(null)} style={{ flex: 1, padding: '12px', background: '#f1f5f9', border: 'none', borderRadius: '8px', fontWeight: 'bold', color: '#64748b' }}>戻る</button>
                  <button onClick={executeEdit} style={{ flex: 1, padding: '12px', background: '#1e293b', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold' }}>確定</button>
                </div>
              </div>
            ) : (
              <div>
                <p style={{ textAlign: 'center', fontWeight: 'bold', color: '#64748b', marginBottom: '15px' }}>状態を変更</p>
                <div style={{ display: 'flex', gap: '6px', marginBottom: '20px' }}>
                  {['出席', '遅刻', '欠席', '休講'].filter(s => s !== editModalLog.status).map(s => <button key={s} onClick={() => setEditPendingStatus(s)} style={{ flex: 1, padding: '12px 0', background: bgColors[s], color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.85rem' }}>{s}</button>)}
                </div>
                <button onClick={() => setEditModalLog(null)} style={{ width: '100%', padding: '12px', background: 'transparent', border: 'none', color: '#64748b', fontWeight: 'bold' }}>キャンセル</button>
              </div>
            )}
          </div>
        </div>
      )}

            <h2 style={{ textAlign: 'center', margin: '0 0 5px 0' }}>授業管理アプリ</h2>
      <div style={{ textAlign: 'center', marginBottom: '15px', color: '#64748b', fontSize: '0.9rem', fontWeight: 'bold' }}>{currentMonth}月 第{currentWeek}週</div>
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px' }}>
        {['home', 'weekly', 'history', 'analytics', 'map'].map(view => (
          <button key={view} onClick={() => setCurrentView(view)} style={{ flex: 1, padding: '10px 0', background: currentView === view ? '#1e293b' : '#e2e8f0', color: currentView === view ? '#fff' : '#475569', border: 'none', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 'bold' }}>
            {view === 'home' ? '日別' : view === 'weekly' ? '週間' : view === 'history' ? '履歴' : view === 'analytics' ? '分析' : 'マップ'}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '15px' }}>
        {[1, 2, 3, 4].map(q => (
          <button key={q} onClick={() => setSelectedQuarter(q)} style={{ flex: 1, padding: '8px 0', border: '1px solid #e2e8f0', borderRadius: '8px', background: selectedQuarter === q ? '#1e293b' : '#f8fafc', color: selectedQuarter === q ? 'white' : '#64748b', fontWeight: 'bold' }}>第{q}Q</button>
        ))}
      </div>

      {currentView === 'home' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', background: '#f1f5f9', padding: '5px', borderRadius: '10px' }}>
            {days.map((day, index) => (
              <button key={day} onClick={() => setSelectedDay(index)} style={{ flex: 1, padding: '10px 0', border: 'none', borderRadius: '8px', background: selectedDay === index ? '#1d4ed8' : 'transparent', color: selectedDay === index ? 'white' : '#64748b', fontWeight: 'bold' }}>{day}</button>
            ))}
          </div>
          {(() => {
            const dayCourses = MY_COURSES.filter(c => c.dayOfWeek === selectedDay && (!c.quarter || c.quarter === selectedQuarter || (Array.isArray(c.quarter) && c.quarter.includes(selectedQuarter)))).sort((a, b) => a.period - b.period);
            if (dayCourses.length === 0) return <div style={{ padding: '40px 10px', textAlign: 'center', color: '#94a3b8', fontWeight: 'bold', background: 'white', borderRadius: '12px', border: '1px dashed #cbd5e1', marginTop: '15px' }}>本日の授業なし</div>;
            
            const tgtQ = getQuarterByDate(parseDateStr(getClassDateStr(selectedDay)));
            const isSameQuarter = (selectedQuarter === tgtQ) && (tgtQ !== 0);

            return dayCourses.map(course => {
              const todayLog = getLogForClassDate(course.id, selectedDay);
              const hasMemo = courseMemos[course.id] && courseMemos[course.id].trim() !== '';
              return (
                <div key={course.id} style={{ background: 'white', padding: '18px', borderRadius: '12px', marginTop: '15px', border: '1px solid #e2e8f0', position: 'relative' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b', fontWeight: 'bold' }}>
                    <span>{course.room}</span>
                    <div style={{display:'flex', gap:'10px', alignItems: 'center'}}>
                      <span>{course.period}時限 ({PERIODS[course.period]?.start || ''}〜{PERIODS[course.period]?.end || ''})</span>
                      {isSameQuarter && <button onClick={() => openDetailModal(course)} style={{background:'#f1f5f9', border:'none', fontSize:'1rem', borderRadius: '50%', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569'}}>⋯</button>}
                    </div>
                  </div>
                  <h3 style={{ margin: '10px 0', fontSize: '1.1rem' }}>{course.name}</h3>
                  {hasMemo && (
                    <div style={{ padding: '8px 12px', background: '#fffbeb', borderRadius: '6px', borderLeft: '4px solid #f59e0b', fontSize: '0.85rem', color: '#b45309', marginBottom: '15px', whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>{courseMemos[course.id]}</div>
                  )}
                  {!isSameQuarter ? (
                    <div style={{ padding: '10px', background: '#f8fafc', textAlign: 'center', color: '#94a3b8', borderRadius: '8px', fontWeight: 'bold' }}>期間外</div>
                  ) : todayLog ? (
                    <div style={{ padding: '10px', background: '#f1f5f9', textAlign: 'center', fontWeight: 'bold', borderRadius: '8px', color: bgColors[todayLog.status] || '#64748b' }}>{todayLog.status} 記録済み</div>
                  ) : (
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {['出席', '遅刻', '欠席', '休講'].map(status => <button key={status} onClick={() => requestRecord(course.id, status, tgtQ)} style={{ flex: 1, padding: '10px 0', background: bgColors[status], color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.85rem' }}>{status}</button>)}
                    </div>
                  )}
                </div>
              );
            });
          })()}
        </div>
      )}

      {currentView === 'weekly' && (
        <div style={{ overflowX: 'auto', background: 'white', padding: '10px', borderRadius: '12px' }}>
          <table style={{ width: '100%', minWidth: '520px', borderCollapse: 'collapse' }}>
            <thead><tr><th style={{width: '30px'}}></th>{days.slice(1,7).map(d => <th key={d} style={{padding: '8px', color: '#64748b'}}>{d}</th>)}</tr></thead>
            <tbody>
              {Object.keys(PERIODS).map(p => (
                <tr key={p}>
                  <td style={{ textAlign: 'center', color: '#94a3b8', fontWeight: 'bold' }}>{p}</td>
                  {days.slice(1,7).map((_, i) => (
                    <td key={i} style={{ padding: '4px', border: '1px solid #f1f5f9', verticalAlign: 'top' }}>
                      {quarterCourses.filter(c => c.dayOfWeek === i + 1 && c.period === Number(p)).map(course => {
                        const hasMemo = courseMemos[course.id] && courseMemos[course.id].trim() !== '';
                        return (
                          <div key={course.id} onClick={() => { setSelectedDay(i+1); openDetailModal(course); }} style={{ background: '#f8fafc', padding: '6px', borderRadius: '6px', marginBottom: '4px', border: '1px solid #e2e8f0', cursor: 'pointer', position: 'relative' }}>
                            <div style={{ fontWeight: 'bold', color: '#1d4ed8', fontSize: '0.65rem', marginBottom: '2px' }}>{course.name}</div>
                            <div style={{ color: '#64748b', fontSize: '0.6rem' }}>{course.room}</div>
                            {hasMemo && <div style={{ position: 'absolute', bottom: '4px', right: '4px', width: '6px', height: '6px', background: '#f59e0b', borderRadius: '50%' }}></div>}
                          </div>
                        );
                      })}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {currentView === 'history' && (
        <div style={{ paddingBottom: '30px' }}>
          {sortedMonths.map(month => {
            const mKey = `m-${month}`; const isMOpen = expandedSections[mKey] !== false;
            return (
              <div key={month} style={{ marginBottom: '15px', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                <div onClick={() => toggleAccordion(mKey, true)} style={{ padding: '12px 15px', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                  <h3 style={{ margin: 0, fontSize: '1rem' }}>{month.slice(0, 4)}年{Number(month.slice(5))}月</h3>
                  <span style={{ transform: isMOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
                </div>
                {isMOpen && (
                  <div style={{ padding: '10px' }}>
                    {Object.keys(groupedLogs[month]).sort((a, b) => b - a).map(week => {
                      const wKey = `w-${month}-${week}`; const isWOpen = expandedSections[wKey] !== false;
                      return (
                        <div key={week} style={{ marginBottom: '10px', border: '1px solid #f1f5f9', borderRadius: '8px' }}>
                          <div onClick={() => toggleAccordion(wKey, true)} style={{ padding: '8px 12px', background: '#f1f5f9', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                            <span>第{week}週</span>
                            <span style={{ transform: isWOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
                          </div>
                          {isWOpen && (
                            <div style={{ padding: '10px' }}>
                              {Object.keys(groupedLogs[month][week]).sort().map(date => {
                                const dKey = `d-${date}`; const isDOpen = expandedSections[dKey] === true;
                                const dayLogs = groupedLogs[month][week][date];
                                return (
                                  <div key={date} style={{ marginBottom: '8px' }}>
                                    <div onClick={() => toggleAccordion(dKey, false)} style={{ padding: '5px 10px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', color: '#64748b', fontWeight: 'bold' }}>
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
            <div><p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0 0 5px 0' }}>出席率 (第{selectedQuarter}Q)</p><p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>{overallRate}%</p></div>
            <div style={{ textAlign: 'right', fontSize: '0.85rem' }}>
              <p style={{margin: '0 0 4px 0'}}>出席: {quarterLogs.filter(l => l.status === '出席').length}</p>
              <p style={{margin: '0 0 4px 0'}}>遅刻: {quarterLogs.filter(l => l.status === '遅刻').length}</p>
              <p style={{margin: 0}}>欠席: {quarterLogs.filter(l => l.status === '欠席').length}</p>
            </div>
          </div>
          {courseAnalytics.map(stat => (
            <div key={stat.name} style={{ background: 'white', padding: '15px', borderRadius: '12px', marginBottom: '10px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>{stat.name}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{stat.total}回の授業</div>
                </div>
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
            {CAMPUSES.map(c => (
              <button key={c.id} onClick={() => { setMapCampus(c.id); setMapImgError(false); }} style={{ flex: 1, padding: '12px', background: mapCampus === c.id ? '#1d4ed8' : '#f1f5f9', color: mapCampus === c.id ? '#fff' : '#64748b', border: 'none', borderRadius: '8px', fontWeight: 'bold' }}>{c.name}</button>
            ))}
          </div>
          {(() => {
            const mapImage = CAMPUSES.find(c => c.id === mapCampus)?.mapImage;
            if (!mapImage || mapImgError) return <div style={{ padding: '30px 10px', textAlign: 'center', color: '#94a3b8', background: 'white', borderRadius: '12px', border: '1px dashed #cbd5e1', fontSize: '0.85rem' }}>マップ画像がありません（public/ に画像を配置してください）</div>;
            return (
              <div style={{ background: 'white', padding: '10px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <img src={mapImage} alt="マップ" onError={() => setMapImgError(true)} style={{ width: '100%', borderRadius: '8px' }} />
              </div>
            );
          })()}
          <div style={{ marginTop: '15px' }}>
            {CAMPUS_BUILDINGS[mapCampus]?.map(b => (
              <div key={b.id} style={{ marginBottom: '10px', padding: '15px', background: 'white', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontWeight: 'bold', color: '#1d4ed8', fontSize: '0.95rem', marginBottom: '5px' }}>{b.name}</div>
                <div style={{ fontSize: '0.8rem', color: '#475569', lineHeight: '1.4' }}>{b.description}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
