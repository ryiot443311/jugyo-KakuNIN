import { useState } from 'react';
import SettingsGroup from './SettingsGroup';
import { DAYS, getFiscalYear } from '../../utils/date';
import { quarterLabel } from '../../data/status';
import { eventsBeforeYear } from '../../data/calendar';
import { downloadBackup } from '../../utils/download';

const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0]; // 月曜始まり
const sortCourses = (courses) => [...courses].sort((a, b) => WEEK_ORDER.indexOf(a.dayOfWeek) - WEEK_ORDER.indexOf(b.dayOfWeek) || a.period - b.period);
const mmdd = (v) => { const [m, d] = v.split('-').map(Number); return `${m}/${d}`; };

// 新年度の準備: バックアップ → 続ける授業を選び、ほかは非表示 → 前の年度の学年暦を消す → クォーター期間の見直し
// 非表示にした授業の記録は残り、履歴と前の年度の分析に出る
export default function RolloverSection({ courses, quarters, calendar, today, getBackup, onHideCourses, onChangeCalendar }) {
  const year = getFiscalYear(today);
  const [keep, setKeep] = useState(() => new Set());
  const [message, setMessage] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const toHide = courses.filter(c => !keep.has(c.id));
  const oldEvents = eventsBeforeYear(calendar, year);

  const toggle = (id) => setKeep(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });

  const hide = () => {
    onHideCourses(toHide.map(c => c.id));
    setMessage(`${toHide.length}件の授業を非表示にしました（記録は残ります。設定の「授業」でいつでも戻せます）。`);
    setKeep(new Set());
  };

  const deleteOld = () => {
    const ids = new Set(oldEvents.map(e => e.id));
    onChangeCalendar(calendar.filter(e => !ids.has(e.id)));
    setMessage(`${year}年度より前の休校日・振替・補講 ${ids.size}件を削除しました。`);
    setConfirmDelete(false);
  };

  return (
    <SettingsGroup title="新年度の準備">
      <p className="small muted">年度が変わったら、上から順に行ってください。いまは{year}年度です。</p>

      <section className="rollover-step" aria-labelledby="rollover-1">
        <h4 id="rollover-1" className="field-label">1. バックアップを書き出す</h4>
        <button type="button" onClick={() => downloadBackup(getBackup())} className="btn btn-soft block">バックアップを書き出す</button>
      </section>

      <section className="rollover-step" aria-labelledby="rollover-2">
        <h4 id="rollover-2" className="field-label">2. 今年度も続ける授業を選ぶ</h4>
        {courses.length === 0 ? (
          <p className="small muted">表示中の授業はありません。</p>
        ) : (
          <>
            <p className="tiny muted">チェックした授業はそのまま残ります。チェックしていない授業は非表示になります（記録と履歴は残り、前の年度の分析にも出ます）。</p>
            {sortCourses(courses).map(c => (
              <label key={c.id} className="check block mb-6">
                <input type="checkbox" checked={keep.has(c.id)} onChange={() => toggle(c.id)} aria-label={`${c.name}を続ける`} />
                {c.name}<span className="small muted">（{DAYS[c.dayOfWeek]}{c.period}限・{quarterLabel(c)}）</span>
              </label>
            ))}
            <button type="button" onClick={hide} disabled={toHide.length === 0} className="btn btn-accent block mt-10">チェックしていない授業（{toHide.length}件）を非表示にする</button>
          </>
        )}
      </section>

      <section className="rollover-step" aria-labelledby="rollover-3">
        <h4 id="rollover-3" className="field-label">3. 前の年度の休校日・振替・補講を消す</h4>
        {oldEvents.length === 0 ? (
          <p className="small muted">消すものはありません。</p>
        ) : confirmDelete ? (
          <div className="row gap-6">
            <button type="button" onClick={() => setConfirmDelete(false)} className="btn btn-soft grow">やめる</button>
            <button type="button" onClick={deleteOld} className="btn btn-danger grow">{oldEvents.length}件を削除する</button>
          </div>
        ) : (
          <button type="button" onClick={() => setConfirmDelete(true)} className="btn btn-soft block">{year}年度より前のもの（{oldEvents.length}件）を削除…</button>
        )}
      </section>

      <section className="rollover-step" aria-labelledby="rollover-4">
        <h4 id="rollover-4" className="field-label">4. クォーターの期間を見直す</h4>
        <p className="small">{Object.entries(quarters).map(([q, r]) => `第${q}Q ${mmdd(r.start)}〜${mmdd(r.end)}`).join('、')}</p>
        <p className="tiny muted">今年度の学年暦と違うときは、設定の「クォーターの期間」で直してください。新しい授業は、設定の「授業」や日別画面から追加できます。</p>
      </section>

      {message && <p className="small ok-text mt-10" role="status">{message}</p>}
    </SettingsGroup>
  );
}
