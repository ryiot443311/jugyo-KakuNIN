import { describe, it, expect } from 'vitest';
import { sanitizeTasks, upcomingTasks, dueLabel, daysUntil, groupDueTasks } from './tasks';

const t = (id, due, done = false) => ({ id, courseId: 'c1', title: `課題${id}`, due, done });

describe('課題', () => {
  it('不正な課題を捨て、done は真偽値にそろえる', () => {
    const result = sanitizeTasks([t('1', '2026-10-30'), { ...t('2', '2026-10-30'), title: ' ' }, { ...t('3', '10/30') }, t('1', '2026-11-01'), { ...t('4', '2026-11-01'), done: 'yes' }, null]);
    expect(result.map(x => x.id)).toEqual(['1', '4']);
    expect(result[1].done).toBe(false);
    expect(() => sanitizeTasks({})).toThrow();
  });
  it('未完了で、期限切れか 7 日以内の課題を期限順に返す', () => {
    const tasks = [t('a', '2026-11-04'), t('b', '2026-10-20'), t('c', '2026-11-05'), t('d', '2026-10-29', true), t('e', '2026-10-28')];
    expect(upcomingTasks(tasks, '2026-10-28').map(x => x.id)).toEqual(['b', 'e', 'a']);
  });
  it('期限の表示', () => {
    expect(daysUntil('2026-11-02', '2026-10-28')).toBe(5);
    expect(dueLabel('2026-10-28', '2026-10-28')).toBe('今日まで');
    expect(dueLabel('2026-10-29', '2026-10-28')).toBe('明日まで');
    expect(dueLabel('2026-11-02', '2026-10-28')).toBe('あと5日');
    expect(dueLabel('2026-10-26', '2026-10-28')).toBe('期限切れ（2日前）');
  });
  it('基準日を選んだ日にすると、その日から 7 日以内までを返す', () => {
    const tasks = [t('a', '2026-11-04'), t('b', '2026-10-20'), t('c', '2026-11-08'), t('f', '2026-11-09')];
    expect(upcomingTasks(tasks, '2026-11-01').map(x => x.id)).toEqual(['b', 'a', 'c']);
  });
  it('期限ごとに区切る（今日を選んでいるとき）', () => {
    const tasks = [t('b', '2026-10-20'), t('e', '2026-10-28'), t('g', '2026-10-29'), t('a', '2026-11-04')];
    const groups = groupDueTasks(tasks, '2026-10-28');
    expect(groups.map(g => [g.label, g.tasks.map(x => x.id)])).toEqual([
      ['期限切れ', ['b']], ['今日', ['e']], ['明日', ['g']], ['11/4（水）まで', ['a']],
    ]);
  });
  it('期限ごとに区切る（先の日を選んでいるときは、その日までを1つにまとめる）', () => {
    const tasks = [t('e', '2026-10-28'), t('h', '2026-10-30'), t('i', '2026-11-01'), t('c', '2026-11-08')];
    const groups = groupDueTasks(tasks, '2026-10-28', '2026-11-01');
    expect(groups.map(g => [g.label, g.tasks.map(x => x.id), !!g.isBase])).toEqual([
      ['今日', ['e'], false], ['11/1（日）まで', ['h', 'i'], true], ['11/8（日）まで', ['c'], false],
    ]);
  });
});
