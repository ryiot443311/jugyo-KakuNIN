import Modal from './Modal';
import { STATUS_COLORS } from '../data/status';

export default function ConfirmRecordModal({ record, onConfirm, onCancel }) {
  return (
    <Modal>
      <p className="modal-message">{record.date} を <span style={{ color: STATUS_COLORS[record.status] }}>{record.status}</span> で記録します。</p>
      <div className="btn-row btn-row--spaced">
        <button onClick={onCancel} className="btn btn--secondary">キャンセル</button>
        <button onClick={onConfirm} className="btn btn--primary">確定</button>
      </div>
    </Modal>
  );
}
