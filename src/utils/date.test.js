import { describe, it, expect } from 'vitest';
import { addDays, getDateOfWeekday, getFiscalYear, getNearestQuarter, getQuarterByDate, getWeekOfMonth, parseDateStr } from './date';

const QUARTERS = {
  1: { start: '04-13', end: '06-03' },
  2: { start: '06-08', end: '07-24' },
  3: { start: '09-24', end: '11-11' },
  4: { start: '11-20', end: '01-25' }, // 年をまたぐ
};
const q = (str, quarters = QUARTERS) => getQuarterByDate(parseDateStr(str), quarters);

describe('getQuarterByDate', () => {
  it('期間内の日付はそのクォーターを返す（境界日を含む）', () => {
    expect(q('2026-04-13')).toBe(1);
    expect(q('2026-06-03')).toBe(1);
    expect(q('2026-09-24')).toBe(3);
    expect(q('2026-11-11')).toBe(3);
  });
  it('年をまたぐクォーターは、前の年末も翌年の年始も同じクォーター', () => {
    expect(q('2026-12-25')).toBe(4);
    expect(q('2027-01-10')).toBe(4);
    expect(q('2027-01-25')).toBe(4);
  });
  it('どの期間にも入らない日は 0', () => {
    expect(q('2026-06-05')).toBe(0);
    expect(q('2026-08-15')).toBe(0);
    expect(q('2027-02-10')).toBe(0);
  });
  it('不正な日付は 0', () => {
    expect(getQuarterByDate(new Date('invalid'), QUARTERS)).toBe(0);
    expect(getQuarterByDate(null, QUARTERS)).toBe(0);
  });
});

describe('getNearestQuarter', () => {
  it('期間内ならそのクォーター', () => {
    expect(getNearestQuarter(parseDateStr('2026-10-01'), QUARTERS)).toBe(3);
  });
  it('休み期間なら次に始まるクォーター', () => {
    expect(getNearestQuarter(parseDateStr('2026-08-15'), QUARTERS)).toBe(3); // 夏休み → 第3Q
    expect(getNearestQuarter(parseDateStr('2026-06-05'), QUARTERS)).toBe(2);
    expect(getNearestQuarter(parseDateStr('2027-02-10'), QUARTERS)).toBe(1); // 春休み → 第1Q
  });
});

describe('getFiscalYear（4月始まり）', () => {
  it('4月〜12月はその年、1〜3月は前の年', () => {
    expect(getFiscalYear('2026-04-01')).toBe(2026);
    expect(getFiscalYear('2026-12-31')).toBe(2026);
    expect(getFiscalYear('2027-01-01')).toBe(2026);
    expect(getFiscalYear('2027-03-31')).toBe(2026);
    expect(getFiscalYear('2027-04-01')).toBe(2027);
  });
});

describe('日付の計算', () => {
  it('addDays は月・年をまたいで計算する', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    expect(addDays('2026-10-28', -7)).toBe('2026-10-21');
  });
  it('getDateOfWeekday は日曜始まりの同じ週の指定曜日', () => {
    expect(getDateOfWeekday('2026-10-28', 0)).toBe('2026-10-25'); // 水曜 → その週の日曜
    expect(getDateOfWeekday('2026-10-28', 6)).toBe('2026-10-31');
    expect(getDateOfWeekday('2026-10-25', 1)).toBe('2026-10-26');
  });
  it('getWeekOfMonth は月の第何週か', () => {
    expect(getWeekOfMonth(parseDateStr('2026-10-01'))).toBe(1);
    expect(getWeekOfMonth(parseDateStr('2026-10-27'))).toBe(5);
  });
});
