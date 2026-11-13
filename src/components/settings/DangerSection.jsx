import { useState } from 'react';
import Modal from '../Modal';
import SettingsGroup from './SettingsGroup';
import { downloadBackup } from '../../utils/download';
import { useI18n } from '../../i18n';

// 取り消せない操作をまとめた項目。折りたたんでおき、実行には確認の文字入力が必要
export default function DangerSection({ logCount, onResetLogs, getBackup, campuses, buildings, onChangeData }) {
  const t = useI18n();
  const CONFIRM_WORD = t.confirmWord;
  const [pending, setPending] = useState(null); // 確認中の操作 { title, message, run }
  const [typed, setTyped] = useState('');
  const [campusId, setCampusId] = useState(null);
  const [buildingId, setBuildingId] = useState(null);

  // 削除する施設の選択（選んだものが無くなったら先頭に戻る）
  const campus = campuses.find(c => c.id === campusId) ?? campuses[0];
  const buildingList = campus ? buildings[campus.id] ?? [] : [];
  const building = buildingList.find(b => b.id === buildingId) ?? buildingList[0];
  const buildingLabel = (b) => b.name || t.untitledFacility;

  const close = () => { setPending(null); setTyped(''); };
  const confirm = () => { pending.run(); close(); };

  const deleteBuilding = () => onChangeData({ buildings: { ...buildings, [campus.id]: buildingList.filter(b => b.id !== building.id) } });

  return (
    <SettingsGroup title={t.dangerTitle} className="danger-zone">
      {pending && (
        <Modal onClose={close}>
          <h3 className="modal-title danger-text">{pending.title}</h3>
          <p className="center strong">{pending.message}<br />{t.irreversible}</p>
          <button type="button" onClick={() => downloadBackup(getBackup())} className="btn btn-soft block mt-10">{t.exportFirst}</button>
          <label className="field-label" htmlFor="danger-confirm">{t.typeToConfirm(CONFIRM_WORD)}</label>
          <input id="danger-confirm" className="input" value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" />
          <div className="row gap-10 mt-20">
            <button type="button" onClick={close} className="btn btn-soft grow">{t.cancel}</button>
            <button type="button" disabled={typed.trim() !== CONFIRM_WORD} onClick={confirm} className="btn btn-danger grow">{t.deleteIt}</button>
          </div>
        </Modal>
      )}

      <p className="small muted mb-10">{t.dangerNote}</p>

      <button
        type="button" disabled={logCount === 0} className="btn btn-danger block"
        onClick={() => setPending({ title: t.resetLogsTitle, message: t.resetLogsMessage(logCount), run: onResetLogs })}
      >{t.resetLogsButton(logCount)}</button>

      <span className="field-label mt-20">{t.deleteFacility}</span>
      {!campus || buildingList.length === 0 ? (
        <p className="small muted">{t.noFacilityToDelete}</p>
      ) : (
        <>
          <div className="row gap-6">
            <select className="input grow" aria-label={t.deleteFacilityCampus} value={campus.id} onChange={(e) => { setCampusId(e.target.value); setBuildingId(null); }}>
              {campuses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select className="input grow" aria-label={t.deleteFacilityTarget} value={building.id} onChange={(e) => setBuildingId(e.target.value)}>
              {buildingList.map(b => <option key={b.id} value={b.id}>{buildingLabel(b)}</option>)}
            </select>
          </div>
          <button
            type="button" className="btn btn-danger block mt-10"
            onClick={() => setPending({ title: t.deleteFacilityTitle, message: t.deleteFacilityMessage(campus.name, buildingLabel(building)), run: deleteBuilding })}
          >{t.deleteThisFacility}</button>
        </>
      )}
    </SettingsGroup>
  );
}
