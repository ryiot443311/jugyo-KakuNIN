import { PERIODS } from '../data/constants';
import { DAYS } from '../utils/date';

const WEEKDAYS = DAYS.slice(1, 7); // 月〜土

export default function WeeklyView({ quarterCourses, courseMemos, onOpenDetail }) {
  return (
    <div className="weekly">
      <table className="weekly-table">
        <thead><tr><th className="weekly-period-col"></th>{WEEKDAYS.map(d => <th key={d}>{d}</th>)}</tr></thead>
        <tbody>
          {Object.keys(PERIODS).map(p => (
            <tr key={p}>
              <td className="weekly-period">{p}</td>
              {WEEKDAYS.map((_, i) => (
                <td key={i} className="weekly-cell">
                  {quarterCourses.filter(c => c.dayOfWeek === i + 1 && c.period === Number(p)).map(course => {
                    const hasMemo = courseMemos[course.id] && courseMemos[course.id].trim() !== '';
                    return (
                      <div key={course.id} onClick={() => onOpenDetail(course)} className="weekly-course">
                        <div className="weekly-course-name">{course.name}</div>
                        <div className="weekly-course-room">{course.room}</div>
                        {hasMemo && <div className="memo-dot"></div>}
                      </div>
                    );
                  })}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
