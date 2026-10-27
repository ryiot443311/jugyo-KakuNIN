import Modal from './Modal';
import { DAYS, parseDateStr } from '../utils/date';

// 記録し忘れの授業の一覧。選ぶとその日の日別画面へ移動する
export default function UnrecordedModal({ items, onSelect, onClose }) {
  return (
    <Modal>
      <h3 className="modal-title">記録していない授業</h3>
      <p className="small muted mb-10">選ぶと、その日の画面に移動します。休講だった授業は「休講」で記録してください。</p>
      <div className="unrecorded-list">
        {items.map(({ date, course }) => {
          const d = parseDateStr(date);
          return (
            <button key={`${date}|${course.id}`} type="button" onClick={() => onSelect(date)} className="unrecorded-item">
              <span className="strong">{d.getMonth() + 1}/{d.getDate()}（{DAYS[d.getDay()]}）{course.period}限</span>
              <span className="small muted">{course.name}</span>
            </button>
          );
        })}
      </div>
      <button type="button" onClick={onClose} className="btn btn-ghost block mt-10">閉じる</button>
    </Modal>
  );
}
