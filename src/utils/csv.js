import { DAYS, getFiscalYear, parseDateStr } from './date';

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
export function buildDetailCsv(logs, courses) {
  const byId = new Map(courses.map(c => [c.id, c]));
  const rows = [...logs]
    .sort((a, b) => a.date.localeCompare(b.date) || (byId.get(a.courseId)?.period ?? 0) - (byId.get(b.courseId)?.period ?? 0) || (a.recordedAt ?? '').localeCompare(b.recordedAt ?? ''))
    .map(l => {
      const c = byId.get(l.courseId);
      return [l.date, DAYS[parseDateStr(l.date).getDay()], c?.period ?? '', c?.name ?? '不明', l.status, l.recordedAt ?? '', `第${l.quarter}Q`, `${getFiscalYear(l.date)}年度`];
    });
  return toCsv([['日付', '曜日', '時限', '授業名', '状態', '記録時刻', 'クォーター', '年度'], ...rows]);
}

// 授業ごとの集計（出席率は休講を除いた回数に対する、出席＋遅刻の割合）
export function buildSummaryCsv(logs, courses) {
  const byId = new Map(courses.map(c => [c.id, c]));
  const stats = new Map();
  const add = (key, status) => {
    if (!stats.has(key)) stats.set(key, { 出席: 0, 遅刻: 0, 欠席: 0, 休講: 0 });
    stats.get(key)[status] += 1;
  };
  for (const l of logs) { add(byId.get(l.courseId)?.name ?? '不明', l.status); add('全体', l.status); }
  const toRow = (name, s) => [name, s.出席, s.遅刻, s.欠席, s.休講, s.出席 + s.遅刻 + s.欠席, rate(s.出席, s.遅刻, s.欠席)];
  const overall = stats.get('全体');
  const rows = [...stats.entries()].filter(([name]) => name !== '全体').sort(([a], [b]) => a.localeCompare(b, 'ja')).map(([name, s]) => toRow(name, s));
  return toCsv([['授業名', '出席', '遅刻', '欠席', '休講', '授業回数(休講除く)', '出席率(%)'], ...(overall ? [toRow('全体', overall)] : []), ...rows]);
}
