import { useState } from 'react';
import Modal from '../Modal';
import { parseBackup } from '../../data/backup';

const PART_LABELS = {
  appData: '授業・キャンパス情報', settings: '設定', campusImages: 'マップ画像',
  logs: '出席記録', courseMemos: '授業メモ', dateMemos: '日付別メモ',
};

export default function DataSection({ logCount, onResetLogs, getBackup, onImportBackup }) {
  const [confirmReset, setConfirmReset] = useState(false);
  const [pendingImport, setPendingImport] = useState(null);
  const [message, setMessage] = useState('');

  const exportBackup = () => {
    const url = URL.createObjectURL(new Blob([getBackup()], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `jugyo-kakunin-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const chooseFile = async (e) => {
    const input = e.target; const file = input.files[0];
    if (!file) return;
    try {
      setPendingImport(parseBackup(await file.text()));
      setMessage('');
    } catch (err) {
      setMessage(err.message);
    }
    input.value = '';
  };

  return (
    <section className="card section">
      {confirmReset && (
        <Modal>
          <p className="center strong">出席記録を{logCount}件すべて削除します。<br />この操作は取り消せません。</p>
          <div className="row gap-10 mt-20">
            <button type="button" onClick={() => setConfirmReset(false)} className="btn btn-soft grow">キャンセル</button>
            <button type="button" onClick={() => { onResetLogs(); setConfirmReset(false); }} className="btn btn-danger grow">削除</button>
          </div>
        </Modal>
      )}
      {pendingImport && (
        <Modal>
          <p className="center strong">次のデータを読み込み、現在の内容を置き換えます。</p>
          <p className="center small muted mt-10">{Object.keys(pendingImport).map(k => PART_LABELS[k]).join('、')}</p>
          <div className="row gap-10 mt-20">
            <button type="button" onClick={() => setPendingImport(null)} className="btn btn-soft grow">キャンセル</button>
            <button type="button" onClick={() => { onImportBackup(pendingImport); setPendingImport(null); }} className="btn btn-primary grow">読み込む</button>
          </div>
        </Modal>
      )}

      <h3 className="section-title">データ</h3>
      <div className="row gap-6">
        <button type="button" onClick={exportBackup} className="btn btn-soft grow">バックアップを書き出す</button>
        <label className="btn btn-soft grow row align-center" style={{ justifyContent: 'center' }}>
          読み込む
          <input type="file" accept="application/json,.json" onChange={chooseFile} hidden />
        </label>
      </div>
      {message && <p className="small danger-text mt-8" role="alert">{message}</p>}
      <p className="tiny muted mt-8 mb-15">授業・キャンパス情報、設定、マップ画像、出席記録、メモを JSON で保存・復元できます。</p>
      <button type="button" onClick={() => setConfirmReset(true)} disabled={logCount === 0} className="btn btn-danger block">出席記録をすべて削除（{logCount}件）</button>
    </section>
  );
}
