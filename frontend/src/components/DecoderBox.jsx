import { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { decodeText } from '../utils/decoder.js';
import { translateText } from '../services/api.js';

const NAMES = { en: 'English', ta: 'Tamil', hi: 'Hindi', te: 'Telugu' };

function Highlighted({ text, matches }) {
  if (!matches.length) return <>{text}</>;
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`(${matches.map((m) => esc(m.matched_text)).sort((a, b) => b.length - a.length).join('|')})`, 'gi');
  return <>{text.split(re).map((part, i) => (i % 2 ? <mark key={i}>{part}</mark> : <span key={i}>{part}</span>))}</>;
}

/** Paste a warning you received. Known warning terms are explained offline from a reviewed glossary. */
export default function DecoderBox() {
  const { t, lang, bundle } = useApp();
  const [text, setText] = useState('');
  const [submitted, setSubmitted] = useState('');
  const [ai, setAi] = useState(null);
  const [aiState, setAiState] = useState('idle');

  const result = useMemo(() => (submitted ? decodeText(submitted, bundle.glossary, bundle.phrasebook, lang) : null), [submitted, bundle, lang]);

  const run = () => { setSubmitted(text.trim()); setAi(null); setAiState('idle'); };
  const runAi = async () => {
    setAiState('loading');
    try {
      const r = await translateText(submitted, lang);
      if (r.provider === 'claude') { setAi(r); setAiState('done'); } else { setAiState('unavailable'); }
    } catch { setAiState('unavailable'); }
  };

  return (
    <section className="card decoder">
      <h3>{t('dec.title')}</h3>
      <p className="muted">{t('dec.help')}</p>
      <textarea rows={4} value={text} maxLength={2000} placeholder={t('dec.placeholder')} onChange={(e) => setText(e.target.value)} aria-label={t('dec.placeholder')} />
      <div className="row wrap gap">
        <button className="btn primary" onClick={run} disabled={!text.trim()}>{t('dec.button')}</button>
        {result && <button className="btn" onClick={runAi} disabled={aiState === 'loading'}>{aiState === 'loading' ? t('loc.checking') : t('dec.ai')}</button>}
      </div>

      {result && (
        <div className="decoded" aria-live="polite">
          <p className="echo" lang={result.detected_language}><Highlighted text={submitted} matches={result.matches} /></p>
          <p className="muted">{t('dec.detected', { lang: NAMES[result.detected_language] })}{' '}<span className={`pill urg-${result.urgency}`}>{t(`dec.urgency.${result.urgency}`)}</span></p>
          {result.matches.length === 0 ? <p>{t('dec.none')}</p> : (
            <>
              <h4>{t('dec.found')}</h4>
              <ul className="plainlist">
                {result.matches.map((m) => <li key={m.term_id}><mark>{m.matched_text}</mark>: {m.meaning}</li>)}
              </ul>
              <h4>{t('dec.actions')}</h4>
              <ul className="plainlist" lang={lang}>{result.suggested_actions.map((a) => <li key={a.id}>{a.text}</li>)}</ul>
            </>
          )}
          {aiState === 'unavailable' && <p className="muted">{t('dec.aiFail')}</p>}
          {ai && (
            <div className="ai-box">
              <h4>{t('dec.simple')}</h4><p>{ai.simplified_en}</p>
              <h4>{t('dec.translation')}</h4><p lang={lang}>{ai.translation}</p>
              <p className="muted small-note">{t('dec.aiLabel')}</p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
