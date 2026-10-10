import { useApp } from '../context/AppContext.jsx';
import { LANG_CODES } from '../i18n.js';

const NATIVE = { en: 'English', ta: 'தமிழ்', hi: 'हिन्दी', te: 'తెలుగు' };

export default function LanguageSelector() {
  const { lang, setLang, t } = useApp();
  return (
    <div className="langs" role="group" aria-label={t('lang.label')}>
      {LANG_CODES.map((c) => (
        <button key={c} lang={c} className={c === lang ? 'on' : ''} aria-pressed={c === lang} onClick={() => setLang(c)}>
          {NATIVE[c]}
        </button>
      ))}
    </div>
  );
}
