import { STATUSES, statusBgClass } from '../data/status';

// 出席・遅刻・欠席・休講のボタン（exclude に指定した状態は表示しない）
// 出席だけを左端に大きく塗りで置き、それ以外（遅刻・欠席・休講）は枠線だけにして誤タップを防ぐ
export default function StatusButtons({ onSelect, exclude }) {
  const statuses = STATUSES.filter(s => s !== exclude);
  const button = (s) => (
    <button key={s} type="button" onClick={() => onSelect(s)} className={`btn status-btn ${statusBgClass(s)}`}>{s}</button>
  );
  const others = statuses.filter(s => s !== '出席');
  return (
    <div className="status-stack">
      {statuses.includes('出席') && button('出席')}
      {others.length > 0 && <div className="status-row">{others.map(button)}</div>}
    </div>
  );
}
