import { useMemo } from 'react';

const countBy = (logs, status) => logs.filter(l => l.status === status).length;
// 休講を除いた回数に対する、出席＋遅刻の割合
const calcRate = (logs) => {
  const total = logs.filter(l => l.status !== '休講').length;
  return total === 0 ? 0 : Math.round(((countBy(logs, '出席') + countBy(logs, '遅刻')) / total) * 100);
};

export default function AnalyticsView({ quarterLogs, quarterCourses, selectedQuarter }) {
  const courseAnalytics = useMemo(() => {
    return [...new Set(quarterCourses.map(c => c.name))].map(name => {
      const rIds = quarterCourses.filter(c => c.name === name).map(c => c.id);
      const sLogs = quarterLogs.filter(l => rIds.includes(l.courseId));
      return { name, total: sLogs.filter(l => l.status !== '休講').length, rate: calcRate(sLogs), hasCanceled: sLogs.some(l => l.status === '休講') };
    }).filter(c => c.total > 0 || c.hasCanceled);
  }, [quarterCourses, quarterLogs]);

  return (
    <div className="view-bottom">
      <div className="summary">
        <div>
          <p className="summary-label">出席率 (第{selectedQuarter}Q)</p>
          <p className="summary-rate">{calcRate(quarterLogs)}%</p>
        </div>
        <div className="summary-counts">
          <p>出席: {countBy(quarterLogs, '出席')}</p>
          <p>遅刻: {countBy(quarterLogs, '遅刻')}</p>
          <p>欠席: {countBy(quarterLogs, '欠席')}</p>
        </div>
      </div>
      {courseAnalytics.map(stat => (
        <div key={stat.name} className="stat-card">
          <div className="stat-card-head">
            <div className="stat-card-title">
              <div className="stat-card-name">{stat.name}</div>
              <div className="stat-card-total">{stat.total}回の授業</div>
            </div>
            <div className={`stat-card-rate${stat.rate >= 80 ? ' is-good' : ''}`}>{stat.rate}%</div>
          </div>
          <div className="progress"><div className="progress-bar" style={{ width: `${stat.rate}%` }}></div></div>
        </div>
      ))}
    </div>
  );
}
