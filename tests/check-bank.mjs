// Controleert de complete vragenbank. Draait lokaal (node tests/check-bank.mjs) en in GitHub Actions
// vóór elke deploy: als er iets niet klopt, gaat de site niet live.

import { bouwBank, DOMEINEN, ALLE_GENERATORS, TOETS_AANTAL } from '../js/bank.js';
import { checkAnswer, parseAnswer, antwoordTekst } from '../js/check.js';
import { nl, euro, tijd, clean } from '../js/format.js';
import { schaalscore, NORM } from '../js/normering.js';

const fouten = [];
const waarschuwingen = [];
const fout = (q, msg) => fouten.push(`${q?.id ?? '-'} [${q?.gen ?? ''}] ${msg}`);

const { oefen, toetsen } = bouwBank();
const alle = [...oefen, ...toetsen.flatMap((t) => t.vragen)];
const genPerId = new Map(ALLE_GENERATORS.map((g) => [g.id, g]));

// ---------- aantallen ----------
if (oefen.length !== 400) fouten.push(`Er zijn ${oefen.length} oefenvragen in plaats van 400`);
for (const d of DOMEINEN) {
  for (const type of ['kaal', 'context']) {
    const n = oefen.filter((q) => q.domein === d.id && q.type === type).length;
    if (n !== 50) fouten.push(`${d.id}/${type}: ${n} vragen in plaats van 50`);
  }
}
if (toetsen.length !== TOETS_AANTAL) fouten.push(`Er zijn ${toetsen.length} toetsen in plaats van 10`);
for (const t of toetsen) {
  const d1 = t.vragen.filter((q) => q.deel === 1);
  const d2 = t.vragen.filter((q) => q.deel === 2);
  if (t.vragen.length !== 55) fouten.push(`Toets ${t.nr}: ${t.vragen.length} vragen in plaats van 55`);
  if (d1.length !== 17) fouten.push(`Toets ${t.nr}: deel 1 heeft ${d1.length} vragen in plaats van 17`);
  if (d2.length !== 38) fouten.push(`Toets ${t.nr}: deel 2 heeft ${d2.length} vragen in plaats van 38`);
  for (const q of d1) if (genPerId.get(q.gen).calc) fout(q, 'rekenmachinevraag in deel 1 (zonder rekenmachine)');
  if (t.vragen.findIndex((q) => q.deel === 2) !== 17) fouten.push(`Toets ${t.nr}: deel 1 en 2 staan niet op volgorde`);
  for (const d of DOMEINEN) if (!t.vragen.some((q) => q.domein === d.id)) fouten.push(`Toets ${t.nr}: domein ${d.id} ontbreekt`);
}

// ---------- uniek ----------
const ids = new Set();
const teksten = new Set();
for (const q of alle) {
  if (ids.has(q.id)) fout(q, 'dubbel id');
  ids.add(q.id);
  const k = q.vraag + JSON.stringify(q.tabel || '') + JSON.stringify(q.grafiek || '') + JSON.stringify(q.opties || '');
  if (teksten.has(k)) fout(q, 'dubbele vraag');
  teksten.add(k);
}

// ---------- inhoud per vraag ----------
function decimalen(x) {
  const s = String(clean(x));
  return s.includes('.') ? s.split('.')[1].length : 0;
}

// Onafhankelijke herberekening van kale sommen uit de vraagtekst zelf.
function evalExpr(expr) {
  const js = expr
    .replace(/(\d)\.(\d{3})/g, '$1$2')
    .replace(/,/g, '.')
    .replace(/−/g, '-')
    .replace(/×/g, '*')
    .replace(/:/g, '/')
    .replace(/(\d+)²/g, '($1**2)')
    .replace(/(\d+)³/g, '($1**3)')
    .replace(/(\d+)⁴/g, '($1**4)')
    .replace(/(\d+)⁵/g, '($1**5)')
    .replace(/(\d+)⁶/g, '($1**6)')
    .replace(/(\d+)⁷/g, '($1**7)')
    .replace(/√(\d+)/g, 'Math.sqrt($1)');
  if (!/^[\d.+\-*/() Mathsqrt]+$/.test(js)) return null;
  // eslint-disable-next-line no-new-func
  return clean(Function(`"use strict"; return (${js});`)());
}
const EENH = {
  km: 1000, hm: 100, m: 1, dm: 0.1, cm: 0.01, mm: 0.001,
  ton: 1e6, kg: 1000, hg: 100, g: 1, mg: 0.001,
  L: 1000, dL: 100, cL: 10, mL: 1, 'm³': 1e6, 'dm³': 1000, 'cm³': 1,
  'km²': 1e6, ha: 1e4, are: 100, 'm²': 1, 'dm²': 0.01, 'cm²': 0.0001,
};
const getal = (s) => parseAnswer(s.replace(/−/g, '-'));
let onafhankelijk = 0;

for (const q of alle) {
  const velden = [q.vraag, q.uitwerking, q.antwoordTekst, ...(q.opties || []), JSON.stringify(q.tabel || ''), JSON.stringify(q.grafiek || '')].join(' ');
  if (/NaN|undefined|Infinity|\[object|\bnull\b/.test(velden)) fout(q, `bevat NaN/undefined/null: ${q.vraag}`);
  if (!q.vraag || !q.uitwerking) fout(q, 'vraag of uitwerking ontbreekt');

  if (q.invoer === 'keuze') {
    if (!Array.isArray(q.opties) || q.opties.length < 2) fout(q, 'te weinig opties');
    else if (new Set(q.opties).size !== q.opties.length) fout(q, 'dubbele opties');
    if (!q.opties?.includes(q.antwoord)) fout(q, `antwoord ${q.antwoord} staat niet bij de opties`);
    if (checkAnswer(q, q.antwoord).status !== 'goed') fout(q, 'juiste optie wordt fout gerekend');
    const fouteOptie = q.opties?.find((o) => o !== q.antwoord);
    if (fouteOptie && checkAnswer(q, fouteOptie).status !== 'fout') fout(q, 'foute optie wordt goed gerekend');
    continue;
  }
  if (typeof q.antwoord !== 'number' || !Number.isFinite(q.antwoord)) {
    fout(q, `antwoord is geen getal: ${q.antwoord}`);
    continue;
  }
  if (q.invoer === 'tijd') {
    if (!Number.isInteger(q.antwoord) || q.antwoord < 0 || q.antwoord >= 1440) fout(q, 'ongeldige tijd');
    if (checkAnswer(q, tijd(q.antwoord)).status !== 'goed') fout(q, 'tijd-antwoord wordt fout gerekend');
    if (checkAnswer(q, tijd(q.antwoord + 1)).status !== 'fout') fout(q, 'verkeerde tijd wordt goed gerekend');
    continue;
  }

  // het juiste antwoord, getypt zoals een student dat doet, moet goed gerekend worden
  const invoer = q.breuk ? `${q.breuk[0]}/${q.breuk[1]}` : nl(q.antwoord).replace('−', '-');
  if (checkAnswer(q, invoer).status !== 'goed') fout(q, `juist antwoord "${invoer}" wordt fout gerekend`);
  if (q.voor === '€' && checkAnswer(q, euro(q.antwoord)).status !== 'goed') fout(q, `"${euro(q.antwoord)}" wordt fout gerekend`);
  if (checkAnswer(q, nl(q.antwoord + 1)).status !== 'fout') fout(q, 'antwoord + 1 wordt goed gerekend');
  if (!q.breuk) {
    const terug = parseAnswer(antwoordTekst(q));
    if (terug === null || Math.abs(terug - q.antwoord) > 1e-9 && !(q.alternatieven || []).length) fout(q, `antwoordtekst "${antwoordTekst(q)}" past niet bij ${q.antwoord}`);
  }

  // afronden
  let m = q.vraag.match(/Rond af op (\d) decima/);
  if (m && decimalen(q.antwoord) > Number(m[1])) fout(q, `antwoord ${q.antwoord} heeft te veel decimalen`);
  if (/hele? centen/.test(q.vraag) && decimalen(q.antwoord) > 2) fout(q, 'te veel decimalen voor centen');
  if (/Rond af op een heel getal/.test(q.vraag) && !Number.isInteger(q.antwoord)) fout(q, 'geen heel getal');
  if (q.voor === '€' && decimalen(q.antwoord) > 2) fout(q, `geldbedrag met ${decimalen(q.antwoord)} decimalen: ${q.antwoord}`);
  if (!q.breuk && decimalen(q.antwoord) > 4) fout(q, `onhandig antwoord met veel decimalen: ${q.antwoord}`);

  // telwoorden moeten positieve hele getallen zijn
  if (['busjes', 'kinderen', 'personen', 'bekers', 'dagen', 'blikken', 'pakken', 'weken', 'leerlingen'].includes(q.eenheid) && (!Number.isInteger(q.antwoord) || q.antwoord <= 0)) fout(q, `aantal ${q.eenheid} is geen positief heel getal: ${q.antwoord}`);
  if (/Hoeveel (busjes|kinderen|bekers|blikken|pakken|personen|jongens|meisjes)/.test(q.vraag) && !Number.isInteger(q.antwoord)) fout(q, 'aantal is geen heel getal');

  // ---------- onafhankelijke herberekening ----------
  m = q.vraag.match(/^([\d.,−+×:() ²³⁴⁵⁶⁷√]+)= …$/);
  if (m) {
    const v = evalExpr(m[1].trim());
    if (v === null) waarschuwingen.push(`${q.id}: kon "${m[1]}" niet narekenen`);
    else {
      onafhankelijk++;
      if (Math.abs(v - q.antwoord) > 1e-9) fout(q, `narekenen geeft ${v}, bank zegt ${q.antwoord}: ${q.vraag}`);
    }
  }
  m = q.vraag.match(/^([\d.,]+) (\S+) = … (\S+)$/);
  if (m && EENH[m[2]] && EENH[m[3]]) {
    onafhankelijk++;
    const v = clean((getal(m[1]) * EENH[m[2]]) / EENH[m[3]]);
    if (Math.abs(v - q.antwoord) > 1e-9) fout(q, `omrekenen geeft ${v}, bank zegt ${q.antwoord}: ${q.vraag}`);
  }
  m = q.vraag.match(/^Hoeveel is ([\d,]+)% van ([\d.]+)\?$/);
  if (m) {
    onafhankelijk++;
    const v = clean((getal(m[1]) * getal(m[2])) / 100);
    if (Math.abs(v - q.antwoord) > 1e-9) fout(q, `procent narekenen geeft ${v}`);
  }
  m = q.vraag.match(/^Hoeveel is \[\[(\d+)\/(\d+)\]\] van (\d+)\?$/);
  if (m) {
    onafhankelijk++;
    const v = clean((Number(m[1]) * Number(m[3])) / Number(m[2]));
    if (Math.abs(v - q.antwoord) > 1e-9) fout(q, `breuk-van narekenen geeft ${v}`);
  }
  m = q.vraag.match(/^Hoeveel procent is ([\d.]+) van ([\d.]+)\?/);
  if (m) {
    onafhankelijk++;
    let v = (getal(m[1]) / getal(m[2])) * 100;
    if (/1 decimaal/.test(q.vraag)) v = Math.round(clean(v * 10)) / 10;
    if (Math.abs(clean(v) - q.antwoord) > 1e-9) fout(q, `hoeveel-procent narekenen geeft ${v}`);
  }
  m = q.vraag.match(/^Gegeven is de formule \w+ = (\d+) \+ ([\d,]+) × \w+\.\nBereken \w+ als \w+ = (\d+)\.$/);
  if (m) {
    onafhankelijk++;
    const v = clean(Number(m[1]) + getal(m[2]) * Number(m[3]));
    if (Math.abs(v - q.antwoord) > 1e-9) fout(q, `formule narekenen geeft ${v}`);
  }
  m = q.vraag.match(/^Bereken het gemiddelde van deze getallen:\n(.+)$/);
  if (m) {
    onafhankelijk++;
    const w = m[1].trim().split(/\s+/).map(Number);
    const v = clean(w.reduce((a, b) => a + b, 0) / w.length);
    if (Math.abs(v - q.antwoord) > 1e-9) fout(q, `gemiddelde narekenen geeft ${v}`);
  }

  // consistentie: het antwoord moet in de uitwerking terugkomen
  const vormen = [nl(q.antwoord), antwoordTekst(q).replace(/ [^\d\s]+$/, ''), euro(q.antwoord), nl(q.antwoord, 1), nl(q.antwoord, 2)];
  if (q.breuk) vormen.push(`[[${q.breuk[0]}/${q.breuk[1]}]]`);
  if (!vormen.some((v) => q.uitwerking.includes(v))) waarschuwingen.push(`${q.id} [${q.gen}]: antwoord ${antwoordTekst(q)} staat niet letterlijk in de uitwerking`);
}

// ---------- antwoord-parser ----------
const parserTests = [
  ['52', 52], ['52,00', 52], ['€ 52', 52], ['€52,-', 52], ['1.250', 1250], ['12.500', 12500], ['1,25', 1.25], ['1.25', 1.25],
  ['−7', -7], ['-7', -7], ['- 7', -7], ['3/4', 0.75], ['1 1/2', 1.5], ['37,5%', 37.5], ['12 cm', 12], ['2,5 m²', 2.5],
  ['0,045', 0.045], ['12 500', 12500], ['abc', null], ['', null], ['1/0', null], ['1.000.000', 1000000],
];
for (const [inv, verwacht] of parserTests) {
  const v = parseAnswer(inv);
  if (v !== verwacht) fouten.push(`parseAnswer("${inv}") gaf ${v}, verwacht ${verwacht}`);
}

// ---------- normering ----------
if (schaalscore(0) >= NORM.grens3F) fouten.push('normering: 0 goed geeft al 3F');
if (schaalscore(55) < NORM.grens3F) fouten.push('normering: alles goed geeft geen 3F');
for (let i = 1; i <= 55; i++) if (schaalscore(i) < schaalscore(i - 1)) fouten.push(`normering niet stijgend bij ${i}`);

// ---------- rapport ----------
const perGen = {};
for (const q of alle) perGen[q.gen] = (perGen[q.gen] || 0) + 1;
console.log(`Vragen totaal: ${alle.length} (oefen ${oefen.length}, toets ${alle.length - oefen.length})`);
console.log(`Generatoren: ${ALLE_GENERATORS.length}, gebruikt: ${Object.keys(perGen).length}`);
console.log(`Onafhankelijk nagerekend: ${onafhankelijk} vragen`);
const ongebruikt = ALLE_GENERATORS.filter((g) => !perGen[g.id]).map((g) => g.id);
if (ongebruikt.length) waarschuwingen.push(`Ongebruikte generatoren: ${ongebruikt.join(', ')}`);
if (waarschuwingen.length) {
  console.log(`\n${waarschuwingen.length} waarschuwing(en):`);
  for (const w of waarschuwingen.slice(0, 60)) console.log('  ⚠ ' + w);
}
if (fouten.length) {
  console.error(`\n✗ ${fouten.length} fout(en):`);
  for (const f of fouten.slice(0, 80)) console.error('  ✗ ' + f);
  process.exit(1);
}
console.log('\n✓ Alle controles geslaagd.');
