import { describe, it, expect } from 'vitest';
import { toTally } from './tally';

describe('toTally', () => {
  it('5回ごとに「正」、端数は画数で表す', () => {
    expect([0, 1, 2, 3, 4, 5, 7, 10].map(toTally)).toEqual(['', '一', '丅', '下', '止', '正', '正丅', '正正']);
  });
  it('不正な値は空文字', () => {
    expect([-1, 1.5, undefined].map(toTally)).toEqual(['', '', '']);
  });
});
