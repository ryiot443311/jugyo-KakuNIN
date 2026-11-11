import { describe, it, expect } from 'vitest';
import { isCourseOnDate, weekPatternLabel } from './status';

const quarters = { 3: { start: '09-01', end: '10-31' } }; // 9/1（火）開始
const course = (weeks) => ({ id: 'x', name: 'X', dayOfWeek: 3, period: 1, ...(weeks ? { weeks } : {}) });

describe('isCourseOnDate', () => {
  it('毎週の授業は曜日だけで決まる', () => {
    expect(isCourseOnDate(course(), '2026-09-02', quarters)).toBe(true);
    expect(isCourseOnDate(course(), '2026-09-03', quarters)).toBe(false);
  });
  it('奇数週・偶数週の授業は、クォーター開始週を第1週として判定する', () => {
    expect(isCourseOnDate(course('odd'), '2026-09-02', quarters)).toBe(true); // 第1週
    expect(isCourseOnDate(course('odd'), '2026-09-09', quarters)).toBe(false); // 第2週
    expect(isCourseOnDate(course('even'), '2026-09-09', quarters)).toBe(true);
    expect(isCourseOnDate(course('even'), '2026-09-16', quarters)).toBe(false); // 第3週
  });
  it('クォーター外の日は隔週を考えない', () => {
    expect(isCourseOnDate(course('even'), '2026-11-04', quarters)).toBe(true);
  });
  it('表示用の名前', () => {
    expect(weekPatternLabel(course())).toBe('毎週');
    expect(weekPatternLabel(course('odd'))).toBe('奇数週');
  });
});
