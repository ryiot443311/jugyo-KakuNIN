import ConfirmDialog from './ConfirmDialog';
import { statusTextClass } from '../data/status';

export default function ConfirmRecordModal({ record, onConfirm, onCancel }) {
  return (
    <ConfirmDialog title="記録の確認" confirmLabel="記録する" onConfirm={onConfirm} onCancel={onCancel}>
      <p className="center strong">{record.date} を <span className={statusTextClass(record.status)}>{record.status}</span> で記録します。</p>
    </ConfirmDialog>
  );
}
