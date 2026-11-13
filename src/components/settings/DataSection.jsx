import { useState } from 'react';
import Modal from '../Modal';
import { parseBackup } from '../../data/backup';
import { downloadBackup } from '../../utils/download';
import SettingsGroup from './SettingsGroup';
import { useI18n } from '../../i18n';

const MAX_BACKUP_BYTES = 30 * 1024 * 1024; // マップ画像を含めても収まる大きさ

export default function DataSection({ getBackup, onImportBackup }) {
  const t = useI18n();
  const [pendingImport, setPendingImport] = useState(null);
  const [message, setMessage] = useState(null); // { ok, text }

  const exportBackup = () => downloadBackup(getBackup());

  const runImport = (mode) => {
    setMessage({ ok: true, text: onImportBackup(pendingImport.data, mode) });
    setPendingImport(null);
  };

  const chooseFile = async (e) => {
    const input = e.target; const file = input.files[0];
    if (!file) return;
    if (file.size > MAX_BACKUP_BYTES) { setMessage({ ok: false, text: t.importFailed(t.fileTooLarge) }); input.value = ''; return; }
    const result = parseBackup(await file.text(), t);
    if (result.ok) { setPendingImport(result); setMessage(null); } else setMessage({ ok: false, text: t.importFailed(result.error) });
    input.value = '';
  };

  return (
    <SettingsGroup title={t.data}>
      {pendingImport && (
        <Modal onClose={() => setPendingImport(null)}>
          <h3 className="modal-title">{t.importTitle}</h3>
          <p className="center small muted">{t.includes(Object.keys(pendingImport.data).map(k => t.parts[k]))}</p>
          {pendingImport.dropped > 0 && <p className="center small muted mt-8">{t.dropped(pendingImport.dropped)}</p>}
          <button type="button" onClick={() => runImport('merge')} className="btn btn-primary block mt-20">{t.merge}</button>
          <p className="tiny muted mt-8">{t.mergeNote}</p>
          <button type="button" onClick={() => runImport('replace')} className="btn btn-soft block mt-10 danger-text">{t.replace}</button>
          <p className="tiny muted mt-8">{t.replaceNote}</p>
          <button type="button" onClick={() => setPendingImport(null)} className="btn btn-ghost block mt-10">{t.cancel}</button>
        </Modal>
      )}

      <div className="row gap-6">
        <button type="button" onClick={exportBackup} className="btn btn-soft grow">{t.exportBackup}</button>
        <label className="btn btn-soft grow row align-center" style={{ justifyContent: 'center' }}>
          {t.importButton}
          <input type="file" accept="application/json,.json" onChange={chooseFile} hidden />
        </label>
      </div>
      {message && <p className={`small mt-8 ${message.ok ? 'ok-text' : 'danger-text'}`} role={message.ok ? 'status' : 'alert'}>{message.text}</p>}
      <p className="tiny muted mt-8">{t.dataNote}</p>
    </SettingsGroup>
  );
}
