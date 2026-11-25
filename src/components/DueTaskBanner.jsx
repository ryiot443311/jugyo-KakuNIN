import { useState } from 'react';
import { shortDate } from '../utils/date';
import { dueLabel, groupDueTasks, COLLAPSE_LIMIT, UPCOMING_DAYS } from '../data/tasks';

// 日別画面の「期限が近い課題」。選んだ日を基準に、期限ごとに区切って出す。
// 多いときは先頭の数件だけ見せて、残りは開いて見る
export default function DueTaskBanner({ tasks, courses, today, baseDate, onToggle }) {
  const [expanded, setExpanded] = useState(false);
  if (tasks.length === 0) return null;

  // 「ほか1件」なら畳まずに全部出す
  const collapsible = tasks.length > COLLAPSE_LIMIT + 1;
  const visibleIds = new Set((collapsible && !expanded ? tasks.slice(0, COLLAPSE_LIMIT) : tasks).map(t => t.id));
  const groups = groupDueTasks(tasks, today, baseDate)
    .map(g => ({ ...g, tasks: g.tasks.filter(t => visibleIds.has(t.id)) }))
    .filter(g => g.tasks.length > 0);
  const courseName = (id) => courses.find(c => c.id === id)?.name;
  const title = baseDate === today
    ? `期限が近い課題（${UPCOMING_DAYS}日以内・期限切れ）`
    : `${shortDate(baseDate)}から${UPCOMING_DAYS}日以内・期限切れの課題`;

  return (
    <section className="card task-banner" aria-labelledby="due-heading">
      <h3 id="due-heading" className="task-banner-title">{title}<span className="task-count">{tasks.length}件</span></h3>
      <div id="due-task-groups">
        {groups.map(g => (
          <div key={g.key} className={`task-group tone-${g.tone}`}>
            <h4 className="task-group-title">{g.label}{g.isBase && <span className="task-group-note">選んだ日</span>}</h4>
            <ul className="task-list">
              {g.tasks.map(t => (
                <li key={t.id} className={`task-item${g.tone === 'overdue' ? ' is-overdue' : ''}`}>
                  <label className="check grow">
                    <input type="checkbox" checked={false} onChange={() => onToggle(t.id)} aria-label={`「${t.title}」を完了にする`} />
                    <span className="grow">{t.title}<span className="tiny muted block">{courseName(t.courseId)}</span></span>
                  </label>
                  <span className="tiny strong task-due">{dueLabel(t.due, today)}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      {collapsible && (
        <button type="button" className="task-more" onClick={() => setExpanded(v => !v)} aria-expanded={expanded} aria-controls="due-task-groups">
          {expanded ? '折りたたむ ▲' : `ほか ${tasks.length - COLLAPSE_LIMIT}件を表示 ▼`}
        </button>
      )}
    </section>
  );
}
