import { STATUSES, STATUS_COLORS } from '../data/status';

// 出席・遅刻・欠席・休講のボタン列（exclude に指定した状態は表示しない）
export default function StatusButtons({ onSelect, exclude }) {
  return (
    <div className="status-row">
      {STATUSES.filter(s => s !== exclude).map(s => (
        <button key={s} onClick={() => onSelect(s)} className="status-btn" style={{ background: STATUS_COLORS[s] }}>{s}</button>
      ))}
    </div>
  );
}
