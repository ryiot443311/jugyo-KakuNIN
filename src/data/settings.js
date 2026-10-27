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

// localStorage の設定を既定値（constants.js）に重ねる。壊れた値や未保存の項目は既定値になる
export function resolveSettings(saved) {
  const s = saved && typeof saved === 'object' ? saved : {};
  return {
    theme: THEMES.some(t => t.id === s.theme) ? s.theme : 'auto',
    quarters: mergeRanges(QUARTERS, s.quarters, isMonthDay),
    periods: mergeRanges(PERIODS, s.periods, isTime),
    hiddenCourses: Array.isArray(s.hiddenCourses) ? s.hiddenCourses : [],
  };
}
