import { describe, it, expect } from 'vitest';
import { findUnrecorded } from './unrecorded';

const quarters = { 1: { start: '04-01', end: '05-31' }, 2: { start: '06-01', end: '07-31' }, 3: { start: '09-01', end: '10-31' }, 4: { start: '11-01', end: '01-31' } };
const periods = { 1: { start: '09:00', end: '10:30' }, 2: { start: '10:40', end: '12:10' } };
const courses = [
  { id: 'wed1', name: 'A', dayOfWeek: 3, period: 1, quarter: 3 },
  { id: 'wed2', name: 'B', dayOfWeek: 3, period: 2, quarter: 3 },
  { id: 'q4', name: 'C', dayOfWeek: 3, period: 1, quarter: 4 },
];
const log = (courseId, date) => ({ id: `${courseId}-${date}`, courseId, date, status: '出席' });
const run = (logs, extra = {}) => findUnrecorded({ logs, courses, quarters, periods, today: '2026-10-28', nowMin: 11 * 60, ...extra })
  .map(u => `${u.date} ${u.course.id}`);

describe('findUnrecorded（記録し忘れの検出）', () => {
  it('記録がひとつもなければ検出しない', () => {
    expect(run([])).toEqual([]);
  });
  it('最初の記録以降で、記録のない授業を新しい順・時限順に返す', () => {
    // 10/14 から使い始め。10/21 は A だけ記録、10/28(今日)は 1限が終わり 2限はまだ
    expect(run([log('wed1', '2026-10-14'), log('wed2', '2026-10-14'), log('wed1', '2026-10-21')]))
      .toEqual(['2026-10-28 wed1', '2026-10-21 wed2']);
  });
  it('今日の授業は、終わったものだけ数える', () => {
    expect(run([log('wed1', '2026-10-21'), log('wed2', '2026-10-21')], { nowMin: 9 * 60 })).toEqual([]);
    expect(run([log('wed1', '2026-10-21'), log('wed2', '2026-10-21')], { nowMin: 13 * 60 })).toEqual(['2026-10-28 wed1', '2026-10-28 wed2']);
  });
  it('休講も記録として扱い、ほかのクォーターの授業は数えない', () => {
    const logs = [log('wed1', '2026-10-21'), { ...log('wed2', '2026-10-21'), status: '休講' }];
    expect(run(logs, { nowMin: 9 * 60 })).toEqual([]); // q4 の授業（第4Q）は第3Qの水曜には数えない
  });
  it('直近4週間より前は数えない', () => {
    const logs = [log('wed1', '2026-09-02')]; // 9/2 から使い始め
    const result = run(logs, { nowMin: 9 * 60 });
    expect(result.at(-1)).toBe('2026-09-30 wed2'); // 28日前（9/30）まで
    expect(result.every(r => r >= '2026-09-30')).toBe(true);
  });
  it('授業を追加した日より前は数えない', () => {
    const added = [...courses, { id: 'new', name: 'D', dayOfWeek: 3, period: 2, quarter: 3, createdAt: '2026-10-20' }];
    const result = findUnrecorded({ logs: [log('wed1', '2026-10-07'), log('wed2', '2026-10-07')], courses: added, quarters, periods, today: '2026-10-28', nowMin: 9 * 60 })
      .filter(u => u.course.id === 'new').map(u => u.date);
    expect(result).toEqual(['2026-10-21']); // 10/14 は追加前なので数えない
  });
  it('休み期間は数えない', () => {
    expect(run([log('wed1', '2026-08-05')], { today: '2026-08-26', nowMin: 23 * 60 })).toEqual([]);
  });
});
