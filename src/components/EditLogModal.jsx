import { useState } from 'react';
import Modal from './Modal';
import StatusButtons from './StatusButtons';
import ConfirmDialog from './ConfirmDialog';

export default function EditLogModal({ log, onChangeStatus, onDelete, onClose }) {
  const [pendingStatus, setPendingStatus] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(false);

  const back = () => { setPendingStatus(null); setPendingDelete(false); };
  if (pendingDelete) {
    return (
      <ConfirmDialog title="記録を削除しますか？" tone="danger" confirmLabel="削除する" onConfirm={onDelete} onCancel={back}>
        <p className="center">{log.date} の記録を削除します。</p>
      </ConfirmDialog>
    );
  }
  if (pendingStatus) {
    return (
      <ConfirmDialog title="状態を変更しますか？" confirmLabel="変更する" onConfirm={() => onChangeStatus(pendingStatus)} onCancel={back}>
        <p className="center">{log.date} の記録を【 {pendingStatus} 】に変更します。</p>
      </ConfirmDialog>
    );
  }

  return (
    <Modal onClose={onClose}>
      <h3 className="modal-title">状態を変更（{log.date}）</h3>
      <StatusButtons onSelect={setPendingStatus} exclude={log.status} />
      <button type="button" onClick={() => setPendingDelete(true)} className="btn btn-ghost danger-text block mt-20">記録を削除</button>
      <button type="button" onClick={onClose} className="btn btn-ghost block">キャンセル</button>
    </Modal>
  );
}
