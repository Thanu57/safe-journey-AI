import { useApp } from '../context/AppContext.jsx';

export function SeverityBadge({ severity }) {
  const { t } = useApp();
  return <span className={`badge sev-${severity}`}>{t(`sev.${severity}`)}</span>;
}

const ICON = { pass: '✓', warn: '!', fail: '✕' };

export function TrustBadge({ level }) {
  const { t } = useApp();
  const tone = { official: 'pass', simulated_official: 'warn', unverified: 'fail', expired: 'fail' }[level];
  return (
    <span className={`badge trust-${tone}`}>
      <span aria-hidden="true">{ICON[tone]}</span> {t(`trust.level.${level}`)}
    </span>
  );
}

export function CheckIcon({ status }) {
  return <span className={`chk chk-${status}`} aria-hidden="true">{ICON[status]}</span>;
}
