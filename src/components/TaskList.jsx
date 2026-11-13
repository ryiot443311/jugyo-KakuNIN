import { useState } from 'react';
import { dueLabel, daysUntil, sortTasks } from '../data/tasks';
import { useI18n } from '../i18n';

// 授業詳細の「課題」: 未完了を期限順に、完了済みはその後ろに並べる
export default function TaskList({ tasks, today, onAdd, onToggle, onDelete }) {
  const t = useI18n();
  const [title, setTitle] = useState('');
  const [due, setDue] = useState(today);
  const sorted = [...sortTasks(tasks.filter(t => !t.done)), ...sortTasks(tasks.filter(t => t.done))];
  const canAdd = title.trim() !== '' && /^\d{4}-\d{2}-\d{2}$/.test(due);

  const add = (e) => {
    e.preventDefault();
    if (!canAdd) return;
    onAdd(title.trim(), due);
    setTitle('');
  };

  return (
    <section aria-labelledby="task-heading">
      <h4 id="task-heading" className="field-label">{t.tasks}</h4>
      {sorted.length === 0 && <p className="tiny muted">{t.noTasks}</p>}
      <ul className="task-list">
        {sorted.map(task => (
          <li key={task.id} className={`task-item${task.done ? ' is-done' : daysUntil(task.due, today) < 0 ? ' is-overdue' : ''}`}>
            <label className="check grow">
              <input type="checkbox" checked={task.done} onChange={() => onToggle(task.id)} />
              <span className="grow">{task.title}</span>
            </label>
            <span className="tiny muted">{task.done ? t.done : dueLabel(task.due, today, t)}</span>
            <button type="button" onClick={() => onDelete(task.id)} className="btn btn-ghost btn-small danger-text" aria-label={t.deleteTask(task.title)}>{t.delete}</button>
          </li>
        ))}
      </ul>
      <form onSubmit={add} className="row gap-6 mt-8">
        <input className="input grow" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t.taskPlaceholder} aria-label={t.taskName} />
        <input className="input" type="date" value={due} onChange={(e) => setDue(e.target.value)} aria-label={t.due} style={{ width: 'auto' }} />
        <button type="submit" disabled={!canAdd} className="btn btn-soft btn-small">{t.add}</button>
      </form>
    </section>
  );
}
