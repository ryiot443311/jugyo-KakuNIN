import { useState } from 'react';
import Modal from '../Modal';
import SettingsGroup from './SettingsGroup';
import { newId } from '../../data/appData';
import { fileToDataUrl } from '../../utils/image';

// 「マップ」と「施設の説明」の2項目。どちらも同じキャンパスを選んで編集する
export default function CampusSection({ campuses, buildings, images, onChangeData, onChangeImages }) {
  const [selectedId, setSelectedId] = useState(null);
  const [message, setMessage] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const campus = campuses.find(c => c.id === selectedId) ?? campuses[0];
  const buildingList = campus ? buildings[campus.id] ?? [] : [];

  const addCampus = () => {
    const id = newId('campus');
    onChangeData({ campuses: [...campuses, { id, name: '新しいキャンパス', mapImage: null }], buildings: { ...buildings, [id]: [] } });
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
      onChangeImages({ ...images, [campus.id]: await fileToDataUrl(file) });
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
        <button key={c.id} type="button" aria-pressed={c.id === campus?.id} onClick={() => { setSelectedId(c.id); setMessage(''); }} className={`btn btn-small ${c.id === campus?.id ? 'btn-accent' : 'btn-soft'}`}>{c.name || '(名称なし)'}</button>
      ))}
    </div>
  );

  return (
    <>
      <SettingsGroup title="マップ">
        {confirmDelete && (
          <Modal>
            <p className="center strong">「{campus.name}」と、その施設の説明・アップロード画像を削除しますか？</p>
            <div className="row gap-10 mt-20">
              <button type="button" onClick={() => setConfirmDelete(false)} className="btn btn-soft grow">キャンセル</button>
              <button type="button" onClick={deleteCampus} className="btn btn-danger grow">削除</button>
            </div>
          </Modal>
        )}

        {campusTabs}
        <button type="button" onClick={addCampus} className="btn btn-soft btn-small">＋ キャンパスを追加</button>

        {!campus ? (
          <p className="small muted mt-10">キャンパスがまだありません。</p>
        ) : (
          <>
            <label className="field-label" htmlFor="campus-name">キャンパス名</label>
            <input id="campus-name" className="input" value={campus.name} onChange={(e) => renameCampus(e.target.value)} />

            <span className="field-label">マップ画像</span>
            <div className="row gap-6 align-center" style={{ flexWrap: 'wrap' }}>
              <label className="btn btn-soft btn-small row align-center">
                画像を選ぶ
                <input type="file" accept="image/*" onChange={uploadImage} hidden />
              </label>
              {images[campus.id] && <button type="button" onClick={removeImage} className="btn btn-ghost danger-text btn-small">画像を削除</button>}
              <span className="tiny muted">{images[campus.id] ? 'アップロード済み' : campus.mapImage ? `既定: ${campus.mapImage}` : '未設定'}</span>
            </div>
            {message && <p className="small danger-text mt-8" role="alert">{message}</p>}
            <button type="button" onClick={() => setConfirmDelete(true)} className="btn btn-ghost danger-text block mt-10">このキャンパスを削除</button>
          </>
        )}
      </SettingsGroup>

      <SettingsGroup title="施設の説明">
        {!campus ? (
          <p className="small muted">先に「マップ」でキャンパスを追加してください。</p>
        ) : (
          <>
            {campusTabs}
            {buildingList.length === 0 && <p className="small muted mb-10">施設がまだありません。</p>}
            {buildingList.map(b => (
              <div key={b.id} className="mb-10">
                <div className="row gap-6">
                  <input className="input grow" aria-label="施設名" value={b.name} onChange={(e) => updateBuilding(b.id, { name: e.target.value })} placeholder="施設名（例: 3号館）" />
                  <button type="button" onClick={() => setBuildings(buildingList.filter(x => x.id !== b.id))} className="btn btn-ghost danger-text btn-small" aria-label={`${b.name || '施設'}を削除`}>削除</button>
                </div>
                <input className="input mt-8" aria-label="説明" value={b.description} onChange={(e) => updateBuilding(b.id, { description: e.target.value })} placeholder="説明（例: 1階: 学生課）" />
              </div>
            ))}
            <button type="button" onClick={() => setBuildings([...buildingList, { id: newId('b'), name: '', description: '' }])} className="btn btn-accent block">＋ 施設を追加</button>
          </>
        )}
      </SettingsGroup>
    </>
  );
}
