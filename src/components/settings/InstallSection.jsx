import { useEffect, useState } from 'react';
import SettingsGroup from './SettingsGroup';
import { useI18n } from '../../i18n';

const isStandalone = () => window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;

// ホーム画面に追加して、アプリとして使うための案内とオフラインの準備状況
export default function InstallSection() {
  const t = useI18n();
  const [installEvent, setInstallEvent] = useState(null);
  const [installed, setInstalled] = useState(isStandalone);
  const [offlineReady, setOfflineReady] = useState(false);

  useEffect(() => {
    const onPrompt = (e) => { e.preventDefault(); setInstallEvent(e); };
    const onInstalled = () => { setInstalled(true); setInstallEvent(null); };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    navigator.serviceWorker?.ready.then(() => setOfflineReady(true)); // 本番ビルドで開いたときだけ有効になる
    return () => { window.removeEventListener('beforeinstallprompt', onPrompt); window.removeEventListener('appinstalled', onInstalled); };
  }, []);

  const install = async () => {
    installEvent.prompt();
    await installEvent.userChoice;
    setInstallEvent(null);
  };

  return (
    <SettingsGroup title={t.installTitle}>
      <p className="small mb-6">{installed ? t.installed : t.installHint}</p>
      {installEvent && <button type="button" onClick={install} className="btn btn-accent block mb-10">{t.addToHome}</button>}
      {!installed && (
        <ul className="small muted mb-10" style={{ paddingLeft: '1.2em', margin: 0 }}>
          <li>{t.androidHint}</li>
          <li>{t.iosHint}</li>
        </ul>
      )}
      <p className={`small ${offlineReady ? 'ok-text' : 'muted'}`}>
        {offlineReady ? t.offlineReady : t.offlineNote}
      </p>
    </SettingsGroup>
  );
}
