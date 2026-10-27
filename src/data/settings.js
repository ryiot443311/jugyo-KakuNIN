import { QUARTERS, PERIODS } from './constants';

export const SETTINGS_KEY = 'app_settings';

export const THEMES = [
  { id: 'auto', label: '自動' },
  { id: 'light', label: 'ライト' },
  { id: 'dark', label: 'ダーク' },
];

// 月ごとの最大日数（2月は閏年を考慮して 29）
export const MAX_DAYS = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

const isMonthDay = (v) => {
  if (typeof v !== 'string' || !/^\d{2}-\d{2}$/.test(v)) return false;
  const [m, d] = v.split('-').map(Number);
  return m >= 1 && m <= 12 && d >= 1 && d <= MAX_DAYS[m - 1];
};
const isTime = (v) => typeof v === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(v);

// 既定値の各キーについて、保存値の { start, end } が正しければ採用し、そうでなければ既定値を使う
const mergeRanges = (defaults, saved, isValid) => Object.fromEntries(
  Object.entries(defaults).map(([key, def]) => {
    const s = saved?.[key];
    return [key, s && isValid(s.start) && isValid(s.end) ? { start: s.start, end: s.end } : def];
  })
);

// 以前のバージョンの形式 [開始月, 開始日, 終了月, 終了日] を 'MM-DD' の範囲に変換する（不正なら null）
const pad2 = (n) => String(n).padStart(2, '0');
const fromLegacyRange = (r) => {
  if (!Array.isArray(r) || r.length !== 4 || !r.every(Number.isInteger)) return null;
  const range = { start: `${pad2(r[0])}-${pad2(r[1])}`, end: `${pad2(r[2])}-${pad2(r[3])}` };
  return isMonthDay(range.start) && isMonthDay(range.end) ? range : null;
};
const legacyQuarters = (ranges) => (Array.isArray(ranges) ? Object.fromEntries(ranges.map((r, i) => [i + 1, fromLegacyRange(r)]).filter(([, r]) => r)) : undefined);

const isThreshold = (v) => Number.isInteger(v) && v >= 1 && v <= 100;

// localStorage の設定を既定値（constants.js）に重ねる。壊れた値や未保存の項目は既定値になる
export function resolveSettings(saved) {
  const s = saved && typeof saved === 'object' ? saved : {};
  return {
    theme: THEMES.some(t => t.id === s.theme) ? s.theme : 'auto',
    quarters: mergeRanges(QUARTERS, s.quarters ?? legacyQuarters(s.quarterRanges), isMonthDay),
    periods: mergeRanges(PERIODS, s.periods, isTime),
    hiddenCourses: Array.isArray(s.hiddenCourses) ? s.hiddenCourses : [],
    threshold: isThreshold(s.threshold) ? s.threshold : 80, // 出席率の基準 (%)
  };
}
