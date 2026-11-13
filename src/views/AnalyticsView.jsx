import WeeklyTrendChart from '../components/charts/WeeklyTrendChart';
import AbsenceTendency from '../components/charts/AbsenceTendency';
import { useI18n } from '../i18n';

export default function AnalyticsView({ selectedQuarter, statusCounts, overallRate, courseAnalytics, threshold, years, year, onYearChange, weekly, absenceWeekdays, absenceSlots }) {
  const t = useI18n();
  const low = courseAnalytics.filter((c) => !c.ok);
  return (
    <div className="mb-20">
      {years.length > 1 && (
        <div className="row align-center gap-10 mb-10">
          <label className="small muted" htmlFor="analytics-year">{t.yearLabel}</label>
          <select id="analytics-year" className="input grow" value={year} onChange={(e) => onYearChange(Number(e.target.value))}>
            {years.map((y) => <option key={y} value={y}>{t.fiscalYear(y)}</option>)}
          </select>
        </div>
      )}

      <div className="summary">
        <div>
          <p className="summary-label">{t.rateTitle(year, selectedQuarter)}</p>
          <p className="summary-rate">{overallRate}%</p>
        </div>
        <div className="summary-counts">
          {['出席', '遅刻', '欠席'].map(s => <p key={s}>{t.status(s)}: {statusCounts[s]}</p>)}
        </div>
      </div>

      {low.length > 0 && (
        <div className="warning" role="alert">
          {t.lowWarning(threshold, low.map((c) => c.name))}
        </div>
      )}

      {courseAnalytics.length === 0 && <div className="empty">{t.noRecordsPeriod}</div>}

      {/* 1週分だけでは推移にならないので、2週以上あるときに表示 */}
      {weekly.length >= 2 && (
        <div className="card chart-card">
          <h3 className="section-title">{t.weeklyRateTitle}</h3>
          <WeeklyTrendChart weeks={weekly} threshold={threshold} />
        </div>
      )}
      {courseAnalytics.length > 0 && (
        <div className="card chart-card">
          <h3 className="section-title">{t.absenceTrendTitle}</h3>
          <AbsenceTendency byWeekday={absenceWeekdays} topSlots={absenceSlots} />
        </div>
      )}

      {courseAnalytics.map((stat) => (
        <div key={stat.name} className="card stat-card">
          <div className="row between mb-10">
            <div className="grow">
              <div className="strong">{stat.name}</div>
              <div className="small muted">{t.courseStatLine(stat.total, stat.present, stat.late, stat.absent)}</div>
            </div>
            <div className={`strong ${stat.ok ? 'ok-text' : 'ng-text'}`}>{stat.rate}%</div>
          </div>
          <div className="bar"><div className={`bar-fill ${stat.ok ? 'is-ok' : 'is-ng'}`} style={{ width: `${stat.rate}%` }}></div></div>
          {stat.total > 0 && (
            <div className={`small mt-8 ${stat.ok ? 'muted' : 'ng-text'}`}>
              {!stat.ok
                ? t.belowThreshold(threshold)
                : stat.allowance === 0
                  ? t.atLimit(threshold)
                  : t.allowance(stat.allowance, threshold)}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
