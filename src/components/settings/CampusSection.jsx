import { useState } from 'react';
import Modal from '../Modal';
import { newId } from '../../data/appData';
import { fileToDataUrl } from '../../utils/image';

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

  return (
    <section className="card section">
      {confirmDelete && (
        <Modal>
          <p className="center strong">「{campus.name}」と、その建物情報・アップロード画像を削除しますか？</p>
          <div className="row gap-10 mt-20">
            <button type="button" onClick={() => setConfirmDelete(false)} className="btn btn-soft grow">キャンセル</button>
            <button type="button" onClick={deleteCampus} className="btn btn-danger grow">削除</button>
          </div>
        </Modal>
      )}

      <h3 className="section-title">キャンパス・マップ</h3>
      <div className="row gap-6 mb-10" style={{ flexWrap: 'wrap' }}>
        {campuses.map(c => (
          <button key={c.id} type="button" aria-pressed={c.id === campus?.id} onClick={() => { setSelectedId(c.id); setMessage(''); }} className={`btn btn-small ${c.id === campus?.id ? 'btn-accent' : 'btn-soft'}`}>{c.name || '(名称なし)'}</button>
        ))}
        <button type="button" onClick={addCampus} className="btn btn-small btn-soft">＋ 追加</button>
      </div>

      {!campus ? (
        <p className="small muted">キャンパスがまだありません。</p>
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

          <span className="field-label">建物・施設</span>
          {buildingList.map(b => (
            <div key={b.id} className="mb-10">
              <div className="row gap-6">
                <input className="input grow" aria-label="建物名" value={b.name} onChange={(e) => updateBuilding(b.id, { name: e.target.value })} placeholder="建物名" />
                <button type="button" onClick={() => setBuildings(buildingList.filter(x => x.id !== b.id))} className="btn btn-ghost danger-text btn-small" aria-label={`${b.name || '建物'}を削除`}>削除</button>
              </div>
              <input className="input mt-8" aria-label="説明" value={b.description} onChange={(e) => updateBuilding(b.id, { description: e.target.value })} placeholder="説明（例: 1階: 学生課）" />
            </div>
          ))}
          <button type="button" onClick={() => setBuildings([...buildingList, { id: newId('b'), name: '', description: '' }])} className="btn btn-soft block">＋ 建物を追加</button>
          <button type="button" onClick={() => setConfirmDelete(true)} className="btn btn-ghost danger-text block mt-10">このキャンパスを削除</button>
        </>
      )}
    </section>
  );
}
