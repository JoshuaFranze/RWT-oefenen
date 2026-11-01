// Hulpfuncties voor Nederlandse getalnotatie en exacte rekenresultaten.

/** Haalt zwevendekomma-ruis weg (0.1+0.2 -> 0.3). */
export const clean = (x) => Number.parseFloat(Number(x).toFixed(10));

/** Afronden "half naar boven", zoals op school (2,45 -> 2,5). */
export function round(x, d = 0) {
  const f = 10 ** d;
  const v = clean(x * f);
  const r = v < 0 ? -Math.round(-v) : Math.round(v);
  return clean(r / f);
}

/**
 * Getal in Nederlandse notatie: komma als decimaalteken,
 * punt als duizendtalscheiding vanaf 10.000. Negatief met echt minteken.
 */
export function nl(x, dec) {
  x = clean(x);
  let s = dec === undefined ? String(x) : x.toFixed(dec);
  if (s.includes('e')) s = x.toFixed(10).replace(/\.?0+$/, '');
  const neg = s.startsWith('-');
  if (neg) s = s.slice(1);
  let [int, frac] = s.split('.');
  if (int.length > 4) int = int.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return (neg ? '−' : '') + int + (frac ? ',' + frac : '');
}

/** Geldbedrag: € 12,50 */
export const euro = (x) => '€ ' + nl(round(x, 2), 2);

/** Negatief getal tussen haakjes als het als tweede term staat: (−5) */
export const nlh = (x) => (x < 0 ? `(${nl(x)})` : nl(x));

export function gcd(a, b) {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a || 1;
}
export const lcm = (a, b) => Math.abs(a * b) / gcd(a, b);

/** Vereenvoudigde breuk als [teller, noemer]. */
export function simplify(n, d) {
  const g = gcd(n, d);
  let t = n / g;
  let m = d / g;
  if (m < 0) {
    t = -t;
    m = -m;
  }
  return [t, m];
}

/** Breuk-token voor de weergave: [[3/4]] wordt een gestapelde breuk. */
export const fr = (n, d) => `[[${n}/${d}]]`;

/** Breuk als tekst, eventueel als gemengd getal: 1 [[5/12]] */
export function fracText(n, d) {
  const [t, m] = simplify(n, d);
  if (m === 1) return String(t);
  const heel = Math.trunc(t / m);
  const rest = Math.abs(t % m);
  if (heel === 0) return fr(t, m);
  return `${heel} ${fr(rest, m)}`;
}

/** Minuten sinds middernacht -> "16:05" */
export function tijd(min) {
  min = ((min % 1440) + 1440) % 1440;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** Duur in minuten -> "1 uur en 38 minuten" */
export function duur(min) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  const delen = [];
  if (h) delen.push(`${h} uur`);
  if (m) delen.push(`${m} ${m === 1 ? 'minuut' : 'minuten'}`);
  return delen.join(' en ') || '0 minuten';
}

const SUP = { 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
export const sup = (n) => String(n).split('').map((c) => SUP[c]).join('');

export const NAMEN = [
  'Sanne', 'Daan', 'Fatima', 'Noah', 'Lotte', 'Mohammed', 'Emma', 'Luuk', 'Yara', 'Sem',
  'Julia', 'Bram', 'Aisha', 'Tim', 'Noor', 'Finn', 'Esmee', 'Milan', 'Zoë', 'Ravi',
  'Lieke', 'Jesse', 'Amira', 'Thijs', 'Fleur', 'Mees', 'Ilse', 'Kofi',
];
