import { useEffect, useRef } from 'react';

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]):not([type=hidden]), select:not([disabled]), textarea:not([disabled]), summary, [tabindex]:not([tabindex="-1"])';
let titleSeq = 0;

// ダイアログ。開いている間はフォーカスを中に閉じ込め、閉じたら開く前の場所に戻す
// onClose を渡すと Esc キーで閉じられる
export default function Modal({ children, onClose }) {
  const ref = useRef(null);
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; });

  // 開いたとき: 開く前のフォーカスを覚え、閉じたら戻す。Tab / Esc を処理する
  useEffect(() => {
    const el = ref.current;
    const prev = document.activeElement;
    const onKeyDown = (e) => {
      if (e.key === 'Escape' && closeRef.current) { e.preventDefault(); closeRef.current(); return; }
      if (e.key !== 'Tab') return;
      const items = [...el.querySelectorAll(FOCUSABLE)].filter(n => n.offsetParent !== null);
      if (items.length === 0) { e.preventDefault(); el.focus(); return; }
      const first = items[0]; const last = items[items.length - 1];
      const active = document.activeElement;
      const outside = active === el || !el.contains(active); // ダイアログ自体、または外にフォーカスがある
      if (e.shiftKey && (active === first || outside)) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && (active === last || outside)) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      if (prev instanceof HTMLElement && document.contains(prev)) prev.focus();
    };
  }, []);

  // 描画のたびに: 見出しをダイアログの名前にし、フォーカスが外にあれば中に移す（中身が切り替わったときのため）
  // フォーカスの移動中（Tab で次の欄へ移る途中の再描画など）に引き戻さないよう、移動が終わってから確かめる
  useEffect(() => {
    const el = ref.current;
    const title = el.querySelector('h3, h4, .modal-title') ?? el.querySelector('p');
    if (title) {
      if (!title.id) title.id = `modal-title-${++titleSeq}`;
      el.setAttribute('aria-labelledby', title.id);
    } else {
      el.removeAttribute('aria-labelledby');
    }
    const timer = setTimeout(() => { if (!el.contains(document.activeElement)) el.focus(); }, 0);
    return () => clearTimeout(timer);
  });

  return (
    <div className="overlay">
      <div className="modal" role="dialog" aria-modal="true" tabIndex={-1} ref={ref}>{children}</div>
    </div>
  );
}
