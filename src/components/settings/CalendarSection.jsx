import { useState } from 'react';
import SettingsGroup from './SettingsGroup';
import { DAYS, parseDateStr } from '../../utils/date';
import { newId } from '../../data/appData';
import { CALENDAR_TYPES, coursesOnDate, sortCalendar } from '../../data/calendar';

const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0]; // 月曜始まり

const shortDate = (date) => { const d = parseDateStr(date); return `${d.getMonth() + 1}/${d.getDate()}（${DAYS[d.getDay()]}）`; };

// 一覧に出す説明
const describe = (e, courses) => {
  if (e.type === 'holiday') return { when: e.start === e.end ? shortDate(e.start) : `${shortDate(e.start)}〜${shortDate(e.end)}`, what: `休校日${e.name ? `・${e.name}` : ''}` };
  if (e.type === 'swap') return { when: shortDate(e.date), what: `${DAYS[e.dayOfWeek]}曜日の授業${e.name ? `・${e.name}` : ''}` };
  const c = courses.find(x => x.id === e.courseId);
  return { when: `${shortDate(e.date)} ${e.period}限`, what: `補講・${c ? c.name : '（削除された授業）'}${e.room ? `・${e.room}` : ''}${e.name ? `・${e.name}` : ''}` };
};

const emptyForm = (today) => ({ type: 'holiday', start: today, end: today, date: today, dayOfWeek: 1, courseId: '', period: 1, room: '', name: '' });

// 休校日・曜日振替・補講の登録
export default function CalendarSection({ calendar, onChange, courses, allCourses, periods, quarters, today }) {
  const [form, setForm] = useState(() => emptyForm(today));
  const [error, setError] = useState('');
  const set = (patch) => { setForm(f => ({ ...f, ...patch })); setError(''); };
  const periodKeys = Object.keys(periods).map(Number);
  const courseId = form.courseId || courses[0]?.id || '';

  const add = () => {
    const base = { id: newId('cal'), name: form.name.trim() };
    let event;
    if (form.type === 'holiday') {
      if (!form.start || !form.end) return setError('日付を入れてください。');
      if (form.end < form.start) return setError('終わりの日は、始まりの日と同じか後にしてください。');
      event = { ...base, type: 'holiday', start: form.start, end: form.end };
    } else if (form.type === 'swap') {
      if (!form.date) return setError('日付を入れてください。');
      if (parseDateStr(form.date).getDay() === form.dayOfWeek) return setError('その日と同じ曜日は選べません。');
      if (calendar.some(e => e.type === 'swap' && e.date === form.date)) return setError('この日の曜日振替は、すでに登録されています。');
      event = { ...base, type: 'swap', date: form.date, dayOfWeek: form.dayOfWeek };
    } else {
      if (!form.date) return setError('日付を入れてください。');
      if (!courseId) return setError('授業を選んでください。');
      const course = courses.find(c => c.id === courseId);
      // 同じ日に同じ授業が二つあると、記録が1件しか付けられないため
      if (coursesOnDate({ courses: [course], date: form.date, quarters, calendar }).length > 0) return setError('この日は、すでにこの授業があります（時間割どおり、または補講）。');
      event = { ...base, type: 'makeup', date: form.date, courseId, period: form.period, room: form.room.trim() };
    }
    onChange([...calendar, event]);
    setForm(f => ({ ...emptyForm(today), type: f.type }));
  };

  const remove = (id) => onChange(calendar.filter(e => e.id !== id));
  const sorted = sortCalendar(calendar);

  return (
    <SettingsGroup title="休校日・振替・補講">
      <p className="small muted">休校日は、記録し忘れ・通知・カレンダー書き出しの対象から外れます。曜日振替の日は、指定した曜日の授業になります。補講は、その授業の出席率に入ります。</p>

      <div className="calendar-form">
        <div className="row gap-6" role="group" aria-label="登録する種類">
          {Object.entries(CALENDAR_TYPES).map(([id, label]) => (
            <button key={id} type="button" aria-pressed={form.type === id} onClick={() => set({ type: id })} className={`btn grow btn-small ${form.type === id ? 'btn-primary' : 'btn-soft'}`}>{label}</button>
          ))}
        </div>

        {form.type === 'holiday' && (
          <div className="row gap-6 align-center">
            <input type="date" className="input grow" aria-label="休校日の始まり" value={form.start} onChange={(e) => set({ start: e.target.value, end: form.end < e.target.value ? e.target.value : form.end })} />
            <span>〜</span>
            <input type="date" className="input grow" aria-label="休校日の終わり" value={form.end} min={form.start} onChange={(e) => set({ end: e.target.value })} />
          </div>
        )}
        {form.type !== 'holiday' && (
          <input type="date" className="input" aria-label={form.type === 'swap' ? '振替の日付' : '補講の日付'} value={form.date} onChange={(e) => set({ date: e.target.value })} />
        )}
        {form.type === 'swap' && (
          <label className="row gap-6 align-center">
            <span className="small">この日は</span>
            <select className="input grow" value={form.dayOfWeek} onChange={(e) => set({ dayOfWeek: Number(e.target.value) })} aria-label="振替先の曜日">
              {WEEK_ORDER.map(d => <option key={d} value={d}>{DAYS[d]}曜日</option>)}
            </select>
            <span className="small">の授業</span>
          </label>
        )}
        {form.type === 'makeup' && (courses.length === 0 ? (
          <p className="small muted">授業がありません。先に授業を登録してください。</p>
        ) : (
          <>
            <select className="input" value={courseId} onChange={(e) => set({ courseId: e.target.value })} aria-label="補講の授業">
              {courses.map(c => <option key={c.id} value={c.id}>{c.name}（{DAYS[c.dayOfWeek]}{c.period}限）</option>)}
            </select>
            <div className="row gap-6">
              <select className="input grow" value={form.period} onChange={(e) => set({ period: Number(e.target.value) })} aria-label="補講の時限">
                {periodKeys.map(p => <option key={p} value={p}>{p}限（{periods[p].start}〜）</option>)}
              </select>
              <input className="input grow" value={form.room} onChange={(e) => set({ room: e.target.value })} placeholder={courses.find(c => c.id === courseId)?.room || '教室'} aria-label="補講の教室（空欄ならいつもの教室）" />
            </div>
          </>
        ))}
        <input className="input" value={form.name} onChange={(e) => set({ name: e.target.value })} placeholder={form.type === 'holiday' ? '名前（例: 大学祭）' : 'メモ（任意）'} aria-label="名前・メモ" maxLength={40} />
        <button type="button" onClick={add} disabled={form.type === 'makeup' && courses.length === 0} className="btn btn-accent block">＋ 登録する</button>
        {error && <p className="small danger-text" role="alert">{error}</p>}
      </div>

      {sorted.length === 0 ? (
        <p className="small muted mt-10">まだ登録はありません。</p>
      ) : (
        <ul className="calendar-list" aria-label="登録した休校日・振替・補講">
          {sorted.map(e => {
            const { when, what } = describe(e, allCourses);
            return (
              <li key={e.id} className="calendar-item">
                <span className="grow small"><b>{when}</b><span className="block muted">{what}</span></span>
                <button type="button" onClick={() => remove(e.id)} className="btn btn-ghost btn-small" aria-label={`${when} ${what} を削除`}>削除</button>
              </li>
            );
          })}
        </ul>
      )}
    </SettingsGroup>
  );
}
