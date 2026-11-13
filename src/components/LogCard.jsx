import { statusBgClass } from '../data/status';
import { useI18n } from '../i18n';

export default function LogCard({ log, courses, onEdit }) {
  const t = useI18n();
  const courseInfo = courses.find(c => c.id === log.courseId);
  return (
    <div className="card log-card">
      <div className="row between align-center mb-6">
        <span className="small accent strong">{courseInfo ? t.periodLong(courseInfo.period) : ''}</span>
        <span className={`pill ${statusBgClass(log.status)}`}>{t.status(log.status)}</span>
      </div>
      <div className="row between align-start">
        <div>
          <div className="strong">{courseInfo?.name || t.unknown}</div>
          <div className="tiny faint">{t.recordedAt(log.recordedAt || log.date)}</div>
        </div>
        <button type="button" onClick={() => onEdit(log)} className="btn btn-soft btn-small">{t.fix}</button>
      </div>
    </div>
  );
}
