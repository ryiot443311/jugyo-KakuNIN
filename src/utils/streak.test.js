import { describe, it, expect } from 'vitest';
import { getAbsenceStreak } from './streak';

const log = (date, status, courseId = 'a') => ({ id: `${courseId}-${date}`, courseId, date, status });

describe('getAbsenceStreak', () => {
  it('直近の連続欠席を数える', () => {
    const logs = [log('2026-10-01', '出席'), log('2026-10-08', '欠席'), log('2026-10-15', '欠席')];
    expect(getAbsenceStreak(logs, 'a', '2026-10-22')).toBe(2);
  });
  it('出席・遅刻で途切れる', () => {
    expect(getAbsenceStreak([log('2026-10-01', '欠席'), log('2026-10-08', '遅刻')], 'a', '2026-10-15')).toBe(0);
    expect(getAbsenceStreak([log('2026-10-01', '欠席'), log('2026-10-08', '欠席'), log('2026-10-15', '出席')], 'a', '2026-10-22')).toBe(0);
  });
  it('休講は数えず、飛ばす', () => {
    const logs = [log('2026-10-01', '欠席'), log('2026-10-08', '休講'), log('2026-10-15', '欠席')];
    expect(getAbsenceStreak(logs, 'a', '2026-10-22')).toBe(2);
  });
  it('指定日以降の記録と、ほかの授業の記録は数えない', () => {
    const logs = [log('2026-10-01', '欠席'), log('2026-10-08', '欠席'), log('2026-10-15', '欠席', 'b')];
    expect(getAbsenceStreak(logs, 'a', '2026-10-08')).toBe(1); // 10/8 当日は含めない
    expect(getAbsenceStreak(logs, 'a', '2026-10-22')).toBe(2);
  });
  it('記録がなければ 0（並び順が違っても日付順で数える）', () => {
    expect(getAbsenceStreak([], 'a', '2026-10-22')).toBe(0);
    expect(getAbsenceStreak([log('2026-10-15', '欠席'), log('2026-10-01', '出席'), log('2026-10-08', '欠席')], 'a', '2026-10-22')).toBe(2);
  });
});
