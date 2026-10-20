import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { MY_COURSES } from './data/constants';
import { isCourseInQuarter } from './data/status';
import { parseDateStr, getQuarterByDate, getWeekOfMonth, getDateOfWeekday } from './utils/date';
import { useLocalStorageState } from './hooks/useLocalStorageState';
import { useToday } from './hooks/useToday';
import ConfirmRecordModal from './components/ConfirmRecordModal';
import CourseDetailModal from './components/CourseDetailModal';
import EditLogModal from './components/EditLogModal';
import DailyView from './views/DailyView';
import WeeklyView from './views/WeeklyView';
import HistoryView from './views/HistoryView';
import AnalyticsView from './views/AnalyticsView';
import MapView from './views/MapView';
import './App.css';

const VIEWS = [
  { id: 'home', label: '日別' },
  { id: 'weekly', label: '週間' },
  { id: 'history', label: '履歴' },
  { id: 'analytics', label: '分析' },
  { id: 'map', label: 'マップ' },
];

function App() {
  const today = useToday();
  const todayObj = parseDateStr(today);

  const [currentView, setCurrentView] = useState('home');
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedQuarter, setSelectedQuarter] = useState(() => getQuarterByDate(parseDateStr(today)) || 3);
  const [logs, setLogs] = useLocalStorageState('attendance_logs', []);
  const [courseMemos, setCourseMemos] = useLocalStorageState('course_memos', {});
  const [pendingRecord, setPendingRecord] = useState(null);
  const [editLog, setEditLog] = useState(null);
  const [detailCourse, setDetailCourse] = useState(null);
  const [expandedSections, setExpandedSections] = useState({});

  // 今日を表示中に日付が変わったら、表示も新しい今日に合わせる
  const prevToday = useRef(today);
  useEffect(() => {
    const prev = prevToday.current;
    if (prev === today) return;
    prevToday.current = today;
    setSelectedDate(d => d === prev ? today : d);
  }, [today]);

  // 日付を選んだら、その日が属するクォーターに切り替える
  const selectDate = useCallback((date) => {
    setSelectedDate(date);
    const q = getQuarterByDate(parseDateStr(date));
    if (q) setSelectedQuarter(q);
  }, []);

  // 選択中の日付に記録できるか（ok / outOfQuarter / future）
  const recordState = useMemo(() => {
    const quarter = getQuarterByDate(parseDateStr(selectedDate));
    if (quarter === 0 || quarter !== selectedQuarter) return { status: 'outOfQuarter', quarter };
    if (selectedDate > today) return { status: 'future', quarter };
    return { status: 'ok', quarter };
  }, [selectedDate, selectedQuarter, today]);

  const getLog = useCallback((courseId) => logs.find(log => log.courseId === courseId && log.date === selectedDate), [logs, selectedDate]);

  const saveMemo = useCallback((courseId, text) => setCourseMemos(prev => ({ ...prev, [courseId]: text })), [setCourseMemos]);

  const requestRecord = useCallback((courseId, status) => setPendingRecord({ courseId, status, date: selectedDate, quarter: recordState.quarter }), [selectedDate, recordState.quarter]);

  const confirmRecord = useCallback(() => {
    const rd = new Date(); const timeStr = `${String(rd.getHours()).padStart(2, '0')}:${String(rd.getMinutes()).padStart(2, '0')}`;
    const newLog = { id: Date.now().toString(), courseId: pendingRecord.courseId, date: pendingRecord.date, recordedAt: `${pendingRecord.date} ${timeStr}`, status: pendingRecord.status, quarter: pendingRecord.quarter };
    setLogs(prev => [...prev, newLog]);
    setPendingRecord(null);
  }, [pendingRecord, setLogs]);

  const changeLogStatus = useCallback((status) => {
    setLogs(prev => prev.map(l => l.id === editLog.id ? { ...l, status } : l));
    setEditLog(null);
  }, [editLog, setLogs]);

  const deleteLog = useCallback(() => {
    setLogs(prev => prev.filter(l => l.id !== editLog.id));
    setEditLog(null);
  }, [editLog, setLogs]);

  const toggleAccordion = useCallback((key, defaultOpen) => setExpandedSections(prev => ({ ...prev, [key]: !(prev[key] ?? defaultOpen) })), []);

  const quarterLogs = useMemo(() => logs.filter(l => l.quarter === selectedQuarter), [logs, selectedQuarter]);
  const quarterCourses = useMemo(() => MY_COURSES.filter(c => isCourseInQuarter(c, selectedQuarter)), [selectedQuarter]);

  return (
    <div className="app">
      {pendingRecord && <ConfirmRecordModal record={pendingRecord} onConfirm={confirmRecord} onCancel={() => setPendingRecord(null)} />}

      {detailCourse && (
        <CourseDetailModal
          course={detailCourse}
          memo={courseMemos[detailCourse.id]}
          recordState={recordState}
          log={getLog(detailCourse.id)}
          onSaveMemo={(text) => saveMemo(detailCourse.id, text)}
          onRecord={(status) => { setDetailCourse(null); requestRecord(detailCourse.id, status); }}
          onEditLog={(log) => { setDetailCourse(null); setEditLog(log); }}
          onClose={() => setDetailCourse(null)}
        />
      )}

      {editLog && <EditLogModal log={editLog} onChangeStatus={changeLogStatus} onDelete={deleteLog} onClose={() => setEditLog(null)} />}

      <h2 className="app-title">授業管理アプリ</h2>
      <div className="app-subtitle">{todayObj.getMonth() + 1}月 第{getWeekOfMonth(todayObj)}週</div>
      <div className="tab-row">
        {VIEWS.map(view => (
          <button key={view.id} onClick={() => setCurrentView(view.id)} className={`tab-btn${currentView === view.id ? ' is-active' : ''}`}>{view.label}</button>
        ))}
      </div>

      <div className="quarter-row">
        {[1, 2, 3, 4].map(q => (
          <button key={q} onClick={() => setSelectedQuarter(q)} className={`quarter-btn${selectedQuarter === q ? ' is-active' : ''}`}>第{q}Q</button>
        ))}
      </div>

      {currentView === 'home' && (
        <DailyView
          selectedDate={selectedDate} today={today} selectedQuarter={selectedQuarter}
          courseMemos={courseMemos} recordState={recordState} getLog={getLog}
          onSelectDate={selectDate} onOpenDetail={setDetailCourse} onRecord={requestRecord}
        />
      )}
      {currentView === 'weekly' && (
        // 週間表から開いた授業は、今週のその曜日の日付として扱う
        <WeeklyView quarterCourses={quarterCourses} courseMemos={courseMemos} onOpenDetail={(course) => { setSelectedDate(getDateOfWeekday(today, course.dayOfWeek)); setDetailCourse(course); }} />
      )}
      {currentView === 'history' && <HistoryView logs={logs} expandedSections={expandedSections} onToggle={toggleAccordion} onEditLog={setEditLog} />}
      {currentView === 'analytics' && <AnalyticsView quarterLogs={quarterLogs} quarterCourses={quarterCourses} selectedQuarter={selectedQuarter} />}
      {currentView === 'map' && <MapView />}
    </div>
  );
}

export default App;
