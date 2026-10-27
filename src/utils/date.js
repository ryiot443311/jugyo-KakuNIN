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

export const getWeekOfMonth = (date) => Math.ceil((date.getDate() + new Date(date.getFullYear(), date.getMonth(), 1).getDay()) / 7);
