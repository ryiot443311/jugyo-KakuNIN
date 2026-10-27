import { DAYS } from '../../utils/date';
import { quarterLabel } from '../../data/status';
import SettingsGroup from './SettingsGroup';

export default function CoursesSection({ courses, hiddenCourses, onToggle, onEdit, onAdd }) {
  return (
    <SettingsGroup title="授業">
      {courses.length === 0 && <p className="small muted">授業がまだありません。</p>}
      {courses.map(c => (
        <div key={c.id} className="row align-center course-row">
          <label className="check grow">
            <input type="checkbox" checked={!hiddenCourses.includes(c.id)} onChange={() => onToggle(c.id)} aria-label={`${c.name}を表示`} />
            <span>
              {c.name}
              <span className="small muted block">{DAYS[c.dayOfWeek]}曜 {c.period}限・{quarterLabel(c)}</span>
            </span>
          </label>
          <button type="button" onClick={() => onEdit(c)} className="btn btn-soft btn-small">編集</button>
        </div>
      ))}
      <button type="button" onClick={() => onAdd()} className="btn btn-accent block mt-10">＋ 授業を追加</button>
      <p className="tiny muted mt-10">チェックを外した授業は、日別・週間・分析に表示されません（記録は残ります）。</p>
    </SettingsGroup>
  );
}
