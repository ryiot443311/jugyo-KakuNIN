import { STATUSES } from '../data/status';

export const countStatuses = (logs) => {
  const c = Object.fromEntries(STATUSES.map((s) => [s, 0]));
  for (const l of logs) if (l.status in c) c[l.status]++;
  return c;
};

// 休講は母数に含めない。遅刻は出席扱い
export const calcRate = (present, late, absent) => {
  const total = present + late + absent;
  return total === 0 ? 0 : Math.round(((present + late) / total) * 100);
};

// 基準 threshold(%) を保ったまま、あと何回欠席できるか。記録がなければ null
export const calcAllowance = (attended, total, threshold) => {
  if (total === 0) return null;
  const maxTotal = Math.floor((attended * 100) / threshold + 1e-9);
  return Math.max(0, maxTotal - total);
};

// 授業名ごとの出席状況（同じ名前の授業は合算）
export const buildCourseAnalytics = (courses, logs, threshold) => {
  const nameById = new Map(courses.map((c) => [c.id, c.name]));
  const stats = new Map([...new Set(nameById.values())].map((name) => [name, { name, present: 0, late: 0, absent: 0, hasCanceled: false }]));
  for (const l of logs) {
    const st = stats.get(nameById.get(l.courseId));
    if (!st) continue;
    if (l.status === '出席') st.present++;
    else if (l.status === '遅刻') st.late++;
    else if (l.status === '欠席') st.absent++;
    else if (l.status === '休講') st.hasCanceled = true;
  }
  return [...stats.values()]
    .map((st) => {
      const total = st.present + st.late + st.absent;
      const attended = st.present + st.late;
      return {
        ...st,
        total,
        rate: calcRate(st.present, st.late, st.absent),
        ok: attended * 100 >= threshold * total,
        allowance: calcAllowance(attended, total, threshold),
      };
    })
    .filter((c) => c.total > 0 || c.hasCanceled);
};
