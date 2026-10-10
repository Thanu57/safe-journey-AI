import { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext.jsx';

export default function SafetyChecklist({ alert }) {
  const { t, lang } = useApp();
  const items = alert.instructions[lang] || alert.instructions.en;
  const key = `sj.check.${alert.id}`;
  const [done, setDone] = useState([]);

  useEffect(() => {
    try { setDone(JSON.parse(localStorage.getItem(key)) || []); } catch { setDone([]); }
  }, [key]);

  const toggle = (i) => {
    const next = done.includes(i) ? done.filter((x) => x !== i) : [...done, i];
    setDone(next);
    try { localStorage.setItem(key, JSON.stringify(next)); } catch { /* ignore */ }
  };
  const count = done.filter((i) => i < items.length).length;

  return (
    <section className="card">
      <div className="row between wrap gap">
        <h3>{t('safety.checklist')}</h3>
        <span className="muted">{t('safety.done', { done: count, total: items.length })}</span>
      </div>
      <progress max={items.length} value={count} aria-hidden="true" />
      <ul className="checklist" lang={lang}>
        {items.map((text, i) => (
          <li key={i}>
            <label>
              <input type="checkbox" checked={done.includes(i)} onChange={() => toggle(i)} />
              <span>{text}</span>
            </label>
          </li>
        ))}
      </ul>
    </section>
  );
}
