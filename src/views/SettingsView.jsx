import { useState } from 'react';
import { THEMES, MAX_DAYS } from '../data/settings';
import CoursesSection from '../components/settings/CoursesSection';
import CampusSection from '../components/settings/CampusSection';
import DataSection from '../components/settings/DataSection';

const pad = (n) => String(n).padStart(2, '0');

// 数値入力。入力途中の値は手元に持ち、範囲内の整数になったときだけ確定する
function NumInput({ value, min, max, label, onCommit }) {
  const [draft, setDraft] = useState(null); // null のときは保存済みの値を表示
  return (
    <input
      type="number" inputMode="numeric" min={min} max={max} aria-label={label}
      value={draft ?? value} className="input num"
      onChange={(e) => {
        const text = e.target.value; const n = Number(text);
        setDraft(text);
        if (text !== '' && Number.isInteger(n) && n >= min && n <= max) onCommit(n);
      }}
      onBlur={() => setDraft(null)}
    />
  );
}

// 'MM-DD' の月・日入力
function MonthDayInput({ value, label, onChange }) {
  const [month, day] = value.split('-').map(Number);
  return (
    <>
      <NumInput value={month} min={1} max={12} label={`${label}の月`} onCommit={(m) => onChange(`${pad(m)}-${pad(Math.min(day, MAX_DAYS[m - 1]))}`)} />月
      <NumInput value={day} min={1} max={MAX_DAYS[month - 1]} label={`${label}の日`} onCommit={(d) => onChange(`${pad(month)}-${pad(d)}`)} />日
    </>
  );
}

export default function SettingsView({ settings, onChange, appData, onChangeData, campusImages, onChangeImages, onAddCourse, onEditCourse, getBackup, onImportBackup }) {
  const setQuarter = (q, patch) => onChange({ quarters: { ...settings.quarters, [q]: { ...settings.quarters[q], ...patch } } });
  const setPeriod = (p, patch) => onChange({ periods: { ...settings.periods, [p]: { ...settings.periods[p], ...patch } } });
  const toggleCourse = (id) => onChange({
    hiddenCourses: settings.hiddenCourses.includes(id) ? settings.hiddenCourses.filter(h => h !== id) : [...settings.hiddenCourses, id],
  });

  return (
    <div className="mb-20">
      <section className="card section">
        <h3 className="section-title">テーマ</h3>
        <div className="row gap-6">
          {THEMES.map(t => (
            <button key={t.id} type="button" aria-pressed={settings.theme === t.id} onClick={() => onChange({ theme: t.id })} className={`btn grow ${settings.theme === t.id ? 'btn-primary' : 'btn-soft'}`}>{t.label}</button>
          ))}
        </div>
      </section>

      <section className="card section">
        <h3 className="section-title">クォーターの期間</h3>
        {Object.entries(settings.quarters).map(([q, range]) => (
          <div key={q} className="row align-center gap-6 range-row">
            <span className="range-label">第{q}Q</span>
            <span className="row align-center gap-6"><MonthDayInput value={range.start} label={`第${q}Q開始`} onChange={(start) => setQuarter(q, { start })} /></span>
            <span className="row align-center gap-6">〜<MonthDayInput value={range.end} label={`第${q}Q終了`} onChange={(end) => setQuarter(q, { end })} /></span>
          </div>
        ))}
        <p className="tiny muted">年をまたぐ期間は、開始を終了より後の日付にします（例: 11月1日〜1月31日）。</p>
      </section>

      <section className="card section">
        <h3 className="section-title">時限の時間</h3>
        {Object.entries(settings.periods).map(([p, time]) => (
          <div key={p} className="row align-center gap-6 range-row">
            <span className="range-label">{p}限</span>
            <input type="time" aria-label={`${p}限の開始`} value={time.start} onChange={(e) => e.target.value && setPeriod(p, { start: e.target.value })} className="input grow" />
            <span>〜</span>
            <input type="time" aria-label={`${p}限の終了`} value={time.end} onChange={(e) => e.target.value && setPeriod(p, { end: e.target.value })} className="input grow" />
          </div>
        ))}
      </section>

      <CoursesSection courses={appData.courses} hiddenCourses={settings.hiddenCourses} onToggle={toggleCourse} onEdit={onEditCourse} onAdd={onAddCourse} />
      <CampusSection campuses={appData.campuses} buildings={appData.buildings} images={campusImages} onChangeData={onChangeData} onChangeImages={onChangeImages} />
      <DataSection getBackup={getBackup} onImportBackup={onImportBackup} />
    </div>
  );
}
