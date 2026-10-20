import { MY_COURSES } from '../data/constants';
import { STATUS_COLORS } from '../data/status';

export default function LogCard({ log, onEdit }) {
  const courseInfo = MY_COURSES.find(c => c.id === log.courseId);
  const isCanceled = log.status === '休講';
  return (
    <div className="log-card">
      <div className="log-card-head">
        <div className="log-card-period">{courseInfo ? `${courseInfo.period}時限` : ''}</div>
        <div className={`status-badge${isCanceled ? ' status-badge--canceled' : ''}`} style={isCanceled ? undefined : { background: STATUS_COLORS[log.status] }}>{log.status}</div>
      </div>
      <div className="log-card-body">
        <div>
          <div className="log-card-name">{courseInfo?.name || '不明'}</div>
          <div className="log-card-time">打刻: {log.recordedAt || log.date}</div>
        </div>
        <button onClick={() => onEdit(log)} className="btn-small">修正</button>
      </div>
    </div>
  );
}
