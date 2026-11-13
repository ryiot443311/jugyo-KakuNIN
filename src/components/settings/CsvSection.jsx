import { useMemo, useState } from 'react';
import SettingsGroup from './SettingsGroup';
import { buildDetailCsv, buildSummaryCsv, filterLogs } from '../../utils/csv';
import { downloadText } from '../../utils/download';
import { getFiscalYear } from '../../utils/date';
import { useI18n } from '../../i18n';

// 出席記録を CSV にして書き出す（年度・クォーターで絞り込み）
export default function CsvSection({ logs, courses }) {
  const t = useI18n();
  const [year, setYear] = useState('all');
  const [quarter, setQuarter] = useState(0);

  const years = useMemo(() => [...new Set(logs.map(l => getFiscalYear(l.date)))].sort((a, b) => b - a), [logs]);
  const target = useMemo(() => filterLogs(logs, { year, quarter }), [logs, year, quarter]);

  const fileSuffix = `${year === 'all' ? t.csvAllYears : t.fiscalYear(year)}-${quarter === 0 ? t.allQuarters : t.quarter(quarter)}`.replace(/\s+/g, '-');
  const save = (kind, build) => downloadText(`jugyo-kakunin-${kind}-${fileSuffix}.csv`, build(target, courses, t), 'text/csv;charset=utf-8');

  return (
    <SettingsGroup title={t.csvTitle}>
      <div className="row gap-10">
        <div className="grow">
          <label className="field-label" htmlFor="csv-year">{t.yearLabel}</label>
          <select id="csv-year" className="input" value={year} onChange={(e) => setYear(e.target.value === 'all' ? 'all' : Number(e.target.value))}>
            <option value="all">{t.all}</option>
            {years.map(y => <option key={y} value={y}>{t.fiscalYear(y)}</option>)}
          </select>
        </div>
        <div className="grow">
          <label className="field-label" htmlFor="csv-quarter">{t.quarterHeading}</label>
          <select id="csv-quarter" className="input" value={quarter} onChange={(e) => setQuarter(Number(e.target.value))}>
            <option value={0}>{t.all}</option>
            {[1, 2, 3, 4].map(q => <option key={q} value={q}>{t.quarter(q)}</option>)}
          </select>
        </div>
      </div>
      <p className="small muted mt-8 mb-10">{t.csvTarget(target.length)}</p>
      <div className="row gap-6">
        <button type="button" disabled={target.length === 0} onClick={() => save('detail', buildDetailCsv)} className="btn btn-soft grow">{t.csvDetail}</button>
        <button type="button" disabled={target.length === 0} onClick={() => save('summary', buildSummaryCsv)} className="btn btn-soft grow">{t.csvSummary}</button>
      </div>
      <p className="tiny muted mt-8">{t.csvNote}</p>
    </SettingsGroup>
  );
}
