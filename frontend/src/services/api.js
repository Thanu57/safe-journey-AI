import fallbackBundle from '../data/fallbackBundle.json';

const BASE = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');
const BUNDLE_KEY = 'sj.bundle';

async function request(path, options = {}, timeoutMs = 9000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`${BASE}${path}`, { ...options, signal: ctrl.signal });
    if (!res.ok) {
      let detail = '';
      try { detail = (await res.json()).detail; } catch { /* ignore */ }
      throw new Error(typeof detail === 'string' && detail ? detail : `Server returned ${res.status}`);
    }
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

/** Live data first, then the last saved copy, then the bundled snapshot. */
export async function loadBundle() {
  try {
    const data = await request('/api/bundle');
    try { localStorage.setItem(BUNDLE_KEY, JSON.stringify({ savedAt: new Date().toISOString(), data })); } catch { /* storage full */ }
    return { data, source: 'live', savedAt: data.generated_at };
  } catch {
    try {
      const cached = JSON.parse(localStorage.getItem(BUNDLE_KEY));
      if (cached?.data) return { data: cached.data, source: 'cache', savedAt: cached.savedAt };
    } catch { /* ignore */ }
    return { data: fallbackBundle, source: 'snapshot', savedAt: fallbackBundle.generated_at };
  }
}

export const fetchRisk = (lat, lng) => request(`/api/risk?lat=${lat}&lng=${lng}`, {}, 6000);

export const translateText = (text, target_lang) =>
  request('/api/translate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text, target_lang }) }, 25000);

export const apiBase = BASE;
