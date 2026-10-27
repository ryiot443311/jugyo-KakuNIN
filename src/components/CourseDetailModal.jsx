import { useState } from 'react';
import Modal from './Modal';
import StatusButtons from './StatusButtons';
import RecordNotice from './RecordNotice';

export default function CourseDetailModal({ course, date, memo, dateMemo, recordState, log, onSaveMemo, onSaveDateMemo, onRecord, onEditLog, onEdit, onClose }) {
  const [tempMemo, setTempMemo] = useState(memo || '');
  const [tempDateMemo, setTempDateMemo] = useState(dateMemo || '');

  return (
    <Modal>
      <h3 className="modal-title">授業詳細</h3>
      <div className="info-box">
        <p><b>科目:</b> {course.name}</p>
        <p><b>教室:</b> {course.room}</p>
        <p><b>担当:</b> {course.teacher}</p>
      </div>

      <label className="field-label" htmlFor="course-memo">メモ (自動保存)</label>
      <textarea
        id="course-memo" value={tempMemo} onChange={(e) => setTempMemo(e.target.value)} onBlur={() => onSaveMemo(tempMemo)}
        placeholder="課題や持ち物などを入力..."
        className="textarea"
      />

      <label className="field-label" htmlFor="date-memo">{date} だけのメモ (自動保存)</label>
      <textarea
        id="date-memo" value={tempDateMemo} onChange={(e) => setTempDateMemo(e.target.value)} onBlur={() => onSaveDateMemo(tempDateMemo)}
        placeholder="この日だけの教室変更など..."
        className="textarea"
      />

      <div className="mt-20 mb-10">
        {recordState.status !== 'ok' ? (
          <RecordNotice status={recordState.status} long />
        ) : log ? (
          <button type="button" onClick={() => onEditLog(log)} className="btn btn-primary block">記録を修正する</button>
        ) : (
          <>
            <p className="field-label center">記録を追加</p>
            <StatusButtons onSelect={onRecord} />
          </>
        )}
      </div>
      <button type="button" onClick={() => { onSaveMemo(tempMemo); onSaveDateMemo(tempDateMemo); onEdit(); }} className="btn btn-soft block mb-6">授業情報を編集</button>
      <button type="button" onClick={() => { onSaveMemo(tempMemo); onSaveDateMemo(tempDateMemo); onClose(); }} className="btn btn-ghost block">閉じる</button>
    </Modal>
  );
}
