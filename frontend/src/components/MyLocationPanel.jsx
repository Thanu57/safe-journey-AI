import { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import ShelterRow from './ShelterRow.jsx';
import { formatDistance } from '../utils/geo.js';

export default function MyLocationPanel({ compact = false }) {
  const { t, lang, bundle, userLoc, setUserLoc, risk } = useApp();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const useGps = () => {
    setErr('');
    if (!navigator.geolocation) { setErr(t('loc.denied')); return; }
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      (p) => { setUserLoc({ lat: +p.coords.latitude.toFixed(5), lng: +p.coords.longitude.toFixed(5), label: 'GPS', kind: 'gps' }); setBusy(false); },
      () => { setErr(t('loc.denied')); setBusy(false); },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  const pick = (e) => {
    const loc = bundle.scenario.demo_locations.find((l) => l.id === e.target.value);
    if (loc) setUserLoc({ lat: loc.lat, lng: loc.lng, label: loc.name, kind: 'demo', id: loc.id });
    else setUserLoc(null);
  };

  const phrases = risk ? risk.advice_phrase_ids.map((id) => bundle.phrasebook[id]?.[lang] || bundle.phrasebook[id]?.en).filter(Boolean) : [];

  return (
    <section className={`card loc ${risk ? `risk-${risk.level}` : ''}`} aria-live="polite">
      <h3>{t('loc.title')}</h3>
      <div className="row wrap gap">
        <button className="btn" onClick={useGps} disabled={busy}>{busy ? t('loc.checking') : t('loc.use')}</button>
        <label className="sel">
          <span className="sr">{t('loc.pick')}</span>
          <select value={userLoc?.id || ''} onChange={pick}>
            <option value="">{t('loc.pick')}</option>
            {bundle.scenario.demo_locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        </label>
      </div>
      {err && <p className="err">{err}</p>}
      {!risk && <p className="muted">{t('loc.none')}</p>}

      {risk && (
        <>
          <p className="risk-head">{t(`loc.level.${risk.level}`)}</p>
          {userLoc?.label && <p className="muted">{userLoc.label}</p>}

          {phrases.length > 0 && (
            <>
              <h4>{t('loc.advice')}</h4>
              <ul className="plainlist" lang={lang}>{(compact ? phrases.slice(0, 2) : phrases).map((p) => <li key={p}>{p}</li>)}</ul>
            </>
          )}

          {risk.hazards.length > 0 && (
            <>
              <h4>{t('loc.near')}</h4>
              <ul className="plainlist">
                {risk.hazards.slice(0, compact ? 3 : 6).map((h) => (
                  <li key={h.id}>
                    {h.name}{' '}
                    <span className={`pill ${h.inside ? 'bad' : 'neutral'}`}>{h.inside ? t('loc.inside') : t('loc.away', { d: formatDistance(h.distance_m) })}</span>
                    {h.status === 'unverified' && <span className="pill neutral"> {t('hz.unverified')}</span>}
                  </li>
                ))}
              </ul>
            </>
          )}

          <h4>{t('loc.shelters')}</h4>
          <ul className="shelters">{risk.shelters.slice(0, compact ? 2 : 3).map((s) => <ShelterRow key={s.id} near={s} />)}</ul>
          <p className="muted small-note">{t('loc.disclaimer')}</p>
        </>
      )}
    </section>
  );
}
