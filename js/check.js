// Antwoorden van de student lezen en nakijken.
// Accepteert o.a.: "52", "52,00", "€ 52", "1.250", "−7", "3/4", "1 5/12", "37,5%", "16:25".

import { clean, nl, euro, tijd, fracText } from './format.js';

function parseGetalDeel(s) {
  if (!s) return null;
  if (s.includes(',')) {
    // komma = decimaalteken, punten zijn duizendtallen
    s = s.replace(/\./g, '').replace(',', '.');
  } else if (/^\d{1,3}(\.\d{3})+$/.test(s)) {
    // 1.250 of 12.500 -> duizendtalpunten
    s = s.replace(/\./g, '');
  }
  if (!/^\d*\.?\d+$|^\d+\.$/.test(s)) return null;
  const v = Number(s);
  return Number.isFinite(v) ? v : null;
}

export function parseAnswer(input) {
  if (input === null || input === undefined) return null;
  let s = String(input).trim().toLowerCase();
  if (!s) return null;
  s = s
    .replace(/[−–—]/g, '-')
    .replace(/,-$/, '')
    .replace(/[€%]/g, ' ')
    .replace(/[a-zµ²³°'"]+(\/[a-z]+)?\.?/g, ' ') // eenheden zoals cm, kg, m², km/u, graden, euro
    .replace(/\s+/g, ' ')
    .trim();
  let neg = false;
  if (s.startsWith('-')) {
    neg = true;
    s = s.slice(1).trim();
  }
  let v = null;
  // gemengd getal: 1 5/12
  let m = s.match(/^(\d+)\s+(\d+)\s*\/\s*(\d+)$/);
  if (m) {
    const d = Number(m[3]);
    if (d !== 0) v = Number(m[1]) + Number(m[2]) / d;
  } else if ((m = s.match(/^(\d+(?:[.,]\d+)?)\s*\/\s*(\d+(?:[.,]\d+)?)$/))) {
    const t = parseGetalDeel(m[1]);
    const d = parseGetalDeel(m[2]);
    if (t !== null && d) v = t / d;
  } else {
    v = parseGetalDeel(s.replace(/\s+/g, ''));
  }
  if (v === null) return null;
  return clean(neg ? -v : v);
}

/** "16:25", "16.25", "16 25", "1625" -> minuten sinds middernacht */
export function parseTijd(input) {
  const s = String(input || '').trim().replace(/\s*uur\s*$/, '');
  let m = s.match(/^(\d{1,2})\s*[:.,hu ]\s*(\d{2})$/);
  if (!m) m = s.match(/^(\d{1,2})(\d{2})$/);
  if (!m) return null;
  const h = Number(m[1]);
  const mi = Number(m[2]);
  if (h > 24 || mi > 59) return null;
  return (h % 24) * 60 + mi;
}

function gelijk(a, b) {
  return Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(b));
}

/**
 * Kijkt een antwoord na.
 * @returns {{status: 'goed'|'fout'|'leeg'|'onleesbaar', waarde?: number}}
 */
export function checkAnswer(q, input) {
  const raw = String(input ?? '').trim();
  if (!raw) return { status: 'leeg' };
  if (q.invoer === 'keuze') {
    return { status: raw === String(q.antwoord) ? 'goed' : 'fout' };
  }
  if (q.invoer === 'tijd') {
    const t = parseTijd(raw);
    if (t === null) return { status: 'onleesbaar' };
    return { status: t === q.antwoord ? 'goed' : 'fout', waarde: t };
  }
  const v = parseAnswer(raw);
  if (v === null) return { status: 'onleesbaar' };
  const opties = [q.antwoord, ...(q.alternatieven || [])];
  return { status: opties.some((a) => gelijk(v, a)) ? 'goed' : 'fout', waarde: v };
}

/** Het juiste antwoord netjes als tekst (voor feedback en review). */
export function antwoordTekst(q) {
  if (q.antwoordTekst) return q.antwoordTekst;
  if (q.invoer === 'keuze') return String(q.antwoord);
  if (q.invoer === 'tijd') return tijd(q.antwoord);
  if (q.voor === '€') return euro(q.antwoord);
  const getal = q.breuk ? fracText(...q.breuk) : nl(q.antwoord);
  if (!q.eenheid) return getal;
  return ['%', '°'].includes(q.eenheid) ? getal + q.eenheid : `${getal} ${q.eenheid}`;
}
