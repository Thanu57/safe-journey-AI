// Mirrors backend/app/services/risk.py so the app still works when the API is unreachable.
export function haversine(lat1, lng1, lat2, lng2) {
  const r = 6371000;
  const rad = (d) => (d * Math.PI) / 180;
  const dphi = rad(lat2 - lat1);
  const dl = rad(lng2 - lng1);
  const a = Math.sin(dphi / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dl / 2) ** 2;
  return 2 * r * Math.asin(Math.sqrt(a));
}

const DANGER_TYPES = ['flood', 'river_flood', 'coastal_surge'];
const NEAR_BUFFER = 1500;

export function computeRiskLocal(lat, lng, hazards, shelters) {
  let level = 'watch';
  const nearby = [];
  for (const h of hazards) {
    const d = haversine(lat, lng, h.lat, h.lng);
    const inside = d <= h.radius_m;
    if (d > h.radius_m + NEAR_BUFFER) continue;
    nearby.push({ id: h.id, name: h.name, type: h.type, status: h.status, inside, distance_m: inside ? 0 : Math.round(d - h.radius_m) });
    if (h.status === 'unverified') continue;
    if (DANGER_TYPES.includes(h.type)) {
      if (inside) level = 'danger';
      else if (level === 'watch') level = 'caution';
    } else if (level === 'watch' && (inside || h.type === 'road_closure')) level = 'caution';
  }
  nearby.sort((a, b) => Number(b.inside) - Number(a.inside) || a.distance_m - b.distance_m);
  const verified = hazards.filter((h) => h.status !== 'unverified');
  const ranked = shelters.map((s) => {
    const d = haversine(lat, lng, s.lat, s.lng);
    const inHz = verified.some((h) => DANGER_TYPES.includes(h.type) && haversine(s.lat, s.lng, h.lat, h.lng) <= h.radius_m);
    return { id: s.id, name: s.name, distance_m: Math.round(d), walk_minutes: Math.max(1, Math.round((d * 1.3) / 80)), availability: s.availability, inside_hazard: inHz };
  });
  ranked.sort((a, b) => Number(a.inside_hazard) - Number(b.inside_hazard) || a.distance_m - b.distance_m);
  const advice = {
    danger: ['move_higher', 'avoid_floodwater', 'avoid_beach', 'call_112'],
    caution: ['avoid_travel', 'avoid_floodwater', 'follow_authorities'],
    watch: ['stay_indoors', 'charge_phone', 'follow_authorities'],
  }[level];
  return { level, lat, lng, hazards: nearby.slice(0, 6), shelters: ranked.slice(0, 3), advice_phrase_ids: advice };
}

export function formatDistance(m) {
  return m < 1000 ? `${Math.max(10, Math.round(m / 10) * 10)} m` : `${(m / 1000).toFixed(1)} km`;
}

export function directionsUrl(from, to) {
  if (from) return `https://www.openstreetmap.org/directions?engine=fossgis_osrm_foot&route=${from.lat}%2C${from.lng}%3B${to.lat}%2C${to.lng}`;
  return `https://www.openstreetmap.org/?mlat=${to.lat}&mlon=${to.lng}#map=17/${to.lat}/${to.lng}`;
}

export function generateTravelRoute(from, dest, hazards = [], shelters = []) {
  if (!dest) return null;
  let start = from;
  if (!start || (start.lat === dest.lat && start.lng === dest.lng)) {
    const isBlr = dest.lng < 79.0;
    start = isBlr
      ? { lat: 12.9756, lng: 77.6066, label: 'MG Road, Central Bengaluru' }
      : { lat: 13.0827, lng: 80.2756, label: 'Chennai Central Hub' };
  }

  const directDistM = haversine(start.lat, start.lng, dest.lat, dest.lng);
  const roadDistKm = Number(((directDistM / 1000) * 1.25).toFixed(1));
  const estMin = Math.max(6, Math.round((roadDistKm / 28) * 60));

  const numSteps = 7;
  const waypoints = [];
  for (let i = 0; i <= numSteps; i++) {
    const t = i / numSteps;
    const lat = start.lat + (dest.lat - start.lat) * t;
    const lng = start.lng + (dest.lng - start.lng) * t;
    const offset = Math.sin(t * Math.PI) * (roadDistKm > 50 ? 0.05 : 0.0035);
    waypoints.push([+(lat + offset).toFixed(5), +(lng - offset * 0.4).toFixed(5)]);
  }

  let matchedHazard = null;
  for (const h of hazards) {
    const distToDest = haversine(dest.lat, dest.lng, h.lat, h.lng);
    if (distToDest <= h.radius_m + 800) {
      matchedHazard = { ...h, distToDest: Math.round(distToDest) };
      break;
    }
  }

  if (!matchedHazard) {
    for (const [wLat, wLng] of waypoints) {
      for (const h of hazards) {
        const d = haversine(wLat, wLng, h.lat, h.lng);
        if (d <= h.radius_m + 500) {
          matchedHazard = { ...h, distToDest: Math.round(d) };
          break;
        }
      }
      if (matchedHazard) break;
    }
  }

  const nearbyShelters = shelters
    .map((s) => ({ ...s, distM: Math.round(haversine(dest.lat, dest.lng, s.lat, s.lng)) }))
    .sort((a, b) => a.distM - b.distM)
    .slice(0, 2);

  return {
    start,
    destination: dest,
    waypoints,
    distanceKm: roadDistKm,
    durationMin: estMin,
    hasHazard: Boolean(matchedHazard),
    hazard: matchedHazard,
    nearbyShelters,
  };
}
