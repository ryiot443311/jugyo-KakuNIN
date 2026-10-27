import { describe, it, expect } from 'vitest';
import { buildCourseAnalytics, calcAllowance, calcRate, countStatuses } from './stats';

describe('calcRate', () => {
  it('遅刻は出席扱い、休講は母数に含めない', () => {
    expect(calcRate(3, 1, 1)).toBe(80);
    expect(calcRate(0, 0, 0)).toBe(0);
    expect(calcRate(1, 0, 2)).toBe(33);
  });
});

describe('calcAllowance（あと何回欠席できるか）', () => {
  it('基準を保てる回数を返す', () => {
    expect(calcAllowance(8, 8, 80)).toBe(2); // 8/10 まで → あと2回
    expect(calcAllowance(4, 5, 80)).toBe(0); // ちょうど基準
  });
  it('基準を下回っていれば 0', () => {
    expect(calcAllowance(1, 3, 80)).toBe(0);
  });
  it('記録がなければ null', () => {
    expect(calcAllowance(0, 0, 80)).toBeNull();
  });
});

describe('countStatuses', () => {
  it('状態ごとに数える', () => {
    const logs = [{ status: '出席' }, { status: '出席' }, { status: '欠席' }, { status: '休講' }];
    expect(countStatuses(logs)).toEqual({ 出席: 2, 遅刻: 0, 欠席: 1, 休講: 1 });
  });
});

describe('buildCourseAnalytics', () => {
  const courses = [{ id: 'a', name: '線形代数' }, { id: 'a2', name: '線形代数' }, { id: 'b', name: '英語' }, { id: 'c', name: '体育' }];
  const logs = [
    { courseId: 'a', status: '出席' }, { courseId: 'a2', status: '欠席' }, { courseId: 'a', status: '出席' },
    { courseId: 'b', status: '欠席' }, { courseId: 'c', status: '休講' },
  ];
  const result = buildCourseAnalytics(courses, logs, 70);

  it('同じ名前の授業は合算する', () => {
    const math = result.find(r => r.name === '線形代数');
    expect(math).toMatchObject({ present: 2, absent: 1, total: 3, rate: 67, ok: false });
  });
  it('基準を下回る科目は ok が false', () => {
    expect(result.find(r => r.name === '英語').ok).toBe(false);
  });
  it('休講だけの科目も一覧に残り、記録のない科目は除く', () => {
    expect(result.map(r => r.name).sort()).toEqual(['体育', '線形代数', '英語'].sort());
    expect(buildCourseAnalytics(courses, [], 70)).toEqual([]);
  });
});
