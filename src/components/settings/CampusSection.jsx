import { useState } from 'react';
import Modal from '../Modal';
import SettingsGroup from './SettingsGroup';
import { newId } from '../../data/appData';
import { fileToDataUrl } from '../../utils/image';
import { useI18n } from '../../i18n';

// 「マップ」と「施設の説明」の2項目。どちらも同じキャンパスを選んで編集する
export default function CampusSection({ campuses, buildings, images, onChangeData, onChangeImages }) {
  const t = useI18n();
  const [selectedId, setSelectedId] = useState(null);
  const [message, setMessage] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const campus = campuses.find(c => c.id === selectedId) ?? campuses[0];
  const buildingList = campus ? buildings[campus.id] ?? [] : [];

  const addCampus = () => {
    const id = newId('campus');
    onChangeData({ campuses: [...campuses, { id, name: t.newCampus, mapImage: null }], buildings: { ...buildings, [id]: [] } });
    setSelectedId(id); setMessage('');
  };
  const renameCampus = (name) => onChangeData({ campuses: campuses.map(c => (c.id === campus.id ? { ...c, name } : c)) });
  const deleteCampus = () => {
    const { [campus.id]: _b, ...restBuildings } = buildings; // eslint-disable-line no-unused-vars
    const { [campus.id]: _i, ...restImages } = images; // eslint-disable-line no-unused-vars
    onChangeData({ campuses: campuses.filter(c => c.id !== campus.id), buildings: restBuildings });
    onChangeImages(restImages);
    setSelectedId(null); setConfirmDelete(false); setMessage('');
  };

  const uploadImage = async (e) => {
    const input = e.target; const file = input.files[0];
    if (!file) return;
    try {
      onChangeImages({ ...images, [campus.id]: await fileToDataUrl(file, t) });
      setMessage('');
    } catch (err) {
      setMessage(err.message);
    }
    input.value = ''; // 同じファイルをもう一度選べるようにする
  };
  const removeImage = () => {
    const { [campus.id]: _removed, ...rest } = images; // eslint-disable-line no-unused-vars
    onChangeImages(rest);
  };

  const setBuildings = (list) => onChangeData({ buildings: { ...buildings, [campus.id]: list } });
  const updateBuilding = (id, patch) => setBuildings(buildingList.map(b => (b.id === id ? { ...b, ...patch } : b)));

  const campusTabs = (
    <div className="row gap-6 mb-10" style={{ flexWrap: 'wrap' }}>
      {campuses.map(c => (
        <button key={c.id} type="button" aria-pressed={c.id === campus?.id} onClick={() => { setSelectedId(c.id); setMessage(''); }} className={`btn btn-small ${c.id === campus?.id ? 'btn-accent' : 'btn-soft'}`}>{c.name || t.untitled}</button>
      ))}
    </div>
  );

  return (
    <>
      <SettingsGroup title={t.map}>
        {confirmDelete && (
          <Modal onClose={() => setConfirmDelete(false)}>
            <p className="center strong">{t.deleteCampusConfirm(campus.name)}</p>
            <div className="row gap-10 mt-20">
              <button type="button" onClick={() => setConfirmDelete(false)} className="btn btn-soft grow">{t.cancel}</button>
              <button type="button" onClick={deleteCampus} className="btn btn-danger grow">{t.delete}</button>
            </div>
          </Modal>
        )}

        {campusTabs}
        <button type="button" onClick={addCampus} className="btn btn-soft btn-small">{t.addCampus}</button>

        {!campus ? (
          <p className="small muted mt-10">{t.noCampusYet}</p>
        ) : (
          <>
            <label className="field-label" htmlFor="campus-name">{t.campusName}</label>
            <input id="campus-name" className="input" value={campus.name} onChange={(e) => renameCampus(e.target.value)} />

            <span className="field-label">{t.mapImage}</span>
            <div className="row gap-6 align-center" style={{ flexWrap: 'wrap' }}>
              <label className="btn btn-soft btn-small row align-center">
                {t.chooseImage}
                <input type="file" accept="image/*" onChange={uploadImage} hidden />
              </label>
              {images[campus.id] && <button type="button" onClick={removeImage} className="btn btn-ghost danger-text btn-small">{t.deleteImage}</button>}
              <span className="tiny muted">{images[campus.id] ? t.uploaded : campus.mapImage ? t.defaultImage(campus.mapImage) : t.notSet}</span>
            </div>
            {message && <p className="small danger-text mt-8" role="alert">{message}</p>}
            <button type="button" onClick={() => setConfirmDelete(true)} className="btn btn-ghost danger-text block mt-10">{t.deleteThisCampus}</button>
          </>
        )}
      </SettingsGroup>

      <SettingsGroup title={t.facilities}>
        {!campus ? (
          <p className="small muted">{t.addCampusFirst}</p>
        ) : (
          <>
            {campusTabs}
            {buildingList.length === 0 && <p className="small muted mb-10">{t.noFacilities}</p>}
            {buildingList.length > 0 && <p className="tiny muted mb-10">{t.facilityDeleteNote}</p>}
            {buildingList.map(b => (
              <div key={b.id} className="mb-10">
                <input className="input" aria-label={t.facilityName} value={b.name} onChange={(e) => updateBuilding(b.id, { name: e.target.value })} placeholder={t.facilityNamePlaceholder} />
                <input className="input mt-8" aria-label={t.description} value={b.description} onChange={(e) => updateBuilding(b.id, { description: e.target.value })} placeholder={t.descriptionPlaceholder} />
              </div>
            ))}
            <button type="button" onClick={() => setBuildings([...buildingList, { id: newId('b'), name: '', description: '' }])} className="btn btn-accent block">{t.addFacility}</button>
          </>
        )}
      </SettingsGroup>
    </>
  );
}
