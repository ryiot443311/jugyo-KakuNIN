// 設定の項目。タイトルをタップして開閉する
export default function SettingsGroup({ title, className = '', children }) {
  return (
    <details className={`card section settings-group ${className}`}>
      <summary className="section-title">{title}</summary>
      {children}
    </details>
  );
}
