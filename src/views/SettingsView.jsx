import { useState } from 'react';
import { THEMES, MAX_DAYS } from '../data/settings';
import SettingsGroup from '../components/settings/SettingsGroup';
import CoursesSection from '../components/settings/CoursesSection';
import CampusSection from '../components/settings/CampusSection';
import DataSection from '../components/settings/DataSection';
import DangerSection from '../components/settings/DangerSection';
import CsvSection from '../components/settings/CsvSection';
import InstallSection from '../components/settings/InstallSection';
import NotifySection from '../components/settings/NotifySection';
import { LANGS, useI18n } from '../i18n';

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
  const t = useI18n();
  const [month, day] = value.split('-').map(Number);
  return (
    <>
      <NumInput value={month} min={1} max={12} label={t.monthOf(label)} onCommit={(m) => onChange(`${pad(m)}-${pad(Math.min(day, MAX_DAYS[m - 1]))}`)} />{t.monthUnit}
      <NumInput value={day} min={1} max={MAX_DAYS[month - 1]} label={t.dayOf(label)} onCommit={(d) => onChange(`${pad(month)}-${pad(d)}`)} />{t.dayUnit}
    </>
  );
}

export default function SettingsView({ settings, onChange, courses, today, appData, onChangeData, campusImages, onChangeImages, logs, logCount, onResetLogs, onAddCourse, onEditCourse, getBackup, onImportBackup }) {
  const t = useI18n();
  const setQuarter = (q, patch) => onChange({ quarters: { ...settings.quarters, [q]: { ...settings.quarters[q], ...patch } } });
  const setPeriod = (p, patch) => onChange({ periods: { ...settings.periods, [p]: { ...settings.periods[p], ...patch } } });
  const toggleCourse = (id) => onChange({
    hiddenCourses: settings.hiddenCourses.includes(id) ? settings.hiddenCourses.filter(h => h !== id) : [...settings.hiddenCourses, id],
  });

  return (
    <div className="mb-20">
      <SettingsGroup title={t.language}>
        <div className="row gap-6">
          {LANGS.map(l => (
            <button key={l.id} type="button" lang={l.id} aria-pressed={settings.lang === l.id} onClick={() => onChange({ lang: l.id })} className={`btn grow ${settings.lang === l.id ? 'btn-primary' : 'btn-soft'}`}>{l.label}</button>
          ))}
        </div>
      </SettingsGroup>

      <SettingsGroup title={t.theme}>
        <div className="row gap-6">
          {THEMES.map(theme => (
            <button key={theme.id} type="button" aria-pressed={settings.theme === theme.id} onClick={() => onChange({ theme: theme.id })} className={`btn grow ${settings.theme === theme.id ? 'btn-primary' : 'btn-soft'}`}>{t.themes[theme.id]}</button>
          ))}
        </div>
      </SettingsGroup>

      <CoursesSection courses={appData.courses} hiddenCourses={settings.hiddenCourses} onToggle={toggleCourse} onEdit={onEditCourse} onAdd={onAddCourse} />
      <CampusSection campuses={appData.campuses} buildings={appData.buildings} images={campusImages} onChangeData={onChangeData} onChangeImages={onChangeImages} />
      <SettingsGroup title={t.threshold}>
        <div className="row gap-10 align-center">
          <NumInput value={settings.threshold} min={1} max={100} label={t.threshold} onCommit={(threshold) => onChange({ threshold })} />
          <span>{t.percentOrMore}</span>
        </div>
        <p className="small muted mt-8">{t.thresholdNote}</p>
      </SettingsGroup>

      <SettingsGroup title={t.quarterPeriods}>
        {Object.entries(settings.quarters).map(([q, range]) => (
          <div key={q} className="row align-center gap-6 range-row">
            <span className="range-label">{t.quarter(q)}</span>
            <span className="row align-center gap-6"><MonthDayInput value={range.start} label={t.quarterStart(q)} onChange={(start) => setQuarter(q, { start })} /></span>
            <span className="row align-center gap-6">{t.tilde}<MonthDayInput value={range.end} label={t.quarterEnd(q)} onChange={(end) => setQuarter(q, { end })} /></span>
          </div>
        ))}
        <p className="tiny muted">{t.crossYearNote}</p>
      </SettingsGroup>

      <SettingsGroup title={t.periodTimes}>
        {Object.entries(settings.periods).map(([p, time]) => (
          <div key={p} className="row align-center gap-6 range-row">
            <span className="range-label">{t.period(p)}</span>
            <input type="time" aria-label={t.periodStart(p)} value={time.start} onChange={(e) => e.target.value && setPeriod(p, { start: e.target.value })} className="input grow" />
            <span>{t.tilde}</span>
            <input type="time" aria-label={t.periodEnd(p)} value={time.end} onChange={(e) => e.target.value && setPeriod(p, { end: e.target.value })} className="input grow" />
          </div>
        ))}
      </SettingsGroup>

      <NotifySection settings={settings} onChange={onChange} courses={courses} today={today} />
      <CsvSection logs={logs} courses={appData.courses} />
      <InstallSection />
      <DataSection getBackup={getBackup} onImportBackup={onImportBackup} />
      <DangerSection logCount={logCount} onResetLogs={onResetLogs} getBackup={getBackup} campuses={appData.campuses} buildings={appData.buildings} onChangeData={onChangeData} />
    </div>
  );
}
