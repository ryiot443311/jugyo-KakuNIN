import { getQuarterByDate, getFiscalYear, parseDateStr } from '../utils/date';
import { isCourseInQuarter, isCourseOnDate } from './status';

// 学年暦（休校日・曜日振替・補講）
// 休校日: { id, type: 'holiday', start, end, name }（start〜end の期間。1日だけなら同じ日）
// 曜日振替: { id, type: 'swap', date, dayOfWeek, name }（その日は dayOfWeek 曜日の授業を行う）
// 補講: { id, type: 'makeup', date, courseId, period, room, name }（その授業を、その日・その時限に1回だけ行う）
export const CALENDAR_KEY = 'school_calendar';

export const CALENDAR_TYPES = { holiday: '休校日', swap: '曜日振替', makeup: '補講' };

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const isText = (v) => typeof v === 'string';
// 実在する日付か（2月30日などは除く）
const isDate = (v) => isText(v) && DATE_RE.test(v) && (() => { const d = parseDateStr(v); return d.getDate() === Number(v.slice(8)); })();

const sanitizeEvent = (e) => {
  if (!isPlainObject(e) || !isText(e.id)) return null;
  const name = isText(e.name) ? e.name : '';
  if (e.type === 'holiday') {
    if (!isDate(e.start) || !isDate(e.end) || e.end < e.start) return null;
    return { id: e.id, type: 'holiday', start: e.start, end: e.end, name };
  }
  if (e.type === 'swap') {
    if (!isDate(e.date) || !Number.isInteger(e.dayOfWeek) || e.dayOfWeek < 0 || e.dayOfWeek > 6) return null;
    return { id: e.id, type: 'swap', date: e.date, dayOfWeek: e.dayOfWeek, name };
  }
  if (e.type === 'makeup') {
    if (!isDate(e.date) || !isText(e.courseId) || !Number.isInteger(e.period) || e.period < 1) return null;
    return { id: e.id, type: 'makeup', date: e.date, courseId: e.courseId, period: e.period, room: isText(e.room) ? e.room : '', name };
  }
  return null;
};

// 保存データの検証。不正なら例外にして、呼び出し側で初期値に戻す。id が重複したものは先頭だけ残す
export const sanitizeCalendar = (arr) => {
  if (!Array.isArray(arr)) throw new Error('calendar is not an array');
  const seen = new Set();
  return arr.map(sanitizeEvent).filter(e => e && !seen.has(e.id) && seen.add(e.id));
};

// 予定の最初と最後の日
export const eventStart = (e) => (e.type === 'holiday' ? e.start : e.date);
export const eventEnd = (e) => (e.type === 'holiday' ? e.end : e.date);

// 日付順（同じ日は 休校日 → 振替 → 補講）
const TYPE_ORDER = { holiday: 0, swap: 1, makeup: 2 };
export const sortCalendar = (calendar) => [...calendar].sort((a, b) => (
  eventStart(a) < eventStart(b) ? -1 : eventStart(a) > eventStart(b) ? 1 : TYPE_ORDER[a.type] - TYPE_ORDER[b.type] || (a.period ?? 0) - (b.period ?? 0)
));

export const holidayOn = (calendar, date) => calendar.find(e => e.type === 'holiday' && e.start <= date && date <= e.end);
export const swapOn = (calendar, date) => calendar.find(e => e.type === 'swap' && e.date === date);

// その日の授業（時限順）。休校日は時間割の授業なし、曜日振替の日は振替先の曜日の授業になる
// 補講は、授業の情報（時限・教室）を補講のものに置き換え、makeupId を付けて返す
// （記録は授業の id で付けるので、補講の記録もその授業の出席率に入る）
// quarter を省くと、その日のクォーターを使う。クォーター外の日は時間割の授業なし（補講だけ）
// 同じ授業が時間割と補講の両方にある日は、時間割を優先する（1日1授業1記録のため）
export function coursesOnDate({ courses, date, quarters, calendar = [], quarter }) {
  const q = quarter ?? getQuarterByDate(parseDateStr(date), quarters);
  const swap = swapOn(calendar, date);
  const regular = q === 0 || holidayOn(calendar, date) ? [] : courses.filter(c => isCourseInQuarter(c, q) && isCourseOnDate(c, date, quarters, swap?.dayOfWeek));
  const ids = new Set(regular.map(c => c.id));
  const makeups = calendar
    .filter(e => e.type === 'makeup' && e.date === date)
    .map(e => { const c = courses.find(x => x.id === e.courseId); return c && { ...c, period: e.period, room: e.room || c.room, makeupId: e.id }; })
    .filter(c => c && !ids.has(c.id) && ids.add(c.id));
  return [...regular, ...makeups].sort((a, b) => a.period - b.period);
}

// 補講を登録できない理由（登録できるなら null）。同じ日に同じ授業が二つあると、記録が1件しか付けられないため
export const makeupError = ({ course, date, quarters, calendar }) => {
  if (!date || !DATE_RE.test(date)) return '日付を入れてください。';
  if (coursesOnDate({ courses: [course], date, quarters, calendar }).length > 0) return 'この日は、すでにこの授業があります（時間割どおり、または補講）。';
  return null;
};

// その日の説明（日別画面の上に出す）。無ければ null
export function dayNote(calendar, date) {
  const holiday = holidayOn(calendar, date);
  if (holiday) return { type: 'holiday', text: `休校日${holiday.name ? `（${holiday.name}）` : ''}` };
  const swap = swapOn(calendar, date);
  if (swap) return { type: 'swap', dayOfWeek: swap.dayOfWeek, name: swap.name };
  return null;
}

// fiscalYear 年度より前に終わった予定（新年度の準備で消す）
export const eventsBeforeYear = (calendar, fiscalYear) => calendar.filter(e => getFiscalYear(eventEnd(e)) < fiscalYear);
