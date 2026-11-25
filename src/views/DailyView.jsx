import { DAYS, addDays, getDateOfWeekday, parseDateStr, toMinutes } from '../utils/date';
import { statusTextClass, weekPatternLabel } from '../data/status';
import { coursesOnDate, dayNote } from '../data/calendar';
import { dateMemoKey, hasText } from '../utils/memo';
import { getAbsenceStreak, STREAK_ALERT } from '../utils/streak';
import { useSwipe } from '../hooks/useSwipe';
import StatusButtons from '../components/StatusButtons';
import RecordNotice from '../components/RecordNotice';
import RecordMark from '../components/RecordMark';
import DueTaskBanner from '../components/DueTaskBanner';

export default function DailyView({ selectedDate, today, selectedQuarter, courses, periods, quarters, calendar, nowMin, logs, courseMemos, dateMemos, recordState, getLog, onSelectDate, onOpenDetail, onRecord, onAddCourse, dueTasks, onToggleTask, unrecordedCount, lookbackDays, onShowUnrecorded, unrecordedDates, recordStyle, justRecordedId }) {
  const swipe = useSwipe((direction) => onSelectDate(addDays(selectedDate, direction))); // 左右スワイプで前後の日へ
  const weekStart = getDateOfWeekday(selectedDate, 0);
  const selectedDateObj = parseDateStr(selectedDate);
  const selectedDay = selectedDateObj.getDay();
  const isToday = selectedDate === today;
  // 学年暦（休校日・曜日振替・補講）を反映したその日の授業
  const dayCourses = coursesOnDate({ courses, date: selectedDate, quarters, calendar, quarter: selectedQuarter });
  const note = dayNote(calendar, selectedDate);

  // 今日（記録できる状態）のときだけ、授業中・次の授業を強調する。休講の授業は対象外
  const trackable = isToday && recordState.status === 'ok' ? dayCourses.filter(c => getLog(c.id)?.status !== '休講') : [];
  const nowId = trackable.find(c => { const p = periods[c.period]; return p && toMinutes(p.start) <= nowMin && nowMin < toMinutes(p.end); })?.id;
  const nextId = trackable.find(c => { const p = periods[c.period]; return p && toMinutes(p.start) > nowMin; })?.id;
  const nextStart = nextId ? toMinutes(periods[dayCourses.find(c => c.id === nextId).period].start) : 0;

  // 週の行の印: 付け忘れがある日は「!」、記録がそろった過去の日は「✓」
  const recordedDates = new Set(logs.map(l => l.date));
  const dayMark = (date) => {
    if (unrecordedDates.has(date)) return { text: '!', className: 'is-missing', label: '記録し忘れあり' };
    if (date <= today && recordedDates.has(date)) return { text: '✓', className: 'is-done', label: '記録済み' };
    return null;
  };

  return (
    <div className="swipe-area" {...swipe}>
      {unrecordedCount > 0 && (
        <button type="button" onClick={onShowUnrecorded} className="unrecorded-banner">
          ⚠ 記録していない授業が {unrecordedCount}件 あります（直近{lookbackDays / 7}週間）<span className="unrecorded-banner-link">確認する ›</span>
        </button>
      )}
      <DueTaskBanner tasks={dueTasks} courses={courses} today={today} baseDate={selectedDate} onToggle={onToggleTask} />
      <div className="date-heading">
        <span className="date-month">{selectedDateObj.getMonth() + 1}月</span><span className="date-num">{selectedDateObj.getDate()}</span><span className="date-unit">日（{DAYS[selectedDay]}）</span>
        {isToday && <span className="badge badge-today">今日</span>}
      </div>
      {note && (
        <p className={`day-note ${note.type === 'holiday' ? 'is-holiday' : 'is-swap'}`} role="note">
          {note.type === 'holiday' ? note.text : `曜日振替: この日は${DAYS[note.dayOfWeek]}曜日の授業${note.name ? `（${note.name}）` : ''}`}
        </p>
      )}
      <div className="day-tabs">
        {DAYS.map((day, index) => {
          const date = addDays(weekStart, index);
          const mark = dayMark(date);
          return (
            <button key={day} type="button" onClick={() => onSelectDate(date)} aria-label={`${parseDateStr(date).getDate()}日（${day}）${mark ? `・${mark.label}` : ''}`} aria-pressed={selectedDay === index} className={`day-tab${selectedDay === index ? ' is-active' : ''}${date === today ? ' is-today' : ''}`}>
              <span className="day-tab-date">{parseDateStr(date).getDate()}</span>
              <span className="day-tab-day">{day}</span>
              <span className={`day-tab-mark ${mark?.className ?? ''}`} aria-hidden="true">{mark?.text}</span>
            </button>
          );
        })}
      </div>
      <div className="week-nav">
        <button type="button" onClick={() => onSelectDate(addDays(selectedDate, -7))} className="btn btn-ghost btn-small">◀ 前の週</button>
        <button type="button" onClick={() => onSelectDate(today)} disabled={isToday} className="btn btn-ghost btn-small">今日</button>
        <button type="button" onClick={() => onSelectDate(addDays(selectedDate, 7))} className="btn btn-ghost btn-small">次の週 ▶</button>
      </div>

      {dayCourses.length === 0 ? (
        <div className="empty">{note?.type === 'holiday' ? '休校日のため授業なし' : `${isToday ? '本日' : 'この日'}の授業なし`}</div>
      ) : dayCourses.map(course => {
        const log = getLog(course.id);
        const memo = courseMemos[course.id];
        const dateMemo = dateMemos[dateMemoKey(course.id, selectedDate)];
        const period = periods[course.period];
        // 記録する前の授業だけ、これまでの連続欠席を知らせる
        const streak = !log && recordState.status === 'ok' ? getAbsenceStreak(logs, course.id, selectedDate) : 0;
        const isNow = course.id === nowId;
        const isNext = course.id === nextId;
        const canceled = log?.status === '休講';
        return (
          <div key={course.makeupId ?? course.id} className={`card course-card${isNow ? ' is-now' : isNext ? ' is-next' : ''}${log ? ' is-recorded' : ''}${canceled ? ' is-canceled' : ''}`}>
            <div className="course-period" aria-hidden="true">
              <span className="course-period-num">{course.period}</span>
              {period && <span className="course-period-time">{period.start}</span>}
            </div>
            <div className="course-body">
              <div className="row between align-center gap-6">
                <div className="row align-center gap-6 course-tags">
                  {isNow && <span className="badge badge-now">授業中</span>}
                  {isNext && <span className="badge badge-next">次の授業</span>}
                  {isNext && nextStart - nowMin <= 90 && <span className="tiny muted">あと{nextStart - nowMin}分</span>}
                </div>
                {recordState.status !== 'outOfQuarter' && <button type="button" onClick={() => onOpenDetail(courses.find(c => c.id === course.id) ?? course)} className="icon-btn" aria-label={`${course.name}の詳細`}>⋯</button>}
              </div>
              <h3 className="course-name">{course.name}{course.makeupId ? <span className="badge badge-weeks">補講</span> : course.weeks && <span className="badge badge-weeks">{weekPatternLabel(course)}</span>}</h3>
              <div className="course-meta small muted">{course.room}{period && ` · ${course.period}限 ${period.start}〜${period.end}`}</div>
              {streak >= STREAK_ALERT && <div className="warning small" role="alert">⚠ 直近{streak}回連続で欠席しています</div>}
              {hasText(memo) && <div className="memo">{memo}</div>}
              {hasText(dateMemo) && <div className="memo memo-dated"><b>この日:</b> {dateMemo}</div>}
              {recordState.status !== 'ok' ? (
                <RecordNotice status={recordState.status} />
              ) : log ? (
                <div className={`notice record-done ${statusTextClass(log.status)}`}>
                  <RecordMark status={log.status} variant={recordStyle} animate={justRecordedId === log.id} />
                  <span>{log.status} 記録済み</span>
                  {isToday && log.recordedAt && <span className="record-time">{log.recordedAt.slice(11)}</span>}
                </div>
              ) : (
                <StatusButtons onSelect={(status) => onRecord(course.id, status)} />
              )}
            </div>
          </div>
        );
      })}
      <button type="button" onClick={() => onAddCourse({ dayOfWeek: selectedDay })} className="btn btn-soft block mt-10">＋ {DAYS[selectedDay]}曜に授業を追加</button>
    </div>
  );
}
