import WeeklyTrendChart from '../components/charts/WeeklyTrendChart';
import AbsenceTendency from '../components/charts/AbsenceTendency';

export default function AnalyticsView({ selectedQuarter, statusCounts, overallRate, courseAnalytics, threshold, years, year, onYearChange, weekly, absenceWeekdays, absenceSlots }) {
  const low = courseAnalytics.filter((c) => !c.ok);
  return (
    <div className="mb-20">
      {years.length > 1 && (
        <div className="row align-center gap-10 mb-10">
          <label className="small muted" htmlFor="analytics-year">年度</label>
          <select id="analytics-year" className="input grow" value={year} onChange={(e) => onYearChange(Number(e.target.value))}>
            {years.map((y) => <option key={y} value={y}>{y}年度</option>)}
          </select>
        </div>
      )}

      <div className="summary">
        <div>
          <p className="summary-label">出席率 ({year}年度 第{selectedQuarter}Q)</p>
          <p className="summary-rate">{overallRate}%</p>
        </div>
        <div className="summary-counts">
          <p>出席: {statusCounts['出席']}</p>
          <p>遅刻: {statusCounts['遅刻']}</p>
          <p>欠席: {statusCounts['欠席']}</p>
        </div>
      </div>

      {low.length > 0 && (
        <div className="warning" role="alert">
          ⚠ 出席率が基準({threshold}%)を下回っている科目: {low.map((c) => c.name).join('、')}
        </div>
      )}

      {courseAnalytics.length === 0 && <div className="empty">この期間の記録はまだありません</div>}

      {/* 1週分だけでは推移にならないので、2週以上あるときに表示 */}
      {weekly.length >= 2 && (
        <div className="card chart-card">
          <h3 className="section-title">週ごとの出席率</h3>
          <WeeklyTrendChart weeks={weekly} threshold={threshold} />
        </div>
      )}
      {courseAnalytics.length > 0 && (
        <div className="card chart-card">
          <h3 className="section-title">欠席の傾向</h3>
          <AbsenceTendency byWeekday={absenceWeekdays} topSlots={absenceSlots} />
        </div>
      )}

      {courseAnalytics.map((stat) => (
        <div key={stat.name} className="card stat-card">
          <div className="row between mb-10">
            <div className="grow">
              <div className="strong">{stat.name}</div>
              <div className="small muted">{stat.total}回の授業 (出席{stat.present}・遅刻{stat.late}・欠席{stat.absent})</div>
            </div>
            <div className={`strong ${stat.ok ? 'ok-text' : 'ng-text'}`}>{stat.rate}%</div>
          </div>
          <div className="bar"><div className={`bar-fill ${stat.ok ? 'is-ok' : 'is-ng'}`} style={{ width: `${stat.rate}%` }}></div></div>
          {stat.total > 0 && (
            <div className={`small mt-8 ${stat.ok ? 'muted' : 'ng-text'}`}>
              {!stat.ok
                ? `基準(${threshold}%)を下回っています`
                : stat.allowance === 0
                  ? `これ以上欠席すると基準(${threshold}%)を下回ります`
                  : `あと${stat.allowance}回欠席しても${threshold}%を維持できます`}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
