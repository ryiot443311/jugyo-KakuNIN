import { describe, it, expect } from 'vitest';
import { isSafeImagePath, resolveAppData, sanitizeCampuses, sanitizeCourses } from './appData';
import { sanitizeLogs, sanitizeMemos } from './sanitize';
import { MY_COURSES } from './constants';

describe('sanitizeCourses', () => {
  const ok = { id: 'a', name: '授業', dayOfWeek: 1, period: 1, quarter: 3, room: 'R', teacher: 'T' };
  it('正しい授業は残し、必須項目が不正なものは捨てる', () => {
    const result = sanitizeCourses([
      ok,
      { ...ok, id: 'b', name: '  ' }, // 名前が空
      { ...ok, id: 'c', dayOfWeek: 7 }, // 曜日が範囲外
      { ...ok, id: 'd', period: 0 }, // 時限が範囲外
      { ...ok, id: 'a' }, // id 重複
      null,
    ]);
    expect(result.map(c => c.id)).toEqual(['a']);
  });
  it('quarter が不正なら全クォーター扱い（未指定）にする', () => {
    expect(sanitizeCourses([{ ...ok, quarter: 9 }])[0].quarter).toBeUndefined();
    expect(sanitizeCourses([{ ...ok, quarter: [] }])[0].quarter).toBeUndefined();
    expect(sanitizeCourses([{ ...ok, quarter: [1, 2] }])[0].quarter).toEqual([1, 2]);
  });
  it('配列でなければ例外', () => {
    expect(() => sanitizeCourses({})).toThrow();
  });
});

describe('resolveAppData', () => {
  it('未保存なら初期データ、保存済みなら空の配列でも保存値を使う', () => {
    expect(resolveAppData({}).courses).toBe(MY_COURSES);
    expect(resolveAppData({ courses: null }).courses).toBe(MY_COURSES);
    expect(resolveAppData({ courses: [] }).courses).toEqual([]);
  });
});

describe('保存データの検証', () => {
  it('sanitizeLogs は不正な記録・重複を捨て、配列でなければ例外', () => {
    const log = { id: '1', courseId: 'a', date: '2026-10-01', status: '出席' };
    expect(sanitizeLogs([log, log, { ...log, id: '2', status: '不明' }, { ...log, id: '3', date: '2026/10/01' }])).toEqual([log]);
    expect(() => sanitizeLogs('x')).toThrow();
  });
  it('sanitizeMemos は文字列以外を捨て、オブジェクトでなければ例外', () => {
    expect(sanitizeMemos({ a: 'メモ', b: 5 })).toEqual({ a: 'メモ' });
    expect(() => sanitizeMemos([])).toThrow();
  });
});

describe('マップ画像の場所の検証', () => {
  it('このアプリ内のパスと data:image だけ許可する', () => {
    expect(isSafeImagePath('/local/map.jpg')).toBe(true);
    expect(isSafeImagePath('data:image/jpeg;base64,AAAA')).toBe(true);
  });
  it('外部サイト・プロトコル相対・javascript:・文字列以外は拒否する', () => {
    for (const bad of ['https://example.com/a.png', '//example.com/a.png', 'javascript:alert(1)', 'data:text/html,<b>', 'map.jpg', '', null, 5]) {
      expect(isSafeImagePath(bad)).toBe(false);
    }
  });
  it('キャンパスの画像が不正なら null にする', () => {
    const [c] = sanitizeCampuses([{ id: 'x', name: '北', mapImage: 'https://example.com/a.png' }]);
    expect(c.mapImage).toBeNull();
    expect(sanitizeCampuses([{ id: 'y', name: '南', mapImage: '/local/s.jpg' }])[0].mapImage).toBe('/local/s.jpg');
  });
});
