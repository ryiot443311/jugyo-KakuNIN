import { describe, it, expect } from 'vitest';
import { getSwipeDirection } from './swipe';

describe('getSwipeDirection', () => {
  it('左へ十分動かすと次（1）、右へなら前（-1）', () => {
    expect(getSwipeDirection(-80, 5)).toBe(1);
    expect(getSwipeDirection(80, -5)).toBe(-1);
  });
  it('動きが小さいとスワイプではない（タップ）', () => {
    expect(getSwipeDirection(10, 0)).toBe(0);
    expect(getSwipeDirection(-59, 0)).toBe(0);
    expect(getSwipeDirection(-60, 0)).toBe(1);
  });
  it('縦の動きが大きいとき（スクロール）は無視する', () => {
    expect(getSwipeDirection(-80, 70)).toBe(0);
    expect(getSwipeDirection(-90, 60)).toBe(1); // 横が縦の1.5倍ちょうど
  });
});
