import { useState } from 'react';
import Modal from '../Modal';
import { downloadBackup } from '../../utils/download';

const CONFIRM_WORD = '削除';

// 取り消せない操作をまとめた項目。折りたたんでおき、実行には確認の文字入力が必要
export default function DangerSection({ logCount, onResetLogs, getBackup }) {
  const [confirming, setConfirming] = useState(false);
  const [typed, setTyped] = useState('');

  const close = () => { setConfirming(false); setTyped(''); };

  return (
    <section className="card section danger-zone">
      {confirming && (
        <Modal>
          <h3 className="modal-title danger-text">出席記録の全削除</h3>
          <p className="center strong">出席記録 {logCount}件 をすべて削除します。<br />この操作は取り消せません。</p>
          <button type="button" onClick={() => downloadBackup(getBackup())} className="btn btn-soft block mt-10">先にバックアップを書き出す</button>
          <label className="field-label" htmlFor="danger-confirm">確認のため「{CONFIRM_WORD}」と入力してください</label>
          <input id="danger-confirm" className="input" value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" />
          <div className="row gap-10 mt-20">
            <button type="button" onClick={close} className="btn btn-soft grow">キャンセル</button>
            <button type="button" disabled={typed.trim() !== CONFIRM_WORD} onClick={() => { onResetLogs(); close(); }} className="btn btn-danger grow">削除する</button>
          </div>
        </Modal>
      )}

      <details>
        <summary className="section-title danger-text">危険な項目</summary>
        <p className="small muted mb-10">ここの操作は元に戻せません。実行前にバックアップの書き出しをおすすめします。</p>
        <button type="button" onClick={() => setConfirming(true)} disabled={logCount === 0} className="btn btn-danger block">出席記録をすべて削除（{logCount}件）</button>
      </details>
    </section>
  );
}
