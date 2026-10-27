import { useMemo } from 'react';

const GOOD_RATE = 80; // この出席率以上なら良好

const countBy = (logs, status) => logs.filter(l => l.status === status).length;
// 休講を除いた回数に対する、出席＋遅刻の割合
const calcRate = (logs) => {
  const total = logs.filter(l => l.status !== '休講').length;
  return total === 0 ? 0 : Math.round(((countBy(logs, '出席') + countBy(logs, '遅刻')) / total) * 100);
};

export default function AnalyticsView({ quarterLogs, quarterCourses, selectedQuarter, years, year, onYearChange }) {
  const courseAnalytics = useMemo(() => {
    return [...new Set(quarterCourses.map(c => c.name))].map(name => {
      const rIds = quarterCourses.filter(c => c.name === name).map(c => c.id);
      const sLogs = quarterLogs.filter(l => rIds.includes(l.courseId));
      return { name, total: sLogs.filter(l => l.status !== '休講').length, rate: calcRate(sLogs), hasCanceled: sLogs.some(l => l.status === '休講') };
    }).filter(c => c.total > 0 || c.hasCanceled);
  }, [quarterCourses, quarterLogs]);

  const lowCourses = courseAnalytics.filter(c => c.total > 0 && c.rate < GOOD_RATE);

  return (
    <div className="mb-20">
      {years.length > 1 && (
        <div className="row align-center gap-10 mb-10">
          <label className="small muted" htmlFor="analytics-year">年度</label>
          <select id="analytics-year" className="input grow" value={year} onChange={(e) => onYearChange(Number(e.target.value))}>
            {years.map(y => <option key={y} value={y}>{y}年度</option>)}
          </select>
        </div>
      )}
      <div className="summary">
        <div>
          <p className="summary-label">出席率 ({year}年度 第{selectedQuarter}Q)</p>
          <p className="summary-rate">{calcRate(quarterLogs)}%</p>
        </div>
        <div className="summary-counts">
          <p>出席: {countBy(quarterLogs, '出席')}</p>
          <p>遅刻: {countBy(quarterLogs, '遅刻')}</p>
          <p>欠席: {countBy(quarterLogs, '欠席')}</p>
        </div>
      </div>
      {lowCourses.length > 0 && (
        <div className="warning" role="alert">出席率が{GOOD_RATE}%未満の授業があります: {lowCourses.map(c => c.name).join('、')}</div>
      )}
      {courseAnalytics.map(stat => (
        <div key={stat.name} className="card stat-card">
          <div className="row between align-center mb-10">
            <div>
              <div className="strong">{stat.name}</div>
              <div className="small muted">{stat.total}回の授業</div>
            </div>
            <div className={`strong ${stat.rate >= GOOD_RATE ? 'ok-text' : 'ng-text'}`}>{stat.rate}%</div>
          </div>
          <div className="bar"><div className={`bar-fill ${stat.rate >= GOOD_RATE ? 'is-ok' : 'is-ng'}`} style={{ width: `${stat.rate}%` }}></div></div>
        </div>
      ))}
    </div>
  );
}
