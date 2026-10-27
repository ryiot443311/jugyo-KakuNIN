import { describe, it, expect } from 'vitest';
import { mergeBackupData } from './merge';

const log = (id, courseId, date, status = '出席') => ({ id, courseId, date, status, quarter: 3 });
const current = {
  logs: [log('1', 'a', '2026-10-01'), log('2', 'a', '2026-10-08')],
  courses: [{ id: 'a', name: '手元の授業' }],
  courseMemos: { a: '手元のメモ' }, datedMemos: {}, campuses: [{ id: 'n', name: '北' }],
  campusBuildings: { n: [{ id: 'b1', name: '1号館', description: '' }] }, campusImages: {},
};

describe('mergeBackupData（統合して読み込む）', () => {
  it('手元にない記録だけ足し、同じ授業・同じ日の記録は手元を優先する', () => {
    const { data, stats } = mergeBackupData(current, { logs: [log('9', 'a', '2026-10-08', '欠席'), log('10', 'a', '2026-10-15')] });
    expect(data.logs.map(l => `${l.date}:${l.status}`)).toEqual(['2026-10-01:出席', '2026-10-08:出席', '2026-10-15:出席']);
    expect(stats.logs).toEqual({ added: 1, skipped: 1 });
  });
  it('同じIDの記録は別の日付でも足さない（IDが重複しないように）', () => {
    const { data } = mergeBackupData(current, { logs: [log('1', 'a', '2026-12-01')] });
    expect(data.logs).toHaveLength(2);
  });
  it('読み込むデータ内の重複も1件にする', () => {
    const { data } = mergeBackupData(current, { logs: [log('20', 'b', '2026-10-01'), log('21', 'b', '2026-10-01')] });
    expect(data.logs).toHaveLength(3);
  });
  it('授業・メモ・キャンパス・施設は、手元にないものだけ足す', () => {
    const { data, stats } = mergeBackupData(current, {
      courses: [{ id: 'a', name: '上書きしない' }, { id: 'b', name: '新しい授業' }],
      courseMemos: { a: '上書きしない', b: '新しいメモ' },
      campuses: [{ id: 's', name: '南' }],
      campusBuildings: { n: [{ id: 'b1', name: '上書きしない', description: '' }, { id: 'b2', name: '2号館', description: '' }], s: [{ id: 'b3', name: 'A館', description: '' }] },
    });
    expect(data.courses.map(c => c.name)).toEqual(['手元の授業', '新しい授業']);
    expect(data.courseMemos).toEqual({ a: '手元のメモ', b: '新しいメモ' });
    expect(data.campuses.map(c => c.id)).toEqual(['n', 's']);
    expect(data.campusBuildings.n.map(b => b.name)).toEqual(['1号館', '2号館']);
    expect(data.campusBuildings.s.map(b => b.name)).toEqual(['A館']);
    expect(stats.campusBuildings).toEqual({ added: 2, skipped: 1 });
  });
  it('含まれていない項目と設定は変更しない', () => {
    const { data } = mergeBackupData(current, { settings: { theme: 'dark' }, logs: [] });
    expect(Object.keys(data)).toEqual(['logs']);
  });
});
