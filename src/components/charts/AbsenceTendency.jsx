import { useI18n } from '../../i18n';

// 曜日ごとの欠席数（横棒）と、欠席の多い曜日・時限
export default function AbsenceTendency({ byWeekday, topSlots }) {
  const t = useI18n();
  const max = Math.max(...byWeekday.map(d => d.count));
  if (max === 0) return <p className="small muted">{t.noAbsence}</p>;
  return (
    <div>
      <div className="hbars" role="list" aria-label={t.absenceByDayLabel}>
        {byWeekday.map(({ day, count }) => (
          <div key={day} className="hbar-row" role="listitem">
            <span className="hbar-label">{t.days[day]}</span>
            <span className="hbar-track">{count > 0 && <span className="hbar-fill" style={{ width: `${(count / max) * 100}%` }} />}</span>
            <span className="hbar-value">{t.barCount(count)}</span>
          </div>
        ))}
      </div>
      <p className="small muted mt-10 mb-6">{t.topSlotsTitle}</p>
      <ol className="small slot-list">
        {topSlots.map(s => <li key={`${s.day}|${s.period}`}>{t.slot(s.day, s.period, s.names)}<span className="strong">{t.times(s.count)}</span></li>)}
      </ol>
    </div>
  );
}
