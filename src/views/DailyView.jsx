import { DAYS, addDays, getDateOfWeekday, parseDateStr, toMinutes } from '../utils/date';
import { isCourseInQuarter, statusTextClass } from '../data/status';
import { dateMemoKey, hasText } from '../utils/memo';
import { getAbsenceStreak, STREAK_ALERT } from '../utils/streak';
import { useSwipe } from '../hooks/useSwipe';
import StatusButtons from '../components/StatusButtons';
import RecordNotice from '../components/RecordNotice';

export default function DailyView({ selectedDate, today, selectedQuarter, courses, periods, nowMin, logs, courseMemos, dateMemos, recordState, getLog, onSelectDate, onOpenDetail, onRecord, onAddCourse, unrecordedCount, lookbackDays, onShowUnrecorded }) {
  const swipe = useSwipe((direction) => onSelectDate(addDays(selectedDate, direction))); // 左右スワイプで前後の日へ
  const weekStart = getDateOfWeekday(selectedDate, 0);
  const selectedDateObj = parseDateStr(selectedDate);
  const selectedDay = selectedDateObj.getDay();
  const isToday = selectedDate === today;
  const dayCourses = courses.filter(c => c.dayOfWeek === selectedDay && isCourseInQuarter(c, selectedQuarter)).sort((a, b) => a.period - b.period);

  // 今日（記録できる状態）のときだけ、授業中・次の授業を強調する。休講の授業は対象外
  const trackable = isToday && recordState.status === 'ok' ? dayCourses.filter(c => getLog(c.id)?.status !== '休講') : [];
  const nowId = trackable.find(c => { const p = periods[c.period]; return p && toMinutes(p.start) <= nowMin && nowMin < toMinutes(p.end); })?.id;
  const nextId = trackable.find(c => { const p = periods[c.period]; return p && toMinutes(p.start) > nowMin; })?.id;

  return (
    <div className="swipe-area" {...swipe}>
      {unrecordedCount > 0 && (
        <button type="button" onClick={onShowUnrecorded} className="unrecorded-banner">
          ⚠ 記録していない授業が {unrecordedCount}件 あります（直近{lookbackDays / 7}週間）<span className="unrecorded-banner-link">確認する ›</span>
        </button>
      )}
      <div className="row gap-6 mb-10">
        <button type="button" onClick={() => onSelectDate(addDays(selectedDate, -7))} className="btn btn-soft grow">◀ 前の週</button>
        <button type="button" onClick={() => onSelectDate(today)} disabled={isToday} className="btn btn-soft grow">今日</button>
        <button type="button" onClick={() => onSelectDate(addDays(selectedDate, 7))} className="btn btn-soft grow">次の週 ▶</button>
      </div>
      <div className="day-tabs">
        {DAYS.map((day, index) => {
          const date = addDays(weekStart, index);
          return (
            <button key={day} type="button" onClick={() => onSelectDate(date)} className={`day-tab${selectedDay === index ? ' is-active' : ''}${date === today ? ' is-today' : ''}`}>{day}</button>
          );
        })}
      </div>
      <div className="date-heading">
        {selectedDateObj.getMonth() + 1}月{selectedDateObj.getDate()}日（{DAYS[selectedDay]}）
        {isToday && <span className="badge badge-today">今日</span>}
      </div>

      {dayCourses.length === 0 ? (
        <div className="empty">{isToday ? '本日' : 'この日'}の授業なし</div>
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
                {isNow && <span className="badge badge-now">授業中</span>}
                {isNext && <span className="badge badge-next">次の授業</span>}
                <span>{course.period}時限{period && ` (${period.start}〜${period.end})`}</span>
                {recordState.status !== 'outOfQuarter' && <button type="button" onClick={() => onOpenDetail(course)} className="icon-btn" aria-label="詳細">⋯</button>}
              </div>
            </div>
            <h3 className="course-name">{course.name}</h3>
            {streak >= STREAK_ALERT && <div className="warning small" role="alert">⚠ 直近{streak}回連続で欠席しています</div>}
            {hasText(memo) && <div className="memo">{memo}</div>}
            {hasText(dateMemo) && <div className="memo memo-dated"><b>この日:</b> {dateMemo}</div>}
            {recordState.status !== 'ok' ? (
              <RecordNotice status={recordState.status} />
            ) : log ? (
              <div className={`notice ${statusTextClass(log.status)}`}>{log.status} 記録済み</div>
            ) : (
              <StatusButtons onSelect={(status) => onRecord(course.id, status)} />
            )}
          </div>
        );
      })}
      <button type="button" onClick={() => onAddCourse({ dayOfWeek: selectedDay })} className="btn btn-soft block mt-10">＋ {DAYS[selectedDay]}曜に授業を追加</button>
    </div>
  );
}
