import { DAYS, parseDateStr, getDateOfWeekday } from '../utils/date';
import { hasText } from '../utils/memo';
import { STATUS_MARKS, statusTextClass, weekPatternLabel } from '../data/status';

const WEEKDAYS = DAYS.slice(1, 7); // 月〜土

// 今週の時間割。記録があるマスには出席簿の記号（○△×休）、記録し忘れには「!」を付ける
export default function WeeklyView({ today, periods, quarterCourses, courseMemos, onOpenDetail, onAddCourse, getLogAt, unrecordedKeys }) {
  const todayDay = parseDateStr(today).getDay();
  const cellCourses = (dayOfWeek, period) => quarterCourses.filter(c => c.dayOfWeek === dayOfWeek && c.period === Number(period));
  return (
    <div className="card table-wrap">
      <table className="weekly">
        <thead><tr><th className="period-col"></th>{WEEKDAYS.map((d, i) => <th key={d} className={i + 1 === todayDay ? 'is-today' : undefined}>{d}<span className="weekly-date">{parseDateStr(getDateOfWeekday(today, i + 1)).getDate()}</span></th>)}</tr></thead>
        <tbody>
          {Object.keys(periods).map(p => (
            <tr key={p}>
              <td className="period-col">{p}{periods[p] && <span className="period-time">{periods[p].start}</span>}</td>
              {WEEKDAYS.map((_, i) => (
                <td key={i} className="weekly-cell">
                  {cellCourses(i + 1, p).map(course => {
                    const date = getDateOfWeekday(today, i + 1);
                    const log = getLogAt(course.id, date);
                    const missing = !log && unrecordedKeys.has(`${course.id}|${date}`);
                    return (
                    <button key={course.id} type="button" onClick={() => onOpenDetail(course)} className="weekly-course">
                      <span className="weekly-name">{course.name}</span>
                      <span className="weekly-room">{course.room}</span>
                      {course.weeks && <span className="weekly-room">{weekPatternLabel(course)}</span>}
                      {hasText(courseMemos[course.id]) && <span className="memo-dot"></span>}
                      {log && <span className={`weekly-mark ${statusTextClass(log.status)}`} aria-hidden="true">{STATUS_MARKS[log.status]}</span>}
                      {missing && <span className="weekly-mark st-text-absent" aria-hidden="true">!</span>}
                      {(log || missing) && <span className="sr-only">（{log ? log.status : '記録し忘れ'}）</span>}
                    </button>
                    );
                  })}
                  {cellCourses(i + 1, p).length === 0 && (
                    <button type="button" onClick={() => onAddCourse({ dayOfWeek: i + 1, period: Number(p) })} className="weekly-add" aria-label={`${WEEKDAYS[i]}曜${p}限に授業を追加`}>＋</button>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
