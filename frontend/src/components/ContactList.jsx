import { useApp } from '../context/AppContext.jsx';

export default function ContactList({ contacts, note }) {
  const { t } = useApp();
  return (
    <section className="card">
      <h3>{t('safety.contacts')}</h3>
      <ul className="contacts">
        {contacts.map((c) => (
          <li key={c.id}>
            <a className={`btn ${c.number === '112' ? 'alarm' : ''}`} href={`tel:${c.number}`} aria-label={`${t('common.call')} ${c.number}, ${c.name}`}>
              {t('common.call')} {c.number}
            </a>
            <span>{c.name}</span>
          </li>
        ))}
      </ul>
      {note && <p className="muted small-note">{note}</p>}
    </section>
  );
}
