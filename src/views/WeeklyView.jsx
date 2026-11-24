import { DAYS, parseDateStr, getDateOfWeekday } from '../utils/date';
import { hasText } from '../utils/memo';
import { STATUS_MARKS, statusTextClass, weekPatternLabel } from '../data/status';
import { coursesOnDate, holidayOn, swapOn } from '../data/calendar';

const WEEKDAYS = DAYS.slice(1, 7); // 月〜土

// 今週の時間割。記録があるマスには出席簿の記号（○△×休）、記録し忘れには「!」を付ける
// 学年暦: 休校日の列は薄くし、曜日振替の列は振替先の曜日の授業、補講はそのコマに「補講」として出す
export default function WeeklyView({ today, periods, quarters, calendar, selectedQuarter, courses, quarterCourses, courseMemos, onOpenDetail, onAddCourse, getLogAt, unrecordedKeys }) {
  const todayDay = parseDateStr(today).getDay();
  const columns = WEEKDAYS.map((_, i) => {
    const date = getDateOfWeekday(today, i + 1);
    const swap = swapOn(calendar, date);
    const holiday = holidayOn(calendar, date);
    const makeups = coursesOnDate({ courses, date, quarters, calendar, quarter: selectedQuarter }).filter(c => c.makeupId);
    return { date, holiday, swap, dayOfWeek: swap?.dayOfWeek ?? i + 1, makeups };
  });
  const cellCourses = (col, period) => [
    ...quarterCourses.filter(c => c.dayOfWeek === col.dayOfWeek && c.period === Number(period)),
    ...col.makeups.filter(c => c.period === Number(period)),
  ];
  const columnLabel = (col) => (col.holiday ? `休校日${col.holiday.name ? `（${col.holiday.name}）` : ''}` : col.swap ? `${DAYS[col.swap.dayOfWeek]}曜日の授業（曜日振替）` : '');

  return (
    <div className="card table-wrap">
      <table className="weekly">
        <thead>
          <tr>
            <th className="period-col"></th>
            {WEEKDAYS.map((d, i) => {
              const col = columns[i];
              const classes = [i + 1 === todayDay && 'is-today', col.holiday && 'is-holiday'].filter(Boolean).join(' ');
              return (
                <th key={d} className={classes || undefined}>
                  {d}<span className="weekly-date">{parseDateStr(col.date).getDate()}</span>
                  {col.holiday && <span className="weekly-note" aria-hidden="true">休校</span>}
                  {!col.holiday && col.swap && <span className="weekly-note is-swap" aria-hidden="true">{DAYS[col.swap.dayOfWeek]}曜</span>}
                  {columnLabel(col) && <span className="sr-only">{columnLabel(col)}</span>}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {Object.keys(periods).map(p => (
            <tr key={p}>
              <td className="period-col">{p}{periods[p] && <span className="period-time">{periods[p].start}</span>}</td>
              {columns.map((col, i) => {
                const list = cellCourses(col, p);
                return (
                  <td key={i} className={`weekly-cell${col.holiday ? ' is-holiday' : ''}`}>
                    {list.map(course => {
                      const off = col.holiday && !course.makeupId; // 休校日の時間割の授業
                      const log = off ? null : getLogAt(course.id, col.date);
                      const missing = !log && !off && unrecordedKeys.has(`${course.id}|${col.date}`);
                      return (
                        <button key={course.makeupId ?? course.id} type="button" onClick={() => onOpenDetail(courses.find(c => c.id === course.id) ?? course, col.date)} className={`weekly-course${off ? ' is-off' : ''}`}>
                          <span className="weekly-name">{course.name}</span>
                          <span className="weekly-room">{course.room}</span>
                          {course.makeupId ? <span className="weekly-room weekly-tag">補講</span> : course.weeks && <span className="weekly-room">{weekPatternLabel(course)}</span>}
                          {hasText(courseMemos[course.id]) && <span className="memo-dot"></span>}
                          {log && <span className={`weekly-mark ${statusTextClass(log.status)}`} aria-hidden="true">{STATUS_MARKS[log.status]}</span>}
                          {missing && <span className="weekly-mark st-text-absent" aria-hidden="true">!</span>}
                          {(log || missing || off) && <span className="sr-only">（{off ? '休校日' : log ? log.status : '記録し忘れ'}）</span>}
                        </button>
                      );
                    })}
                    {list.length === 0 && (
                      <button type="button" onClick={() => onAddCourse({ dayOfWeek: i + 1, period: Number(p) })} className="weekly-add" aria-label={`${WEEKDAYS[i]}曜${p}限に授業を追加`}>＋</button>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
