import { useMemo } from 'react';
import { DAYS, parseDateStr, getWeekOfMonth } from '../utils/date';
import LogCard from '../components/LogCard';

function AccordionHeader({ onClick, isOpen, className, children }) {
  return (
    <button type="button" onClick={onClick} aria-expanded={isOpen} className={`acc-head ${className}`}>
      {children}
      <span className={`arrow${isOpen ? ' is-open' : ''}`}>▼</span>
    </button>
  );
}

export default function HistoryView({ logs, expandedSections, onToggle, onEditLog }) {
  // 年をまたいでも正しく並ぶよう 'YYYY-MM' をキーにする
  const groupedLogs = useMemo(() => logs.reduce((acc, log) => {
    const d = parseDateStr(log.date); const m = log.date.slice(0, 7); const w = getWeekOfMonth(d);
    if (!acc[m]) acc[m] = {}; if (!acc[m][w]) acc[m][w] = {}; if (!acc[m][w][log.date]) acc[m][w][log.date] = [];
    acc[m][w][log.date].push({ ...log, dayName: DAYS[d.getDay()] }); return acc;
  }, {}), [logs]);
  const sortedMonths = useMemo(() => Object.keys(groupedLogs).sort((a, b) => b.localeCompare(a)), [groupedLogs]);

  if (sortedMonths.length === 0) return <div className="empty">記録はまだありません</div>;

  return (
    <div className="mb-20">
      {sortedMonths.map(month => {
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
                                {isDOpen && <div className="pt-8">{dayLogs.map(log => <LogCard key={log.id} log={log} onEdit={onEditLog} />)}</div>}
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
      })}
    </div>
  );
}
