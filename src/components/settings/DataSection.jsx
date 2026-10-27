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
  const [message, setMessage] = useState('');

  const exportBackup = () => downloadBackup(getBackup());

  const chooseFile = async (e) => {
    const input = e.target; const file = input.files[0];
    if (!file) return;
    if (file.size > MAX_BACKUP_BYTES) { setMessage('読み込めませんでした: ファイルが大きすぎます（30MBまで）'); input.value = ''; return; }
    const result = parseBackup(await file.text());
    if (result.ok) { setPendingImport(result); setMessage(''); } else setMessage(`読み込めませんでした: ${result.error}`);
    input.value = '';
  };

  return (
    <SettingsGroup title="データ">
      {pendingImport && (
        <Modal>
          <p className="center strong">次のデータを読み込み、現在の内容を置き換えます。</p>
          <p className="center small muted mt-10">{Object.keys(pendingImport.data).map(k => PART_LABELS[k]).join('、')}</p>
          {pendingImport.dropped > 0 && <p className="center small muted mt-8">不正なデータ {pendingImport.dropped} 件は除外します。</p>}
          <div className="row gap-10 mt-20">
            <button type="button" onClick={() => setPendingImport(null)} className="btn btn-soft grow">キャンセル</button>
            <button type="button" onClick={() => { onImportBackup(pendingImport.data); setPendingImport(null); }} className="btn btn-primary grow">読み込む</button>
          </div>
        </Modal>
      )}

      <div className="row gap-6">
        <button type="button" onClick={exportBackup} className="btn btn-soft grow">バックアップを書き出す</button>
        <label className="btn btn-soft grow row align-center" style={{ justifyContent: 'center' }}>
          読み込む
          <input type="file" accept="application/json,.json" onChange={chooseFile} hidden />
        </label>
      </div>
      {message && <p className="small danger-text mt-8" role="alert">{message}</p>}
      <p className="tiny muted mt-8">授業・キャンパス情報、設定、マップ画像、出席記録、メモを JSON で保存・復元できます。</p>
    </SettingsGroup>
  );
}
