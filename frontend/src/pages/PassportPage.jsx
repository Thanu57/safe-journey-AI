import { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { SeverityBadge } from '../components/Badges.jsx';
import { buildPassport, loadPassport, passportText, savePassport } from '../utils/passport.js';
import { clock, timeAgo } from '../utils/time.js';
import { formatDistance } from '../utils/geo.js';

const NAMES = { en: 'English', ta: 'Tamil', hi: 'Hindi', te: 'Telugu' };

export default function PassportPage() {
  const { t, lang, bundle, userLoc } = useApp();
  const [passport, setPassport] = useState(loadPassport);

  const make = () => {
    const p = buildPassport(bundle, lang, userLoc);
    if (savePassport(p)) setPassport(p);
  };
  const download = () => {
    const blob = new Blob([passportText(passport)], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'safejourney-emergency-passport.txt';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="page passport">
      <div className="row between wrap gap noprint">
        <div>
          <h1>{t('pass.title')}</h1>
          <p className="muted">{t('pass.intro')}</p>
        </div>
        {bundle && <button className="btn primary" onClick={make}>{passport ? t('pass.refresh') : t('pass.make')}</button>}
      </div>

      {!passport && <div className="card empty"><p>{t('pass.empty')}</p></div>}

      {passport && (
        <article className="card sheet" lang={passport.lang}>
          {passport.simulated && <div className="tape inline"><span>{t('banner.sim')}</span></div>}
          <div className="notlive" role="note">
            <strong>{t('pass.saved', { time: clock(passport.savedAt, lang) })}</strong>
            <span> ({timeAgo(passport.savedAt, lang)}). {t('pass.notLive')}</span>
            <div className="muted">{t('pass.language', { lang: NAMES[passport.lang] })}</div>
          </div>

          <h3>{t('pass.contacts')}</h3>
          <ul className="contacts">
            {passport.contacts.map((c) => (
              <li key={c.id}><a className={`btn ${c.number === '112' ? 'alarm' : ''}`} href={`tel:${c.number}`}>{c.number}</a><span>{c.name}</span></li>
            ))}
          </ul>

          <h3>{t('pass.alerts')}</h3>
          {passport.alerts.map((a) => (
            <section key={a.id} className="pass-alert">
              <div className="row wrap gap"><SeverityBadge severity={a.severity} /><span className="muted">{a.sourceName}, {clock(a.issuedAt, lang)}</span></div>
              <h4>{a.title}</h4>
              <p>{a.plain}</p>
              <ul className="plainlist">{a.instructions.map((i) => <li key={i}>{i}</li>)}</ul>
              <details className="noprint">
                <summary>{t('pass.original')}</summary>
                <p lang={a.originalLang}>{a.originalText}</p>
              </details>
            </section>
          ))}

          <h3>{t('pass.shelters')}</h3>
          <ul className="plainlist">
            {passport.shelters.map((s) => (
              <li key={s.id}>
                <strong>{s.name}</strong>, {s.address} ({formatDistance(s.distance_m)}){' '}
                <span className={`pill ${s.availability === 'confirmed_open' ? 'ok' : 'neutral'}`}>
                  {s.availability === 'confirmed_open' ? t('loc.confirmed', { time: clock(s.verifiedAt, lang) }) : t('loc.unconfirmed')}
                </span>
              </li>
            ))}
          </ul>

          {passport.claims.length > 0 && (
            <>
              <h3>{t('pass.claims')}</h3>
              <ul className="plainlist">{passport.claims.map((c) => <li key={c.id}>{c.title}</li>)}</ul>
            </>
          )}
          <p className="muted small-note">{passport.contactsNote}</p>

          <div className="row wrap gap noprint">
            <button className="btn" onClick={() => window.print()}>{t('pass.print')}</button>
            <button className="btn" onClick={download}>{t('pass.download')}</button>
          </div>
        </article>
      )}
    </div>
  );
}
