import { useState } from 'react';
import { dueLabel, daysUntil, sortTasks } from '../data/tasks';

// 授業詳細の「課題」: 未完了を期限順に、完了済みはその後ろに並べる
export default function TaskList({ tasks, today, onAdd, onToggle, onDelete }) {
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
      <h4 id="task-heading" className="field-label">課題</h4>
      {sorted.length === 0 && <p className="tiny muted">登録された課題はありません</p>}
      <ul className="task-list">
        {sorted.map(t => (
          <li key={t.id} className={`task-item${t.done ? ' is-done' : daysUntil(t.due, today) < 0 ? ' is-overdue' : ''}`}>
            <label className="check grow">
              <input type="checkbox" checked={t.done} onChange={() => onToggle(t.id)} />
              <span className="grow">{t.title}</span>
            </label>
            <span className="tiny muted">{t.done ? '完了' : dueLabel(t.due, today)}</span>
            <button type="button" onClick={() => onDelete(t.id)} className="btn btn-ghost btn-small danger-text" aria-label={`課題「${t.title}」を削除`}>削除</button>
          </li>
        ))}
      </ul>
      <form onSubmit={add} className="row gap-6 mt-8">
        <input className="input grow" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="例: レポート提出" aria-label="課題名" />
        <input className="input" type="date" value={due} onChange={(e) => setDue(e.target.value)} aria-label="期限" style={{ width: 'auto' }} />
        <button type="submit" disabled={!canAdd} className="btn btn-soft btn-small">追加</button>
      </form>
    </section>
  );
}
