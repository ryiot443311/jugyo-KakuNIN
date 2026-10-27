export const STATUSES = ['出席', '遅刻', '欠席', '休講'];

const STATUS_KEYS = { '出席': 'present', '遅刻': 'late', '欠席': 'absent', '休講': 'canceled' };

// 状態に対応する CSS クラス（背景色 / 文字色）
export const statusBgClass = (status) => `st-${STATUS_KEYS[status]}`;
export const statusTextClass = (status) => `st-text-${STATUS_KEYS[status]}`;

// quarter 未指定の授業は全クォーターに表示する
export const isCourseInQuarter = (course, quarter) => !course.quarter || course.quarter === quarter || (Array.isArray(course.quarter) && course.quarter.includes(quarter));

// 授業の開講クォーターの表示用ラベル（未指定・全クォーターは「全Q」）
export const quarterLabel = (course) => {
  const qs = [].concat(course.quarter ?? [1, 2, 3, 4]);
  return qs.length === 4 ? '全Q' : `第${qs.join('・')}Q`;
};
