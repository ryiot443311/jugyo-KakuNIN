import { parseDateStr } from '../utils/date';
import { useI18n } from '../i18n';
import { hasText } from '../utils/memo';
import { weekPatternLabel } from '../data/status';

const WEEKDAYS = [1, 2, 3, 4, 5, 6]; // 月〜土

export default function WeeklyView({ today, periods, quarterCourses, courseMemos, onOpenDetail, onAddCourse }) {
  const t = useI18n();
  const todayDay = parseDateStr(today).getDay();
  const cellCourses = (dayOfWeek, period) => quarterCourses.filter(c => c.dayOfWeek === dayOfWeek && c.period === Number(period));
  return (
    <div className="card table-wrap">
      <table className="weekly">
        <thead><tr><th className="period-col"></th>{WEEKDAYS.map(d => <th key={d} className={d === todayDay ? 'is-today' : undefined}>{t.days[d]}</th>)}</tr></thead>
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
                      {course.weeks && <span className="weekly-room">{weekPatternLabel(course, t)}</span>}
                      {hasText(courseMemos[course.id]) && <span className="memo-dot"></span>}
                    </button>
                  ))}
                  {cellCourses(i + 1, p).length === 0 && (
                    <button type="button" onClick={() => onAddCourse({ dayOfWeek: i + 1, period: Number(p) })} className="weekly-add" aria-label={t.addCourseAt(WEEKDAYS[i], p)}>＋</button>
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
