import { useState } from 'react';
import SettingsGroup from './SettingsGroup';
import { BEFORE_MINUTES, notificationSupported } from '../../utils/notify';
import { buildIcs, icsFileName } from '../../utils/ics';
import { downloadText } from '../../utils/download';
import { getFiscalYear } from '../../utils/date';

const ALARMS = [0, 5, 10, 15, 30];

// 通知（アプリを開いている間）と、カレンダーへの書き出し（アプリを閉じていても届く）
export default function NotifySection({ settings, onChange, courses, today }) {
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
    const { text, count } = buildIcs({ courses, quarters: settings.quarters, periods: settings.periods, fiscalYear: year, from: today, alarmMinutes: alarm });
    if (count === 0) { setMessage('書き出せる授業がありません（今日以降に授業がある期間のみ書き出します）'); return; }
    downloadText(icsFileName(year), text, 'text/calendar');
    setMessage(`${count}件の繰り返し予定を書き出しました。ファイルを開いてカレンダーに追加してください。`);
  };

  return (
    <SettingsGroup title="通知・カレンダー">
      <h4 className="field-label">アプリの通知</h4>
      {!supported ? (
        <p className="small muted">この端末・ブラウザは通知に対応していません。下のカレンダー書き出しを使ってください。</p>
      ) : (
        <>
          <label className="check block mb-6"><input type="checkbox" checked={settings.notify.before} onChange={() => toggle('before')} />授業開始の{BEFORE_MINUTES}分前に知らせる</label>
          <label className="check block mb-6"><input type="checkbox" checked={settings.notify.after} onChange={() => toggle('after')} />授業が終わったとき、未記録なら知らせる</label>
          {permission === 'denied' && <p className="small danger-text" role="alert">通知が許可されていません。ブラウザまたは端末の設定で、このアプリの通知を許可してください。</p>}
          <p className="tiny muted">アプリを開いている間（他のアプリに切り替えた直後を含む）だけ届きます。閉じていても知らせてほしいときは、カレンダーに書き出してください。</p>
        </>
      )}

      <h4 className="field-label">カレンダーに書き出す（.ics）</h4>
      <div className="row gap-6 align-center" style={{ flexWrap: 'wrap' }}>
        <select className="input" style={{ width: 'auto' }} value={year} onChange={(e) => setYear(Number(e.target.value))} aria-label="書き出す年度">
          {[thisYear, thisYear + 1].map(y => <option key={y} value={y}>{y}年度</option>)}
        </select>
        <select className="input" style={{ width: 'auto' }} value={alarm} onChange={(e) => setAlarm(Number(e.target.value))} aria-label="アラーム">
          {ALARMS.map(m => <option key={m} value={m}>{m === 0 ? 'アラームなし' : `${m}分前にアラーム`}</option>)}
        </select>
        <button type="button" onClick={exportIcs} className="btn btn-soft">書き出す</button>
      </div>
      {message && <p className="small mt-8" role="status">{message}</p>}
      <p className="tiny muted mt-8">非表示にしていない授業を、クォーターの期間に合わせた繰り返し予定にします（隔週の授業は2週ごと）。時間割を変えたら、カレンダーの古い予定を消してから書き出し直してください。</p>
    </SettingsGroup>
  );
}
