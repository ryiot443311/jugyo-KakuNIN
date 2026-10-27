import { DAYS, parseDateStr } from '../utils/date';
import { hasText } from '../utils/memo';

const WEEKDAYS = DAYS.slice(1, 7); // 月〜土

export default function WeeklyView({ today, periods, quarterCourses, courseMemos, onOpenDetail }) {
  const todayDay = parseDateStr(today).getDay();
  return (
    <div className="card table-wrap">
      <table className="weekly">
        <thead><tr><th className="period-col"></th>{WEEKDAYS.map((d, i) => <th key={d} className={i + 1 === todayDay ? 'is-today' : undefined}>{d}</th>)}</tr></thead>
        <tbody>
          {Object.keys(periods).map(p => (
            <tr key={p}>
              <td className="period-col">{p}</td>
              {WEEKDAYS.map((_, i) => (
                <td key={i} className="weekly-cell">
                  {quarterCourses.filter(c => c.dayOfWeek === i + 1 && c.period === Number(p)).map(course => (
                    <button key={course.id} type="button" onClick={() => onOpenDetail(course)} className="weekly-course">
                      <span className="weekly-name">{course.name}</span>
                      <span className="weekly-room">{course.room}</span>
                      {hasText(courseMemos[course.id]) && <span className="memo-dot"></span>}
                    </button>
                  ))}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
