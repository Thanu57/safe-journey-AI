import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import CrisisMap, { HAZARD_STYLE, HazardDetail } from '../components/CrisisMap.jsx';
import MyLocationPanel from '../components/MyLocationPanel.jsx';
import { POPULAR_DESTINATIONS } from '../components/TravelRouteFinder.jsx';
import { generateTravelRoute } from '../utils/geo.js';

export default function CrisisMapPage() {
  const { t, lang, bundle, userLoc, activeRoute, setActiveRoute } = useApp();
  const [params, setParams] = useSearchParams();
  const [layers, setLayers] = useState({ hazards: true, projected: true, shelters: true, unverified: true });
  const [selectedId, setSelectedId] = useState(null);
  const alertFilter = params.get('alert');
  const destFilter = params.get('dest');
  const filterAlert = bundle.alerts.find((a) => a.id === alertFilter);
  const selected = bundle.hazards.find((h) => h.id === selectedId);
  const toggle = (k) => setLayers((l) => ({ ...l, [k]: !l[k] }));

  // Automatically activate route when dest param is present in URL
  useEffect(() => {
    if (destFilter) {
      const match = POPULAR_DESTINATIONS.find((p) => p.id === destFilter);
      if (match) {
        const route = generateTravelRoute(userLoc, match, bundle.hazards, bundle.shelters);
        setActiveRoute(route);
      }
    }
  }, [destFilter, userLoc, bundle, setActiveRoute]);

  const legend = [
    ['flood', 'map.l.flood'], ['coastal_surge', 'map.l.coastal_surge'], ['road_closure', 'map.l.road_closure'],
    ['cyclone_zone', 'map.l.cyclone_zone'], ['unverified_claim', 'map.l.unverified_claim'],
  ];

  return (
    <div className="page wide">
      <h1 className="sr">{t('map.title')}</h1>
      {filterAlert && (
        <div className="filterbar">
          <span lang={lang}>{t('map.filtered', { title: (filterAlert.translations[lang] || filterAlert.translations.en).title })}</span>
          <button className="btn small" onClick={() => { setParams({}); setSelectedId(null); }}>{t('map.showAll')}</button>
        </div>
      )}
      <div className="maplayout">
        <div className="mapbox">
          <CrisisMap layers={layers} selectedId={selectedId} onSelect={setSelectedId} alertFilter={alertFilter} />
        </div>
        <div className="mapside">
          {/* Active Travel Route Way Card */}
          {activeRoute && (
            <section className="card active-route-card" aria-label="Active Travel Route">
              <div className="row between">
                <span className="pill ok">Active Route Way</span>
                <button
                  className="btn small"
                  onClick={() => {
                    setActiveRoute(null);
                    if (destFilter) {
                      params.delete('dest');
                      setParams(params);
                    }
                  }}
                >
                  ✕ Clear Route
                </button>
              </div>
              <h3 style={{ marginTop: '0.4rem', marginBottom: '0.2rem' }}>
                📍 {activeRoute.destination?.name}
              </h3>
              <p className="muted small-note">
                From: <strong>{activeRoute.start?.label || 'Your Location'}</strong> · {activeRoute.distanceKm} km · ~{activeRoute.durationMin} mins
              </p>
              <div style={{ margin: '0.4rem 0' }}>
                <span className={`pill ${activeRoute.hasHazard ? 'bad' : 'ok'}`}>
                  {activeRoute.hasHazard ? '⚠️ Hazard On Route / Place' : '✅ Route Way Clear'}
                </span>
              </div>
              <p className="small-note">
                <strong>Recommended Road:</strong> {activeRoute.destination?.recommendedRoute}
              </p>
              {activeRoute.hazard && (
                <div className="hazard-route-alert">
                  <strong>🚨 Problem Present:</strong> {activeRoute.hazard.name}
                  <p className="small-note" style={{ margin: '0.2rem 0' }}>{activeRoute.hazard.description}</p>
                </div>
              )}
              {activeRoute.destination?.detourAdvice && (
                <p className="small-note">
                  <strong>💡 Detour Solution:</strong> {activeRoute.destination.detourAdvice}
                </p>
              )}
            </section>
          )}

          <section className="card">
            <h3>{t('map.layers')}</h3>
            <div className="layers">
              {[['hazards', 'map.hazards'], ['projected', 'map.projected'], ['shelters', 'map.shelters'], ['unverified', 'map.unverified']].map(([k, label]) => (
                <label key={k}><input type="checkbox" checked={layers[k]} onChange={() => toggle(k)} /> {t(label)}</label>
              ))}
            </div>
            <h4>{t('map.legend')}</h4>
            <ul className="legend">
              {legend.map(([type, key]) => (
                <li key={type}><span className="swatch" style={{ borderColor: HAZARD_STYLE[type].color, borderStyle: HAZARD_STYLE[type].dashArray ? 'dashed' : 'solid' }} />{t(key)}</li>
              ))}
              <li><span className="pin mini shelter open"><span>⌂</span></span>{t('map.l.shelter')}</li>
              <li><span className="pin mini shelter"><span>⌂</span></span>{t('map.l.shelter2')}</li>
            </ul>
          </section>

          <section className="card">
            {selected ? (
              <>
                <HazardDetail hazard={selected} alerts={bundle.alerts} shelters={bundle.shelters} />
                <button className="btn small" onClick={() => setSelectedId(null)}>{t('common.close')}</button>
              </>
            ) : <p className="muted">{t('map.pickHint')}</p>}
          </section>

          <MyLocationPanel />
          <p className="muted small-note"><Link to="/">{t('nav.dashboard')}</Link></p>
        </div>
      </div>
    </div>
  );
}
