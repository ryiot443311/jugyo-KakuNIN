import { describe, it, expect } from 'vitest';
import { dueNotifications } from './notify';

const quarters = { 3: { start: '09-01', end: '10-31' } };
const periods = { 1: { start: '09:00', end: '10:30' }, 2: { start: '10:40', end: '12:10' } };
const courses = [
  { id: 'a', name: 'A', dayOfWeek: 3, period: 1, quarter: 3, room: '101' },
  { id: 'b', name: 'B', dayOfWeek: 3, period: 2, quarter: 3, room: '' },
  { id: 'odd', name: 'C', dayOfWeek: 3, period: 2, quarter: 3, weeks: 'odd' }, // 10/28 は第9週（奇数）
  { id: 'even', name: 'D', dayOfWeek: 3, period: 2, quarter: 3, weeks: 'even' },
];
const both = { before: true, after: true };
const run = (nowMin, extra = {}) => dueNotifications({ courses, quarters, periods, logs: [], today: '2026-10-28', nowMin, notify: both, ...extra }).map(n => n.key);

describe('dueNotifications', () => {
  it('開始10分前から5分間、開始前の通知を出す（その日に授業がある授業だけ）', () => {
    expect(run(8 * 60 + 49)).toEqual([]);
    expect(run(8 * 60 + 50)).toEqual(['2026-10-28|a|before']);
    expect(run(8 * 60 + 54)).toEqual(['2026-10-28|a|before']);
    expect(run(8 * 60 + 55)).toEqual([]);
    // 10:30: 1限の終了と、2限の開始10分前（偶数週の授業は今週ないので出ない）
    expect(run(10 * 60 + 30)).toEqual(['2026-10-28|a|after', '2026-10-28|b|before', '2026-10-28|odd|before']);
  });
  it('記録済みの授業は終了時に知らせず、休講の授業は開始前にも知らせない', () => {
    expect(run(10 * 60 + 30, { logs: [{ courseId: 'a', date: '2026-10-28', status: '出席' }] }).filter(k => k.includes('|a|'))).toEqual([]);
    expect(run(8 * 60 + 50, { logs: [{ courseId: 'a', date: '2026-10-28', status: '休講' }] })).toEqual([]);
  });
  it('設定で切った通知は出さない。クォーター外の日は出さない', () => {
    expect(run(10 * 60 + 30, { notify: { before: false, after: true } })).toEqual(['2026-10-28|a|after']);
    expect(run(8 * 60 + 50, { today: '2026-11-04' })).toEqual([]);
  });
});
