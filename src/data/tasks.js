import { addDays, parseDateStr, shortDate } from '../utils/date';

// 授業ごとの課題 [{ id, courseId, title, due: 'YYYY-MM-DD', done }]
export const TASKS_KEY = 'course_tasks';
export const UPCOMING_DAYS = 7; // 日別画面に出す期限（選んだ日から何日後まで）
export const COLLAPSE_LIMIT = 3; // 日別画面で、折りたたんだときに見せる件数

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

// 未完了で、期限切れか、基準日（ふつうは今日、日別画面では選んだ日）から days 日後までが期限の課題
export const upcomingTasks = (tasks, base, days = UPCOMING_DAYS) => {
  const limit = addDays(base, days);
  return sortTasks(tasks.filter(t => !t.done && t.due <= limit));
};

// 期限ごとに区切る: 期限切れ／今日／明日／選んだ日まで／その後 days 日まで。
// tasks は期限順の前提。空の区切りは返さない。tone は緊急度（overdue・today・soon・later）
export const groupDueTasks = (tasks, today, base = today, days = UPCOMING_DAYS) => {
  const tomorrow = addDays(today, 1);
  const limit = addDays(base, days);
  const defs = [
    { key: 'overdue', label: '期限切れ', tone: 'overdue', test: (d) => d < today },
    { key: 'today', label: '今日', tone: 'today', test: (d) => d === today },
    { key: 'tomorrow', label: '明日', tone: 'soon', test: (d) => d === tomorrow },
    // 選んだ日が明後日以降のときだけ、その日までを1つにまとめる
    ...(base > tomorrow ? [{ key: 'base', label: `${shortDate(base)}まで`, tone: 'soon', isBase: true, test: (d) => d <= base }] : []),
    { key: 'later', label: `${shortDate(limit)}まで`, tone: 'later', test: () => true },
  ];
  const groups = defs.map(({ label, tone, key, isBase }) => ({ key, label, tone, isBase, tasks: [] }));
  tasks.forEach((t) => { groups[defs.findIndex(g => g.test(t.due))].tasks.push(t); });
  return groups.filter(g => g.tasks.length > 0);
};
