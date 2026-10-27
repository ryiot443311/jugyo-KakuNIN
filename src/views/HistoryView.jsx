import { useMemo } from 'react';
import { DAYS, parseDateStr, getWeekOfMonth, getFiscalYear } from '../utils/date';
import LogCard from '../components/LogCard';

function AccordionHeader({ onClick, isOpen, className, children }) {
  return (
    <button type="button" onClick={onClick} aria-expanded={isOpen} className={`acc-head ${className}`}>
      {children}
      <span className={`arrow${isOpen ? ' is-open' : ''}`}>▼</span>
    </button>
  );
}

export default function HistoryView({ logs, courses, expandedSections, onToggle, onEditLog }) {
  // 年をまたいでも正しく並ぶよう 'YYYY-MM' をキーにする
  const groupedLogs = useMemo(() => logs.reduce((acc, log) => {
    const d = parseDateStr(log.date); const m = log.date.slice(0, 7); const w = getWeekOfMonth(d);
    if (!acc[m]) acc[m] = {}; if (!acc[m][w]) acc[m][w] = {}; if (!acc[m][w][log.date]) acc[m][w][log.date] = [];
    acc[m][w][log.date].push({ ...log, dayName: DAYS[d.getDay()] }); return acc;
  }, {}), [logs]);
  const sortedMonths = useMemo(() => Object.keys(groupedLogs).sort((a, b) => b.localeCompare(a)), [groupedLogs]);

  // 年度（4月始まり）ごとに月をまとめる。新しい年度が先頭
  const years = useMemo(() => {
    const byYear = {};
    for (const month of sortedMonths) (byYear[getFiscalYear(`${month}-01`)] ??= []).push(month);
    return Object.keys(byYear).map(Number).sort((a, b) => b - a).map(fy => ({ fy, months: byYear[fy] }));
  }, [sortedMonths]);
  const logCountByYear = useMemo(() => logs.reduce((acc, l) => { const fy = getFiscalYear(l.date); acc[fy] = (acc[fy] ?? 0) + 1; return acc; }, {}), [logs]);

  if (years.length === 0) return <div className="empty">記録はまだありません</div>;

  const renderMonth = (month) => {
    const mKey = `m-${month}`; const isMOpen = expandedSections[mKey] !== false;
    return (
      <div key={month} className="card accordion">
        <AccordionHeader onClick={() => onToggle(mKey, true)} isOpen={isMOpen} className="acc-month">
          <span>{month.slice(0, 4)}年{Number(month.slice(5))}月</span>
        </AccordionHeader>
        {isMOpen && (
          <div className="acc-body">
            {Object.keys(groupedLogs[month]).sort((a, b) => b - a).map(week => {
              const wKey = `w-${month}-${week}`; const isWOpen = expandedSections[wKey] !== false;
              return (
                <div key={week} className="acc-week">
                  <AccordionHeader onClick={() => onToggle(wKey, true)} isOpen={isWOpen} className="acc-weekhead">
                    <span>第{week}週</span>
                  </AccordionHeader>
                  {isWOpen && (
                    <div className="acc-body">
                      {Object.keys(groupedLogs[month][week]).sort().map(date => {
                        const dKey = `d-${date}`; const isDOpen = expandedSections[dKey] === true;
                        const dayLogs = groupedLogs[month][week][date];
                        return (
                          <div key={date} className="acc-day">
                            <AccordionHeader onClick={() => onToggle(dKey, false)} isOpen={isDOpen} className="acc-dayhead">
                              <span>{date} ({dayLogs[0].dayName})</span>
                            </AccordionHeader>
                            {isDOpen && <div className="pt-8">{dayLogs.map(log => <LogCard key={log.id} log={log} courses={courses} onEdit={onEditLog} />)}</div>}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="mb-20">
      {years.map(({ fy, months }, i) => {
        const yKey = `y-${fy}`; const isYOpen = expandedSections[yKey] ?? i === 0; // 古い年度は閉じておく
        return (
          <div key={fy}>
            <AccordionHeader onClick={() => onToggle(yKey, i === 0)} isOpen={isYOpen} className="acc-year">
              <span>{fy}年度 <span className="small muted">（{logCountByYear[fy]}件）</span></span>
            </AccordionHeader>
            {isYOpen && months.map(renderMonth)}
          </div>
        );
      })}
    </div>
  );
}
