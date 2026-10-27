import { useState } from 'react';
import Modal from './Modal';
import StatusButtons from './StatusButtons';

export default function EditLogModal({ log, onChangeStatus, onDelete, onClose }) {
  const [pendingStatus, setPendingStatus] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(false);

  if (pendingStatus || pendingDelete) {
    return (
      <Modal>
        <p className="center strong">{pendingDelete ? `${log.date} の記録を削除しますか？` : `【 ${pendingStatus} 】に変更しますか？`}</p>
        <div className="row gap-10 mt-20">
          <button type="button" onClick={() => { setPendingStatus(null); setPendingDelete(false); }} className="btn btn-soft grow">戻る</button>
          {pendingDelete
            ? <button type="button" onClick={onDelete} className="btn btn-danger grow">削除</button>
            : <button type="button" onClick={() => onChangeStatus(pendingStatus)} className="btn btn-primary grow">確定</button>}
        </div>
      </Modal>
    );
  }

  return (
    <Modal>
      <p className="field-label center">状態を変更</p>
      <StatusButtons onSelect={setPendingStatus} exclude={log.status} />
      <button type="button" onClick={() => setPendingDelete(true)} className="btn btn-ghost danger-text block mt-20">記録を削除</button>
      <button type="button" onClick={onClose} className="btn btn-ghost block">キャンセル</button>
    </Modal>
  );
}
