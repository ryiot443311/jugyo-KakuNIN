import { addDays } from './date';
import { isCourseInQuarter, isCourseOnDate } from '../data/status';

// 時間割をカレンダー（iCalendar / .ics）にする。授業ごと・クォーターごとに繰り返しの予定を作る
// 時刻は端末の時刻として扱う（タイムゾーンを付けない）

// 年度 fiscalYear のクォーター期間 { start, end }（'YYYY-MM-DD'）。4〜12月始まりはその年、1〜3月始まりは翌年
export const quarterDates = (range, fiscalYear) => {
  const startYear = Number(range.start.slice(0, 2)) >= 4 ? fiscalYear : fiscalYear + 1;
  const endYear = range.end >= range.start ? startYear : startYear + 1;
  return { start: `${startYear}-${range.start}`, end: `${endYear}-${range.end}` };
};

// テキストのエスケープ（RFC 5545）
const esc = (s) => String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');

// 1行 75 バイトごとに折り返す（文字の途中では切らない）
const fold = (line) => {
  const enc = new TextEncoder();
  const out = [];
  let cur = ''; let bytes = 0;
  for (const ch of line) {
    const n = enc.encode(ch).length;
    if (bytes + n > (out.length === 0 ? 75 : 74)) { out.push(cur); cur = ''; bytes = 0; }
    cur += ch; bytes += n;
  }
  out.push(cur);
  return out.join('\r\n ');
};

const ymd = (dateStr) => dateStr.replace(/-/g, '');
const hms = (hhmm) => `${hhmm.replace(':', '')}00`;
const utcStamp = (d) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

// 期間内で、最初に授業がある日（なければ null）
const firstDate = (course, start, end, quarters) => {
  for (let d = start; d <= end; d = addDays(d, 1)) if (isCourseOnDate(course, d, quarters)) return d;
  return null;
};

// from 以降に終わるクォーターだけを含める（過去の予定を作らないため）
export function buildIcs({ courses, quarters, periods, fiscalYear, from, alarmMinutes = 10, now = new Date() }) {
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//jugyo-kakunin//attendance//JA', 'CALSCALE:GREGORIAN', 'X-WR-CALNAME:授業の時間割'];
  let count = 0;
  for (const [q, range] of Object.entries(quarters)) {
    const { start, end } = quarterDates(range, fiscalYear);
    if (end < from) continue;
    for (const c of courses) {
      const p = periods[c.period];
      if (!p || !isCourseInQuarter(c, Number(q))) continue;
      const first = firstDate(c, start > from ? start : from, end, quarters);
      if (!first) continue;
      const interval = c.weeks === 'odd' || c.weeks === 'even' ? 2 : 1;
      lines.push(
        'BEGIN:VEVENT',
        `UID:${c.id}-${fiscalYear}-q${q}@jugyo-kakunin`,
        `DTSTAMP:${utcStamp(now)}`,
        `DTSTART:${ymd(first)}T${hms(p.start)}`,
        `DTEND:${ymd(first)}T${hms(p.end)}`,
        `RRULE:FREQ=WEEKLY;INTERVAL=${interval};UNTIL=${ymd(end)}T235959`,
        `SUMMARY:${esc(c.name)}`,
        ...(c.room ? [`LOCATION:${esc(c.room)}`] : []),
        ...(c.teacher ? [`DESCRIPTION:${esc(`担当: ${c.teacher}`)}`] : []),
      );
      if (alarmMinutes > 0) lines.push('BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${esc(c.name)}`, `TRIGGER:-PT${alarmMinutes}M`, 'END:VALARM');
      lines.push('END:VEVENT');
      count++;
    }
  }
  lines.push('END:VCALENDAR');
  return { text: `${lines.map(fold).join('\r\n')}\r\n`, count };
}

export const icsFileName = (fiscalYear) => `jugyo-timetable-${fiscalYear}.ics`;
