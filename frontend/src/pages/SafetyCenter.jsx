import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import ClarityTriptych from '../components/ClarityTriptych.jsx';
import AlertTrustPanel from '../components/AlertTrustPanel.jsx';
import SafetyChecklist from '../components/SafetyChecklist.jsx';
import ContactList from '../components/ContactList.jsx';
import DecoderBox from '../components/DecoderBox.jsx';
import ShelterRow from '../components/ShelterRow.jsx';
import { SeverityBadge, TrustBadge } from '../components/Badges.jsx';
import { buildPassport, savePassport } from '../utils/passport.js';
import { clock } from '../utils/time.js';

export default function SafetyCenter() {
  const { t, lang, bundle, userLoc, risk } = useApp();
  const { id } = useParams();
  const nav = useNavigate();
  const [msg, setMsg] = useState('');
  const alerts = bundle.alerts;
  const alert = alerts.find((a) => a.id === id) || alerts.find((a) => a.status === 'active' && a.source_kind !== 'social_media') || alerts[0];
  const tr = alert.translations[lang] || alert.translations.en;

  const save = () => {
    const ok = savePassport(buildPassport(bundle, lang, userLoc));
    setMsg(ok ? t('safety.saved') : t('safety.saveFail'));
  };

  return (
    <div className="page">
      <h1>{t('safety.title')}</h1>

      <nav className="chips" aria-label={t('safety.pick')}>
        {alerts.map((a) => (
          <button key={a.id} className={a.id === alert.id ? 'on' : ''} aria-pressed={a.id === alert.id} onClick={() => nav(`/safety/${a.id}`)} lang={lang}>
            {(a.translations[lang] || a.translations.en).title}
          </button>
        ))}
      </nav>

      <section className="card engine">
        <div className="row wrap gap">
          <SeverityBadge severity={alert.severity} />
          <TrustBadge level={alert.trust.level} />
          <span className="muted">{alert.source_name}, {t('common.issued')} {clock(alert.issued_at, lang)}</span>
        </div>
        <h2 lang={lang}>{tr.title}</h2>
        <ClarityTriptych alert={alert} />
        <div className="row wrap gap">
          {alert.hazard_ids.length > 0 && <Link className="btn" to={`/map?alert=${alert.id}`}>{t('alert.viewMap')}</Link>}
          <button className="btn primary" onClick={save}>{t('safety.save')}</button>
        </div>
        {msg && <p className="ok-msg" role="status">{msg} <Link to="/passport">{t('nav.passport')}</Link></p>}
      </section>

      <div className="layout">
        <div className="main stack">
          <SafetyChecklist alert={alert} />
          <section className="card">
            <h3>{t('safety.shelters')}</h3>
            {risk ? <ul className="shelters">{risk.shelters.map((s) => <ShelterRow key={s.id} near={s} />)}</ul> : <p className="muted">{t('safety.setLoc')}</p>}
            <p className="muted small-note">{t('loc.disclaimer')}</p>
          </section>
          <DecoderBox />
        </div>
        <aside className="side stack">
          <AlertTrustPanel alert={alert} />
          <ContactList contacts={bundle.contacts} note={bundle.contacts_note} />
        </aside>
      </div>
    </div>
  );
}
