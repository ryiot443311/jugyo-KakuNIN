// 記録した直後に、数秒間だけ「元に戻す」を出す
export default function UndoToast({ text, onUndo }) {
  return (
    <div className="toast" role="status">
      <span>{text}</span>
      <button type="button" onClick={onUndo} className="btn btn-soft btn-small">元に戻す</button>
    </div>
  );
}
