import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { fetchRisk, loadBundle } from '../services/api.js';
import { computeRiskLocal } from '../utils/geo.js';
import { LANG_CODES, translate } from '../i18n.js';

const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

function initialLang() {
  try {
    const saved = localStorage.getItem('sj.lang');
    if (LANG_CODES.includes(saved)) return saved;
  } catch { /* ignore */ }
  const nav = (navigator.language || 'en').slice(0, 2);
  return LANG_CODES.includes(nav) ? nav : 'en';
}

function initialLoc() {
  try { return JSON.parse(localStorage.getItem('sj.loc')); } catch { return null; }
}

export function AppProvider({ children }) {
  const [lang, setLangState] = useState(initialLang);
  const [state, setState] = useState({ status: 'loading', bundle: null, source: null, savedAt: null });
  const [userLoc, setUserLocState] = useState(initialLoc);
  const [risk, setRisk] = useState(null);
  const [online, setOnline] = useState(navigator.onLine);
  const [activeRoute, setActiveRoute] = useState(null);

  const setLang = useCallback((code) => {
    setLangState(code);
    try { localStorage.setItem('sj.lang', code); } catch { /* ignore */ }
  }, []);

  const setUserLoc = useCallback((loc) => {
    setUserLocState(loc);
    try { loc ? localStorage.setItem('sj.loc', JSON.stringify(loc)) : localStorage.removeItem('sj.loc'); } catch { /* ignore */ }
  }, []);

  const reload = useCallback(async () => {
    setState((s) => ({ ...s, status: s.bundle ? 'refreshing' : 'loading' }));
    const res = await loadBundle();
    setState({ status: 'ready', bundle: res.data, source: res.source, savedAt: res.savedAt });
  }, []);

  useEffect(() => { reload(); }, [reload]);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    const up = () => { setOnline(true); reload(); };
    const down = () => setOnline(false);
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    return () => { window.removeEventListener('online', up); window.removeEventListener('offline', down); };
  }, [reload]);

  // Recompute the personal risk check whenever the position or data changes.
  useEffect(() => {
    const b = state.bundle;
    if (!userLoc || !b) { setRisk(null); return undefined; }
    let cancelled = false;
    const local = computeRiskLocal(userLoc.lat, userLoc.lng, b.hazards, b.shelters);
    setRisk(local); // instant answer from local data
    if (state.source === 'live') {
      fetchRisk(userLoc.lat, userLoc.lng).then((r) => { if (!cancelled) setRisk(r); }).catch(() => {});
    }
    return () => { cancelled = true; };
  }, [userLoc, state.bundle, state.source]);

  const t = useCallback((key, vars) => translate(lang, key, vars), [lang]);

  const value = useMemo(() => ({ lang, setLang, t, ...state, reload, userLoc, setUserLoc, risk, online, activeRoute, setActiveRoute }),
    [lang, setLang, t, state, reload, userLoc, setUserLoc, risk, online, activeRoute, setActiveRoute]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
