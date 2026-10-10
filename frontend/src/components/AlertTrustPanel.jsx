import { useApp } from '../context/AppContext.jsx';
import { CheckIcon, TrustBadge } from './Badges.jsx';
import { clock, timeAgo } from '../utils/time.js';

export default function AlertTrustPanel({ alert }) {
  const { t, lang, source } = useApp();
  return (
    <section className="trust" aria-label={t('trust.title')}>
      <h4>{t('trust.title')}</h4>
      <p className="muted">{t('trust.intro')}</p>
      <p><TrustBadge level={alert.trust.level} /></p>
      <ul className="checks">
        {alert.trust.checks.map((c) => (
          <li key={c.id}>
            <CheckIcon status={c.status} />
            <div>
              <strong>{t(`trust.check.${c.id}`)}</strong>
              <span className={`chk-label chk-${c.status}`}> {t(`trust.${c.status}`)}</span>
              <div className="muted">{c.detail}</div>
            </div>
          </li>
        ))}
      </ul>
      <dl className="facts">
        <div><dt>{t('common.source')}</dt><dd>{alert.source_name}</dd></div>
        <div><dt>{t('common.issued')}</dt><dd>{clock(alert.issued_at, lang)} ({timeAgo(alert.issued_at, lang)})</dd></div>
        <div><dt>{t('common.updated')}</dt><dd>{clock(alert.updated_at, lang)} ({timeAgo(alert.updated_at, lang)})</dd></div>
      </dl>
      {source !== 'live' && <p className="muted small-note">{t('trust.stale')}</p>}
    </section>
  );
}
