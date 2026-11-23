// 目次: 下のタブに入らない画面（履歴・マップ・設定）への入口。本の目次のように点線でつなぐ
export default function TocView({ logCount, campusCount, courseCount, onOpen }) {
  const items = [
    { id: 'history', label: '履歴', note: `記録 ${logCount}件を月・週・日で振り返る` },
    { id: 'map', label: 'マップ', note: `キャンパス ${campusCount}か所` },
    { id: 'settings', label: '設定', note: `授業 ${courseCount}科目・期間・時限・通知・データ` },
  ];
  return (
    <section aria-labelledby="toc-heading">
      <h2 id="toc-heading" className="toc-title">目 次</h2>
      <ul className="toc">
        {items.map(item => (
          <li key={item.id}>
            <button type="button" onClick={() => onOpen(item.id)} className="toc-item">
              <span className="toc-label">{item.label}</span>
              <span className="toc-note">{item.note}</span>
              <span className="toc-leader" aria-hidden="true" />
              <span className="toc-arrow" aria-hidden="true">›</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
