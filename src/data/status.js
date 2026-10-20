export const STATUSES = ['出席', '遅刻', '欠席', '休講'];

export const STATUS_COLORS = { '出席': '#22c55e', '遅刻': '#f59e0b', '欠席': '#ef4444', '休講': '#94a3b8' };

// quarter 未指定の授業は全クォーターに表示する
export const isCourseInQuarter = (course, quarter) => !course.quarter || course.quarter === quarter || (Array.isArray(course.quarter) && course.quarter.includes(quarter));
