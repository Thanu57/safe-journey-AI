import { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Circle, MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useApp } from '../context/AppContext.jsx';
import { clock, timeAgo } from '../utils/time.js';
import { directionsUrl, formatDistance, haversine } from '../utils/geo.js';

export const HAZARD_STYLE = {
  flood: { color: '#1d6fb8', glyph: '≈' },
  river_flood: { color: '#1d6fb8', glyph: '≈' },
  coastal_surge: { color: '#0e8a8a', glyph: '≈' },
  road_closure: { color: '#c77700', glyph: '✕' },
  cyclone_zone: { color: '#c8372d', glyph: '◎', dashArray: '9 8' },
  unverified_claim: { color: '#6b7280', glyph: '?', dashArray: '4 7' },
};

const pin = (cls, glyph, color) =>
  L.divIcon({
    className: 'pin-wrap',
    html: `<div class="pin ${cls}" style="${color ? `--pin:${color}` : ''}"><span>${glyph}</span></div>`,
    iconSize: [30, 30], iconAnchor: [15, 15], popupAnchor: [0, -15],
  });
const ICONS = {};
const hazardIcon = (type) => (ICONS[type] ||= pin('hz', HAZARD_STYLE[type].glyph, HAZARD_STYLE[type].color));
const shelterIcon = (open) => (ICONS[open ? 'so' : 'su'] ||= pin(open ? 'shelter open' : 'shelter', '⌂'));
const meIcon = L.divIcon({ className: 'pin-wrap', html: '<div class="me"></div>', iconSize: [20, 20], iconAnchor: [10, 10] });
const startIcon = L.divIcon({ className: 'pin-wrap', html: '<div class="pin" style="background:#059669; border-color:#fff; color:#fff;"><span>▲</span></div>', iconSize: [30, 30], iconAnchor: [15, 15], popupAnchor: [0, -15] });
const destIcon = (hasHazard) => L.divIcon({ className: 'pin-wrap', html: `<div class="pin" style="background:${hasHazard ? '#e11d48' : '#2563eb'}; border-color:#fff; color:#fff;"><span>${hasHazard ? '⚠' : '★'}</span></div>`, iconSize: [32, 32], iconAnchor: [16, 16], popupAnchor: [0, -16] });

function Controller({ target }) {
  const map = useMap();
  useEffect(() => {
    if (!target) return;
    if (target.bounds) map.fitBounds(target.bounds, { padding: [30, 30], maxZoom: 15 });
    else map.flyTo(target.center, target.zoom, { duration: 0.6 });
  }, [map, target]);
  return null;
}

export function closestShelters(h, shelters, n = 2) {
  return shelters
    .map((s) => ({ ...s, d: haversine(h.lat, h.lng, s.lat, s.lng) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, n);
}

/** Description, source, time and related shelters for one hazard. Used in the popup and the side panel. */
export function HazardDetail({ hazard, alerts, shelters, compact = false }) {
  const { t, lang, userLoc } = useApp();
  const alert = alerts.find((a) => a.id === hazard.alert_id);
  const tr = alert && (alert.translations[lang] || alert.translations.en);
  return (
    <div className="hz-detail">
      <strong>{hazard.name}</strong>
      <div><span className={`pill ${hazard.status === 'unverified' ? 'neutral' : 'bad'}`}>{t(`hz.${hazard.status}`)}</span></div>
      <p>{hazard.description}</p>
      <dl className="facts">
        <div><dt>{t('common.source')}</dt><dd>{hazard.source_name}</dd></div>
        <div><dt>{t('map.observed')}</dt><dd>{clock(hazard.observed_at, lang)} ({timeAgo(hazard.observed_at, lang)})</dd></div>
      </dl>
      {alert && !compact && <p><Link to={`/safety/${alert.id}`} lang={lang}>{t('map.openAlert')}: {tr.title}</Link></p>}
      <div className="muted"><strong>{t('map.closest')}</strong></div>
      <ul className="plainlist">
        {closestShelters(hazard, shelters).map((s) => (
          <li key={s.id}>
            {s.name} ({formatDistance(s.d)}){' '}
            <span className={`pill ${s.availability === 'confirmed_open' ? 'ok' : 'neutral'}`}>{s.availability === 'confirmed_open' ? t('status.active') : t('loc.unconfirmed')}</span>{' '}
            <a href={directionsUrl(userLoc, s)} target="_blank" rel="noreferrer">{t('loc.directions')}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function CrisisMap({ layers, selectedId, onSelect, alertFilter }) {
  const { bundle, userLoc, activeRoute, t, lang } = useApp();
  const { hazards, shelters, alerts, scenario } = bundle;

  const visible = hazards.filter((h) => {
    if (h.status === 'unverified') return layers.unverified;
    if (h.type === 'cyclone_zone') return layers.projected;
    return layers.hazards;
  });

  const target = useMemo(() => {
    if (activeRoute?.waypoints?.length) {
      return { bounds: L.latLngBounds(activeRoute.waypoints), key: activeRoute.destination?.id || 'route' };
    }
    if (selectedId) {
      const h = hazards.find((x) => x.id === selectedId);
      if (h) return { bounds: L.circle([h.lat, h.lng], { radius: h.radius_m * 1.6 }).getBounds(), key: selectedId };
    }
    if (alertFilter) {
      const hs = hazards.filter((h) => h.alert_id === alertFilter);
      if (hs.length) return { bounds: L.latLngBounds(hs.map((h) => [h.lat, h.lng])), key: alertFilter };
    }
    return null;
  }, [selectedId, alertFilter, hazards, activeRoute]);

  return (
    <MapContainer center={scenario.map_center} zoom={scenario.map_zoom} scrollWheelZoom className="map" aria-label={t('map.title')}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />
      <Controller target={target} />

      {/* Active Travel Route Way */}
      {activeRoute?.waypoints?.length > 0 && (
        <>
          <Polyline
            positions={activeRoute.waypoints}
            pathOptions={{
              color: activeRoute.hasHazard ? '#e11d48' : '#2563eb',
              weight: 6,
              opacity: 0.9,
              lineCap: 'round',
              lineJoin: 'round',
            }}
          />
          <Polyline
            positions={activeRoute.waypoints}
            pathOptions={{
              color: '#ffffff',
              weight: 2,
              opacity: 0.95,
              dashArray: '6, 8',
            }}
          />
          {activeRoute.start && (
            <Marker position={[activeRoute.start.lat, activeRoute.start.lng]} icon={startIcon}>
              <Popup>
                <strong>Start: {activeRoute.start.label || 'Your Location'}</strong>
                <p className="muted small-note">Route start point</p>
              </Popup>
            </Marker>
          )}
          {activeRoute.destination && (
            <Marker position={[activeRoute.destination.lat, activeRoute.destination.lng]} icon={destIcon(activeRoute.hasHazard)}>
              <Popup>
                <strong>Destination: {activeRoute.destination.name}</strong>
                <p>
                  <span className={`pill ${activeRoute.hasHazard ? 'bad' : 'ok'}`}>
                    {activeRoute.hasHazard ? '⚠️ Problem Detected' : '✅ Route Clear'}
                  </span>
                </p>
                <div className="muted small-note">{activeRoute.distanceKm} km · ~{activeRoute.durationMin} mins</div>
                {activeRoute.hazard && (
                  <p style={{ marginTop: '6px' }}><strong>Problem:</strong> {activeRoute.hazard.name}</p>
                )}
                {activeRoute.destination.detourAdvice && (
                  <p style={{ marginTop: '4px' }}><strong>Detour Advice:</strong> {activeRoute.destination.detourAdvice}</p>
                )}
              </Popup>
            </Marker>
          )}
        </>
      )}

      {visible.map((h) => {
        const st = HAZARD_STYLE[h.type] || HAZARD_STYLE.flood;
        const dim = alertFilter && h.alert_id !== alertFilter;
        const sel = h.id === selectedId;
        return (
          <Circle
            key={h.id}
            center={[h.lat, h.lng]}
            radius={h.radius_m}
            pathOptions={{ color: st.color, weight: sel ? 4 : 2, dashArray: st.dashArray, fillOpacity: dim ? 0.03 : h.type === 'cyclone_zone' ? 0.07 : 0.2, opacity: dim ? 0.3 : 1 }}
            eventHandlers={{ click: () => onSelect(h.id) }}
          />
        );
      })}
      {visible.map((h) => (
        <Marker key={`m-${h.id}`} position={[h.lat, h.lng]} icon={hazardIcon(h.type)} opacity={alertFilter && h.alert_id !== alertFilter ? 0.35 : 1} eventHandlers={{ click: () => onSelect(h.id) }}>
          <Popup maxWidth={300}><HazardDetail compact hazard={h} alerts={alerts} shelters={shelters} /></Popup>
        </Marker>
      ))}

      {layers.shelters && shelters.map((s) => (
        <Marker key={s.id} position={[s.lat, s.lng]} icon={shelterIcon(s.availability === 'confirmed_open')}>
          <Popup>
            <strong>{s.name}</strong>
            <div className="muted">{s.address}</div>
            <p>
              <span className={`pill ${s.availability === 'confirmed_open' ? 'ok' : 'neutral'}`}>
                {s.availability === 'confirmed_open' ? t('loc.confirmed', { time: clock(s.verified_at, lang) }) : t('loc.unconfirmed')}
              </span>
            </p>
            <div className="muted">{t('common.source')}: {s.source_name}</div>
            {s.accessibility.notes && <div className="muted">{s.accessibility.notes}</div>}
            <p><a href={directionsUrl(userLoc, s)} target="_blank" rel="noreferrer">{t('loc.directions')}</a></p>
          </Popup>
        </Marker>
      ))}

      {userLoc && <Marker position={[userLoc.lat, userLoc.lng]} icon={meIcon}><Popup>{t('map.me')}{userLoc.label ? `: ${userLoc.label}` : ''}</Popup></Marker>}
    </MapContainer>
  );
}
