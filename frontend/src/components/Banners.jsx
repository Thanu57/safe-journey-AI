import { useApp } from '../context/AppContext.jsx';
import { clock } from '../utils/time.js';

export function SimBanner() {
  const { t, bundle } = useApp();
  if (bundle && !bundle.scenario.is_simulated) return null;
  return (
    <div className="tape" role="note">
      <span>{t('banner.sim')}</span>
    </div>
  );
}

export function ConnectionBanner() {
  const { t, source, savedAt, lang, online, reload } = useApp();
  if (source === 'live' && online) return null;
  let msg = '';
  if (source === 'cache') msg = t('banner.cache', { time: clock(savedAt, lang) });
  else if (source === 'snapshot') msg = t('banner.snapshot');
  else if (!online) msg = t('banner.offline');
  if (!msg) return null;
  return (
    <div className="conn" role="status">
      <span>{msg}</span>
      <button className="btn small" onClick={reload}>{t('common.retry')}</button>
    </div>
  );
}
