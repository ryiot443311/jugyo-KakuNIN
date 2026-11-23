import { STATUS_MARKS, STATUS_STAMPS, statusTextClass } from '../data/status';

// 記録済みの印。variant: 'hanko'（朱肉の印のような丸）/ 'mark'（出席簿の ○△×休）
// 文字は読み上げない（隣に「出席 記録済み」などの文字を必ず置く）
export default function RecordMark({ status, variant = 'hanko', animate = false }) {
  if (variant === 'mark') return <span className={`record-mark ${statusTextClass(status)}`} aria-hidden="true">{STATUS_MARKS[status]}</span>;
  return <span className={`hanko ${statusTextClass(status)}${animate ? ' is-pressed' : ''}`} aria-hidden="true">{STATUS_STAMPS[status]}</span>;
}
