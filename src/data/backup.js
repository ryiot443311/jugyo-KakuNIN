import { STATUSES } from './status';
import { resolveAppData } from './appData';
import { resolveSettings } from './settings';

const BACKUP_VERSION = 1;

const isObject = (v) => !!v && typeof v === 'object' && !Array.isArray(v);
const isTextMap = (v) => isObject(v) && Object.values(v).every(x => typeof x === 'string');
const isLog = (l) => isObject(l) && typeof l.id === 'string' && typeof l.courseId === 'string'
  && /^\d{4}-\d{2}-\d{2}$/.test(l.date) && STATUSES.includes(l.status) && Number.isInteger(l.quarter);

// 画面で扱うデータ全体を JSON 文字列にする
export const buildBackup = ({ appData, settings, campusImages, logs, courseMemos, dateMemos }) =>
  JSON.stringify({ version: BACKUP_VERSION, appData, settings, campusImages, logs, courseMemos, dateMemos }, null, 2);

// バックアップ JSON を検証し、読み込める項目だけを返す（不正なら Error）
export function parseBackup(text) {
  let raw;
  try { raw = JSON.parse(text); } catch { throw new Error('JSON として読み込めませんでした'); }
  if (!isObject(raw) || raw.version !== BACKUP_VERSION) throw new Error('このアプリのバックアップファイルではありません');

  const result = {};
  if (isObject(raw.appData)) result.appData = resolveAppData(raw.appData);
  if (isObject(raw.settings)) result.settings = resolveSettings(raw.settings);
  if (isObject(raw.campusImages)) result.campusImages = Object.fromEntries(Object.entries(raw.campusImages).filter(([, v]) => typeof v === 'string' && v.startsWith('data:image/')));
  if (Array.isArray(raw.logs)) result.logs = raw.logs.filter(isLog);
  if (isTextMap(raw.courseMemos)) result.courseMemos = raw.courseMemos;
  if (isTextMap(raw.dateMemos)) result.dateMemos = raw.dateMemos;
  if (Object.keys(result).length === 0) throw new Error('読み込めるデータがありません');
  return result;
}
