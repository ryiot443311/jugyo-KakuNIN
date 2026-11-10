import { parseDateStr, getQuarterWeek } from '../utils/date';

export const STATUSES = ['出席', '遅刻', '欠席', '休講'];

const STATUS_KEYS = { '出席': 'present', '遅刻': 'late', '欠席': 'absent', '休講': 'canceled' };

// 状態に対応する CSS クラス（背景色 / 文字色）
export const statusBgClass = (status) => `st-${STATUS_KEYS[status]}`;
export const statusTextClass = (status) => `st-text-${STATUS_KEYS[status]}`;

// quarter 未指定の授業は全クォーターに表示する
export const isCourseInQuarter = (course, quarter) => !course.quarter || course.quarter === quarter || (Array.isArray(course.quarter) && course.quarter.includes(quarter));

// 隔週授業の種類（未指定は毎週）
export const WEEK_PATTERNS = [
  { id: 'every', label: '毎週' },
  { id: 'odd', label: '奇数週' },
  { id: 'even', label: '偶数週' },
];
export const weekPatternLabel = (course) => WEEK_PATTERNS.find(w => w.id === course.weeks)?.label ?? '毎週';

// 授業がその日にあるか（曜日と隔週で判定。クォーターは呼び出し側で確認する）
// 隔週は、その日のクォーターの開始週を第1週として奇数・偶数を数える。クォーター外の日は隔週を考えない
export const isCourseOnDate = (course, dateStr, quarters) => {
  if (course.dayOfWeek !== parseDateStr(dateStr).getDay()) return false;
  if (course.weeks !== 'odd' && course.weeks !== 'even') return true;
  const week = getQuarterWeek(dateStr, quarters);
  return week === 0 || (week % 2 === 1) === (course.weeks === 'odd');
};

// 授業の開講クォーターの表示用ラベル（未指定・全クォーターは「全Q」）
export const quarterLabel = (course) => {
  const qs = [].concat(course.quarter ?? [1, 2, 3, 4]);
  return qs.length === 4 ? '全Q' : `第${qs.join('・')}Q`;
};
