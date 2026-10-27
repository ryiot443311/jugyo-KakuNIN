import { useState } from 'react';
import Modal from '../Modal';
import SettingsGroup from './SettingsGroup';
import { downloadBackup } from '../../utils/download';

const CONFIRM_WORD = '削除';

// 取り消せない操作をまとめた項目。折りたたんでおき、実行には確認の文字入力が必要
export default function DangerSection({ logCount, onResetLogs, getBackup, campuses, buildings, onChangeData }) {
  const [pending, setPending] = useState(null); // 確認中の操作 { title, message, run }
  const [typed, setTyped] = useState('');
  const [campusId, setCampusId] = useState(null);
  const [buildingId, setBuildingId] = useState(null);

  // 削除する施設の選択（選んだものが無くなったら先頭に戻る）
  const campus = campuses.find(c => c.id === campusId) ?? campuses[0];
  const buildingList = campus ? buildings[campus.id] ?? [] : [];
  const building = buildingList.find(b => b.id === buildingId) ?? buildingList[0];
  const buildingLabel = (b) => b.name || '(名称なしの施設)';

  const close = () => { setPending(null); setTyped(''); };
  const confirm = () => { pending.run(); close(); };

  const deleteBuilding = () => onChangeData({ buildings: { ...buildings, [campus.id]: buildingList.filter(b => b.id !== building.id) } });

  return (
    <SettingsGroup title="危険な項目" className="danger-zone">
      {pending && (
        <Modal>
          <h3 className="modal-title danger-text">{pending.title}</h3>
          <p className="center strong">{pending.message}<br />この操作は取り消せません。</p>
          <button type="button" onClick={() => downloadBackup(getBackup())} className="btn btn-soft block mt-10">先にバックアップを書き出す</button>
          <label className="field-label" htmlFor="danger-confirm">確認のため「{CONFIRM_WORD}」と入力してください</label>
          <input id="danger-confirm" className="input" value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" />
          <div className="row gap-10 mt-20">
            <button type="button" onClick={close} className="btn btn-soft grow">キャンセル</button>
            <button type="button" disabled={typed.trim() !== CONFIRM_WORD} onClick={confirm} className="btn btn-danger grow">削除する</button>
          </div>
        </Modal>
      )}

      <p className="small muted mb-10">ここの操作は元に戻せません。実行前にバックアップの書き出しをおすすめします。</p>

      <button
        type="button" disabled={logCount === 0} className="btn btn-danger block"
        onClick={() => setPending({ title: '出席記録の全削除', message: `出席記録 ${logCount}件 をすべて削除します。`, run: onResetLogs })}
      >出席記録をすべて削除（{logCount}件）</button>

      <span className="field-label mt-20">施設を削除</span>
      {!campus || buildingList.length === 0 ? (
        <p className="small muted">削除できる施設がありません。</p>
      ) : (
        <>
          <div className="row gap-6">
            <select className="input grow" aria-label="施設を削除: キャンパス" value={campus.id} onChange={(e) => { setCampusId(e.target.value); setBuildingId(null); }}>
              {campuses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select className="input grow" aria-label="施設を削除: 施設" value={building.id} onChange={(e) => setBuildingId(e.target.value)}>
              {buildingList.map(b => <option key={b.id} value={b.id}>{buildingLabel(b)}</option>)}
            </select>
          </div>
          <button
            type="button" className="btn btn-danger block mt-10"
            onClick={() => setPending({ title: '施設の削除', message: `「${campus.name}」の「${buildingLabel(building)}」を削除します。`, run: deleteBuilding })}
          >この施設を削除</button>
        </>
      )}
    </SettingsGroup>
  );
}
