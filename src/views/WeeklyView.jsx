import { DAYS, parseDateStr } from '../utils/date';
import { hasText } from '../utils/memo';
import { weekPatternLabel } from '../data/status';

const WEEKDAYS = DAYS.slice(1, 7); // 月〜土

export default function WeeklyView({ today, periods, quarterCourses, courseMemos, onOpenDetail, onAddCourse }) {
  const todayDay = parseDateStr(today).getDay();
  const cellCourses = (dayOfWeek, period) => quarterCourses.filter(c => c.dayOfWeek === dayOfWeek && c.period === Number(period));
  return (
    <div className="card table-wrap">
      <table className="weekly">
        <thead><tr><th className="period-col"></th>{WEEKDAYS.map((d, i) => <th key={d} className={i + 1 === todayDay ? 'is-today' : undefined}>{d}</th>)}</tr></thead>
        <tbody>
          {Object.keys(periods).map(p => (
            <tr key={p}>
              <td className="period-col">{p}{periods[p] && <span className="period-time">{periods[p].start}</span>}</td>
              {WEEKDAYS.map((_, i) => (
                <td key={i} className="weekly-cell">
                  {cellCourses(i + 1, p).map(course => (
                    <button key={course.id} type="button" onClick={() => onOpenDetail(course)} className="weekly-course">
                      <span className="weekly-name">{course.name}</span>
                      <span className="weekly-room">{course.room}</span>
                      {course.weeks && <span className="weekly-room">{weekPatternLabel(course)}</span>}
                      {hasText(courseMemos[course.id]) && <span className="memo-dot"></span>}
                    </button>
                  ))}
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
