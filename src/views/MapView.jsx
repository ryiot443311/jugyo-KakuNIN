import { useState } from 'react';
import { useI18n } from '../i18n';

export default function MapView({ campuses, buildings, campusImages }) {
  const t = useI18n();
  const [mapCampus, setMapCampus] = useState(null);
  const [failedSrc, setFailedSrc] = useState(null);
  const campus = campuses.find(c => c.id === mapCampus) ?? campuses[0];
  const mapImage = campus && (campusImages[campus.id] || campus.mapImage);

  if (!campus) return <div className="empty">{t.noCampus}</div>;

  return (
    <div className="mb-20">
      <div className="row gap-10 mb-15">
        {campuses.map(c => (
          <button key={c.id} type="button" onClick={() => setMapCampus(c.id)} className={`btn grow ${campus.id === c.id ? 'btn-accent' : 'btn-soft'}`}>{c.name}</button>
        ))}
      </div>
      {!mapImage || failedSrc === mapImage ? (
        <div className="empty small">{t.noMapImage}</div>
      ) : (
        <div className="card section">
          <img src={mapImage} alt={t.mapAlt} onError={() => setFailedSrc(mapImage)} className="map-img" />
        </div>
      )}
      {buildings[campus.id]?.map(b => (
        <div key={b.id} className="card building">
          <div className="strong accent mb-6">{b.name}</div>
          <div className="small muted">{b.description}</div>
        </div>
      ))}
    </div>
  );
}
