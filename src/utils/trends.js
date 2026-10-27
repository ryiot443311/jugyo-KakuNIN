import { getDateOfWeekday, parseDateStr } from './date';
import { calcRate } from './stats';

// 週（日曜始まり）ごとの出席率。休講だけの週は除く。古い週から並べる
export const weeklyRates = (logs) => {
  const weeks = new Map();
  for (const l of logs) {
    const week = getDateOfWeekday(l.date, 0);
    if (!weeks.has(week)) weeks.set(week, { week, present: 0, late: 0, absent: 0 });
    const w = weeks.get(week);
    if (l.status === '出席') w.present++;
    else if (l.status === '遅刻') w.late++;
    else if (l.status === '欠席') w.absent++;
  }
  return [...weeks.values()]
    .map(w => ({ ...w, total: w.present + w.late + w.absent, rate: calcRate(w.present, w.late, w.absent) }))
    .filter(w => w.total > 0)
    .sort((a, b) => a.week.localeCompare(b.week));
};

const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0]; // 月曜始まり

// 曜日ごとの欠席数（月〜土は常に、日曜は欠席があるときだけ）
export const absenceByWeekday = (logs) => {
  const counts = new Map(WEEK_ORDER.map(d => [d, 0]));
  for (const l of logs) if (l.status === '欠席') counts.set(parseDateStr(l.date).getDay(), counts.get(parseDateStr(l.date).getDay()) + 1);
  return WEEK_ORDER.filter(d => d !== 0 || counts.get(0) > 0).map(day => ({ day, count: counts.get(day) }));
};

// 欠席の多い曜日・時限（多い順に limit 件）。授業が見つからない記録は数えない
export const topAbsenceSlots = (logs, courses, limit = 3) => {
  const byId = new Map(courses.map(c => [c.id, c]));
  const slots = new Map();
  for (const l of logs) {
    const c = byId.get(l.courseId);
    if (l.status !== '欠席' || !c) continue;
    const key = `${c.dayOfWeek}|${c.period}`;
    if (!slots.has(key)) slots.set(key, { day: c.dayOfWeek, period: c.period, count: 0, names: new Set() });
    const s = slots.get(key); s.count++; s.names.add(c.name);
  }
  return [...slots.values()]
    .sort((a, b) => b.count - a.count || WEEK_ORDER.indexOf(a.day) - WEEK_ORDER.indexOf(b.day) || a.period - b.period)
    .slice(0, limit)
    .map(s => ({ ...s, names: [...s.names] }));
};
