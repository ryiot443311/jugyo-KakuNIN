import { getFiscalYear, parseDateStr } from './date';
import { ja } from '../i18n/messages';

// 値を CSV のセルにする。先頭が = + - @ の値は、表計算ソフトで式として実行されないよう ' を付ける
const cell = (value) => {
  let s = String(value ?? '');
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

// Excel で文字化けしないよう、BOM 付き・CRLF 区切りにする
const toCsv = (rows) => `\uFEFF${rows.map(r => r.map(cell).join(',')).join('\r\n')}\r\n`;

// 年度（'all' で全て）とクォーター（0 で全て）で記録を絞り込む
export const filterLogs = (logs, { year = 'all', quarter = 0 }) =>
  logs.filter(l => (year === 'all' || getFiscalYear(l.date) === year) && (quarter === 0 || l.quarter === quarter));

const rate = (present, late, absent) => (present + late + absent === 0 ? '' : Math.round(((present + late) / (present + late + absent)) * 100));

// 記録1件を1行にした明細
export function buildDetailCsv(logs, courses, t = ja) {
  const byId = new Map(courses.map(c => [c.id, c]));
  const rows = [...logs]
    .sort((a, b) => a.date.localeCompare(b.date) || (byId.get(a.courseId)?.period ?? 0) - (byId.get(b.courseId)?.period ?? 0) || (a.recordedAt ?? '').localeCompare(b.recordedAt ?? ''))
    .map(l => {
      const c = byId.get(l.courseId);
      return [l.date, t.days[parseDateStr(l.date).getDay()], c?.period ?? '', c?.name ?? t.unknown, t.status(l.status), l.recordedAt ?? '', t.quarter(l.quarter), t.fiscalYear(getFiscalYear(l.date))];
    });
  return toCsv([t.csvDetailHeaders, ...rows]);
}

// 授業ごとの集計（出席率は休講を除いた回数に対する、出席＋遅刻の割合）
export function buildSummaryCsv(logs, courses, t = ja) {
  const byId = new Map(courses.map(c => [c.id, c]));
  const stats = new Map();
  const empty = () => ({ 出席: 0, 遅刻: 0, 欠席: 0, 休講: 0 });
  const overall = empty(); // 授業名と重ならないよう、全体は別に数える
  for (const l of logs) {
    const name = byId.get(l.courseId)?.name ?? t.unknown;
    if (!stats.has(name)) stats.set(name, empty());
    stats.get(name)[l.status] += 1;
    overall[l.status] += 1;
  }
  const toRow = (name, s) => [name, s.出席, s.遅刻, s.欠席, s.休講, s.出席 + s.遅刻 + s.欠席, rate(s.出席, s.遅刻, s.欠席)];
  const rows = [...stats.entries()].sort(([a], [b]) => a.localeCompare(b, t.lang)).map(([name, s]) => toRow(name, s));
  return toCsv([t.csvSummaryHeaders, ...(logs.length > 0 ? [toRow(t.overall, overall)] : []), ...rows]);
}
