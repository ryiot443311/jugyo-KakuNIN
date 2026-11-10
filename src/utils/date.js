import { QUARTERS } from '../data/constants';

export const DAYS = ['日', '月', '火', '水', '木', '金', '土'];

// Date を 'YYYY-MM-DD' に変換
export const formatDate = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// 'YYYY-MM-DD' をローカル時刻の Date に変換（new Date('YYYY-MM-DD') は UTC 扱いになるため）
export const parseDateStr = (str) => { const [y, m, d] = str.split('-').map(Number); return new Date(y, m - 1, d); };

export const addDays = (dateStr, n) => { const d = parseDateStr(dateStr); d.setDate(d.getDate() + n); return formatDate(d); };

// dateStr を含む週（日曜始まり）の、指定曜日の日付
export const getDateOfWeekday = (dateStr, dayOfWeek) => addDays(dateStr, dayOfWeek - parseDateStr(dateStr).getDay());

// 'MM-DD' を月日の数値に変換（例: '04-01' → 401）
const toMonthDay = (mmdd) => Number(mmdd.replace('-', ''));

// 'HH:MM' を 0:00 からの経過分に変換
export const toMinutes = (hhmm) => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; };

// 日付が属するクォーター（どの期間にも入らなければ 0）
export const getQuarterByDate = (dateObj, quarters = QUARTERS) => {
  if (!dateObj || isNaN(dateObj)) return 0;
  const md = (dateObj.getMonth() + 1) * 100 + dateObj.getDate();
  for (const [quarter, { start, end }] of Object.entries(quarters)) {
    const s = toMonthDay(start); const e = toMonthDay(end);
    const inRange = s <= e ? (md >= s && md <= e) : (md >= s || md <= e); // 年をまたぐ期間に対応
    if (inRange) return Number(quarter);
  }
  return 0;
};

// 4月始まりの年度（1〜3月は前の年の年度）。'YYYY-MM-DD' を受け取る
export const getFiscalYear = (dateStr) => { const [y, m] = dateStr.split('-').map(Number); return m >= 4 ? y : y - 1; };

// 期間内ならそのクォーター、休み期間なら次に始まるクォーター
export const getNearestQuarter = (dateObj, quarters = QUARTERS) => {
  const q = getQuarterByDate(dateObj, quarters);
  if (q !== 0) return q;
  const ord = (dateObj.getMonth() + 1) * 31 + dateObj.getDate();
  let best = Number(Object.keys(quarters)[0]);
  let bestDelta = Infinity;
  for (const [quarter, { start }] of Object.entries(quarters)) {
    const [sm, sd] = start.split('-').map(Number);
    const delta = (sm * 31 + sd - ord + 372) % 372;
    if (delta < bestDelta) { bestDelta = delta; best = Number(quarter); }
  }
  return best;
};

// 日付が属するクォーターの開始日 'YYYY-MM-DD'（どのクォーターにも入らなければ null）
export const getQuarterStart = (dateStr, quarters = QUARTERS) => {
  const d = parseDateStr(dateStr);
  const q = getQuarterByDate(d, quarters);
  if (q === 0) return null;
  const s = toMonthDay(quarters[q].start);
  const md = (d.getMonth() + 1) * 100 + d.getDate();
  const year = md >= s ? d.getFullYear() : d.getFullYear() - 1; // 年をまたぐ期間の 1 月側
  return `${year}-${quarters[q].start}`;
};

// クォーターの何週目か（開始日を含む週が第1週。週は月曜始まり）。クォーター外は 0
export const getQuarterWeek = (dateStr, quarters = QUARTERS) => {
  const start = getQuarterStart(dateStr, quarters);
  if (!start) return 0;
  const monday = (s) => { const d = parseDateStr(s); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d; };
  return Math.round((monday(dateStr) - monday(start)) / (7 * 24 * 60 * 60 * 1000)) + 1;
};

export const getWeekOfMonth = (date) => Math.ceil((date.getDate() + new Date(date.getFullYear(), date.getMonth(), 1).getDay()) / 7);
