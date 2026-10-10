import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import { directionsUrl, formatDistance, generateTravelRoute } from '../utils/geo.js';

export const POPULAR_DESTINATIONS = [
  // Bengaluru destinations
  {
    id: 'bengaluru-koramangala',
    name: 'Koramangala 80ft Road & Sony Signal',
    city: 'Bengaluru',
    lat: 12.9352,
    lng: 77.6245,
    tag: 'High Flood Risk',
    recommendedRoute: 'Via Intermediate Ring Road Flyover & Hosur Elevated Tollway (Avoids low-lying Sony World junction)',
    detourAdvice: 'Avoid 80ft Road service lanes. Take the Domlur flyover toward Intermediate Ring Road or stay on the elevated Hosur Road expressway.',
    safetyActions: [
      'Do not drive two-wheelers or hatchbacks through standing water above 6 inches.',
      'If water rises near vehicle exhaust, switch off the engine immediately and move to higher pavement.',
      'Stay away from submerged open stormwater drains (SWD) near 4th Block.',
    ],
  },
  {
    id: 'bengaluru-bellandur',
    name: 'Bellandur Outer Ring Road (Eco-Space)',
    city: 'Bengaluru',
    lat: 12.9260,
    lng: 77.6762,
    tag: 'Lake Overflow Risk',
    recommendedRoute: 'Via Central Carriageway Elevated Flyover (Do NOT use the lower Eco-Space service lanes)',
    detourAdvice: 'Stay strictly on the elevated central flyover. If heading toward Whitefield, use Old Airport Road / Varthur road alternative.',
    safetyActions: [
      'Avoid driving through lake foam or water overflow; chemical foam causes slippery road hazards.',
      'Keep vehicle windows rolled up and cabin air on recirculation.',
      'If stranded, proceed to Marathahalli Community Hall relief point.',
    ],
  },
  {
    id: 'bengaluru-majestic',
    name: 'Majestic Railway Station (KSR Bengaluru)',
    city: 'Bengaluru',
    lat: 12.9781,
    lng: 77.5695,
    tag: 'Underpass Flooded',
    recommendedRoute: 'Via Anand Rao Circle Flyover & Platform Road (Okalipuram underpass closed)',
    detourAdvice: 'Okalipuram underpass is submerged under 2 feet of water. Use Anand Rao Circle flyover and Sheshadri Road instead.',
    safetyActions: [
      'Use Namma Metro (Green/Purple line interchange at Majestic) for 100% flood-free transit.',
      'Verify train departures via 139 helpline before proceeding.',
      'Wait on upper railway platform waiting concourses if tracks are waterlogged.',
    ],
  },
  {
    id: 'bengaluru-mgroad',
    name: 'MG Road & Brigade Road',
    city: 'Bengaluru',
    lat: 12.9756,
    lng: 77.6066,
    tag: 'Safe Corridor',
    recommendedRoute: 'Via Cubbon Road & MG Road Boulevard (Elevated terrain & clear stormwater drains)',
    detourAdvice: 'Main arterial boulevard is open and clear. Purple Line Metro stations provide dry shelter.',
    safetyActions: [
      'Route is clear. Watch for minor tree branches during high winds.',
      'Follow normal traffic signals.',
    ],
  },
  {
    id: 'bengaluru-airport',
    name: 'Kempegowda Int\'l Airport (KIA), Devanahalli',
    city: 'Bengaluru',
    lat: 13.1986,
    lng: 77.7066,
    tag: 'Highway Wind Advisory',
    recommendedRoute: 'Via Hebbal Elevated Expressway & Bellary Road (NH 44)',
    detourAdvice: 'Use the main NH 44 elevated expressway. Avoid unpaved rural connecting roads.',
    safetyActions: [
      'Expect gusty crosswinds on the elevated highway; keep driving speed under 60 km/h.',
      'Check flight operational status before starting your journey.',
      'Terminal 1 and 2 waiting halls are open with 24/7 food and emergency facilities.',
    ],
  },
  {
    id: 'bengaluru-indiranagar',
    name: 'Indiranagar 100ft Road',
    city: 'Bengaluru',
    lat: 12.9784,
    lng: 77.6408,
    tag: 'Safe Corridor',
    recommendedRoute: 'Via Old Airport Road & 100ft Road (High ground & dry corridor)',
    detourAdvice: 'Corridor is clear. Elevated terrain prevents water accumulation.',
    safetyActions: ['Route clear. Normal travel precautions apply.'],
  },
  {
    id: 'bengaluru-whitefield',
    name: 'Whitefield ITPL (International Tech Park)',
    city: 'Bengaluru',
    lat: 12.9863,
    lng: 77.7308,
    tag: 'Metro Recommended',
    recommendedRoute: 'Via Namma Metro Purple Line or HAL Old Airport Road corridor',
    detourAdvice: 'Take the elevated Metro to Whitefield (Kadugodi) to bypass Hoodi junction water puddles.',
    safetyActions: ['Metro is operational and dry. Avoid lower Hoodi junction service lane.'],
  },

  // Chennai destinations
  {
    id: 'velachery',
    name: 'Guesthouse in Velachery (100ft Bypass)',
    city: 'Chennai',
    lat: 12.9815,
    lng: 80.2180,
    tag: 'Severe Flood 1.2m',
    recommendedRoute: 'Via OMR Elevated Tollway & Taramani Link Road (Velachery 100ft road submerged)',
    detourAdvice: 'Do NOT use Velachery 100ft bypass or Vijayanagar junction. Take OMR elevated expressway toward Taramani.',
    safetyActions: [
      'Do not remain in ground-floor rooms or basements; move to upper floors immediately.',
      'Elevated Velachery MRTS station provides safe high ground.',
      'Do not walk through floodwater due to power cables and submerged hazards.',
    ],
  },
  {
    id: 'marina',
    name: 'Marina Beach Promenade',
    city: 'Chennai',
    lat: 13.0500,
    lng: 80.2824,
    tag: 'Coastal Surge Closed',
    recommendedRoute: 'Kamarajar Salai closed. Detour inland via Anna Salai & Royapettah',
    detourAdvice: 'Coastal roads are barred by police barricades. Divert inland through Anna Salai.',
    safetyActions: [
      'Beach promenade is completely closed due to high wave surge.',
      'Stay at least 500 meters inland from the shoreline.',
      'Never approach the beach to take photos during a cyclone surge.',
    ],
  },
  {
    id: 'central',
    name: 'Chennai Central Railway Station',
    city: 'Chennai',
    lat: 13.0827,
    lng: 80.2756,
    tag: 'Surrounding Roads Flooded',
    recommendedRoute: 'Via Poonamallee High Road Flyover & Central Metro Subway',
    detourAdvice: 'Use the underground pedestrian subway at Central Metro to avoid flooded street crossings.',
    safetyActions: [
      'Check Southern Railway train status via 139 before leaving.',
      'Ripon Building and station passenger waiting concourse are safe dry zones.',
    ],
  },
  {
    id: 'tnagar',
    name: 'Hotel in T. Nagar (Anna Salai / Usman Rd)',
    city: 'Chennai',
    lat: 13.0418,
    lng: 80.2341,
    tag: 'Anna Salai Diversion',
    recommendedRoute: 'Via Usman Road Elevated Flyover (Avoids Teynampet waterlogged road)',
    detourAdvice: 'Take Usman Road flyover toward CIT Nagar. Avoid low-lying underpasses and Bazullah Road.',
    safetyActions: [
      'Stay inside hotel lobby or higher floors until stormwater pumps drain the area.',
      'Follow traffic police diversions.',
    ],
  },
  {
    id: 'airport',
    name: 'Chennai International Airport (Meenambakkam)',
    city: 'Chennai',
    lat: 12.9941,
    lng: 80.1709,
    tag: 'Airport Runway Delays',
    recommendedRoute: 'Via GST Road Elevated Highway or Airport Metro Direct Line',
    detourAdvice: 'Take Chennai Metro Blue Line directly into the airport terminal for dry, reliable transit.',
    safetyActions: [
      'Expect flight schedule delays due to cyclone crosswinds.',
      'Traveller Transit Hall near airport provides emergency accommodation.',
    ],
  },
  {
    id: 'mudichur',
    name: 'Mudichur Causeway (Tambaram)',
    city: 'Chennai',
    lat: 12.9000,
    lng: 80.0730,
    tag: 'Road Completely Closed',
    recommendedRoute: 'Causeway impassable. Detour via Tambaram Outer Ring Road Bypass flyover',
    detourAdvice: 'Low-level causeway is under fast-flowing water. Turn around and take the Outer Ring Road bypass.',
    safetyActions: [
      'NEVER attempt to drive through a flooded causeway.',
      'Water currents can easily wash away even heavy SUVs.',
      'Proceed to Tambaram Municipal Relief Camp.',
    ],
  },
];

export default function TravelRouteFinder() {
  const { bundle, userLoc, activeRoute, setActiveRoute, t, lang } = useApp();
  const [cityFilter, setCityFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [selectedPlaceId, setSelectedPlaceId] = useState(activeRoute?.destination?.id || null);
  const navigate = useNavigate();

  const destinations = useMemo(() => {
    return POPULAR_DESTINATIONS.filter((d) => {
      if (cityFilter !== 'all' && d.city.toLowerCase() !== cityFilter) return false;
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return (
        d.name.toLowerCase().includes(q) ||
        d.city.toLowerCase().includes(q) ||
        d.tag.toLowerCase().includes(q)
      );
    });
  }, [cityFilter, query]);

  const handleSelectPlace = (place) => {
    setSelectedPlaceId(place.id);
    const route = generateTravelRoute(userLoc, place, bundle.hazards, bundle.shelters);
    setActiveRoute(route);
  };

  const handleClearRoute = () => {
    setSelectedPlaceId(null);
    setActiveRoute(null);
  };

  const currentRoute = activeRoute;
  const currentDest = currentRoute?.destination;

  return (
    <section className="card travel-card" id="travel-route-finder" aria-label="Travel Route and Place Safety">
      <div className="travel-header">
        <div className="travel-title-wrap">
          <span className="travel-icon-badge" aria-hidden="true">🛣️</span>
          <div>
            <h3>Travel Route & Place Safety Check</h3>
            <p className="muted small-note">
              Click any place in <strong>Bengaluru</strong> or <strong>Chennai</strong> to see the route way, detect problems, and get immediate solutions.
            </p>
          </div>
        </div>
        {currentRoute && (
          <button className="btn small" onClick={handleClearRoute}>
            ✕ Clear Route
          </button>
        )}
      </div>

      {/* City Switcher & Search Bar */}
      <div className="travel-search-bar">
        <div className="city-tabs">
          <button
            className={`city-tab ${cityFilter === 'all' ? 'active' : ''}`}
            onClick={() => setCityFilter('all')}
          >
            All Places ({POPULAR_DESTINATIONS.length})
          </button>
          <button
            className={`city-tab ${cityFilter === 'bengaluru' ? 'active' : ''}`}
            onClick={() => setCityFilter('bengaluru')}
          >
            📍 Bengaluru (Bangalore)
          </button>
          <button
            className={`city-tab ${cityFilter === 'chennai' ? 'active' : ''}`}
            onClick={() => setCityFilter('chennai')}
          >
            🌊 Chennai Coast
          </button>
        </div>

        <div className="travel-input-wrap">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search place (e.g., Koramangala, MG Road, Bellandur, Velachery, Airport...)"
            aria-label="Search travel destinations"
          />
        </div>
      </div>

      {/* Destination Chips */}
      <div className="place-chips-scroll" role="list" aria-label="Popular destinations">
        {destinations.map((place) => {
          const isSelected = selectedPlaceId === place.id;
          const isRisk = place.tag.includes('Risk') || place.tag.includes('Flood') || place.tag.includes('Closed');
          return (
            <button
              key={place.id}
              role="listitem"
              className={`place-chip ${isSelected ? 'selected' : ''} ${isRisk ? 'chip-risk' : 'chip-safe'}`}
              onClick={() => handleSelectPlace(place)}
            >
              <span className="place-chip-name">{place.name}</span>
              <span className={`place-chip-tag ${isRisk ? 'risk' : 'safe'}`}>
                {isRisk ? '⚠️ ' : '✅ '}
                {place.tag}
              </span>
            </button>
          );
        })}
      </div>

      {/* Route & Problem Solution Panel */}
      {currentRoute && currentDest && (
        <div className="route-result-panel" aria-live="polite">
          {/* Route Way Header */}
          <div className="route-way-header">
            <div className="route-summary">
              <span className="route-badge-dir">Start: {currentRoute.start?.label || 'Your Location'}</span>
              <span className="route-arrow">➔</span>
              <span className="route-badge-dest">Dest: {currentDest.name}</span>
            </div>
            <div className="route-metrics">
              <span className="metric-pill">📏 <strong>{currentRoute.distanceKm} km</strong> distance</span>
              <span className="metric-pill">⏱️ <strong>~{currentRoute.durationMin} mins</strong> drive</span>
              <span className={`metric-pill status-pill ${currentRoute.hasHazard ? 'hazard-detected' : 'safe-corridor'}`}>
                {currentRoute.hasHazard ? '⚠️ Problem Detected' : '✅ Clear Route Way'}
              </span>
            </div>
          </div>

          {/* Recommended Route Way description */}
          <div className="route-way-box">
            <h4>📍 Recommended Route Way ("Root Way"):</h4>
            <p className="route-path-text">{currentDest.recommendedRoute}</p>
            <div className="route-actions-row">
              <button
                className="btn primary small"
                onClick={() => navigate(`/map?dest=${encodeURIComponent(currentDest.id)}`)}
              >
                🗺️ View Route on Crisis Map
              </button>
              <a
                className="btn small"
                href={directionsUrl(currentRoute.start, currentDest)}
                target="_blank"
                rel="noreferrer"
              >
                🧭 Open Live Navigation
              </a>
            </div>
          </div>

          {/* Problem Detected Section */}
          <div className={`problem-box ${currentRoute.hasHazard ? 'problem-alert' : 'problem-clear'}`}>
            <div className="problem-head">
              <span className="problem-icon">{currentRoute.hasHazard ? '🚨' : '🛡️'}</span>
              <div>
                <strong>
                  {currentRoute.hasHazard
                    ? `Problem Present at ${currentDest.name}`
                    : `No Critical Hazard at ${currentDest.name}`}
                </strong>
                <p className="problem-desc">
                  {currentRoute.hazard
                    ? currentRoute.hazard.description
                    : `Active hazard scans indicate no severe waterlogging or road blocks at ${currentDest.name}. Elevated corridor is operating normally.`}
                </p>
                {currentRoute.hazard && (
                  <div className="problem-meta">
                    <span className="pill bad">Severity: {currentRoute.hazard.severity}</span>
                    <span className="pill neutral">Source: {currentRoute.hazard.source_name}</span>
                    <span className="pill neutral">Radius: {currentRoute.hazard.radius_m}m</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Solution: What to do if problem occurs */}
          <div className="solution-box">
            <h4 className="solution-title">
              💡 Solution: What to do if problem occurs at this place
            </h4>

            <div className="solution-grid">
              {/* Solution 1: Detour */}
              <div className="solution-item">
                <span className="sol-icon">🔄</span>
                <div>
                  <strong>Recommended Safe Detour</strong>
                  <p>{currentDest.detourAdvice}</p>
                </div>
              </div>

              {/* Solution 2: Safety Action Checklist */}
              {currentDest.safetyActions && currentDest.safetyActions.length > 0 && (
                <div className="solution-item">
                  <span className="sol-icon">🛑</span>
                  <div>
                    <strong>Immediate Safety Steps</strong>
                    <ul className="sol-list">
                      {currentDest.safetyActions.map((action, idx) => (
                        <li key={idx}>{action}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Solution 3: Nearest Shelters */}
              {currentRoute.nearbyShelters && currentRoute.nearbyShelters.length > 0 && (
                <div className="solution-item">
                  <span className="sol-icon">🏥</span>
                  <div>
                    <strong>Nearest Emergency Shelters</strong>
                    <ul className="sol-shelters">
                      {currentRoute.nearbyShelters.map((s) => (
                        <li key={s.id}>
                          <strong>{s.name}</strong> ({formatDistance(s.distM)} away)
                          <div className="muted small-note">{s.address}</div>
                          <span className={`pill ${s.availability === 'confirmed_open' ? 'ok' : 'neutral'}`}>
                            {s.availability === 'confirmed_open' ? 'Open & Verified' : 'Unconfirmed'}
                          </span>
                          {' '}
                          <a
                            href={directionsUrl(currentDest, s)}
                            target="_blank"
                            rel="noreferrer"
                            className="linkish small-note"
                          >
                            Directions
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Solution 4: Emergency SOS Call */}
              <div className="solution-item">
                <span className="sol-icon">📞</span>
                <div>
                  <strong>Emergency SOS Contacts</strong>
                  <div className="sos-buttons-row">
                    <a className="btn alarm small" href="tel:112">
                      🚨 Call 112 (National Emergency)
                    </a>
                    {currentDest.city === 'Bengaluru' ? (
                      <a className="btn small" href="tel:1533">
                        🌊 Call 1533 (BBMP Flood Control)
                      </a>
                    ) : (
                      <a className="btn small" href="tel:1913">
                        🌊 Call 1913 (Chennai Corporation)
                      </a>
                    )}
                    <a className="btn small" href="tel:100">
                      🚓 Call 100 (Police)
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
