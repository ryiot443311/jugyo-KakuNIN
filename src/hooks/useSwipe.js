import { useRef } from 'react';
import { getSwipeDirection } from '../utils/swipe';

// 要素に付けるタッチ操作。左右にスワイプしたら onSwipe(1 または -1) を呼ぶ
export function useSwipe(onSwipe) {
  const start = useRef(null);
  return {
    onTouchStart: (e) => {
      const t = e.touches[0];
      start.current = e.touches.length === 1 ? { x: t.clientX, y: t.clientY } : null; // 2本指以上は無視
    },
    onTouchEnd: (e) => {
      if (!start.current) return;
      const t = e.changedTouches[0];
      const direction = getSwipeDirection(t.clientX - start.current.x, t.clientY - start.current.y);
      start.current = null;
      if (direction !== 0) onSwipe(direction);
    },
    onTouchCancel: () => { start.current = null; },
  };
}
