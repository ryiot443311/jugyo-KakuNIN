import { useState } from 'react';
import Modal from '../Modal';
import { parseBackup } from '../../data/backup';
import { downloadBackup } from '../../utils/download';
import SettingsGroup from './SettingsGroup';

const MAX_BACKUP_BYTES = 30 * 1024 * 1024; // マップ画像を含めても収まる大きさ

const PART_LABELS = {
  logs: '出席記録', courses: '授業', courseMemos: '授業メモ', datedMemos: '日付別メモ', settings: '設定',
  campuses: 'キャンパス', campusBuildings: '施設の説明', campusImages: 'マップ画像',
};

export default function DataSection({ getBackup, onImportBackup }) {
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
    if (file.size > MAX_BACKUP_BYTES) { setMessage({ ok: false, text: '読み込めませんでした: ファイルが大きすぎます（30MBまで）' }); input.value = ''; return; }
    const result = parseBackup(await file.text());
    if (result.ok) { setPendingImport(result); setMessage(null); } else setMessage({ ok: false, text: `読み込めませんでした: ${result.error}` });
    input.value = '';
  };

  return (
    <SettingsGroup title="データ">
      {pendingImport && (
        <Modal>
          <h3 className="modal-title">バックアップの読み込み</h3>
          <p className="center small muted">含まれている項目: {Object.keys(pendingImport.data).map(k => PART_LABELS[k]).join('、')}</p>
          {pendingImport.dropped > 0 && <p className="center small muted mt-8">不正なデータ {pendingImport.dropped} 件は除外します。</p>}
          <button type="button" onClick={() => runImport('merge')} className="btn btn-primary block mt-20">統合する</button>
          <p className="tiny muted mt-8">手元にない記録・授業・メモだけを足します。同じものは手元を優先し、設定は変えません。2台の端末で使うときに。</p>
          <button type="button" onClick={() => runImport('replace')} className="btn btn-soft block mt-10 danger-text">置き換える</button>
          <p className="tiny muted mt-8">含まれている項目を、バックアップの内容で置き換えます。初めて読み込むときや、元に戻すときに。</p>
          <button type="button" onClick={() => setPendingImport(null)} className="btn btn-ghost block mt-10">キャンセル</button>
        </Modal>
      )}

      <div className="row gap-6">
        <button type="button" onClick={exportBackup} className="btn btn-soft grow">バックアップを書き出す</button>
        <label className="btn btn-soft grow row align-center" style={{ justifyContent: 'center' }}>
          読み込む
          <input type="file" accept="application/json,.json" onChange={chooseFile} hidden />
        </label>
      </div>
      {message && <p className={`small mt-8 ${message.ok ? 'ok-text' : 'danger-text'}`} role={message.ok ? 'status' : 'alert'}>{message.text}</p>}
      <p className="tiny muted mt-8">授業・キャンパス情報、設定、マップ画像、出席記録、メモを JSON で保存・復元できます。</p>
    </SettingsGroup>
  );
}
