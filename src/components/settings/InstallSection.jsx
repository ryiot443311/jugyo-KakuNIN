import { useEffect, useState } from 'react';
import SettingsGroup from './SettingsGroup';

const isStandalone = () => window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;

// ホーム画面に追加して、アプリとして使うための案内とオフラインの準備状況
export default function InstallSection() {
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
    <SettingsGroup title="アプリとして使う">
      <p className="small mb-6">{installed ? '✓ ホーム画面のアプリとして起動しています。' : 'ホーム画面に追加すると、ブラウザを開かずにアプリのように起動できます。'}</p>
      {installEvent && <button type="button" onClick={install} className="btn btn-accent block mb-10">ホーム画面に追加</button>}
      {!installed && (
        <ul className="small muted mb-10" style={{ paddingLeft: '1.2em', margin: 0 }}>
          <li>Android（Chrome）: メニュー（︙）→「ホーム画面に追加」または「アプリをインストール」</li>
          <li>iPhone（Safari）: 共有ボタン →「ホーム画面に追加」</li>
        </ul>
      )}
      <p className={`small ${offlineReady ? 'ok-text' : 'muted'}`}>
        {offlineReady ? '✓ オフラインで開く準備ができています。' : 'オフラインで開く機能は、本番ビルドで開いたときに有効になります（一度開くと端末に保存されます）。'}
      </p>
    </SettingsGroup>
  );
}
