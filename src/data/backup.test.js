import { describe, it, expect } from 'vitest';
import { buildBackup, parseBackup } from './backup';

const logs = [{ id: 'l1', courseId: 'c1', date: '2026-10-07', recordedAt: '2026-10-07 10:00', status: '出席', quarter: 3 }];
const courses = [{ id: 'c1', name: '授業', dayOfWeek: 2, period: 2, quarter: [3], room: 'A', teacher: 'T', campus: '' }];
const base = { logs, courseMemos: { c1: 'メモ' }, datedMemos: { 'c1|2026-10-07': '日付メモ' }, courses, settings: { theme: 'dark', threshold: 70 } };
const write = (data, extra = {}) => JSON.stringify({ app: 'my-attendance-app', version: 1, ...extra, data });

describe('バックアップ', () => {
  it('書き出した内容を、そのまま読み込める', () => {
    const json = JSON.stringify(buildBackup({ ...base, campuses: [], campusBuildings: {}, campusImages: {} }));
    const result = parseBackup(json);
    expect(result.ok).toBe(true);
    expect(result.data.logs).toEqual(logs);
    expect(result.data.courseMemos).toEqual({ c1: 'メモ' });
    expect(result.data.datedMemos).toEqual({ 'c1|2026-10-07': '日付メモ' });
    expect(result.data.courses[0]).toMatchObject({ id: 'c1', name: '授業', quarter: [3] });
    expect(result.data.settings).toMatchObject({ theme: 'dark', threshold: 70 });
    expect(result.dropped).toBe(0);
  });
  it('書き出しは app / version / data の形式（以前のバージョンと同じ）', () => {
    const b = buildBackup(base, new Date('2026-10-28T00:00:00Z'));
    expect(b).toMatchObject({ app: 'my-attendance-app', version: 1, exportedAt: '2026-10-28T00:00:00.000Z' });
    expect(Object.keys(b.data)).toEqual(expect.arrayContaining(['logs', 'courseMemos', 'datedMemos', 'courses', 'settings']));
  });
  it('以前のバージョンのバックアップ（含まれる項目だけ）を読み込める', () => {
    const result = parseBackup(write({ logs, courses, settings: { theme: 'light', threshold: 60, quarterRanges: [[4, 1, 5, 31]] } }));
    expect(result.ok).toBe(true);
    expect(Object.keys(result.data).sort()).toEqual(['courses', 'logs', 'settings']);
    expect(result.data.settings.quarters[1]).toEqual({ start: '04-01', end: '05-31' });
  });
  it('不正な記録は捨てて、件数を返す', () => {
    const result = parseBackup(write({ logs: [...logs, { id: 'bad', date: 'xx' }, { ...logs[0] }] })); // 不正1件＋id 重複1件
    expect(result.ok).toBe(true);
    expect(result.data.logs).toHaveLength(1);
    expect(result.dropped).toBe(2);
  });
  it('JSON でない・別アプリ・中身が空のファイルは拒否する', () => {
    expect(parseBackup('これはJSONではない')).toMatchObject({ ok: false });
    expect(parseBackup(write({ logs }, { app: 'other' }))).toMatchObject({ ok: false, error: 'このアプリのバックアップファイルではありません' }); // 中身が正しくても別アプリは拒否
    expect(parseBackup(write({}))).toMatchObject({ ok: false });
    expect(parseBackup(write({ logs: 'x' }))).toMatchObject({ ok: false });
  });
  it('画像は data:image/ のものだけ受け付ける', () => {
    const result = parseBackup(write({ campusImages: { a: 'data:image/jpeg;base64,AAAA', b: 'http://example.com/x.png', c: 5 } }));
    expect(result.data.campusImages).toEqual({ a: 'data:image/jpeg;base64,AAAA' });
  });
});
