import { useState } from 'react';
import { MY_COURSES } from '../data/constants';
import { THEMES, MAX_DAYS } from '../data/settings';
import { DAYS } from '../utils/date';
import Modal from '../components/Modal';

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

export default function SettingsView({ settings, logCount, onChange, onResetLogs }) {
  const [confirmReset, setConfirmReset] = useState(false);

  const setQuarter = (q, patch) => onChange({ quarters: { ...settings.quarters, [q]: { ...settings.quarters[q], ...patch } } });
  const setPeriod = (p, patch) => onChange({ periods: { ...settings.periods, [p]: { ...settings.periods[p], ...patch } } });
  const toggleCourse = (id) => onChange({
    hiddenCourses: settings.hiddenCourses.includes(id) ? settings.hiddenCourses.filter(h => h !== id) : [...settings.hiddenCourses, id],
  });

  return (
    <div className="mb-20">
      {confirmReset && (
        <Modal>
          <p className="center strong">出席記録を{logCount}件すべて削除します。<br />この操作は取り消せません。</p>
          <div className="row gap-10 mt-20">
            <button type="button" onClick={() => setConfirmReset(false)} className="btn btn-soft grow">キャンセル</button>
            <button type="button" onClick={() => { onResetLogs(); setConfirmReset(false); }} className="btn btn-danger grow">削除</button>
          </div>
        </Modal>
      )}

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

      <section className="card section">
        <h3 className="section-title">授業の表示</h3>
        {MY_COURSES.map(c => (
          <div key={c.id} className="row align-center course-row">
            <label className="check grow">
              <input type="checkbox" checked={!settings.hiddenCourses.includes(c.id)} onChange={() => toggleCourse(c.id)} />
              {c.name}
            </label>
            <span className="small muted">{DAYS[c.dayOfWeek]}曜 {c.period}限</span>
          </div>
        ))}
        <p className="tiny muted mt-10">チェックを外した授業は、日別・週間・分析に表示されません（記録は残ります）。</p>
      </section>

      <section className="card section">
        <h3 className="section-title">データ</h3>
        <button type="button" onClick={() => setConfirmReset(true)} disabled={logCount === 0} className="btn btn-danger block">出席記録をすべて削除（{logCount}件）</button>
      </section>
    </div>
  );
}
