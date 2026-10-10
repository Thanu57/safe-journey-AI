import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import { SeverityBadge, TrustBadge } from './Badges.jsx';
import AlertTrustPanel from './AlertTrustPanel.jsx';
import { timeAgo } from '../utils/time.js';

export default function AlertCard({ alert, alerts }) {
  const { t, lang } = useApp();
  const [open, setOpen] = useState(false);
  const tr = alert.translations[lang] || alert.translations.en;
  const claim = alert.source_kind === 'social_media';
  const other = (id) => alerts.find((a) => a.id === id);
  const contra = alert.contradicted_by && other(alert.contradicted_by);
  const newer = alert.superseded_by && other(alert.superseded_by);

  return (
    <article className={`card alert sev-bar-${alert.severity} ${claim ? 'claim' : ''} ${alert.status === 'expired' ? 'expired' : ''}`} id={`card-${alert.id}`}>
      <header>
        <div className="row wrap gap">
          <SeverityBadge severity={alert.severity} />
          {!claim && <span className={`badge status-${alert.status}`}>{t(`status.${alert.status}`)}</span>}
          <span className="badge plain">{t(`type.${alert.type}`)}</span>
        </div>
        <h3 lang={lang}>{tr.title}</h3>
        {lang !== 'en' && <p className="muted en-title" lang="en">{alert.title}</p>}
      </header>

      <p className="summary" lang={lang}>{tr.plain}</p>

      {contra && (
        <div className="official-pos">
          <strong>{t('rumor.official')}</strong>{' '}
          <Link to={`/safety/${contra.id}`} lang={lang}>{(contra.translations[lang] || contra.translations.en).title}</Link>
          <p lang={lang}>{(contra.translations[lang] || contra.translations.en).plain}</p>
        </div>
      )}
      {newer && (
        <p className="official-pos">
          {t('alert.superseded')}: <Link to={`/safety/${newer.id}`} lang={lang}>{(newer.translations[lang] || newer.translations.en).title}</Link>
        </p>
      )}

      <dl className="facts inline">
        <div><dt>{t('common.region')}</dt><dd>{alert.region}</dd></div>
        <div><dt>{t('common.source')}</dt><dd>{alert.source_name}</dd></div>
        <div><dt>{t('common.updated')}</dt><dd>{timeAgo(alert.updated_at, lang)}</dd></div>
      </dl>

      <div className="row wrap gap between">
        <TrustBadge level={alert.trust.level} />
        <button className="linkish" aria-expanded={open} onClick={() => setOpen(!open)}>
          {open ? t('alert.hideTrust') : t('alert.trust')}
        </button>
      </div>
      {open && <AlertTrustPanel alert={alert} />}

      <footer className="row wrap gap">
        {alert.hazard_ids.length > 0 && <Link className="btn" to={`/map?alert=${alert.id}`}>{t('alert.viewMap')}</Link>}
        <Link className="btn primary" to={`/safety/${alert.id}`}>{t('alert.guidance')}</Link>
      </footer>
    </article>
  );
}
