import { useState } from 'react';
import { CAMPUSES, CAMPUS_BUILDINGS } from '../data/constants';

export default function MapView() {
  const [mapCampus, setMapCampus] = useState(CAMPUSES[0]?.id);
  const [mapImgError, setMapImgError] = useState(false);
  const mapImage = CAMPUSES.find(c => c.id === mapCampus)?.mapImage;

  return (
    <div className="view-bottom">
      <div className="campus-tabs">
        {CAMPUSES.map(c => (
          <button key={c.id} onClick={() => { setMapCampus(c.id); setMapImgError(false); }} className={`campus-tab${mapCampus === c.id ? ' is-active' : ''}`}>{c.name}</button>
        ))}
      </div>
      {!mapImage || mapImgError ? (
        <div className="empty-state empty-state--small">マップ画像がありません（public/ に画像を配置してください）</div>
      ) : (
        <div className="map-frame">
          <img src={mapImage} alt="マップ" onError={() => setMapImgError(true)} className="map-img" />
        </div>
      )}
      <div className="building-list">
        {CAMPUS_BUILDINGS[mapCampus]?.map(b => (
          <div key={b.id} className="building-card">
            <div className="building-name">{b.name}</div>
            <div className="building-desc">{b.description}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
