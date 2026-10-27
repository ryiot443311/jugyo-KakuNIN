import { describe, it, expect } from 'vitest';
import { absenceByWeekday, topAbsenceSlots, weeklyRates } from './trends';

const log = (date, status, courseId = 'a') => ({ id: `${courseId}-${date}-${status}`, courseId, date, status });

describe('weeklyRates（週ごとの出席率）', () => {
  it('日曜始まりの週ごとに集計し、古い週から並べる', () => {
    const result = weeklyRates([
      log('2026-10-21', '欠席'), log('2026-10-19', '出席'), log('2026-10-25', '出席'), // 10/18週: 出席1・欠席1, 10/25週(日曜): 出席1
      log('2026-10-14', '遅刻'),
    ]);
    expect(result.map(w => [w.week, w.rate])).toEqual([['2026-10-11', 100], ['2026-10-18', 50], ['2026-10-25', 100]]);
  });
  it('休講だけの週は除く', () => {
    expect(weeklyRates([log('2026-10-21', '休講')])).toEqual([]);
  });
});

describe('absenceByWeekday（曜日ごとの欠席数）', () => {
  it('月〜土を数え、日曜は欠席があるときだけ含める', () => {
    const result = absenceByWeekday([log('2026-10-19', '欠席'), log('2026-10-26', '欠席'), log('2026-10-21', '出席')]);
    expect(result.map(r => r.day)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(result.find(r => r.day === 1).count).toBe(2);
    expect(absenceByWeekday([log('2026-10-25', '欠席')]).map(r => r.day)).toEqual([1, 2, 3, 4, 5, 6, 0]);
  });
});

describe('topAbsenceSlots（欠席の多い曜日・時限）', () => {
  const courses = [{ id: 'a', name: '英語', dayOfWeek: 1, period: 1 }, { id: 'b', name: '数学', dayOfWeek: 3, period: 2 }];
  it('多い順に返し、授業名をまとめる', () => {
    const result = topAbsenceSlots([log('2026-10-19', '欠席', 'a'), log('2026-10-26', '欠席', 'a'), log('2026-10-21', '欠席', 'b'), log('2026-10-28', '遅刻', 'b')], courses);
    expect(result).toEqual([
      { day: 1, period: 1, count: 2, names: ['英語'] },
      { day: 3, period: 2, count: 1, names: ['数学'] },
    ]);
  });
  it('欠席がなければ空、授業が見つからない記録は数えない', () => {
    expect(topAbsenceSlots([log('2026-10-19', '出席', 'a'), log('2026-10-19', '欠席', 'zz')], courses)).toEqual([]);
  });
});
