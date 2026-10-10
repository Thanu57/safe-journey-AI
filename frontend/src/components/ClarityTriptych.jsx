import { useApp } from '../context/AppContext.jsx';

const NAMES = { en: 'English', ta: 'Tamil', hi: 'Hindi', te: 'Telugu' };

/** Crisis Clarity Engine view: the same warning in three forms side by side. */
export default function ClarityTriptych({ alert }) {
  const { t, lang } = useApp();
  const tr = alert.translations[lang] || alert.translations.en;
  const panels = [
    { id: 'orig', label: t('safety.original'), lang: alert.original.lang, text: alert.original.text, note: t('safety.noteOriginal', { lang: NAMES[alert.original.lang] }) },
    { id: 'plain', label: t('safety.plain'), lang: 'en', text: alert.translations.en.plain, note: t('safety.notePlain') },
  ];
  if (lang !== 'en') panels.push({ id: 'mine', label: t('safety.translated'), lang, text: tr.plain, note: t('safety.noteTranslated') });

  return (
    <div className={`triptych n${panels.length}`}>
      {panels.map((p) => (
        <section key={p.id} className={`panel ${p.id}`}>
          <h4>{p.label}</h4>
          <p className="body" lang={p.lang}>{p.text}</p>
          <p className="muted small-note">{p.note}</p>
        </section>
      ))}
    </div>
  );
}
