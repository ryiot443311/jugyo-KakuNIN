import { DAYS } from '../../utils/date';
import { quarterLabel, weekPatternLabel } from '../../data/status';
import SettingsGroup from './SettingsGroup';

const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0]; // 月曜始まり

export default function CoursesSection({ courses, hiddenCourses, onToggle, onShowAll, onEdit, onAdd }) {
  const hiddenCount = courses.filter(c => hiddenCourses.includes(c.id)).length;
  const dayGroups = WEEK_ORDER
    .map(d => ({ day: d, items: courses.filter(c => c.dayOfWeek === d).sort((a, b) => a.period - b.period) }))
    .filter(g => g.items.length > 0);

  return (
    <SettingsGroup title="授業">
      {dayGroups.length === 0 && <p className="small muted">授業がまだありません。</p>}
      {hiddenCount > 0 && (
        <div className="row between align-center gap-6 hidden-summary">
          <span className="small">非表示の授業: {hiddenCount}件</span>
          <button type="button" onClick={onShowAll} className="btn btn-soft btn-small">すべて表示に戻す</button>
        </div>
      )}
      {dayGroups.map(g => (
        <details key={g.day} className="day-group" open>
          <summary>{DAYS[g.day]}曜日（{g.items.length}）</summary>
          {g.items.map(c => (
            <div key={c.id} className="row align-center course-row">
              <label className={`check grow${hiddenCourses.includes(c.id) ? ' is-hidden-course' : ''}`}>
                <input type="checkbox" checked={!hiddenCourses.includes(c.id)} onChange={() => onToggle(c.id)} aria-label={`${c.name}を表示`} />
                <span>
                  {c.name}{hiddenCourses.includes(c.id) && <span className="badge badge-weeks">非表示</span>}
                  <span className="small muted block">{c.period}限・{quarterLabel(c)}{c.weeks && `・${weekPatternLabel(c)}`}</span>
                </span>
              </label>
              <button type="button" onClick={() => onEdit(c)} className="btn btn-soft btn-small">編集</button>
            </div>
          ))}
        </details>
      ))}
      <button type="button" onClick={() => onAdd()} className="btn btn-accent block mt-10">＋ 授業を追加</button>
      <p className="tiny muted mt-10">チェックを外した授業は、日別・週間・分析に表示されません（記録は残ります）。</p>
    </SettingsGroup>
  );
}
