import { addDays, formatDate, getFiscalYear, parseDateStr } from './date';
import { isCourseInQuarter, isCourseOnDate } from '../data/status';
import { coursesOnDate } from '../data/calendar';

// 時間割をカレンダー（iCalendar / .ics）にする。授業ごと・クォーターごとに繰り返しの予定を作る
// 時刻は端末の時刻として扱う（タイムゾーンを付けない）

// 年度 fiscalYear のクォーター期間 { start, end }（'YYYY-MM-DD'）。4〜12月始まりはその年、1〜3月始まりは翌年
// うるう年でない年の 2月29日は、開始なら 3月1日、終了なら 2月28日にする
export const quarterDates = (range, fiscalYear) => {
  const startYear = Number(range.start.slice(0, 2)) >= 4 ? fiscalYear : fiscalYear + 1;
  const endYear = range.end >= range.start ? startYear : startYear + 1;
  const start = formatDate(parseDateStr(`${startYear}-${range.start}`));
  const endRaw = `${endYear}-${range.end}`;
  const endFixed = formatDate(parseDateStr(endRaw));
  return { start, end: endFixed === endRaw ? endRaw : addDays(endFixed, -1) };
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

// 期間内で、時間割どおり（曜日・隔週）なら授業がある日
const regularDates = (course, start, end, quarters) => {
  const dates = [];
  for (let d = start; d <= end; d = addDays(d, 1)) if (isCourseOnDate(course, d, quarters)) dates.push(d);
  return dates;
};

// 学年暦を反映したその日の授業に、時間割の授業として course が入っているか
const heldAsRegular = (course, date, quarters, calendar, quarter) => coursesOnDate({ courses: [course], date, quarters, calendar, quarter }).some(c => !c.makeupId);

// from 以降に終わるクォーターだけを含める（過去の予定を作らないため）
// 学年暦: 休校日・振替で授業がない日は繰り返しから除き（EXDATE）、振替で授業がある日と補講は1回だけの予定にする
export function buildIcs({ courses, quarters, periods, fiscalYear, from, calendar = [], alarmMinutes = 10, now = new Date() }) {
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//jugyo-kakunin//attendance//JA', 'CALSCALE:GREGORIAN', 'X-WR-CALNAME:授業の時間割'];
  let count = 0;
  const addEvent = ({ uid, course, date, period, room, summary, extra = [] }) => {
    lines.push(
      'BEGIN:VEVENT',
      `UID:${uid}@jugyo-kakunin`,
      `DTSTAMP:${utcStamp(now)}`,
      `DTSTART:${ymd(date)}T${hms(period.start)}`,
      `DTEND:${ymd(date)}T${hms(period.end)}`,
      ...extra,
      `SUMMARY:${esc(summary)}`,
      ...(room ? [`LOCATION:${esc(room)}`] : []),
      ...(course.teacher ? [`DESCRIPTION:${esc(`担当: ${course.teacher}`)}`] : []),
    );
    if (alarmMinutes > 0) lines.push('BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${esc(summary)}`, `TRIGGER:-PT${alarmMinutes}M`, 'END:VALARM');
    lines.push('END:VEVENT');
    count++;
  };

  for (const [qKey, range] of Object.entries(quarters)) {
    const q = Number(qKey);
    const { start, end } = quarterDates(range, fiscalYear);
    if (end < from) continue;
    const rangeStart = start > from ? start : from;
    for (const c of courses) {
      const p = periods[c.period];
      if (!p || !isCourseInQuarter(c, q)) continue;
      // 最初の回は、休校日・振替で無くならない日にする（隔週の数え方は変わらない）
      const dates = regularDates(c, rangeStart, end, quarters);
      const held = dates.map(d => heldAsRegular(c, d, quarters, calendar, q));
      const firstIndex = held.indexOf(true);
      if (firstIndex === -1) continue;
      const skipped = dates.filter((d, i) => i > firstIndex && !held[i]);
      const interval = c.weeks === 'odd' || c.weeks === 'even' ? 2 : 1;
      addEvent({
        uid: `${c.id}-${fiscalYear}-q${q}`, course: c, date: dates[firstIndex], period: p, room: c.room, summary: c.name,
        extra: [
          `RRULE:FREQ=WEEKLY;INTERVAL=${interval};UNTIL=${ymd(end)}T235959`,
          ...(skipped.length > 0 ? [`EXDATE:${skipped.map(d => `${ymd(d)}T${hms(p.start)}`).join(',')}`] : []),
        ],
      });
    }
    // 曜日振替の日に、振替先の曜日の授業として行う回
    for (const swap of calendar) {
      if (swap.type !== 'swap' || swap.date < rangeStart || swap.date > end) continue;
      for (const c of coursesOnDate({ courses, date: swap.date, quarters, calendar, quarter: q })) {
        const p = periods[c.period];
        if (!p || c.makeupId || isCourseOnDate(c, swap.date, quarters)) continue;
        addEvent({ uid: `${c.id}-${swap.date}-swap`, course: c, date: swap.date, period: p, room: c.room, summary: `${c.name}（振替）` });
      }
    }
  }

  // 補講（その年度で from 以降のもの）
  for (const e of calendar) {
    if (e.type !== 'makeup' || e.date < from || getFiscalYear(e.date) !== fiscalYear) continue;
    const c = coursesOnDate({ courses, date: e.date, quarters, calendar }).find(x => x.makeupId === e.id);
    const p = c && periods[c.period];
    if (!p) continue;
    addEvent({ uid: `${c.id}-${e.date}-makeup-${e.id}`, course: c, date: e.date, period: p, room: c.room, summary: `${c.name}（補講）` });
  }

  lines.push('END:VCALENDAR');
  return { text: `${lines.map(fold).join('\r\n')}\r\n`, count };
}

export const icsFileName = (fiscalYear) => `jugyo-timetable-${fiscalYear}.ics`;
