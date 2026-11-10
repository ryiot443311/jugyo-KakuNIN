import { describe, it, expect } from 'vitest';
import { buildIcs, quarterDates } from './ics';

const quarters = { 3: { start: '09-01', end: '10-31' }, 4: { start: '11-01', end: '01-31' } };
const periods = { 1: { start: '09:00', end: '10:30' } };
const now = new Date('2026-08-01T00:00:00Z');
const course = (extra) => ({ id: 'c1', name: '線形代数, 演習;1', dayOfWeek: 3, period: 1, quarter: [3], room: 'A-1', teacher: '佐藤', ...extra });
const unfold = (text) => text.replace(/\r\n /g, '');

describe('quarterDates', () => {
  it('年度の期間にする（年をまたぐ期間は終了が翌年）', () => {
    expect(quarterDates(quarters[3], 2026)).toEqual({ start: '2026-09-01', end: '2026-10-31' });
    expect(quarterDates(quarters[4], 2026)).toEqual({ start: '2026-11-01', end: '2027-01-31' });
    expect(quarterDates({ start: '01-10', end: '03-01' }, 2026)).toEqual({ start: '2027-01-10', end: '2027-03-01' });
  });
});

describe('buildIcs', () => {
  it('毎週の授業を、最初の授業日から期間の終わりまで繰り返す', () => {
    const { text, count } = buildIcs({ courses: [course()], quarters, periods, fiscalYear: 2026, from: '2026-08-01', now });
    const t = unfold(text);
    expect(count).toBe(1);
    expect(t).toContain('DTSTART:20260902T090000'); // 9/1(火) 開始なので最初の水曜は 9/2
    expect(t).toContain('DTEND:20260902T103000');
    expect(t).toContain('RRULE:FREQ=WEEKLY;INTERVAL=1;UNTIL=20261031T235959');
    expect(t).toContain('SUMMARY:線形代数\\, 演習\\;1');
    expect(t).toContain('LOCATION:A-1');
    expect(t).toContain('TRIGGER:-PT10M');
    expect(text.split('\r\n')[0]).toBe('BEGIN:VCALENDAR');
    expect(text.endsWith('END:VCALENDAR\r\n')).toBe(true);
  });
  it('隔週は2週ごと。偶数週は第2週から始まる', () => {
    const t = unfold(buildIcs({ courses: [course({ weeks: 'even' })], quarters, periods, fiscalYear: 2026, from: '2026-08-01', now }).text);
    expect(t).toContain('DTSTART:20260909T090000');
    expect(t).toContain('INTERVAL=2');
  });
  it('終わったクォーターは含めず、途中から書き出すときは今日以降の最初の授業日から', () => {
    const c = course({ quarter: [3, 4] });
    const { text, count } = buildIcs({ courses: [c], quarters, periods, fiscalYear: 2026, from: '2026-11-05', now });
    expect(count).toBe(1);
    expect(unfold(text)).toContain('DTSTART:20261111T090000');
    expect(unfold(text)).toContain('UNTIL=20270131T235959');
  });
  it('アラーム 0 分なら付けない。1 行は 75 バイト以内に折り返す', () => {
    const long = course({ name: 'とても長い授業名'.repeat(10) });
    const { text } = buildIcs({ courses: [long], quarters, periods, fiscalYear: 2026, from: '2026-08-01', alarmMinutes: 0, now });
    expect(text).not.toContain('VALARM');
    const enc = new TextEncoder();
    for (const line of text.split('\r\n')) expect(enc.encode(line).length).toBeLessThanOrEqual(75);
    expect(unfold(text)).toContain(`SUMMARY:${'とても長い授業名'.repeat(10)}`);
  });
});
