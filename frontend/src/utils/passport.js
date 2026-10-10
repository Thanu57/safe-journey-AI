import { haversine } from './geo.js';

const KEY = 'sj.passport';

export function buildPassport(bundle, lang, userLoc) {
  const origin = userLoc || { lat: bundle.scenario.map_center[0], lng: bundle.scenario.map_center[1] };
  const official = bundle.alerts.filter((a) => a.status === 'active' && a.source_kind !== 'social_media');
  const claims = bundle.alerts.filter((a) => a.source_kind === 'social_media');
  const titleOf = (id) => bundle.alerts.find((a) => a.id === id)?.translations[lang]?.title || '';
  return {
    version: 1,
    savedAt: new Date().toISOString(),
    dataGeneratedAt: bundle.generated_at,
    lang,
    simulated: bundle.scenario.is_simulated,
    scenarioName: bundle.scenario.name,
    location: userLoc ? { lat: userLoc.lat, lng: userLoc.lng, label: userLoc.label } : null,
    alerts: official.map((a) => ({
      id: a.id,
      severity: a.severity,
      title: a.translations[lang]?.title || a.title,
      plain: a.translations[lang]?.plain || a.translations.en.plain,
      originalLang: a.original.lang,
      originalText: a.original.text,
      instructions: a.instructions[lang] || a.instructions.en,
      sourceName: a.source_name,
      issuedAt: a.issued_at,
      updatedAt: a.updated_at,
      expiresAt: a.expires_at,
      trust: a.trust.level,
    })),
    claims: claims.map((a) => ({ id: a.id, title: a.translations[lang]?.title || a.title, contradictedBy: titleOf(a.contradicted_by) })),
    shelters: bundle.shelters
      .map((s) => ({ id: s.id, name: s.name, address: s.address, lat: s.lat, lng: s.lng, availability: s.availability, verifiedAt: s.verified_at, distance_m: Math.round(haversine(origin.lat, origin.lng, s.lat, s.lng)) }))
      .sort((a, b) => a.distance_m - b.distance_m)
      .slice(0, 6),
    contacts: bundle.contacts,
    contactsNote: bundle.contacts_note,
  };
}

export function savePassport(p) {
  try { localStorage.setItem(KEY, JSON.stringify(p)); return true; } catch { return false; }
}

export function loadPassport() {
  try { return JSON.parse(localStorage.getItem(KEY)); } catch { return null; }
}

export function passportText(p) {
  const L = [];
  L.push('SAFEJOURNEY AI: EMERGENCY PASSPORT');
  if (p.simulated) L.push('SIMULATED DATA. This is a demonstration scenario, not a real emergency.');
  L.push(`Saved: ${new Date(p.savedAt).toLocaleString()}. This is a saved copy, not live information.`, '');
  L.push('EMERGENCY CONTACTS');
  p.contacts.forEach((c) => L.push(`  ${c.number}  ${c.name}`));
  L.push('');
  p.alerts.forEach((a) => {
    L.push(`[${a.severity}] ${a.title}`, `  Source: ${a.sourceName}. Issued ${new Date(a.issuedAt).toLocaleString()}`, `  ${a.plain}`);
    a.instructions.forEach((i) => L.push(`  - ${i}`));
    L.push('');
  });
  L.push('SHELTERS (shown as open only when a recent source confirms it)');
  p.shelters.forEach((s) => L.push(`  ${s.name}, ${s.address} [${s.availability === 'confirmed_open' ? 'confirmed open' : 'availability unconfirmed'}]`));
  if (p.claims.length) { L.push('', 'CLAIMS GOING AROUND (not confirmed)'); p.claims.forEach((c) => L.push(`  ${c.title}`)); }
  return L.join('\n');
}
