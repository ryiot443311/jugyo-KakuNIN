import { describe, it, expect } from 'vitest';
import { resolveSettings } from './settings';
import { QUARTERS, PERIODS } from './constants';

describe('resolveSettings', () => {
  it('未保存・不正な値は既定値になる', () => {
    for (const bad of [undefined, null, 5, 'x', []]) {
      expect(resolveSettings(bad)).toEqual({ theme: 'auto', quarters: QUARTERS, periods: PERIODS, hiddenCourses: [], threshold: 80 });
    }
  });
  it('テーマ・出席率の基準は、正しい値だけ採用する', () => {
    expect(resolveSettings({ theme: 'dark', threshold: 70 })).toMatchObject({ theme: 'dark', threshold: 70 });
    expect(resolveSettings({ theme: 'blue', threshold: 0 })).toMatchObject({ theme: 'auto', threshold: 80 });
    expect(resolveSettings({ threshold: 101 }).threshold).toBe(80);
    expect(resolveSettings({ threshold: 70.5 }).threshold).toBe(80);
  });
  it('以前の形式 quarterRanges（[開始月, 開始日, 終了月, 終了日]）を読み込む', () => {
    const s = resolveSettings({ quarterRanges: [[4, 13, 6, 3], [6, 8, 7, 24], [9, 24, 11, 11], [11, 20, 1, 25]] });
    expect(s.quarters).toEqual({
      1: { start: '04-13', end: '06-03' }, 2: { start: '06-08', end: '07-24' },
      3: { start: '09-24', end: '11-11' }, 4: { start: '11-20', end: '01-25' },
    });
  });
  it('quarterRanges の不正な行は、そのクォーターだけ既定値', () => {
    const s = resolveSettings({ quarterRanges: [[4, 13, 6, 3], [13, 1, 7, 24]] });
    expect(s.quarters[1]).toEqual({ start: '04-13', end: '06-03' });
    expect(s.quarters[2]).toEqual(QUARTERS[2]);
  });
  it('quarters があれば quarterRanges より優先する', () => {
    const s = resolveSettings({ quarters: { 1: { start: '05-01', end: '05-31' } }, quarterRanges: [[4, 1, 4, 30]] });
    expect(s.quarters[1]).toEqual({ start: '05-01', end: '05-31' });
  });
  it('存在しない日付（2/30 など）や時刻の形式違いは捨てる', () => {
    const s = resolveSettings({ quarters: { 1: { start: '02-30', end: '05-31' } }, periods: { 1: { start: '25:00', end: '10:30' } } });
    expect(s.quarters[1]).toEqual(QUARTERS[1]);
    expect(s.periods[1]).toEqual(PERIODS[1]);
  });
});
