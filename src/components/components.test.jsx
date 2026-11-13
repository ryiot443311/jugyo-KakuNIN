// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import StatusButtons from './StatusButtons';
import TaskList from './TaskList';
import Modal from './Modal';
import UndoToast from './UndoToast';
import CourseFormModal from './CourseFormModal';

afterEach(cleanup);

describe('StatusButtons', () => {
  it('4つの状態を出し、押した状態を返す。exclude の状態は出さない', () => {
    const onSelect = vi.fn();
    const { rerender } = render(<StatusButtons onSelect={onSelect} />);
    expect(screen.getAllByRole('button').map(b => b.textContent)).toEqual(['遅刻', '欠席', '休講', '出席']);
    fireEvent.click(screen.getByText('欠席'));
    expect(onSelect).toHaveBeenCalledWith('欠席');
    rerender(<StatusButtons onSelect={onSelect} exclude="出席" />);
    expect(screen.queryByText('出席')).toBeNull();
  });
});

describe('TaskList', () => {
  const tasks = [
    { id: 'a', courseId: 'c', title: '完了済み', due: '2026-10-01', done: true },
    { id: 'b', courseId: 'c', title: 'あとの課題', due: '2026-11-10', done: false },
    { id: 'c', courseId: 'c', title: '期限切れ', due: '2026-10-20', done: false },
  ];
  it('未完了を期限順に、完了済みを後ろに並べ、期限切れに印を付ける', () => {
    const { container } = render(<TaskList tasks={tasks} today="2026-10-28" onAdd={() => {}} onToggle={() => {}} onDelete={() => {}} />);
    const items = [...container.querySelectorAll('.task-item')];
    expect(items.map(li => li.querySelector('.check span').textContent)).toEqual(['期限切れ', 'あとの課題', '完了済み']);
    expect(items[0].classList.contains('is-overdue')).toBe(true);
    expect(items[2].textContent).toContain('完了');
  });
  it('課題名が空なら追加できない。追加すると入力欄を空にする', () => {
    const onAdd = vi.fn();
    render(<TaskList tasks={[]} today="2026-10-28" onAdd={onAdd} onToggle={() => {}} onDelete={() => {}} />);
    const add = screen.getByRole('button', { name: '追加' });
    expect(add.disabled).toBe(true);
    fireEvent.change(screen.getByLabelText('課題名'), { target: { value: '  レポート ' } });
    fireEvent.change(screen.getByLabelText('期限'), { target: { value: '2026-11-01' } });
    fireEvent.click(add);
    expect(onAdd).toHaveBeenCalledWith('レポート', '2026-11-01');
    expect(screen.getByLabelText('課題名').value).toBe('');
  });
  it('完了・削除のボタンは対象の課題の ID を返す', () => {
    const onToggle = vi.fn(); const onDelete = vi.fn();
    render(<TaskList tasks={tasks} today="2026-10-28" onAdd={() => {}} onToggle={onToggle} onDelete={onDelete} />);
    fireEvent.click(screen.getByLabelText('あとの課題'));
    fireEvent.click(screen.getByRole('button', { name: '課題「期限切れ」を削除' }));
    expect(onToggle).toHaveBeenCalledWith('b');
    expect(onDelete).toHaveBeenCalledWith('c');
  });
});

describe('Modal', () => {
  it('見出しを名前にし、Esc で onClose を呼ぶ。閉じると元の場所にフォーカスを戻す', () => {
    vi.useFakeTimers();
    const onClose = vi.fn();
    const opener = document.createElement('button');
    document.body.appendChild(opener);
    opener.focus();
    const { unmount } = render(<Modal onClose={onClose}><h3>確認</h3><button type="button">はい</button></Modal>);
    act(() => { vi.runAllTimers(); });
    const dialog = screen.getByRole('dialog', { name: '確認' });
    expect(dialog.contains(document.activeElement)).toBe(true);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
    unmount();
    expect(document.activeElement).toBe(opener);
    opener.remove();
    vi.useRealTimers();
  });
  it('onClose が無ければ Esc では閉じない', () => {
    render(<Modal><p>お知らせ</p></Modal>);
    expect(() => fireEvent.keyDown(document, { key: 'Escape' })).not.toThrow();
    expect(screen.getByRole('dialog', { name: 'お知らせ' })).toBeTruthy();
  });
});

describe('UndoToast', () => {
  it('元に戻す・× ボタン・横スワイプで、それぞれの処理を呼ぶ（縦の動きでは消さない）', () => {
    const onUndo = vi.fn(); const onDismiss = vi.fn();
    const { container } = render(<UndoToast text="記録しました" onUndo={onUndo} onDismiss={onDismiss} />);
    fireEvent.click(screen.getByRole('button', { name: '元に戻す' }));
    fireEvent.click(screen.getByRole('button', { name: '閉じる' }));
    expect(onUndo).toHaveBeenCalledTimes(1);
    expect(onDismiss).toHaveBeenCalledTimes(1);
    const toast = container.querySelector('.toast');
    fireEvent.touchStart(toast, { touches: [{ clientX: 100, clientY: 100 }] });
    fireEvent.touchEnd(toast, { changedTouches: [{ clientX: 105, clientY: 200 }] });
    expect(onDismiss).toHaveBeenCalledTimes(1);
    fireEvent.touchStart(toast, { touches: [{ clientX: 100, clientY: 100 }] });
    fireEvent.touchEnd(toast, { changedTouches: [{ clientX: 260, clientY: 105 }] });
    expect(onDismiss).toHaveBeenCalledTimes(2);
  });
});

describe('CourseFormModal', () => {
  const periods = { 1: { start: '09:00', end: '10:30' }, 2: { start: '10:40', end: '12:10' } };
  it('隔週を選ぶと weeks を保存し、毎週に戻すと weeks を消す', () => {
    const onSave = vi.fn();
    const course = { id: 'c1', name: '輪講', dayOfWeek: 3, period: 1, quarter: [3], room: '', teacher: '', weeks: 'odd' };
    render(<CourseFormModal course={course} periods={periods} logCount={0} onSave={onSave} onDelete={() => {}} onClose={() => {}} />);
    expect(screen.getByLabelText('奇数週').checked).toBe(true);
    fireEvent.click(screen.getByLabelText('毎週'));
    fireEvent.click(screen.getByRole('button', { name: '保存' }));
    expect(onSave.mock.calls[0][0]).not.toHaveProperty('weeks');
    fireEvent.click(screen.getByLabelText('偶数週'));
    fireEvent.click(screen.getByRole('button', { name: '保存' }));
    expect(onSave.mock.calls[1][0]).toMatchObject({ id: 'c1', weeks: 'even', quarter: [3] });
  });
  it('授業名が空、またはクォーターを1つも選ばないと保存できない', () => {
    render(<CourseFormModal course={null} preset={{ quarters: [3] }} periods={periods} logCount={0} onSave={() => {}} onDelete={() => {}} onClose={() => {}} />);
    const save = screen.getByRole('button', { name: '保存' });
    expect(save.disabled).toBe(true);
    fireEvent.change(screen.getByLabelText('授業名'), { target: { value: '統計' } });
    expect(save.disabled).toBe(false);
    fireEvent.click(screen.getByLabelText('第3Q'));
    expect(save.disabled).toBe(true);
  });
});

describe('英語表示', () => {
  it('Provider の言語で文言が変わる（保存する状態は日本語のまま）', async () => {
    const { I18nContext } = await import('../i18n');
    const { en } = await import('../i18n/messages');
    const onSelect = vi.fn();
    render(<I18nContext.Provider value={en}><StatusButtons onSelect={onSelect} /></I18nContext.Provider>);
    expect(screen.getAllByRole('button').map(b => b.textContent)).toEqual(['Late', 'Absent', 'Canceled', 'Present']);
    fireEvent.click(screen.getByText('Absent'));
    expect(onSelect).toHaveBeenCalledWith('欠席');
  });
});
