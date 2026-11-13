import { useState } from 'react';
import Modal from './Modal';
import { DAYS, formatDate } from '../utils/date';
import { useI18n } from '../i18n';
import { newId } from '../data/appData';
import { WEEK_PATTERNS } from '../data/status';

const QUARTER_IDS = [1, 2, 3, 4];

// 授業の追加・編集フォーム（course が null なら追加。preset は追加時の初期値）
export default function CourseFormModal({ course, preset, periods, logCount, onSave, onDelete, onClose }) {
  const t = useI18n();
  const [name, setName] = useState(course?.name ?? '');
  const [dayOfWeek, setDayOfWeek] = useState(course?.dayOfWeek ?? preset?.dayOfWeek ?? 1);
  const [period, setPeriod] = useState(course?.period ?? preset?.period ?? 1);
  const [quarters, setQuarters] = useState(() => (course ? [].concat(course.quarter ?? QUARTER_IDS) : preset?.quarters ?? QUARTER_IDS));
  const [weeks, setWeeks] = useState(course?.weeks ?? 'every');
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
    const { weeks: _w, ...rest } = course ?? {}; // eslint-disable-line no-unused-vars
    onSave({
      ...rest,
      id: course?.id ?? newId('course'),
      ...(course ? {} : { createdAt: formatDate(new Date()) }), // 追加した日（記録し忘れの検出に使う）
      name: name.trim(), dayOfWeek, period,
      quarter: [...quarters].sort(),
      ...(weeks === 'every' ? {} : { weeks }),
      room: room.trim(), teacher: teacher.trim(),
    });
  };

  if (confirmDelete) {
    return (
      <Modal onClose={() => setConfirmDelete(false)}>
        <p className="center strong">{t.deleteCourseConfirm(course.name)}</p>
        {logCount > 0 && <p className="center small muted mt-10">{t.deleteCourseLogsNote(logCount)}</p>}
        <div className="row gap-10 mt-20">
          <button type="button" onClick={() => setConfirmDelete(false)} className="btn btn-soft grow">{t.back}</button>
          <button type="button" onClick={() => onDelete(course.id)} className="btn btn-danger grow">{t.delete}</button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal onClose={onClose}>
      <form onSubmit={submit}>
        <h3 className="modal-title">{course ? t.editCourse : t.addCourse}</h3>

        <label className="field-label" htmlFor="course-name">{t.courseName}</label>
        <input id="course-name" className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder={t.courseNamePlaceholder} autoFocus />

        <div className="row gap-10">
          <div className="grow">
            <label className="field-label" htmlFor="course-day">{t.dayOfWeek}</label>
            <select id="course-day" className="input" value={dayOfWeek} onChange={(e) => setDayOfWeek(Number(e.target.value))}>
              {DAYS.map((d, i) => <option key={d} value={i}>{t.dayMid(i)}</option>)}
            </select>
          </div>
          <div className="grow">
            <label className="field-label" htmlFor="course-period">{t.periodLabel}</label>
            <select id="course-period" className="input" value={period} onChange={(e) => setPeriod(Number(e.target.value))}>
              {periodOptions.map(p => <option key={p} value={p}>{t.periodOption(p, periods[p]?.start)}</option>)}
            </select>
          </div>
        </div>

        <span className="field-label">{t.offeredQuarters}</span>
        <div className="row gap-10">
          {QUARTER_IDS.map(q => (
            <label key={q} className="check"><input type="checkbox" checked={quarters.includes(q)} onChange={() => toggleQuarter(q)} />{t.quarter(q)}</label>
          ))}
        </div>

        <span className="field-label">{t.frequency}</span>
        <div className="row gap-10" role="radiogroup" aria-label={t.frequency}>
          {WEEK_PATTERNS.map(w => (
            <label key={w.id} className="check"><input type="radio" name="course-weeks" checked={weeks === w.id} onChange={() => setWeeks(w.id)} />{t.weekPatterns[w.id]}</label>
          ))}
        </div>
        {weeks !== 'every' && <p className="tiny muted mt-8">{t.weeksNote}</p>}

        <label className="field-label" htmlFor="course-room">{t.room}</label>
        <input id="course-room" className="input" value={room} onChange={(e) => setRoom(e.target.value)} placeholder={t.roomPlaceholder} />

        <label className="field-label" htmlFor="course-teacher">{t.teacher}</label>
        <input id="course-teacher" className="input" value={teacher} onChange={(e) => setTeacher(e.target.value)} />

        <div className="row gap-10 mt-20">
          <button type="button" onClick={onClose} className="btn btn-soft grow">{t.cancel}</button>
          <button type="submit" disabled={!canSave} className="btn btn-primary grow">{t.save}</button>
        </div>
        {course && <button type="button" onClick={() => setConfirmDelete(true)} className="btn btn-ghost danger-text block mt-10">{t.deleteThisCourse}</button>}
      </form>
    </Modal>
  );
}
