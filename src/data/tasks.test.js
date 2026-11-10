import { describe, it, expect } from 'vitest';
import { sanitizeTasks, upcomingTasks, dueLabel, daysUntil } from './tasks';

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
});
