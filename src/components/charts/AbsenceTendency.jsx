import { DAYS } from '../../utils/date';

// 曜日ごとの欠席数（横棒）と、欠席の多い曜日・時限
export default function AbsenceTendency({ byWeekday, topSlots }) {
  const max = Math.max(...byWeekday.map(d => d.count));
  if (max === 0) return <p className="small muted">この期間の欠席はありません。</p>;
  return (
    <div>
      <div className="hbars" role="list" aria-label="曜日ごとの欠席数">
        {byWeekday.map(({ day, count }) => (
          <div key={day} className="hbar-row" role="listitem">
            <span className="hbar-label">{DAYS[day]}</span>
            <span className="hbar-track">{count > 0 && <span className="hbar-fill" style={{ width: `${(count / max) * 100}%` }} />}</span>
            <span className="hbar-value">{count}回</span>
          </div>
        ))}
      </div>
      <p className="small muted mt-10 mb-6">欠席の多い時限</p>
      <ol className="small slot-list">
        {topSlots.map(s => <li key={`${s.day}|${s.period}`}>{DAYS[s.day]}曜{s.period}限（{s.names.join('・')}）: <span className="strong">{s.count}回</span></li>)}
      </ol>
    </div>
  );
}
