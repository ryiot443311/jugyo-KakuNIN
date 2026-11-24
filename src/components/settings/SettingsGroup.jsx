import { useContext, useEffect, useRef } from 'react';
import { SettingsFocus } from './settingsFocus';

// 設定の項目。タイトルをタップして開閉する。目次から開いたときは、開いた状態でその項目までスクロールする
export default function SettingsGroup({ title, className = '', children }) {
  const focused = useContext(SettingsFocus) === title;
  const ref = useRef(null);
  useEffect(() => {
    if (!focused || !ref.current) return;
    ref.current.open = true;
    ref.current.scrollIntoView?.({ block: 'start' });
    ref.current.querySelector('summary')?.focus({ preventScroll: true });
  }, [focused]);
  return (
    <details ref={ref} className={`card section settings-group ${className}`}>
      <summary className="section-title">{title}</summary>
      {children}
    </details>
  );
}
