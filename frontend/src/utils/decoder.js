// Offline warning decoder: same rules as backend/app/services/translation_service.py.
const RANGES = { ta: [0x0b80, 0x0bff], hi: [0x0900, 0x097f], te: [0x0c00, 0x0c7f] };
const RANK = { high: 0, medium: 1, low: 2 };
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function detectLanguage(text) {
  const counts = { ta: 0, hi: 0, te: 0 };
  for (const ch of text) {
    const cp = ch.codePointAt(0);
    for (const [k, [lo, hi]] of Object.entries(RANGES)) if (cp >= lo && cp <= hi) counts[k] += 1;
  }
  const best = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0];
  return counts[best] > 0 ? best : 'en';
}

function find(variant, text) {
  if (/^[\x00-\x7f]+$/.test(variant)) {
    const stem = variant.replace(/\*$/, '');
    const tail = variant.endsWith('*') ? '[\\p{L}\\p{N}_]*' : '';
    const re = new RegExp(`(^|[^\\p{L}\\p{N}_])(${esc(stem)}${tail})(?![\\p{L}\\p{N}_])`, 'iu');
    const m = text.match(re);
    return m ? m[2] : null;
  }
  const i = text.toLowerCase().indexOf(variant.toLowerCase());
  return i === -1 ? null : text.slice(i, i + variant.length);
}

export function decodeText(text, glossary, phrasebook, lang = 'en') {
  const matches = [];
  for (const term of glossary) {
    for (const v of term.variants) {
      const hit = find(v, text);
      if (hit) {
        matches.push({ term_id: term.id, meaning: term.en, matched_text: hit, urgency: term.urgency, phrase: term.phrase });
        break;
      }
    }
  }
  matches.sort((a, b) => RANK[a.urgency] - RANK[b.urgency]);
  const used = new Set();
  const actions = [];
  for (const m of matches) {
    if (used.has(m.phrase) || !phrasebook[m.phrase]) continue;
    used.add(m.phrase);
    actions.push({ id: m.phrase, text: phrasebook[m.phrase][lang] || phrasebook[m.phrase].en });
    if (actions.length === 5) break;
  }
  return { detected_language: detectLanguage(text), urgency: matches[0]?.urgency || 'unknown', matches, suggested_actions: actions };
}
