import { addDays, parseDateStr } from '../utils/date';

// 授業ごとの課題 [{ id, courseId, title, due: 'YYYY-MM-DD', done }]
export const TASKS_KEY = 'course_tasks';
export const UPCOMING_DAYS = 7; // 日別画面に出す期限（今日から何日後まで）

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

// 保存データの検証。不正なら例外にして、呼び出し側で初期値に戻す
export const sanitizeTasks = (arr) => {
  if (!Array.isArray(arr)) throw new Error('tasks is not an array');
  const seen = new Set();
  return arr.filter((t) => {
    const ok = isPlainObject(t) && typeof t.id === 'string' && typeof t.courseId === 'string' &&
      typeof t.title === 'string' && t.title.trim() !== '' && typeof t.due === 'string' && DATE_RE.test(t.due) && !seen.has(t.id);
    if (ok) seen.add(t.id);
    return ok;
  }).map((t) => ({ id: t.id, courseId: t.courseId, title: t.title, due: t.due, done: t.done === true }));
};

// 期限までの日数（今日が期限なら 0、過ぎていれば負）
export const daysUntil = (due, today) => Math.round((parseDateStr(due) - parseDateStr(today)) / (24 * 60 * 60 * 1000));

export const dueLabel = (due, today) => {
  const n = daysUntil(due, today);
  if (n < 0) return `期限切れ（${-n}日前）`;
  if (n === 0) return '今日まで';
  if (n === 1) return '明日まで';
  return `あと${n}日`;
};

// 期限順（同じ期限は登録順）
export const sortTasks = (tasks) => [...tasks].sort((a, b) => (a.due < b.due ? -1 : a.due > b.due ? 1 : 0));

// 未完了で、期限切れか、今日から days 日後までが期限の課題
export const upcomingTasks = (tasks, today, days = UPCOMING_DAYS) => {
  const limit = addDays(today, days);
  return sortTasks(tasks.filter(t => !t.done && t.due <= limit));
};
