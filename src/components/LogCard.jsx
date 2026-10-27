import { MY_COURSES } from '../data/constants';
import { statusBgClass } from '../data/status';

export default function LogCard({ log, onEdit }) {
  const courseInfo = MY_COURSES.find(c => c.id === log.courseId);
  return (
    <div className="card log-card">
      <div className="row between align-center mb-6">
        <span className="small accent strong">{courseInfo ? `${courseInfo.period}時限` : ''}</span>
        <span className={`pill ${statusBgClass(log.status)}`}>{log.status}</span>
      </div>
      <div className="row between align-start">
        <div>
          <div className="strong">{courseInfo?.name || '不明'}</div>
          <div className="tiny faint">打刻: {log.recordedAt || log.date}</div>
        </div>
        <button type="button" onClick={() => onEdit(log)} className="btn btn-soft btn-small">修正</button>
      </div>
    </div>
  );
}
