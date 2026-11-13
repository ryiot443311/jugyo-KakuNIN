import { useState } from 'react';
import SettingsGroup from './SettingsGroup';
import { BEFORE_MINUTES, notificationSupported } from '../../utils/notify';
import { buildIcs, icsFileName } from '../../utils/ics';
import { downloadText } from '../../utils/download';
import { getFiscalYear } from '../../utils/date';
import { useI18n } from '../../i18n';

const ALARMS = [0, 5, 10, 15, 30];

// 通知（アプリを開いている間）と、カレンダーへの書き出し（アプリを閉じていても届く）
export default function NotifySection({ settings, onChange, courses, today }) {
  const t = useI18n();
  const supported = notificationSupported();
  const [permission, setPermission] = useState(() => (supported ? Notification.permission : 'unsupported'));
  const [alarm, setAlarm] = useState(10);
  const [year, setYear] = useState(() => getFiscalYear(today));
  const [message, setMessage] = useState('');
  const thisYear = getFiscalYear(today);

  const toggle = async (key) => {
    const next = !settings.notify[key];
    if (next && permission !== 'granted') {
      const result = await Notification.requestPermission().catch(() => 'denied');
      setPermission(result);
      if (result !== 'granted') return;
    }
    onChange({ notify: { ...settings.notify, [key]: next } });
  };

  const exportIcs = () => {
    const { text, count } = buildIcs({ courses, quarters: settings.quarters, periods: settings.periods, fiscalYear: year, from: today, alarmMinutes: alarm, t });
    if (count === 0) { setMessage(t.icsNone); return; }
    downloadText(icsFileName(year), text, 'text/calendar');
    setMessage(t.icsDone(count));
  };

  return (
    <SettingsGroup title={t.notifyTitle}>
      <h4 className="field-label">{t.appNotify}</h4>
      {!supported ? (
        <p className="small muted">{t.notifyUnsupported}</p>
      ) : (
        <>
          <label className="check block mb-6"><input type="checkbox" checked={settings.notify.before} onChange={() => toggle('before')} />{t.notifyBefore(BEFORE_MINUTES)}</label>
          <label className="check block mb-6"><input type="checkbox" checked={settings.notify.after} onChange={() => toggle('after')} />{t.notifyAfter}</label>
          {permission === 'denied' && <p className="small danger-text" role="alert">{t.notifyDenied}</p>}
          <p className="tiny muted">{t.notifyNote}</p>
        </>
      )}

      <h4 className="field-label">{t.icsTitle}</h4>
      <div className="row gap-6 align-center" style={{ flexWrap: 'wrap' }}>
        <select className="input" style={{ width: 'auto' }} value={year} onChange={(e) => setYear(Number(e.target.value))} aria-label={t.icsYear}>
          {[thisYear, thisYear + 1].map(y => <option key={y} value={y}>{t.fiscalYear(y)}</option>)}
        </select>
        <select className="input" style={{ width: 'auto' }} value={alarm} onChange={(e) => setAlarm(Number(e.target.value))} aria-label={t.alarm}>
          {ALARMS.map(m => <option key={m} value={m}>{m === 0 ? t.noAlarm : t.alarmBefore(m)}</option>)}
        </select>
        <button type="button" onClick={exportIcs} className="btn btn-soft">{t.exportButton}</button>
      </div>
      {message && <p className="small mt-8" role="status">{message}</p>}
      <p className="tiny muted mt-8">{t.icsNote}</p>
    </SettingsGroup>
  );
}
