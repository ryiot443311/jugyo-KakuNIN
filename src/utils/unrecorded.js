import { addDays, parseDateStr, getQuarterByDate, toMinutes } from './date';
import { isCourseInQuarter } from '../data/status';

export const LOOKBACK_DAYS = 28; // さかのぼって調べる日数（直近4週間）

// 記録し忘れの授業（終わった授業で、記録がないもの）を、新しい日付順・時限順に返す
// 記録を一件もつけていないときと、最初の記録より前の日は数えない（使い始める前の授業を数えないため）
export function findUnrecorded({ logs, courses, quarters, periods, today, nowMin, lookbackDays = LOOKBACK_DAYS }) {
  if (logs.length === 0) return [];
  const firstLogDate = logs.reduce((min, l) => (l.date < min ? l.date : min), logs[0].date);
  const lookbackStart = addDays(today, -lookbackDays);
  const start = firstLogDate > lookbackStart ? firstLogDate : lookbackStart;
  const recorded = new Set(logs.map(l => `${l.courseId}|${l.date}`));

  const result = [];
  for (let date = today; date >= start; date = addDays(date, -1)) {
    const d = parseDateStr(date);
    const quarter = getQuarterByDate(d, quarters);
    if (quarter === 0) continue; // 休み期間
    const missing = courses.filter((c) => {
      if (c.dayOfWeek !== d.getDay() || !isCourseInQuarter(c, quarter) || recorded.has(`${c.id}|${date}`)) return false;
      if (date !== today) return true;
      const p = periods[c.period]; // 今日は、終わった授業だけ
      return !!p && toMinutes(p.end) <= nowMin;
    });
    missing.sort((a, b) => a.period - b.period).forEach(course => result.push({ date, course }));
  }
  return result;
}
