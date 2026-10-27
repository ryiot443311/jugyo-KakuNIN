import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { QUARTERS } from './data/constants';
import { isCourseInQuarter } from './data/status';
import { SETTINGS_KEY, resolveSettings } from './data/settings';
import { DATA_KEY, IMAGES_KEY, resolveAppData } from './data/appData';
import { buildBackup } from './data/backup';
import { parseDateStr, getQuarterByDate, getWeekOfMonth, getDateOfWeekday } from './utils/date';
import { dateMemoKey } from './utils/memo';
import { applyTheme } from './utils/theme';
import { useLocalStorageState, useSaveFailed } from './hooks/useLocalStorageState';
import { useToday } from './hooks/useToday';
import { useNowMinutes } from './hooks/useNowMinutes';
import ConfirmRecordModal from './components/ConfirmRecordModal';
import CourseDetailModal from './components/CourseDetailModal';
import EditLogModal from './components/EditLogModal';
import CourseFormModal from './components/CourseFormModal';
import DailyView from './views/DailyView';
import WeeklyView from './views/WeeklyView';
import HistoryView from './views/HistoryView';
import AnalyticsView from './views/AnalyticsView';
import MapView from './views/MapView';
import SettingsView from './views/SettingsView';
import './App.css';

const VIEWS = [
  { id: 'home', label: '日別' },
  { id: 'weekly', label: '週間' },
  { id: 'history', label: '履歴' },
  { id: 'analytics', label: '分析' },
  { id: 'map', label: 'マップ' },
  { id: 'settings', label: '設定' },
];

function App() {
  const today = useToday();
  const nowMin = useNowMinutes();
  const todayObj = parseDateStr(today);

  const [savedSettings, setSavedSettings] = useLocalStorageState(SETTINGS_KEY, {});
  const settings = useMemo(() => resolveSettings(savedSettings), [savedSettings]);
  const updateSettings = useCallback((patch) => setSavedSettings({ ...settings, ...patch }), [settings, setSavedSettings]);
  useEffect(() => { applyTheme(settings.theme); }, [settings.theme]);

  const [savedData, setSavedData] = useLocalStorageState(DATA_KEY, {});
  const appData = useMemo(() => resolveAppData(savedData), [savedData]);
  const updateData = useCallback((patch) => setSavedData({ ...appData, ...patch }), [appData, setSavedData]);
  const [campusImages, setCampusImages] = useLocalStorageState(IMAGES_KEY, {});

  const saveFailed = useSaveFailed();
  const [saveErrorDismissed, setSaveErrorDismissed] = useState(false);

  const [currentView, setCurrentView] = useState('home');
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedQuarter, setSelectedQuarter] = useState(() => getQuarterByDate(parseDateStr(today), settings.quarters) || 3);
  const [logs, setLogs] = useLocalStorageState('attendance_logs', []);
  const [courseMemos, setCourseMemos] = useLocalStorageState('course_memos', {});
  const [dateMemos, setDateMemos] = useLocalStorageState('date_memos', {});
  const [pendingRecord, setPendingRecord] = useState(null);
  const [editLog, setEditLog] = useState(null);
  const [detailCourse, setDetailCourse] = useState(null);
  const [courseForm, setCourseForm] = useState(null); // { course, preset }
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
    const q = getQuarterByDate(parseDateStr(date), settings.quarters);
    if (q) setSelectedQuarter(q);
  }, [settings.quarters]);

  // 選択中の日付に記録できるか（ok / outOfQuarter / future）
  const recordState = useMemo(() => {
    const quarter = getQuarterByDate(parseDateStr(selectedDate), settings.quarters);
    if (quarter === 0 || quarter !== selectedQuarter) return { status: 'outOfQuarter', quarter };
    if (selectedDate > today) return { status: 'future', quarter };
    return { status: 'ok', quarter };
  }, [selectedDate, selectedQuarter, today, settings.quarters]);

  const getLog = useCallback((courseId) => logs.find(log => log.courseId === courseId && log.date === selectedDate), [logs, selectedDate]);

  const saveMemo = useCallback((courseId, text) => setCourseMemos(prev => ({ ...prev, [courseId]: text })), [setCourseMemos]);

  // 空のメモはキーごと消す
  const saveDateMemo = useCallback((courseId, text) => setDateMemos(prev => {
    const key = dateMemoKey(selectedDate, courseId);
    const next = { ...prev };
    if (text.trim() === '') delete next[key]; else next[key] = text;
    return next;
  }), [selectedDate, setDateMemos]);

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

  const openAddCourse = useCallback((preset) => setCourseForm({ course: null, preset: { quarters: [selectedQuarter], ...preset } }), [selectedQuarter]);

  const saveCourse = useCallback((course) => {
    const exists = appData.courses.some(c => c.id === course.id);
    updateData({ courses: exists ? appData.courses.map(c => (c.id === course.id ? course : c)) : [...appData.courses, course] });
    setCourseForm(null);
  }, [appData.courses, updateData]);

  const deleteCourse = useCallback((id) => {
    updateData({ courses: appData.courses.filter(c => c.id !== id) });
    setCourseForm(null);
  }, [appData.courses, updateData]);

  const getBackup = () => buildBackup({ appData, settings, campusImages, logs, courseMemos, dateMemos });

  // バックアップに含まれていた項目だけを置き換える
  const importBackup = (backup) => {
    if (backup.appData) setSavedData(backup.appData);
    if (backup.settings) setSavedSettings(backup.settings);
    if (backup.campusImages) setCampusImages(backup.campusImages);
    if (backup.logs) setLogs(backup.logs);
    if (backup.courseMemos) setCourseMemos(backup.courseMemos);
    if (backup.dateMemos) setDateMemos(backup.dateMemos);
  };

  const toggleAccordion = useCallback((key, defaultOpen) => setExpandedSections(prev => ({ ...prev, [key]: !(prev[key] ?? defaultOpen) })), []);

  // 設定で非表示にした授業は日別・週間・分析から外す（履歴には記録が残る）
  const courses = useMemo(() => appData.courses.filter(c => !settings.hiddenCourses.includes(c.id)), [appData.courses, settings.hiddenCourses]);
  const quarterCourses = useMemo(() => courses.filter(c => isCourseInQuarter(c, selectedQuarter)), [courses, selectedQuarter]);
  const quarterLogs = useMemo(() => {
    const ids = new Set(courses.map(c => c.id));
    return logs.filter(l => l.quarter === selectedQuarter && ids.has(l.courseId));
  }, [logs, courses, selectedQuarter]);

  return (
    <div className="app">
      {pendingRecord && <ConfirmRecordModal record={pendingRecord} onConfirm={confirmRecord} onCancel={() => setPendingRecord(null)} />}

      {detailCourse && (
        <CourseDetailModal
          course={detailCourse}
          date={selectedDate}
          memo={courseMemos[detailCourse.id]}
          dateMemo={dateMemos[dateMemoKey(selectedDate, detailCourse.id)]}
          recordState={recordState}
          log={getLog(detailCourse.id)}
          onSaveMemo={(text) => saveMemo(detailCourse.id, text)}
          onSaveDateMemo={(text) => saveDateMemo(detailCourse.id, text)}
          onRecord={(status) => { setDetailCourse(null); requestRecord(detailCourse.id, status); }}
          onEditLog={(log) => { setDetailCourse(null); setEditLog(log); }}
          onEdit={() => { setCourseForm({ course: detailCourse }); setDetailCourse(null); }}
          onClose={() => setDetailCourse(null)}
        />
      )}

      {courseForm && (
        <CourseFormModal
          course={courseForm.course} preset={courseForm.preset} periods={settings.periods}
          logCount={courseForm.course ? logs.filter(l => l.courseId === courseForm.course.id).length : 0}
          onSave={saveCourse} onDelete={deleteCourse} onClose={() => setCourseForm(null)}
        />
      )}

      {editLog && <EditLogModal log={editLog} onChangeStatus={changeLogStatus} onDelete={deleteLog} onClose={() => setEditLog(null)} />}

      <h2 className="app-title">授業管理アプリ</h2>
      <div className="app-sub">{todayObj.getMonth() + 1}月 第{getWeekOfMonth(todayObj)}週</div>

      {saveFailed && !saveErrorDismissed && (
        <div className="error-banner" role="alert">
          <span>データを端末に保存できません。このままだと記録が残らない可能性があります。</span>
          <button type="button" onClick={() => setSaveErrorDismissed(true)} className="btn btn-ghost btn-small">閉じる</button>
        </div>
      )}

      <nav className="tabs" aria-label="画面切り替え">
        {VIEWS.map(view => (
          <button key={view.id} type="button" onClick={() => setCurrentView(view.id)} aria-current={currentView === view.id ? 'page' : undefined} className={`tab${currentView === view.id ? ' is-active' : ''}`}>{view.label}</button>
        ))}
      </nav>

      {/* クォーターに関係しないマップ・設定では非表示 */}
      {currentView !== 'map' && currentView !== 'settings' && (
        <div className="quarters">
          {Object.keys(QUARTERS).map(Number).map(q => (
            <button key={q} type="button" onClick={() => setSelectedQuarter(q)} aria-pressed={selectedQuarter === q} className={`quarter${selectedQuarter === q ? ' is-active' : ''}`}>第{q}Q</button>
          ))}
        </div>
      )}

      {currentView === 'home' && (
        <DailyView
          selectedDate={selectedDate} today={today} selectedQuarter={selectedQuarter}
          courses={courses} periods={settings.periods} nowMin={nowMin}
          courseMemos={courseMemos} dateMemos={dateMemos} recordState={recordState} getLog={getLog}
          onSelectDate={selectDate} onOpenDetail={setDetailCourse} onRecord={requestRecord} onAddCourse={openAddCourse}
        />
      )}
      {currentView === 'weekly' && (
        // 週間表から開いた授業は、今週のその曜日の日付として扱う
        <WeeklyView today={today} periods={settings.periods} quarterCourses={quarterCourses} courseMemos={courseMemos} onOpenDetail={(course) => { setSelectedDate(getDateOfWeekday(today, course.dayOfWeek)); setDetailCourse(course); }} onAddCourse={openAddCourse} />
      )}
      {currentView === 'history' && <HistoryView logs={logs} courses={appData.courses} expandedSections={expandedSections} onToggle={toggleAccordion} onEditLog={setEditLog} />}
      {currentView === 'analytics' && <AnalyticsView quarterLogs={quarterLogs} quarterCourses={quarterCourses} selectedQuarter={selectedQuarter} />}
      {currentView === 'map' && <MapView campuses={appData.campuses} buildings={appData.buildings} campusImages={campusImages} />}
      {currentView === 'settings' && (
        <SettingsView
          settings={settings} onChange={updateSettings}
          appData={appData} onChangeData={updateData} campusImages={campusImages} onChangeImages={setCampusImages}
          onAddCourse={() => openAddCourse()} onEditCourse={(course) => setCourseForm({ course })}
          logCount={logs.length} onResetLogs={() => setLogs([])}
          getBackup={getBackup} onImportBackup={importBackup}
        />
      )}
    </div>
  );
}

export default App;
