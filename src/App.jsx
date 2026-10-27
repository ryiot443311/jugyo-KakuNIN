import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { QUARTERS } from './data/constants';
import { isCourseInQuarter } from './data/status';
import { SETTINGS_KEY, resolveSettings } from './data/settings';
import { COURSES_KEY, CAMPUSES_KEY, BUILDINGS_KEY, IMAGES_KEY, resolveAppData } from './data/appData';
import { sanitizeLogs, sanitizeMemos } from './data/sanitize';
import { buildBackup } from './data/backup';
import { mergeBackupData } from './data/merge';
import { findUnrecorded, LOOKBACK_DAYS } from './utils/unrecorded';
import { parseDateStr, getQuarterByDate, getNearestQuarter, getWeekOfMonth, getDateOfWeekday, getFiscalYear } from './utils/date';
import { buildCourseAnalytics, calcRate, countStatuses } from './utils/stats';
import { absenceByWeekday, topAbsenceSlots, weeklyRates } from './utils/trends';
import { dateMemoKey } from './utils/memo';
import { applyTheme } from './utils/theme';
import { useLocalStorageState, useSaveFailed } from './hooks/useLocalStorageState';
import { useToday } from './hooks/useToday';
import { useNowMinutes } from './hooks/useNowMinutes';
import ConfirmRecordModal from './components/ConfirmRecordModal';
import UndoToast from './components/UndoToast';
import UnrecordedModal from './components/UnrecordedModal';
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

const UNDO_MS = 6000; // 記録後に「元に戻す」を出しておく時間

const PART_NAMES = {
  logs: '出席記録', courses: '授業', courseMemos: '授業メモ', datedMemos: '日付別メモ',
  campuses: 'キャンパス', campusBuildings: '施設の説明', campusImages: 'マップ画像',
};

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

  // 授業・キャンパス・施設は別々のキーで保存する（courses・campus_buildings は以前のバージョンと同じ形式）
  const [savedCourses, setSavedCourses] = useLocalStorageState(COURSES_KEY, null);
  const [savedCampuses, setSavedCampuses] = useLocalStorageState(CAMPUSES_KEY, null);
  const [savedBuildings, setSavedBuildings] = useLocalStorageState(BUILDINGS_KEY, null);
  const appData = useMemo(
    () => resolveAppData({ courses: savedCourses, campuses: savedCampuses, buildings: savedBuildings }),
    [savedCourses, savedCampuses, savedBuildings],
  );
  const updateData = useCallback((patch) => {
    if (patch.courses) setSavedCourses(patch.courses);
    if (patch.campuses) setSavedCampuses(patch.campuses);
    if (patch.buildings) setSavedBuildings(patch.buildings);
  }, [setSavedCourses, setSavedCampuses, setSavedBuildings]);
  const [campusImages, setCampusImages] = useLocalStorageState(IMAGES_KEY, {});

  const saveFailed = useSaveFailed();
  const [saveErrorDismissed, setSaveErrorDismissed] = useState(false);

  const [currentView, setCurrentView] = useState('home');
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedQuarter, setSelectedQuarter] = useState(() => getNearestQuarter(parseDateStr(today), settings.quarters));
  const [logs, setLogs] = useLocalStorageState('attendance_logs', [], sanitizeLogs);
  const [courseMemos, setCourseMemos] = useLocalStorageState('course_memos', {}, sanitizeMemos);
  const [dateMemos, setDateMemos] = useLocalStorageState('dated_memos', {}, sanitizeMemos);
  const [pendingRecord, setPendingRecord] = useState(null);
  const [undo, setUndo] = useState(null); // { logId, text }
  const [showUnrecorded, setShowUnrecorded] = useState(false);
  const [analyticsYear, setAnalyticsYear] = useState(() => getFiscalYear(today));
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

  const logIndex = useMemo(() => new Map(logs.map(log => [`${log.courseId}|${log.date}`, log])), [logs]);
  const getLog = useCallback((courseId) => logIndex.get(`${courseId}|${selectedDate}`), [logIndex, selectedDate]);

  const saveMemo = useCallback((courseId, text) => setCourseMemos(prev => ({ ...prev, [courseId]: text })), [setCourseMemos]);

  // 空のメモはキーごと消す
  const saveDateMemo = useCallback((courseId, text) => setDateMemos(prev => {
    const key = dateMemoKey(courseId, selectedDate);
    const next = { ...prev };
    if (text.trim() === '') delete next[key]; else next[key] = text;
    return next;
  }), [selectedDate, setDateMemos]);

  const requestRecord = useCallback((courseId, status) => setPendingRecord({ courseId, status, date: selectedDate, quarter: recordState.quarter }), [selectedDate, recordState.quarter]);

  const confirmRecord = useCallback(() => {
    const rd = new Date(); const timeStr = `${String(rd.getHours()).padStart(2, '0')}:${String(rd.getMinutes()).padStart(2, '0')}`;
    const newLog = { id: Date.now().toString(), courseId: pendingRecord.courseId, date: pendingRecord.date, recordedAt: `${pendingRecord.date} ${timeStr}`, status: pendingRecord.status, quarter: pendingRecord.quarter };
    setLogs(prev => [...prev, newLog]);
    setUndo({ logId: newLog.id, text: `「${appData.courses.find(c => c.id === newLog.courseId)?.name ?? '授業'}」を${newLog.status}で記録しました` });
    setPendingRecord(null);
  }, [pendingRecord, appData.courses, setLogs]);

  // 記録後しばらくしたら「元に戻す」を消す
  useEffect(() => {
    if (!undo) return undefined;
    const timer = setTimeout(() => setUndo(null), UNDO_MS);
    return () => clearTimeout(timer);
  }, [undo]);

  const undoRecord = useCallback(() => {
    setLogs(prev => prev.filter(l => l.id !== undo.logId));
    setUndo(null);
  }, [undo, setLogs]);

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

  const getBackup = () => JSON.stringify(buildBackup({
    logs, courseMemos, datedMemos: dateMemos, courses: appData.courses, settings,
    campuses: appData.campuses, campusBuildings: appData.buildings, campusImages,
  }), null, 2);

  // バックアップを読み込む。mode が 'merge' なら手元にないものだけ足し、'replace' なら含まれていた項目を置き換える
  // 戻り値は、結果の説明文
  const importBackup = (incoming, mode) => {
    const backup = mode === 'merge'
      ? mergeBackupData({
        logs, courseMemos, datedMemos: dateMemos, campusImages,
        // 初期データのまま（一度も編集していない）の授業・キャンパス・施設は、統合せず読み込んだ内容に置き換える
        courses: savedCourses ? appData.courses : [],
        campuses: savedCampuses ? appData.campuses : [],
        campusBuildings: savedBuildings ? appData.buildings : {},
      }, incoming)
      : { data: incoming };
    applyBackup(backup.data);
    if (mode !== 'merge') return '読み込みました（置き換え）。';
    const added = Object.entries(backup.stats).filter(([, s]) => s.added > 0).map(([k, s]) => `${PART_NAMES[k]} ${s.added}件`);
    const skipped = Object.values(backup.stats).reduce((n, s) => n + s.skipped, 0);
    return `統合しました。追加: ${added.length > 0 ? added.join('、') : 'なし'}${skipped > 0 ? `（手元と同じ ${skipped}件は手元を優先）` : ''}`;
  };

  // 含まれていた項目だけを反映する
  const applyBackup = (backup) => {
    if (backup.courses) setSavedCourses(backup.courses);
    if (backup.campuses) setSavedCampuses(backup.campuses);
    if (backup.campusBuildings) setSavedBuildings(backup.campusBuildings);
    if (backup.campusImages) setCampusImages(backup.campusImages);
    if (backup.settings) setSavedSettings(backup.settings);
    if (backup.logs) setLogs(backup.logs);
    if (backup.courseMemos) setCourseMemos(backup.courseMemos);
    if (backup.datedMemos) setDateMemos(backup.datedMemos);
  };

  const toggleAccordion = useCallback((key, defaultOpen) => setExpandedSections(prev => ({ ...prev, [key]: !(prev[key] ?? defaultOpen) })), []);

  // 設定で非表示にした授業は日別・週間・分析から外す（履歴には記録が残る）
  const courses = useMemo(() => appData.courses.filter(c => !settings.hiddenCourses.includes(c.id)), [appData.courses, settings.hiddenCourses]);
  const quarterCourses = useMemo(() => courses.filter(c => isCourseInQuarter(c, selectedQuarter)), [courses, selectedQuarter]);
  // 分析の年度の選択肢（記録のある年度と今年度）。選択中の年度が無くなったら新しい年度に寄せる
  const fiscalYears = useMemo(() => [...new Set([getFiscalYear(today), ...logs.map(l => getFiscalYear(l.date))])].sort((a, b) => b - a), [logs, today]);
  const year = fiscalYears.includes(analyticsYear) ? analyticsYear : fiscalYears[0];
  const quarterLogs = useMemo(() => {
    const ids = new Set(courses.map(c => c.id));
    return logs.filter(l => l.quarter === selectedQuarter && ids.has(l.courseId) && getFiscalYear(l.date) === year);
  }, [logs, courses, selectedQuarter, year]);
  // 記録し忘れの授業（日別画面で知らせる）
  const unrecorded = useMemo(
    () => findUnrecorded({ logs, courses, quarters: settings.quarters, periods: settings.periods, today, nowMin }),
    [logs, courses, settings.quarters, settings.periods, today, nowMin],
  );
  const weekly = useMemo(() => weeklyRates(quarterLogs), [quarterLogs]);
  const absenceWeekdays = useMemo(() => absenceByWeekday(quarterLogs), [quarterLogs]);
  const absenceSlots = useMemo(() => topAbsenceSlots(quarterLogs, quarterCourses), [quarterLogs, quarterCourses]);
  const statusCounts = useMemo(() => countStatuses(quarterLogs), [quarterLogs]);
  const overallRate = calcRate(statusCounts['出席'], statusCounts['遅刻'], statusCounts['欠席']);
  const courseAnalytics = useMemo(() => buildCourseAnalytics(quarterCourses, quarterLogs, settings.threshold), [quarterCourses, quarterLogs, settings.threshold]);

  return (
    <div className="app">
      {pendingRecord && <ConfirmRecordModal record={pendingRecord} onConfirm={confirmRecord} onCancel={() => setPendingRecord(null)} />}

      {detailCourse && (
        <CourseDetailModal
          course={detailCourse}
          date={selectedDate}
          memo={courseMemos[detailCourse.id]}
          dateMemo={dateMemos[dateMemoKey(detailCourse.id, selectedDate)]}
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
          courses={courses} periods={settings.periods} nowMin={nowMin} logs={logs}
          courseMemos={courseMemos} dateMemos={dateMemos} recordState={recordState} getLog={getLog}
          onSelectDate={selectDate} onOpenDetail={setDetailCourse} onRecord={requestRecord} onAddCourse={openAddCourse}
          unrecordedCount={unrecorded.length} lookbackDays={LOOKBACK_DAYS} onShowUnrecorded={() => setShowUnrecorded(true)}
        />
      )}
      {showUnrecorded && (
        <UnrecordedModal items={unrecorded} onSelect={(date) => { selectDate(date); setShowUnrecorded(false); }} onClose={() => setShowUnrecorded(false)} />
      )}
      {currentView === 'weekly' && (
        // 週間表から開いた授業は、今週のその曜日の日付として扱う
        <WeeklyView today={today} periods={settings.periods} quarterCourses={quarterCourses} courseMemos={courseMemos} onOpenDetail={(course) => { setSelectedDate(getDateOfWeekday(today, course.dayOfWeek)); setDetailCourse(course); }} onAddCourse={openAddCourse} />
      )}
      {currentView === 'history' && <HistoryView logs={logs} courses={appData.courses} expandedSections={expandedSections} onToggle={toggleAccordion} onEditLog={setEditLog} />}
      {currentView === 'analytics' && (
        <AnalyticsView
          selectedQuarter={selectedQuarter} statusCounts={statusCounts} overallRate={overallRate} courseAnalytics={courseAnalytics}
          threshold={settings.threshold} years={fiscalYears} year={year} onYearChange={setAnalyticsYear}
          weekly={weekly} absenceWeekdays={absenceWeekdays} absenceSlots={absenceSlots}
        />
      )}
      {currentView === 'map' && <MapView campuses={appData.campuses} buildings={appData.buildings} campusImages={campusImages} />}
      {currentView === 'settings' && (
        <SettingsView
          settings={settings} onChange={updateSettings}
          appData={appData} onChangeData={updateData} campusImages={campusImages} onChangeImages={setCampusImages}
          onAddCourse={() => openAddCourse()} onEditCourse={(course) => setCourseForm({ course })}
          logs={logs} logCount={logs.length} onResetLogs={() => setLogs([])}
          getBackup={getBackup} onImportBackup={importBackup}
        />
      )}

      {undo && <UndoToast text={undo.text} onUndo={undoRecord} />}
    </div>
  );
}

export default App;
