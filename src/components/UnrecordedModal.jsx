import Modal from './Modal';
import { parseDateStr } from '../utils/date';
import { useI18n } from '../i18n';

// 記録し忘れの授業の一覧。選ぶとその日の日別画面へ移動する
export default function UnrecordedModal({ items, onSelect, onClose }) {
  const t = useI18n();
  return (
    <Modal onClose={onClose}>
      <h3 className="modal-title">{t.unrecordedTitle}</h3>
      <p className="small muted mb-10">{t.unrecordedNote}</p>
      <div className="unrecorded-list">
        {items.map(({ date, course }) => {
          const d = parseDateStr(date);
          return (
            <button key={`${date}|${course.id}`} type="button" onClick={() => onSelect(date)} className="unrecorded-item">
              <span className="strong">{t.shortDate(d.getMonth() + 1, d.getDate(), d.getDay())}{t.period(course.period)}</span>
              <span className="small muted">{course.name}</span>
            </button>
          );
        })}
      </div>
      <button type="button" onClick={onClose} className="btn btn-ghost block mt-10">{t.close}</button>
    </Modal>
  );
}
