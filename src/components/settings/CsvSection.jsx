import { useMemo, useState } from 'react';
import SettingsGroup from './SettingsGroup';
import { buildDetailCsv, buildSummaryCsv, filterLogs } from '../../utils/csv';
import { downloadText } from '../../utils/download';
import { getFiscalYear } from '../../utils/date';

// 出席記録を CSV にして書き出す（年度・クォーターで絞り込み）
export default function CsvSection({ logs, courses }) {
  const [year, setYear] = useState('all');
  const [quarter, setQuarter] = useState(0);

  const years = useMemo(() => [...new Set(logs.map(l => getFiscalYear(l.date)))].sort((a, b) => b - a), [logs]);
  const target = useMemo(() => filterLogs(logs, { year, quarter }), [logs, year, quarter]);

  const fileSuffix = `${year === 'all' ? '全年度' : `${year}年度`}-${quarter === 0 ? '全Q' : `第${quarter}Q`}`;
  const save = (kind, build) => downloadText(`jugyo-kakunin-${kind}-${fileSuffix}.csv`, build(target, courses), 'text/csv;charset=utf-8');

  return (
    <SettingsGroup title="CSV出力">
      <div className="row gap-10">
        <div className="grow">
          <label className="field-label" htmlFor="csv-year">年度</label>
          <select id="csv-year" className="input" value={year} onChange={(e) => setYear(e.target.value === 'all' ? 'all' : Number(e.target.value))}>
            <option value="all">すべて</option>
            {years.map(y => <option key={y} value={y}>{y}年度</option>)}
          </select>
        </div>
        <div className="grow">
          <label className="field-label" htmlFor="csv-quarter">クォーター</label>
          <select id="csv-quarter" className="input" value={quarter} onChange={(e) => setQuarter(Number(e.target.value))}>
            <option value={0}>すべて</option>
            {[1, 2, 3, 4].map(q => <option key={q} value={q}>第{q}Q</option>)}
          </select>
        </div>
      </div>
      <p className="small muted mt-8 mb-10">対象: 出席記録 {target.length} 件</p>
      <div className="row gap-6">
        <button type="button" disabled={target.length === 0} onClick={() => save('detail', buildDetailCsv)} className="btn btn-soft grow">記録の明細</button>
        <button type="button" disabled={target.length === 0} onClick={() => save('summary', buildSummaryCsv)} className="btn btn-soft grow">授業ごとの集計</button>
      </div>
      <p className="tiny muted mt-8">Excel などで開けます（UTF-8・BOM付き）。</p>
    </SettingsGroup>
  );
}
