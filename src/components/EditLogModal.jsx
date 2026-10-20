import { useState } from 'react';
import Modal from './Modal';
import StatusButtons from './StatusButtons';

export default function EditLogModal({ log, onChangeStatus, onDelete, onClose }) {
  const [pendingStatus, setPendingStatus] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(false);

  if (pendingStatus || pendingDelete) {
    return (
      <Modal>
        <div className="center">
          <p className="modal-message">{pendingDelete ? `${log.date} の記録を削除しますか？` : `【 ${pendingStatus} 】に変更しますか？`}</p>
          <div className="btn-row">
            <button onClick={() => { setPendingStatus(null); setPendingDelete(false); }} className="btn btn--secondary">戻る</button>
            {pendingDelete
              ? <button onClick={onDelete} className="btn btn--danger">削除</button>
              : <button onClick={() => onChangeStatus(pendingStatus)} className="btn btn--primary">確定</button>}
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal>
      <p className="field-label field-label--center">状態を変更</p>
      <StatusButtons onSelect={setPendingStatus} exclude={log.status} />
      <button onClick={() => setPendingDelete(true)} className="btn btn--danger-outline btn--block edit-delete">記録を削除</button>
      <button onClick={onClose} className="btn btn--ghost">キャンセル</button>
    </Modal>
  );
}
