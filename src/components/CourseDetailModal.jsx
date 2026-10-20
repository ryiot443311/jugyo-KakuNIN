import { useState } from 'react';
import Modal from './Modal';
import StatusButtons from './StatusButtons';
import RecordNotice from './RecordNotice';

export default function CourseDetailModal({ course, memo, recordState, log, onSaveMemo, onRecord, onEditLog, onClose }) {
  const [tempMemo, setTempMemo] = useState(memo || '');

  return (
    <Modal>
      <h3 className="modal-title">授業詳細</h3>
      <div className="detail-info">
        <p><b>科目:</b> {course.name}</p>
        <p><b>教室:</b> {course.room}</p>
        <p><b>担当:</b> {course.teacher}</p>
      </div>

      <div className="memo-field">
        <p className="field-label">メモ (自動保存)</p>
        <textarea
          value={tempMemo} onChange={(e) => setTempMemo(e.target.value)} onBlur={() => onSaveMemo(tempMemo)}
          placeholder="課題や持ち物などを入力..."
          className="memo-textarea"
        />
      </div>

      {recordState.status !== 'ok' ? (
        <div className="detail-record"><RecordNotice status={recordState.status} long /></div>
      ) : log ? (
        <button onClick={() => onEditLog(log)} className="btn btn--primary btn--block detail-record">記録を修正する</button>
      ) : (
        <div className="detail-record">
          <p className="field-label field-label--center">記録を追加</p>
          <StatusButtons onSelect={onRecord} />
        </div>
      )}
      <button onClick={() => { onSaveMemo(tempMemo); onClose(); }} className="btn btn--ghost">閉じる</button>
    </Modal>
  );
}
