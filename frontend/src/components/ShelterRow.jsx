import { useApp } from '../context/AppContext.jsx';
import { clock } from '../utils/time.js';
import { directionsUrl, formatDistance } from '../utils/geo.js';

export default function ShelterRow({ near, showWalk = true }) {
  const { t, lang, bundle, userLoc } = useApp();
  const full = bundle.shelters.find((s) => s.id === near.id);
  if (!full) return null;
  const open = full.availability === 'confirmed_open';
  return (
    <li className={`shelter ${open ? 'open' : 'unconfirmed'}`}>
      <div>
        <strong>{full.name}</strong>
        <div className="muted">{full.address}</div>
        <div className="row wrap gap tight">
          <span className={`pill ${open ? 'ok' : 'neutral'}`}>
            {open ? t('loc.confirmed', { time: clock(full.verified_at, lang) }) : t('loc.unconfirmed')}
          </span>
          {near.inside_hazard && <span className="pill bad">{t('loc.shelterRisk')}</span>}
          {full.accessibility.step_free === 'yes' && <span className="pill neutral">Step-free</span>}
          {full.accessibility.medical_desk && <span className="pill neutral">Medical desk</span>}
        </div>
      </div>
      <div className="shelter-side">
        <div>{formatDistance(near.distance_m)}</div>
        {showWalk && <div className="muted">{t('loc.walk', { n: near.walk_minutes })}</div>}
        <a className="linkish" href={directionsUrl(userLoc, full)} target="_blank" rel="noreferrer">{t('loc.directions')}</a>
      </div>
    </li>
  );
}
