import { parseDateStr, getQuarterWeek } from '../utils/date';
import { ja } from '../i18n/messages';

export const STATUSES = ['出席', '遅刻', '欠席', '休講'];

const STATUS_KEYS = { '出席': 'present', '遅刻': 'late', '欠席': 'absent', '休講': 'canceled' };

// 状態に対応する CSS クラス（背景色 / 文字色）
export const statusBgClass = (status) => `st-${STATUS_KEYS[status]}`;
export const statusTextClass = (status) => `st-text-${STATUS_KEYS[status]}`;

// quarter 未指定の授業は全クォーターに表示する
export const isCourseInQuarter = (course, quarter) => !course.quarter || course.quarter === quarter || (Array.isArray(course.quarter) && course.quarter.includes(quarter));

// 隔週授業の種類（未指定は毎週）。表示名は i18n/messages.js の weekPatterns
export const WEEK_PATTERNS = [{ id: 'every' }, { id: 'odd' }, { id: 'even' }];
export const weekPatternLabel = (course, t = ja) => t.weekPatterns[WEEK_PATTERNS.some(w => w.id === course.weeks) ? course.weeks : 'every'];

// 授業がその日にあるか（曜日と隔週で判定。クォーターは呼び出し側で確認する）
// 隔週は、その日のクォーターの開始週を第1週として奇数・偶数を数える。クォーター外の日は隔週を考えない
export const isCourseOnDate = (course, dateStr, quarters) => {
  if (course.dayOfWeek !== parseDateStr(dateStr).getDay()) return false;
  if (course.weeks !== 'odd' && course.weeks !== 'even') return true;
  const week = getQuarterWeek(dateStr, quarters);
  return week === 0 || (week % 2 === 1) === (course.weeks === 'odd');
};

// 授業の開講クォーターの表示用ラベル（未指定・全クォーターは「全Q」）
export const quarterLabel = (course, t = ja) => {
  const qs = [].concat(course.quarter ?? [1, 2, 3, 4]);
  return qs.length === 4 ? t.allQuarters : t.quarterList(qs);
};
