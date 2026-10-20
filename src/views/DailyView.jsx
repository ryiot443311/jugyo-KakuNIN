import { MY_COURSES, PERIODS } from '../data/constants';
import { STATUS_COLORS, isCourseInQuarter } from '../data/status';
import { DAYS, addDays, getDateOfWeekday, parseDateStr } from '../utils/date';
import StatusButtons from '../components/StatusButtons';
import RecordNotice from '../components/RecordNotice';

export default function DailyView({ selectedDate, today, selectedQuarter, courseMemos, recordState, getLog, onSelectDate, onOpenDetail, onRecord }) {
  const weekStart = getDateOfWeekday(selectedDate, 0);
  const selectedDay = parseDateStr(selectedDate).getDay();
  const dayCourses = MY_COURSES.filter(c => c.dayOfWeek === selectedDay && isCourseInQuarter(c, selectedQuarter)).sort((a, b) => a.period - b.period);

  return (
    <div>
      <div className="week-nav">
        <button onClick={() => onSelectDate(addDays(selectedDate, -7))} className="week-nav-btn">‹ 前週</button>
        <input type="date" value={selectedDate} max={today} onChange={(e) => e.target.value && onSelectDate(e.target.value)} className="date-input" />
        <button onClick={() => onSelectDate(today)} disabled={selectedDate === today} className="week-nav-btn">今日</button>
        <button onClick={() => onSelectDate(addDays(selectedDate, 7))} disabled={addDays(weekStart, 7) > today} className="week-nav-btn">次週 ›</button>
      </div>
      <div className="day-tabs">
        {DAYS.map((day, index) => {
          const date = addDays(weekStart, index);
          return (
            <button key={day} onClick={() => onSelectDate(date)} className={`day-tab${selectedDay === index ? ' is-active' : ''}`}>
              {day}<span className="day-tab-date">{parseDateStr(date).getDate()}</span>
            </button>
          );
        })}
      </div>

      {dayCourses.length === 0 ? (
        <div className="empty-state">{selectedDate === today ? '本日' : 'この日'}の授業なし</div>
      ) : dayCourses.map(course => {
        const log = getLog(course.id);
        const memo = courseMemos[course.id];
        return (
          <div key={course.id} className="course-card">
            <div className="course-card-head">
              <span>{course.room}</span>
              <div className="course-card-meta">
                <span>{course.period}時限 ({PERIODS[course.period]?.start || ''}〜{PERIODS[course.period]?.end || ''})</span>
                {recordState.status !== 'outOfQuarter' && <button onClick={() => onOpenDetail(course)} className="icon-btn">⋯</button>}
              </div>
            </div>
            <h3 className="course-card-name">{course.name}</h3>
            {memo && memo.trim() !== '' && <div className="memo-box">{memo}</div>}
            {recordState.status !== 'ok' ? (
              <RecordNotice status={recordState.status} />
            ) : log ? (
              <div className="recorded" style={{ color: STATUS_COLORS[log.status] || '#64748b' }}>{log.status} 記録済み</div>
            ) : (
              <StatusButtons onSelect={(status) => onRecord(course.id, status)} />
            )}
          </div>
        );
      })}
    </div>
  );
}
