import { useState } from 'react';
import Message from './Message';
import { shortDate } from '../utils/date';
import { newId } from '../data/appData';
import { makeupError } from '../data/calendar';

// 授業詳細から、その授業の補講を登録する。登録済みの今後の補講も一覧で出し、削除できる
export default function MakeupForm({ course, periods, quarters, calendar, today, onChangeCalendar }) {
  const [date, setDate] = useState(today);
  const [period, setPeriod] = useState(course.period);
  const [room, setRoom] = useState('');
  const [message, setMessage] = useState(null); // { ok, text }
  const upcoming = calendar.filter(e => e.type === 'makeup' && e.courseId === course.id && e.date >= today).sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.period - b.period));

  const add = () => {
    const error = makeupError({ course, date, quarters, calendar });
    if (error) { setMessage({ ok: false, text: error }); return; }
    onChangeCalendar([...calendar, { id: newId('cal'), type: 'makeup', date, courseId: course.id, period, room: room.trim(), name: '' }]);
    setMessage({ ok: true, text: `${shortDate(date)} ${period}限に補講を登録しました。` });
    setRoom('');
  };

  return (
    <details className="makeup-box mt-10">
      <summary className="field-label">補講を追加{upcoming.length > 0 && `（予定 ${upcoming.length}件）`}</summary>
      <div className="calendar-form">
        <input type="date" className="input" aria-label="補講の日付" value={date} onChange={(e) => { setDate(e.target.value); setMessage(null); }} />
        <div className="row gap-6">
          <select className="input grow" value={period} onChange={(e) => setPeriod(Number(e.target.value))} aria-label="補講の時限">
            {Object.keys(periods).map(Number).map(p => <option key={p} value={p}>{p}限（{periods[p].start}〜）</option>)}
          </select>
          <input className="input grow" value={room} onChange={(e) => setRoom(e.target.value)} placeholder={course.room || '教室'} aria-label="補講の教室（空欄ならいつもの教室）" />
        </div>
        <button type="button" onClick={add} className="btn btn-soft block">＋ 補講を登録</button>
        <Message message={message} />
      </div>
      {upcoming.length > 0 && (
        <ul className="calendar-list" aria-label="この授業の今後の補講">
          {upcoming.map(e => (
            <li key={e.id} className="calendar-item">
              <span className="grow small"><b>{shortDate(e.date)} {e.period}限</b>{e.room && <span className="muted">・{e.room}</span>}</span>
              <button type="button" onClick={() => onChangeCalendar(calendar.filter(x => x.id !== e.id))} className="btn btn-ghost btn-small" aria-label={`${shortDate(e.date)} ${e.period}限の補講を削除`}>削除</button>
            </li>
          ))}
        </ul>
      )}
      <p className="tiny muted mt-8">補講の記録は、この授業の出席率に入ります。休校日・振替は、設定の「休校日・振替・補講」で登録できます。</p>
    </details>
  );
}
