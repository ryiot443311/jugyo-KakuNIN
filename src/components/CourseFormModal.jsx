import { useState } from 'react';
import Modal from './Modal';
import { DAYS, formatDate } from '../utils/date';
import { newId } from '../data/appData';

const QUARTER_IDS = [1, 2, 3, 4];

// 授業の追加・編集フォーム（course が null なら追加。preset は追加時の初期値）
export default function CourseFormModal({ course, preset, periods, logCount, onSave, onDelete, onClose }) {
  const [name, setName] = useState(course?.name ?? '');
  const [dayOfWeek, setDayOfWeek] = useState(course?.dayOfWeek ?? preset?.dayOfWeek ?? 1);
  const [period, setPeriod] = useState(course?.period ?? preset?.period ?? 1);
  const [quarters, setQuarters] = useState(() => (course ? [].concat(course.quarter ?? QUARTER_IDS) : preset?.quarters ?? QUARTER_IDS));
  const [room, setRoom] = useState(course?.room ?? '');
  const [teacher, setTeacher] = useState(course?.teacher ?? '');
  const [confirmDelete, setConfirmDelete] = useState(false);

  // 設定にない時限の授業でも、いまの値は選択肢に残す
  const periodOptions = [...new Set([...Object.keys(periods).map(Number), course?.period ?? period])].sort((a, b) => a - b);
  const canSave = name.trim() !== '' && quarters.length > 0;

  const toggleQuarter = (q) => setQuarters(prev => (prev.includes(q) ? prev.filter(x => x !== q) : [...prev, q]));

  const submit = (e) => {
    e.preventDefault();
    if (!canSave) return;
    onSave({
      ...course,
      id: course?.id ?? newId('course'),
      ...(course ? {} : { createdAt: formatDate(new Date()) }), // 追加した日（記録し忘れの検出に使う）
      name: name.trim(), dayOfWeek, period,
      quarter: [...quarters].sort(),
      room: room.trim(), teacher: teacher.trim(),
    });
  };

  if (confirmDelete) {
    return (
      <Modal>
        <p className="center strong">「{course.name}」を削除しますか？</p>
        {logCount > 0 && <p className="center small muted mt-10">この授業の出席記録 {logCount}件 は残り、履歴では「不明」と表示されます。</p>}
        <div className="row gap-10 mt-20">
          <button type="button" onClick={() => setConfirmDelete(false)} className="btn btn-soft grow">戻る</button>
          <button type="button" onClick={() => onDelete(course.id)} className="btn btn-danger grow">削除</button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal>
      <form onSubmit={submit}>
        <h3 className="modal-title">{course ? '授業を編集' : '授業を追加'}</h3>

        <label className="field-label" htmlFor="course-name">授業名</label>
        <input id="course-name" className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="例: 線形代数" autoFocus />

        <div className="row gap-10">
          <div className="grow">
            <label className="field-label" htmlFor="course-day">曜日</label>
            <select id="course-day" className="input" value={dayOfWeek} onChange={(e) => setDayOfWeek(Number(e.target.value))}>
              {DAYS.map((d, i) => <option key={d} value={i}>{d}曜</option>)}
            </select>
          </div>
          <div className="grow">
            <label className="field-label" htmlFor="course-period">時限</label>
            <select id="course-period" className="input" value={period} onChange={(e) => setPeriod(Number(e.target.value))}>
              {periodOptions.map(p => <option key={p} value={p}>{p}限{periods[p] && ` ${periods[p].start}〜`}</option>)}
            </select>
          </div>
        </div>

        <span className="field-label">開講クォーター</span>
        <div className="row gap-10">
          {QUARTER_IDS.map(q => (
            <label key={q} className="check"><input type="checkbox" checked={quarters.includes(q)} onChange={() => toggleQuarter(q)} />第{q}Q</label>
          ))}
        </div>

        <label className="field-label" htmlFor="course-room">教室</label>
        <input id="course-room" className="input" value={room} onChange={(e) => setRoom(e.target.value)} placeholder="例: 3-601" />

        <label className="field-label" htmlFor="course-teacher">担当</label>
        <input id="course-teacher" className="input" value={teacher} onChange={(e) => setTeacher(e.target.value)} />

        <div className="row gap-10 mt-20">
          <button type="button" onClick={onClose} className="btn btn-soft grow">キャンセル</button>
          <button type="submit" disabled={!canSave} className="btn btn-primary grow">保存</button>
        </div>
        {course && <button type="button" onClick={() => setConfirmDelete(true)} className="btn btn-ghost danger-text block mt-10">この授業を削除</button>}
      </form>
    </Modal>
  );
}
