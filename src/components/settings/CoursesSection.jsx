import { quarterLabel, weekPatternLabel } from '../../data/status';
import SettingsGroup from './SettingsGroup';
import { useI18n } from '../../i18n';

const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0]; // 月曜始まり

export default function CoursesSection({ courses, hiddenCourses, onToggle, onEdit, onAdd }) {
  const t = useI18n();
  const dayGroups = WEEK_ORDER
    .map(d => ({ day: d, items: courses.filter(c => c.dayOfWeek === d).sort((a, b) => a.period - b.period) }))
    .filter(g => g.items.length > 0);

  return (
    <SettingsGroup title={t.courses}>
      {dayGroups.length === 0 && <p className="small muted">{t.noCourses}</p>}
      {dayGroups.map(g => (
        <details key={g.day} className="day-group" open>
          <summary>{t.dayGroup(g.day, g.items.length)}</summary>
          {g.items.map(c => (
            <div key={c.id} className="row align-center course-row">
              <label className="check grow">
                <input type="checkbox" checked={!hiddenCourses.includes(c.id)} onChange={() => onToggle(c.id)} aria-label={t.showCourse(c.name)} />
                <span>
                  {c.name}
                  <span className="small muted block">{[t.period(c.period), quarterLabel(c, t), ...(c.weeks ? [weekPatternLabel(c, t)] : [])].join(t.metaSep)}</span>
                </span>
              </label>
              <button type="button" onClick={() => onEdit(c)} className="btn btn-soft btn-small">{t.edit}</button>
            </div>
          ))}
        </details>
      ))}
      <button type="button" onClick={() => onAdd()} className="btn btn-accent block mt-10">{t.addCourseButton}</button>
      <p className="tiny muted mt-10">{t.hiddenNote}</p>
    </SettingsGroup>
  );
}
