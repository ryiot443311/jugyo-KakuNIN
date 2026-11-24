import { describe, it, expect } from 'vitest';
import { sanitizeCalendar, coursesOnDate, dayNote, eventsBeforeYear, sortCalendar } from './calendar';

const quarters = { 3: { start: '09-01', end: '10-31' }, 4: { start: '11-01', end: '01-31' } };
const courses = [
  { id: 'wed1', name: 'A', dayOfWeek: 3, period: 1, quarter: 3, room: '101' },
  { id: 'wed2', name: 'B', dayOfWeek: 3, period: 2, quarter: 3, weeks: 'odd' }, // 10/28 は第9週（奇数）
  { id: 'thu1', name: 'C', dayOfWeek: 4, period: 1, quarter: 3, room: '202' },
];
const ids = (args) => coursesOnDate({ courses, quarters, ...args }).map(c => `${c.id}@${c.period}${c.makeupId ? '補' : ''}`);

describe('sanitizeCalendar', () => {
  it('種類ごとに必要な項目がそろったものだけ残す', () => {
    const result = sanitizeCalendar([
      { id: 'h1', type: 'holiday', start: '2026-10-28', end: '2026-10-30', name: '大学祭', extra: 1 },
      { id: 'h2', type: 'holiday', start: '2026-10-30', end: '2026-10-28' }, // 終わりが前
      { id: 'h3', type: 'holiday', start: '2026-02-30', end: '2026-02-30' }, // 存在しない日
      { id: 's1', type: 'swap', date: '2026-10-29', dayOfWeek: 3 },
      { id: 's2', type: 'swap', date: '2026-10-29', dayOfWeek: 7 },
      { id: 'm1', type: 'makeup', date: '2026-10-31', courseId: 'wed1', period: 2 },
      { id: 'm2', type: 'makeup', date: '2026-10-31', courseId: 'wed1', period: 0 },
      { id: 'h1', type: 'holiday', start: '2026-11-01', end: '2026-11-01' }, // id の重複
      { id: 'x', type: 'other', date: '2026-10-31' },
      null,
    ]);
    expect(result).toEqual([
      { id: 'h1', type: 'holiday', start: '2026-10-28', end: '2026-10-30', name: '大学祭' },
      { id: 's1', type: 'swap', date: '2026-10-29', dayOfWeek: 3, name: '' },
      { id: 'm1', type: 'makeup', date: '2026-10-31', courseId: 'wed1', period: 2, room: '', name: '' },
    ]);
    expect(() => sanitizeCalendar({})).toThrow();
  });
});

describe('coursesOnDate', () => {
  it('学年暦がなければ時間割どおり（時限順）', () => {
    expect(ids({ date: '2026-10-28' })).toEqual(['wed1@1', 'wed2@2']);
    expect(ids({ date: '2026-10-21' })).toEqual(['wed1@1']); // 偶数週は隔週の授業なし
  });
  it('休校日は時間割の授業なし（期間の最初と最後の日も含む）', () => {
    const calendar = [{ id: 'h', type: 'holiday', start: '2026-10-27', end: '2026-10-29', name: '' }];
    expect(ids({ date: '2026-10-27', calendar })).toEqual([]);
    expect(ids({ date: '2026-10-29', calendar })).toEqual([]);
    expect(ids({ date: '2026-10-30', calendar })).toEqual([]); // 金曜はもともと授業なし
    expect(ids({ date: '2026-10-22', calendar })).toEqual(['thu1@1']);
  });
  it('曜日振替の日は、振替先の曜日の授業になる（隔週はその日の週で数える）', () => {
    const calendar = [{ id: 's', type: 'swap', date: '2026-10-29', dayOfWeek: 3, name: '' }];
    expect(ids({ date: '2026-10-29', calendar })).toEqual(['wed1@1', 'wed2@2']); // 木曜だが水曜の授業
    const even = [{ id: 's', type: 'swap', date: '2026-10-22', dayOfWeek: 3, name: '' }];
    expect(ids({ date: '2026-10-22', calendar: even })).toEqual(['wed1@1']);
  });
  it('補講は、時限・教室を補講のものにして加える（教室が空ならいつもの教室）', () => {
    const calendar = [
      { id: 'm1', type: 'makeup', date: '2026-10-30', courseId: 'wed1', period: 3, room: '', name: '' },
      { id: 'm2', type: 'makeup', date: '2026-10-30', courseId: 'thu1', period: 2, room: '303', name: '' },
    ];
    const list = coursesOnDate({ courses, quarters, calendar, date: '2026-10-30' });
    expect(list.map(c => [c.id, c.period, c.room, c.makeupId])).toEqual([['thu1', 2, '303', 'm2'], ['wed1', 3, '101', 'm1']]);
    expect(courses[0].period).toBe(1); // 元の授業は変えない
  });
  it('補講は休校日・クォーター外の日にも出し、同じ日に時間割の授業があれば時間割を優先する', () => {
    const calendar = [
      { id: 'h', type: 'holiday', start: '2026-10-28', end: '2026-10-28', name: '' },
      { id: 'm1', type: 'makeup', date: '2026-10-28', courseId: 'thu1', period: 3, room: '', name: '' },
      { id: 'm2', type: 'makeup', date: '2026-10-29', courseId: 'thu1', period: 3, room: '', name: '' },
      { id: 'm3', type: 'makeup', date: '2026-08-05', courseId: 'thu1', period: 1, room: '', name: '' },
      { id: 'm4', type: 'makeup', date: '2026-08-05', courseId: 'gone', period: 2, room: '', name: '' }, // 授業がない
    ];
    expect(ids({ date: '2026-10-28', calendar })).toEqual(['thu1@3補']);
    expect(ids({ date: '2026-10-29', calendar })).toEqual(['thu1@1']);
    expect(ids({ date: '2026-08-05', calendar })).toEqual(['thu1@1補']);
  });
  it('quarter を渡すと、そのクォーターの授業で判定する', () => {
    expect(ids({ date: '2026-10-28', quarter: 4 })).toEqual([]);
  });
});

describe('dayNote・eventsBeforeYear・sortCalendar', () => {
  const calendar = [
    { id: 'm', type: 'makeup', date: '2026-04-10', courseId: 'wed1', period: 2, room: '', name: '' },
    { id: 's', type: 'swap', date: '2026-04-10', dayOfWeek: 1, name: '振替' },
    { id: 'h', type: 'holiday', start: '2026-03-25', end: '2026-04-05', name: '春休み' },
    { id: 'old', type: 'holiday', start: '2025-12-28', end: '2026-01-04', name: '' },
  ];
  it('その日の説明（休校日を優先）', () => {
    expect(dayNote(calendar, '2026-04-01')).toEqual({ type: 'holiday', text: '休校日（春休み）' });
    expect(dayNote(calendar, '2026-04-10')).toEqual({ type: 'swap', dayOfWeek: 1, name: '振替' });
    expect(dayNote(calendar, '2026-04-11')).toBeNull();
  });
  it('年度より前に終わった予定（年度をまたぐ休校日は残す）', () => {
    expect(eventsBeforeYear(calendar, 2026).map(e => e.id)).toEqual(['old']);
  });
  it('日付順・同じ日は 休校日 → 振替 → 補講', () => {
    expect(sortCalendar(calendar).map(e => e.id)).toEqual(['old', 'h', 's', 'm']);
  });
});
