import { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import AlertCard from '../components/AlertCard.jsx';
import MyLocationPanel from '../components/MyLocationPanel.jsx';
import TravelRouteFinder from '../components/TravelRouteFinder.jsx';

export default function Dashboard() {
  const { t, lang, bundle } = useApp();
  const [q, setQ] = useState('');
  const [sev, setSev] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const { alerts, scenario, contacts } = bundle;

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return alerts.filter((a) => {
      if (sev && a.severity !== sev) return false;
      if (type && a.type !== type) return false;
      if (status && a.status !== status) return false;
      if (!needle) return true;
      const hay = [a.title, a.region, a.source_name, a.type, ...Object.values(a.translations).map((x) => x.title)].join(' ').toLowerCase();
      return hay.includes(needle);
    });
  }, [alerts, q, sev, type, status]);

  const official = filtered.filter((a) => a.source_kind !== 'social_media');
  const claims = filtered.filter((a) => a.source_kind === 'social_media');
  const active = alerts.filter((a) => a.status === 'active' && a.source_kind !== 'social_media').length;
  const unverified = alerts.filter((a) => a.source_kind === 'social_media').length;
  const expired = alerts.filter((a) => a.status === 'expired').length;
  const types = [...new Set(alerts.map((a) => a.type))];
  const call = contacts.find((c) => c.number === '112');
  const clear = () => { setQ(''); setSev(''); setType(''); setStatus(''); };

  return (
    <div className="page">
      <section className="hero">
        <h1 lang={lang}>{t('dash.heading')}</h1>
        <p className="scenario">{scenario.name}</p>
        <p className="muted">{t('dash.stats', { a: active, r: unverified, e: expired })}</p>
      </section>

      <div className="layout">
        <div className="main">
          {/* Interactive Travel Route Way, Place Search & Problem Solution Engine */}
          <TravelRouteFinder />

          <form className="filters" role="search" onSubmit={(e) => e.preventDefault()}>
            <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('dash.search')} aria-label={t('dash.search')} />
            <select value={sev} onChange={(e) => setSev(e.target.value)} aria-label={t('filter.severity')}>
              <option value="">{t('filter.severity')}: {t('common.all')}</option>
              {['Extreme', 'Severe', 'Moderate', 'Minor', 'Info'].map((s) => <option key={s} value={s}>{t(`sev.${s}`)}</option>)}
            </select>
            <select value={type} onChange={(e) => setType(e.target.value)} aria-label={t('filter.type')}>
              <option value="">{t('filter.type')}: {t('common.all')}</option>
              {types.map((x) => <option key={x} value={x}>{t(`type.${x}`)}</option>)}
            </select>
            <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label={t('filter.status')}>
              <option value="">{t('filter.status')}: {t('common.all')}</option>
              <option value="active">{t('status.active')}</option>
              <option value="expired">{t('status.expired')}</option>
            </select>
          </form>
          <p className="muted" role="status">{t('dash.count', { n: filtered.length })}</p>

          {filtered.length === 0 && (
            <div className="card empty"><p>{t('dash.none')}</p><button className="btn" onClick={clear}>{t('common.clear')}</button></div>
          )}

          {official.length > 0 && (
            <div className="stack">
              <h2>{t('dash.official')}</h2>
              {official.map((a) => <AlertCard key={a.id} alert={a} alerts={alerts} />)}
            </div>
          )}

          {claims.length > 0 && (
            <div className="stack rumor-desk">
              <h2>{t('rumor.heading')}</h2>
              <p className="muted">{t('rumor.sub')}</p>
              {claims.map((a) => <AlertCard key={a.id} alert={a} alerts={alerts} />)}
            </div>
          )}
        </div>

        <aside className="side">
          {call && <a className="btn alarm block" href={`tel:${call.number}`}>{t('common.call')} {call.number}: {call.name}</a>}
          <MyLocationPanel compact />
        </aside>
      </div>
    </div>
  );
}
