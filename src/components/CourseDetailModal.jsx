import { useState } from 'react';
import Modal from './Modal';
import StatusButtons from './StatusButtons';
import RecordNotice from './RecordNotice';
import { weekPatternLabel } from '../data/status';
import TaskList from './TaskList';
import { useI18n } from '../i18n';

export default function CourseDetailModal({ course, date, today, tasks, onAddTask, onToggleTask, onDeleteTask, memo, dateMemo, recordState, log, onSaveMemo, onSaveDateMemo, onRecord, onEditLog, onEdit, onClose }) {
  const t = useI18n();
  const [tempMemo, setTempMemo] = useState(memo || '');
  const [tempDateMemo, setTempDateMemo] = useState(dateMemo || '');

  const saveAndClose = () => { onSaveMemo(tempMemo); onSaveDateMemo(tempDateMemo); onClose(); };

  return (
    <Modal onClose={saveAndClose}>
      <h3 className="modal-title">{t.courseDetailTitle}</h3>
      <div className="info-box">
        <p><b>{t.subject}:</b> {course.name}</p>
        <p><b>{t.room}:</b> {course.room}</p>
        <p><b>{t.teacher}:</b> {course.teacher}</p>
        {course.weeks && <p><b>{t.frequency}:</b> {weekPatternLabel(course, t)}</p>}
      </div>

      <label className="field-label" htmlFor="course-memo">{t.memoLabel}</label>
      <textarea
        id="course-memo" value={tempMemo} onChange={(e) => setTempMemo(e.target.value)} onBlur={() => onSaveMemo(tempMemo)}
        placeholder={t.memoPlaceholder}
        className="textarea"
      />

      <label className="field-label" htmlFor="date-memo">{t.dateMemoLabel(date)}</label>
      <textarea
        id="date-memo" value={tempDateMemo} onChange={(e) => setTempDateMemo(e.target.value)} onBlur={() => onSaveDateMemo(tempDateMemo)}
        placeholder={t.dateMemoPlaceholder}
        className="textarea"
      />

      <TaskList tasks={tasks} today={today} onAdd={onAddTask} onToggle={onToggleTask} onDelete={onDeleteTask} />

      <div className="mt-20 mb-10">
        {recordState.status !== 'ok' ? (
          <RecordNotice status={recordState.status} long />
        ) : log ? (
          <button type="button" onClick={() => onEditLog(log)} className="btn btn-primary block">{t.editRecord}</button>
        ) : (
          <>
            <p className="field-label center">{t.addRecord}</p>
            <StatusButtons onSelect={onRecord} />
          </>
        )}
      </div>
      <button type="button" onClick={() => { onSaveMemo(tempMemo); onSaveDateMemo(tempDateMemo); onEdit(); }} className="btn btn-soft block mb-6">{t.editCourseInfo}</button>
      <button type="button" onClick={saveAndClose} className="btn btn-ghost block">{t.close}</button>
    </Modal>
  );
}
