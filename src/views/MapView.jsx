import { useState } from 'react';
import { CAMPUSES, CAMPUS_BUILDINGS } from '../data/constants';

export default function MapView() {
  const [mapCampus, setMapCampus] = useState(CAMPUSES[0]?.id);
  const [mapImgError, setMapImgError] = useState(false);
  const mapImage = CAMPUSES.find(c => c.id === mapCampus)?.mapImage;

  return (
    <div className="mb-20">
      <div className="row gap-10 mb-15">
        {CAMPUSES.map(c => (
          <button key={c.id} type="button" onClick={() => { setMapCampus(c.id); setMapImgError(false); }} className={`btn grow ${mapCampus === c.id ? 'btn-accent' : 'btn-soft'}`}>{c.name}</button>
        ))}
      </div>
      {!mapImage || mapImgError ? (
        <div className="empty small">マップ画像がありません（public/ に画像を配置してください）</div>
      ) : (
        <div className="card section">
          <img src={mapImage} alt="マップ" onError={() => setMapImgError(true)} className="map-img" />
        </div>
      )}
      {CAMPUS_BUILDINGS[mapCampus]?.map(b => (
        <div key={b.id} className="card building">
          <div className="strong accent mb-6">{b.name}</div>
          <div className="small muted">{b.description}</div>
        </div>
      ))}
    </div>
  );
}
