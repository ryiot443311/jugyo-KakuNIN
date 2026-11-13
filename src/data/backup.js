import { resolveSettings } from './settings';
import { sanitizeCourses, sanitizeCampuses, sanitizeBuildings } from './appData';
import { sanitizeLogs, sanitizeMemos } from './sanitize';
import { sanitizeTasks } from './tasks';
import { ja } from '../i18n/messages';

const APP_ID = 'my-attendance-app';
const BACKUP_VERSION = 1;

const isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

// バックアップ JSON の中身。logs〜settings の形式は、以前のバージョンのバックアップと同じ
export const buildBackup = ({ logs, courseMemos, datedMemos, tasks, courses, settings, campuses, campusBuildings, campusImages }, now = new Date()) => ({
  app: APP_ID,
  version: BACKUP_VERSION,
  exportedAt: now.toISOString(),
  data: { logs, courseMemos, datedMemos, tasks, courses, settings, campuses, campusBuildings, campusImages },
});

export const sanitizeImages = (obj) => {
  if (!isPlainObject(obj)) throw new Error('images is not an object');
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => typeof v === 'string' && v.startsWith('data:image/')));
};

// 成功: { ok: true, data, dropped }  data には含まれていたキーだけが入る / dropped は破棄した不正データの件数
export const parseBackup = (text, t = ja) => {
  let json;
  try { json = JSON.parse(text); } catch { return { ok: false, error: t.backupNotJson }; }
  if (!isPlainObject(json) || json.app !== APP_ID || !isPlainObject(json.data)) {
    return { ok: false, error: t.backupNotOurs };
  }
  const src = json.data;
  const data = {};
  let dropped = 0;
  const take = (key, sanitize, countDropped = false) => {
    if (src[key] === undefined) return;
    data[key] = sanitize(src[key]);
    if (countDropped) dropped += src[key].length - data[key].length;
  };
  try {
    take('logs', sanitizeLogs, true);
    take('courses', sanitizeCourses, true);
    take('courseMemos', sanitizeMemos);
    take('datedMemos', sanitizeMemos);
    take('tasks', sanitizeTasks, true);
    take('settings', resolveSettings);
    take('campuses', sanitizeCampuses);
    take('campusBuildings', sanitizeBuildings);
    take('campusImages', sanitizeImages);
  } catch {
    return { ok: false, error: t.backupBadFormat };
  }
  if (Object.keys(data).length === 0) return { ok: false, error: t.backupEmpty };
  return { ok: true, data, dropped };
};
