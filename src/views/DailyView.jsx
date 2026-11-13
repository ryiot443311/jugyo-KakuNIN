import { useI18n } from '../i18n';
import { DAYS, addDays, getDateOfWeekday, parseDateStr, toMinutes } from '../utils/date';
import { isCourseInQuarter, isCourseOnDate, statusTextClass, weekPatternLabel } from '../data/status';
import { dateMemoKey, hasText } from '../utils/memo';
import { getAbsenceStreak, STREAK_ALERT } from '../utils/streak';
import { useSwipe } from '../hooks/useSwipe';
import StatusButtons from '../components/StatusButtons';
import RecordNotice from '../components/RecordNotice';
import { dueLabel, daysUntil, UPCOMING_DAYS } from '../data/tasks';

export default function DailyView({ selectedDate, today, selectedQuarter, courses, periods, quarters, nowMin, logs, courseMemos, dateMemos, recordState, getLog, onSelectDate, onOpenDetail, onRecord, onAddCourse, dueTasks, onToggleTask, unrecordedCount, lookbackDays, onShowUnrecorded }) {
  const t = useI18n();
  const swipe = useSwipe((direction) => onSelectDate(addDays(selectedDate, direction))); // 左右スワイプで前後の日へ
  const weekStart = getDateOfWeekday(selectedDate, 0);
  const selectedDateObj = parseDateStr(selectedDate);
  const selectedDay = selectedDateObj.getDay();
  const isToday = selectedDate === today;
  const dayCourses = courses.filter(c => isCourseOnDate(c, selectedDate, quarters) && isCourseInQuarter(c, selectedQuarter)).sort((a, b) => a.period - b.period);

  // 今日（記録できる状態）のときだけ、授業中・次の授業を強調する。休講の授業は対象外
  const trackable = isToday && recordState.status === 'ok' ? dayCourses.filter(c => getLog(c.id)?.status !== '休講') : [];
  const nowId = trackable.find(c => { const p = periods[c.period]; return p && toMinutes(p.start) <= nowMin && nowMin < toMinutes(p.end); })?.id;
  const nextId = trackable.find(c => { const p = periods[c.period]; return p && toMinutes(p.start) > nowMin; })?.id;

  return (
    <div className="swipe-area" {...swipe}>
      {unrecordedCount > 0 && (
        <button type="button" onClick={onShowUnrecorded} className="unrecorded-banner">
          {t.unrecordedBanner(unrecordedCount, lookbackDays / 7)}<span className="unrecorded-banner-link">{t.review}</span>
        </button>
      )}
      {dueTasks.length > 0 && (
        <section className="card task-banner" aria-labelledby="due-heading">
          <h3 id="due-heading" className="task-banner-title">{t.dueTasksTitle(UPCOMING_DAYS)}</h3>
          <ul className="task-list">
            {dueTasks.map(task => (
              <li key={task.id} className={`task-item${daysUntil(task.due, today) < 0 ? ' is-overdue' : ''}`}>
                <label className="check grow">
                  <input type="checkbox" checked={false} onChange={() => onToggleTask(task.id)} aria-label={t.markTaskDone(task.title)} />
                  <span className="grow">{task.title}<span className="tiny muted block">{courses.find(c => c.id === task.courseId)?.name}</span></span>
                </label>
                <span className="tiny strong task-due">{dueLabel(task.due, today, t)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
      <div className="row gap-6 mb-8 week-nav">
        <button type="button" onClick={() => onSelectDate(addDays(selectedDate, -7))} className="btn btn-soft grow">{t.prevWeek}</button>
        <button type="button" onClick={() => onSelectDate(today)} disabled={isToday} className="btn btn-soft grow">{t.today}</button>
        <button type="button" onClick={() => onSelectDate(addDays(selectedDate, 7))} className="btn btn-soft grow">{t.nextWeek}</button>
      </div>
      <div className="day-tabs">
        {DAYS.map((day, index) => {
          const date = addDays(weekStart, index);
          return (
            <button key={day} type="button" onClick={() => onSelectDate(date)} className={`day-tab${selectedDay === index ? ' is-active' : ''}${date === today ? ' is-today' : ''}`}>{t.days[index]}</button>
          );
        })}
      </div>
      <div className="date-heading">
        {t.dateHeading(selectedDateObj.getMonth() + 1, selectedDateObj.getDate(), selectedDay)}
        {isToday && <span className="badge badge-today">{t.today}</span>}
      </div>

      {dayCourses.length === 0 ? (
        <div className="empty">{t.noClasses(isToday)}</div>
      ) : dayCourses.map(course => {
        const log = getLog(course.id);
        const memo = courseMemos[course.id];
        const dateMemo = dateMemos[dateMemoKey(course.id, selectedDate)];
        const period = periods[course.period];
        // 記録する前の授業だけ、これまでの連続欠席を知らせる
        const streak = !log && recordState.status === 'ok' ? getAbsenceStreak(logs, course.id, selectedDate) : 0;
        const isNow = course.id === nowId;
        const isNext = course.id === nextId;
        return (
          <div key={course.id} className={`card course-card${isNow ? ' is-now' : isNext ? ' is-next' : ''}`}>
            <div className="row between align-center small muted strong">
              <span>{course.room}</span>
              <div className="row gap-10 align-center">
                {isNow && <span className="badge badge-now">{t.nowBadge}</span>}
                {isNext && <span className="badge badge-next">{t.nextBadge}</span>}
                <span>{t.periodLong(course.period)}{period && ` (${t.timeRange(period.start, period.end)})`}</span>
                {recordState.status !== 'outOfQuarter' && <button type="button" onClick={() => onOpenDetail(course)} className="icon-btn" aria-label={t.courseDetailLabel(course.name)}>⋯</button>}
              </div>
            </div>
            <h3 className="course-name">{course.name}{course.weeks && <span className="badge badge-weeks">{weekPatternLabel(course, t)}</span>}</h3>
            {streak >= STREAK_ALERT && <div className="warning small" role="alert">{t.absenceStreak(streak)}</div>}
            {hasText(memo) && <div className="memo">{memo}</div>}
            {hasText(dateMemo) && <div className="memo memo-dated"><b>{t.thisDay}</b> {dateMemo}</div>}
            {recordState.status !== 'ok' ? (
              <RecordNotice status={recordState.status} />
            ) : log ? (
              <div className={`notice ${statusTextClass(log.status)}`}>{t.recorded(t.status(log.status))}</div>
            ) : (
              <StatusButtons onSelect={(status) => onRecord(course.id, status)} />
            )}
          </div>
        );
      })}
      <button type="button" onClick={() => onAddCourse({ dayOfWeek: selectedDay })} className="btn btn-soft block mt-10">{t.addCourseOnDay(selectedDay)}</button>
    </div>
  );
}
