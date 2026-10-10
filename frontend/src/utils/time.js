const LOCALES = { en: 'en-IN', ta: 'ta-IN', hi: 'hi-IN', te: 'te-IN' };

export function timeAgo(iso, lang = 'en') {
  if (!iso) return '';
  const diffMin = Math.round((new Date(iso).getTime() - Date.now()) / 60000);
  const rtf = new Intl.RelativeTimeFormat(LOCALES[lang] || 'en', { numeric: 'auto' });
  const abs = Math.abs(diffMin);
  if (abs < 60) return rtf.format(diffMin, 'minute');
  if (abs < 60 * 36) return rtf.format(Math.round(diffMin / 60), 'hour');
  return rtf.format(Math.round(diffMin / 1440), 'day');
}

export function clock(iso, lang = 'en') {
  if (!iso) return '';
  return new Intl.DateTimeFormat(LOCALES[lang] || 'en', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
}
