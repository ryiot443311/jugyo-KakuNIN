import { describe, it, expect } from 'vitest';
import { buildDetailCsv, buildSummaryCsv, filterLogs } from './csv';

const courses = [
  { id: 'a', name: '線形代数', period: 2 },
  { id: 'b', name: '国語, 現代"文"', period: 1 },
  { id: 'x', name: '=HYPERLINK("http://example.com")', period: 3 },
];
const logs = [
  { id: '1', courseId: 'a', date: '2025-04-08', recordedAt: '2025-04-08 10:00', status: '出席', quarter: 1 },
  { id: '2', courseId: 'b', date: '2025-04-08', status: '欠席', quarter: 1 },
  { id: '3', courseId: 'a', date: '2026-01-13', status: '遅刻', quarter: 4 },
  { id: '4', courseId: 'x', date: '2026-04-07', status: '出席', quarter: 1 },
];
const lines = (csv) => csv.replace(/^\uFEFF/, '').split('\r\n').filter(Boolean);

describe('filterLogs', () => {
  it('年度（4月始まり）で絞り込む', () => {
    expect(filterLogs(logs, { year: 2025 }).map(l => l.id)).toEqual(['1', '2', '3']); // 2026年1月は2025年度
    expect(filterLogs(logs, { year: 2026 }).map(l => l.id)).toEqual(['4']);
  });
  it('クォーターで絞り込み、指定なしは全部', () => {
    expect(filterLogs(logs, { quarter: 4 }).map(l => l.id)).toEqual(['3']);
    expect(filterLogs(logs, {})).toHaveLength(4);
  });
});

describe('buildDetailCsv', () => {
  const csv = buildDetailCsv(logs, courses);
  it('BOM 付き・CRLF 区切り', () => {
    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(csv).toContain('\r\n');
  });
  it('日付 → 時限の順に並ぶ', () => {
    const rows = lines(csv).slice(1);
    expect(rows[0]).toContain('"国語, 現代""文"""'); // 同じ日は1限が先
    expect(rows[1]).toContain('線形代数');
  });
  it('カンマ・引用符を含む値をエスケープする', () => {
    expect(csv).toContain('"国語, 現代""文"""');
  });
  it('式として実行されうる先頭文字（=）の前に \' を付ける', () => {
    expect(csv).toContain(`"'=HYPERLINK(""http://example.com"")"`);
  });
  it('授業が見つからない記録は「不明」', () => {
    expect(buildDetailCsv([{ id: '9', courseId: 'zz', date: '2025-04-01', status: '休講', quarter: 1 }], courses)).toContain('不明');
  });
});

describe('buildSummaryCsv', () => {
  it('全体と授業ごとの集計を出す', () => {
    const rows = lines(buildSummaryCsv(logs.slice(0, 3), courses));
    expect(rows[0]).toBe('授業名,出席,遅刻,欠席,休講,授業回数(休講除く),出席率(%)');
    expect(rows[1]).toBe('全体,1,1,1,0,3,67');
    expect(rows).toContain('線形代数,1,1,0,0,2,100');
  });
});
