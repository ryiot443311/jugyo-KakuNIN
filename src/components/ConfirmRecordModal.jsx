import Modal from './Modal';
import { statusTextClass } from '../data/status';

export default function ConfirmRecordModal({ record, onConfirm, onCancel }) {
  return (
    <Modal>
      <p className="center strong">{record.date} を <span className={statusTextClass(record.status)}>{record.status}</span> で記録します。</p>
      <div className="row gap-10 mt-20">
        <button type="button" onClick={onCancel} className="btn btn-soft grow">キャンセル</button>
        <button type="button" onClick={onConfirm} className="btn btn-primary grow">確定</button>
      </div>
    </Modal>
  );
}
