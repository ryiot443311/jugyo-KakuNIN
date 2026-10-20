import { useMemo } from 'react';
import { DAYS, parseDateStr, getWeekOfMonth } from '../utils/date';
import LogCard from '../components/LogCard';

function AccordionHeader({ onClick, isOpen, className, children }) {
  return (
    <div onClick={onClick} className={className}>
      {children}
      <span className={`chevron${isOpen ? ' is-open' : ''}`}>▼</span>
    </div>
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

  if (sortedMonths.length === 0) return <div className="empty-state">記録はまだありません</div>;

  return (
    <div className="view-bottom">
      {sortedMonths.map(month => {
        const mKey = `m-${month}`; const isMOpen = expandedSections[mKey] !== false;
        return (
          <div key={month} className="history-month">
            <AccordionHeader onClick={() => onToggle(mKey, true)} isOpen={isMOpen} className="history-month-head">
              <h3>{month.slice(0, 4)}年{Number(month.slice(5))}月</h3>
            </AccordionHeader>
            {isMOpen && (
              <div className="history-body">
                {Object.keys(groupedLogs[month]).sort((a, b) => b - a).map(week => {
                  const wKey = `w-${month}-${week}`; const isWOpen = expandedSections[wKey] !== false;
                  return (
                    <div key={week} className="history-week">
                      <AccordionHeader onClick={() => onToggle(wKey, true)} isOpen={isWOpen} className="history-week-head">
                        <span>第{week}週</span>
                      </AccordionHeader>
                      {isWOpen && (
                        <div className="history-body">
                          {Object.keys(groupedLogs[month][week]).sort().map(date => {
                            const dKey = `d-${date}`; const isDOpen = expandedSections[dKey] === true;
                            const dayLogs = groupedLogs[month][week][date];
                            return (
                              <div key={date} className="history-day">
                                <AccordionHeader onClick={() => onToggle(dKey, false)} isOpen={isDOpen} className="history-day-head">
                                  <span>{date} ({dayLogs[0].dayName})</span>
                                </AccordionHeader>
                                {isDOpen && <div className="history-day-body">{dayLogs.map(log => <LogCard key={log.id} log={log} onEdit={onEditLog} />)}</div>}
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
