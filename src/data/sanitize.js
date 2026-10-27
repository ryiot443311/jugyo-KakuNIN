import { STATUSES } from './status';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

// 保存データの検証。不正なら例外にして、呼び出し側で初期値に戻す
export const sanitizeLogs = (arr) => {
  if (!Array.isArray(arr)) throw new Error('logs is not an array');
  const seen = new Set();
  return arr.filter((l) => {
    const ok = isPlainObject(l) && typeof l.id === 'string' && typeof l.courseId === 'string' &&
      typeof l.date === 'string' && DATE_RE.test(l.date) && STATUSES.includes(l.status) && !seen.has(l.id);
    if (ok) seen.add(l.id);
    return ok;
  });
};

export const sanitizeMemos = (obj) => {
  if (!isPlainObject(obj)) throw new Error('memos is not an object');
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => typeof v === 'string'));
};
