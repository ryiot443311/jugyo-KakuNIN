import { describe, it, expect } from 'vitest';
import { ja, en } from './messages';
import { getMessages } from './index';
import { dueLabel } from '../data/tasks';
import { quarterLabel, weekPatternLabel } from '../data/status';
import { buildDetailCsv, buildSummaryCsv } from '../utils/csv';
import { parseBackup } from '../data/backup';

// 値の形（文字列・関数・配列・オブジェクト）を比べる
const shape = (obj) => Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, Array.isArray(v) ? `array${v.length}` : typeof v === 'object' ? shape(v) : typeof v]));

describe('messages', () => {
  it('日本語と英語で同じキーと形を持つ', () => {
    expect(shape(en)).toEqual(shape(ja));
  });
  it('関数の文言は、引数を入れると空でない文字列（配列）を返す', () => {
    for (const t of [ja, en]) {
      for (const [k, v] of Object.entries(t)) {
        if (typeof v !== 'function') continue;
        // 配列を受け取る文言もあるので、いくつかの引数の組で試す
        const outs = [[1, 2, 3, 4], [['x'], 1], [1, ['x'], 1], [1, 2, ['x']]].map(args => { try { return v(...args); } catch { return ''; } });
        expect(outs.some(o => { const text = Array.isArray(o) ? o.join('') : String(o); return /\S/.test(text) && !/undefined|NaN/.test(text); }), k).toBe(true);
      }
    }
  });
  it('不明な言語は日本語', () => {
    expect(getMessages('fr')).toBe(ja);
    expect(getMessages('en')).toBe(en);
  });
  it('状態は保存値（日本語）のまま、表示だけ英語にする', () => {
    expect(en.status('出席')).toBe('Present');
    expect(en.status('休講')).toBe('Canceled');
    expect(ja.status('遅刻')).toBe('遅刻');
  });
  it('英語の単数・複数', () => {
    expect(en.dueOverdue(1)).toBe('Overdue (1 day ago)');
    expect(en.unrecordedBanner(2, 2)).toBe('⚠ 2 unrecorded classes (last 2 weeks)');
    expect(en.courseStatLine(1, 1, 0, 0)).toBe('1 class (Present 1, Late 0, Absent 0)');
  });
});

describe('英語での出力', () => {
  it('課題の期限・授業のラベル', () => {
    expect(dueLabel('2026-10-28', '2026-10-28', en)).toBe('Due today');
    expect(dueLabel('2026-11-02', '2026-10-28', en)).toBe('5 days left');
    expect(quarterLabel({ quarter: [1, 2] }, en)).toBe('Q1/Q2');
    expect(quarterLabel({}, en)).toBe('All Q');
    expect(weekPatternLabel({ weeks: 'odd' }, en)).toBe('Odd weeks');
  });
  it('CSV の見出し・状態・曜日', () => {
    const courses = [{ id: 'c1', name: 'Math', period: 2 }];
    const logs = [{ id: '1', courseId: 'c1', date: '2026-10-28', status: '欠席', quarter: 3, recordedAt: '2026-10-28 10:00' }];
    const detail = buildDetailCsv(logs, courses, en).replace('﻿', '').split('\r\n');
    expect(detail[0]).toBe('Date,Day,Period,Class,Status,Recorded at,Term,Fiscal year');
    expect(detail[1]).toBe('2026-10-28,Wed,2,Math,Absent,2026-10-28 10:00,Q3,FY2026');
    const summary = buildSummaryCsv(logs, courses, en).replace('﻿', '').split('\r\n');
    expect(summary[1]).toBe('Overall,0,0,1,0,1,0');
  });
  it('バックアップのエラー', () => {
    expect(parseBackup('{', en)).toEqual({ ok: false, error: 'Not valid JSON' });
  });
});
