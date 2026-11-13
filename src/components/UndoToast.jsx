import { useRef, useState } from 'react';
import { getSwipeDirection } from '../utils/swipe';
import { useI18n } from '../i18n';

// 記録した直後に、数秒間だけ画面上部に「元に戻す」を出す。左右にスワイプするか × で消せる
export default function UndoToast({ text, onUndo, onDismiss }) {
  const t = useI18n();
  const start = useRef(null);
  const [dx, setDx] = useState(0); // 指に合わせて横にずらす量

  const onTouchStart = (e) => {
    const touch = e.touches[0];
    start.current = e.touches.length === 1 ? { x: touch.clientX, y: touch.clientY } : null;
  };
  const onTouchMove = (e) => {
    if (!start.current) return;
    setDx(e.touches[0].clientX - start.current.x);
  };
  const onTouchEnd = (e) => {
    if (!start.current) return;
    const touch = e.changedTouches[0];
    const direction = getSwipeDirection(touch.clientX - start.current.x, touch.clientY - start.current.y);
    start.current = null;
    if (direction !== 0) onDismiss();
    else setDx(0); // スワイプでなければ元の位置に戻す
  };

  return (
    <div
      className="toast" role="status"
      style={{ '--toast-dx': `${dx}px`, opacity: Math.max(0.3, 1 - Math.abs(dx) / 200) }}
      onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
      onTouchCancel={() => { start.current = null; setDx(0); }}
    >
      <span>{text}</span>
      <button type="button" onClick={onUndo} className="btn btn-soft btn-small">{t.undo}</button>
      <button type="button" onClick={onDismiss} className="toast-close" aria-label={t.close}>×</button>
    </div>
  );
}
