import Modal from './Modal';
import { statusTextClass } from '../data/status';
import { useI18n } from '../i18n';

export default function ConfirmRecordModal({ record, onConfirm, onCancel }) {
  const t = useI18n();
  const [before, after] = t.confirmRecord(record.date);
  return (
    <Modal onClose={onCancel}>
      <p className="center strong">{before}<span className={statusTextClass(record.status)}>{t.status(record.status)}</span>{after}</p>
      <div className="row gap-10 mt-20">
        <button type="button" onClick={onCancel} className="btn btn-soft grow">{t.cancel}</button>
        <button type="button" onClick={onConfirm} className="btn btn-primary grow">{t.confirm}</button>
      </div>
    </Modal>
  );
}
