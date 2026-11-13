import { useState } from 'react';
import Modal from './Modal';
import StatusButtons from './StatusButtons';
import { useI18n } from '../i18n';

export default function EditLogModal({ log, onChangeStatus, onDelete, onClose }) {
  const t = useI18n();
  const [pendingStatus, setPendingStatus] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(false);

  if (pendingStatus || pendingDelete) {
    return (
      <Modal onClose={() => { setPendingStatus(null); setPendingDelete(false); }}>
        <p className="center strong">{pendingDelete ? t.deleteLogConfirm(log.date) : t.changeStatusConfirm(t.status(pendingStatus))}</p>
        <div className="row gap-10 mt-20">
          <button type="button" onClick={() => { setPendingStatus(null); setPendingDelete(false); }} className="btn btn-soft grow">{t.back}</button>
          {pendingDelete
            ? <button type="button" onClick={onDelete} className="btn btn-danger grow">{t.delete}</button>
            : <button type="button" onClick={() => onChangeStatus(pendingStatus)} className="btn btn-primary grow">{t.confirm}</button>}
        </div>
      </Modal>
    );
  }

  return (
    <Modal onClose={onClose}>
      <h3 className="modal-title">{t.changeStatusTitle(log.date)}</h3>
      <StatusButtons onSelect={setPendingStatus} exclude={log.status} />
      <button type="button" onClick={() => setPendingDelete(true)} className="btn btn-ghost danger-text block mt-20">{t.deleteLog}</button>
      <button type="button" onClick={onClose} className="btn btn-ghost block">{t.cancel}</button>
    </Modal>
  );
}
