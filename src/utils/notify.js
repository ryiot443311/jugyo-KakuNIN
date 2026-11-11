import { getQuarterByDate, parseDateStr, toMinutes } from './date';
import { isCourseInQuarter, isCourseOnDate } from '../data/status';

export const BEFORE_MINUTES = 10; // 授業開始の何分前に知らせるか
const WINDOW_MINUTES = 5; // バックグラウンドで時計が遅れても、この分数までは遅れて知らせる

// いま知らせるべき通知 [{ key, title, body }]
// before: 授業開始 BEFORE_MINUTES 分前（休講で記録した授業は除く）
// after: 授業終了時に、まだ記録していない授業
export function dueNotifications({ courses, quarters, periods, logs, today, nowMin, notify }) {
  if (!notify.before && !notify.after) return [];
  const quarter = getQuarterByDate(parseDateStr(today), quarters);
  if (quarter === 0) return [];
  const logOf = (id) => logs.find(l => l.courseId === id && l.date === today);
  const inWindow = (trigger) => trigger <= nowMin && nowMin < trigger + WINDOW_MINUTES;
  const result = [];
  for (const c of courses) {
    const p = periods[c.period];
    if (!p || !isCourseInQuarter(c, quarter) || !isCourseOnDate(c, today, quarters)) continue;
    const log = logOf(c.id);
    if (notify.before && log?.status !== '休講' && inWindow(toMinutes(p.start) - BEFORE_MINUTES)) {
      result.push({ key: `${today}|${c.id}|before`, title: `まもなく ${c.name}`, body: `${p.start}から ${c.period}限${c.room ? `・${c.room}` : ''}` });
    }
    if (notify.after && !log && inWindow(toMinutes(p.end))) {
      result.push({ key: `${today}|${c.id}|after`, title: `${c.name} の出欠を記録しましょう`, body: 'タップして記録する' });
    }
  }
  return result;
}

export const notificationSupported = () => typeof window !== 'undefined' && 'Notification' in window;

// 通知を表示する。Android の Chrome では Service Worker 経由でないと表示できないため、使えればそちらを使う
export async function showNotification({ key, title, body }) {
  const options = { body, tag: key, icon: '/icon-192.png', badge: '/icon-192.png' };
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    if (reg) { await reg.showNotification(title, options); return; }
  } catch { /* Service Worker が使えなければ下へ */ }
  try { new Notification(title, options); } catch { /* 表示できない環境 */ }
}
