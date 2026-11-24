import { shortDate } from '../utils/date';
import { sortCalendar, eventEnd } from '../data/calendar';

// 学年暦の、今日以降でいちばん近い予定の説明（なければ null）
const nextEventNote = (calendar, courses, today) => {
  const next = sortCalendar(calendar).find(e => eventEnd(e) >= today);
  if (!next) return null;
  if (next.type === 'holiday') return `次の休校日: ${shortDate(next.start > today ? next.start : today)}${next.name ? ` ${next.name}` : ''}`;
  if (next.type === 'swap') return `次の曜日振替: ${shortDate(next.date)}`;
  return `次の補講: ${shortDate(next.date)} ${courses.find(c => c.id === next.courseId)?.name ?? ''}`;
};

// 目次: 下のタブに入らない画面（履歴・マップ・設定）と、よく使う設定の項目への入口。本の目次のように点線でつなぐ
export default function TocView({ logCount, campusCount, courseCount, calendar, courses, today, onOpen }) {
  const chapters = [
    { id: 'history', label: '履歴', note: `記録 ${logCount}件を月・週・日で振り返る` },
    { id: 'map', label: 'マップ', note: `キャンパス ${campusCount}か所` },
    {
      id: 'settings', label: '設定', note: `授業 ${courseCount}科目・期間・時限・通知・データ`,
      sections: [
        { title: '休校日・振替・補講', note: nextEventNote(calendar, courses, today) ?? `登録 ${calendar.length}件` },
        { title: '新年度の準備', note: '授業の整理・期間の見直し' },
        { title: 'データ', label: 'バックアップ', note: '書き出し・読み込み' },
      ],
    },
  ];
  return (
    <section aria-labelledby="toc-heading">
      <h2 id="toc-heading" className="toc-title">目 次</h2>
      <ul className="toc">
        {chapters.map(item => (
          <li key={item.id}>
            <button type="button" onClick={() => onOpen(item.id)} className="toc-item">
              <span className="toc-label">{item.label}</span>
              <span className="toc-note">{item.note}</span>
              <span className="toc-leader" aria-hidden="true" />
              <span className="toc-arrow" aria-hidden="true">›</span>
            </button>
            {item.sections && (
              <ul className="toc toc-sections">
                {item.sections.map(sec => (
                  <li key={sec.title}>
                    <button type="button" onClick={() => onOpen(item.id, sec.title)} className="toc-item toc-section">
                      <span className="toc-label">{sec.label ?? sec.title}</span>
                      <span className="toc-note">{sec.note}</span>
                      <span className="toc-leader" aria-hidden="true" />
                      <span className="toc-arrow" aria-hidden="true">›</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
