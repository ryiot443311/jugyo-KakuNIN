import { useState } from 'react';
import { parseDateStr } from '../../utils/date';

const MAX_WEEKS = 12; // 直近この週数を表示
const W = 320; const H = 170;
const PAD = { top: 18, right: 8, bottom: 22, left: 30 };
const PLOT_W = W - PAD.left - PAD.right;
const PLOT_H = H - PAD.top - PAD.bottom;
const y = (rate) => PAD.top + PLOT_H * (1 - rate / 100);
const md = (dateStr) => { const d = parseDateStr(dateStr); return `${d.getMonth() + 1}/${d.getDate()}`; };

// 上の端だけ角を丸めた棒（下は基準線に接して四角）
const barPath = (x, top, width, base) => {
  const r = Math.min(4, width / 2, base - top);
  return `M${x},${base} V${top + r} Q${x},${top} ${x + r},${top} H${x + width - r} Q${x + width},${top} ${x + width},${top + r} V${base} Z`;
};

// 週ごとの出席率（1系列の棒グラフ）。タップ・ホバーでその週の内訳を表示し、表でも読める
export default function WeeklyTrendChart({ weeks, threshold }) {
  const shown = weeks.slice(-MAX_WEEKS);
  const [selected, setSelected] = useState(null);
  const active = shown.find(w => w.week === selected) ?? shown[shown.length - 1];
  const slot = PLOT_W / shown.length;
  const barW = Math.min(24, slot - 4); // 棒は24pxまで。隣との間は空ける
  const base = y(0);
  const labelEvery = shown.length > 6 ? 2 : 1;

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="chart" role="img" aria-label={`週ごとの出席率。直近の週（${md(shown[shown.length - 1].week)}〜）は${shown[shown.length - 1].rate}%`}>
        {[0, 50, 100].map(v => (
          <g key={v}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y(v)} y2={y(v)} className="chart-grid" />
            <text x={PAD.left - 6} y={y(v) + 4} textAnchor="end" className="chart-axis">{v}</text>
          </g>
        ))}
        <line x1={PAD.left} x2={W - PAD.right} y1={y(threshold)} y2={y(threshold)} className="chart-ref" />
        <text x={W - PAD.right} y={y(threshold) - 4} textAnchor="end" className="chart-axis">基準 {threshold}%</text>
        {shown.map((w, i) => {
          const x = PAD.left + slot * i + (slot - barW) / 2;
          const isActive = w.week === active.week;
          return (
            <g key={w.week}>
              {/* 0% の週も「記録がある」と分かるよう、2px の棒を残す */}
              <path d={barPath(x, Math.min(y(w.rate), base - 2), barW, base)} className="chart-bar" />
              {isActive && <text x={x + barW / 2} y={y(w.rate) - 5} textAnchor="middle" className="chart-value">{w.rate}%</text>}
              {(i % labelEvery === (shown.length - 1) % labelEvery) && (
                <text x={x + barW / 2} y={H - 6} textAnchor="middle" className="chart-axis">{md(w.week)}</text>
              )}
              {/* 押しやすいよう、棒より広い透明の当たり判定 */}
              <rect
                x={PAD.left + slot * i} y={PAD.top} width={slot} height={PLOT_H} className="chart-hit"
                onMouseEnter={() => setSelected(w.week)} onClick={() => setSelected(w.week)}
              ><title>{`${md(w.week)}〜の週: ${w.rate}%`}</title></rect>
            </g>
          );
        })}
      </svg>
      <p className="small muted mt-8" aria-live="polite">
        {md(active.week)}〜の週: <span className="strong">{active.rate}%</span>（出席{active.present}・遅刻{active.late}・欠席{active.absent}）
      </p>
      <details className="chart-table mt-8">
        <summary className="small muted">数値を表で見る</summary>
        <table>
          <thead><tr><th>週</th><th>出席率</th><th>出席</th><th>遅刻</th><th>欠席</th></tr></thead>
          <tbody>
            {shown.map(w => <tr key={w.week}><td>{md(w.week)}〜</td><td>{w.rate}%</td><td>{w.present}</td><td>{w.late}</td><td>{w.absent}</td></tr>)}
          </tbody>
        </table>
      </details>
    </div>
  );
}
