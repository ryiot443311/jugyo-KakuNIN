import Modal from './Modal';

// 確認ダイアログ（アプリ共通）。見出し → 説明 → 「キャンセル」「〜する」の順にそろえる
// tone: primary（ふつう）・danger（削除など取り消せない操作）
export default function ConfirmDialog({ title, children, confirmLabel, onConfirm, onCancel, tone = 'primary', confirmDisabled = false }) {
  return (
    <Modal onClose={onCancel}>
      <h3 className={`modal-title${tone === 'danger' ? ' danger-text' : ''}`}>{title}</h3>
      {children && <div className="confirm-body">{children}</div>}
      <div className="row gap-10 mt-20">
        <button type="button" onClick={onCancel} className="btn btn-soft grow">キャンセル</button>
        <button type="button" onClick={onConfirm} disabled={confirmDisabled} className={`btn grow ${tone === 'danger' ? 'btn-danger' : 'btn-primary'}`}>{confirmLabel}</button>
      </div>
    </Modal>
  );
}
