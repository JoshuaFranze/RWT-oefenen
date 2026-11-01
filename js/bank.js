// Bouwt de complete vragenbank: 4 domeinen × (50 kaal + 50 context) = 400 oefenvragen
// en 10 oefentoetsen van 55 vragen (17 zonder + 38 met rekenmachine).
// Alles is deterministisch (vaste seeds) en elke vraagtekst is uniek over de hele bank.

import { makeRng } from './rng.js';
import { generators as G } from './generators/getallen.js';
import { generators as V } from './generators/verhoudingen.js';
import { generators as M } from './generators/meten.js';
import { generators as B } from './generators/verbanden.js';

export const BANK_VERSIE = 1;

export const DOMEINEN = [
  { id: 'getallen', naam: 'Getallen', kort: 'G', kleur: 'sky', omschrijving: 'Hoofdrekenen, bewerkingen, negatieve getallen en kommagetallen' },
  { id: 'verhoudingen', naam: 'Verhoudingen', kort: 'V', kleur: 'violet', omschrijving: 'Procenten, breuken, verhoudingen en schaal' },
  { id: 'meten', naam: 'Meten & Meetkunde', kort: 'M', kleur: 'amber', omschrijving: 'Metriek stelsel, oppervlakte, inhoud, tijd en snelheid' },
  { id: 'verbanden', naam: 'Verbanden', kort: 'B', kleur: 'emerald', omschrijving: 'Formules, tabellen, grafieken en gemiddelden' },
];

export const ALLE_GENERATORS = [...G, ...V, ...M, ...B];

const PER_CEL = 50;
export const TOETS_AANTAL = 10;
export const TOETS_OPBOUW = {
  deel1: [ // zonder rekenmachine: 17
    ['getallen', 'kaal', 5], ['verhoudingen', 'kaal', 4], ['meten', 'kaal', 4], ['verbanden', 'kaal', 2],
    ['getallen', 'context', 1], ['verhoudingen', 'context', 1],
  ],
  deel2: [ // met rekenmachine: 38
    ['getallen', 'kaal', 2], ['getallen', 'context', 6],
    ['verhoudingen', 'kaal', 2], ['verhoudingen', 'context', 9],
    ['meten', 'kaal', 2], ['meten', 'context', 9],
    ['verbanden', 'kaal', 2], ['verbanden', 'context', 6],
  ],
};

const VELDEN = ['vraag', 'antwoord', 'uitwerking', 'voor', 'eenheid', 'invoer', 'opties', 'optieWeergave', 'breuk', 'alternatieven', 'antwoordTekst', 'tabel', 'grafiek'];

function sleutel(q) {
  return q.vraag + '|' + JSON.stringify(q.tabel || '') + JSON.stringify(q.grafiek || '') + JSON.stringify(q.opties || '');
}

function maakVraag(gen, rng, gezien, id, extra) {
  for (let poging = 0; poging < 400; poging++) {
    const ruw = gen.gen(rng);
    const k = sleutel(ruw);
    if (gezien.has(k)) continue;
    gezien.add(k);
    const q = { id, domein: gen.domein, type: gen.type, calc: gen.calc, gen: gen.id, ...extra };
    for (const v of VELDEN) if (ruw[v] !== undefined) q[v] = ruw[v];
    return q;
  }
  return null;
}

function kies(domein, type, filter) {
  return ALLE_GENERATORS.filter((g) => g.domein === domein && g.type === type && (!filter || filter(g)));
}

let _cache = null;

export function bouwBank() {
  if (_cache) return _cache;
  const gezien = new Set();
  const oefen = [];
  for (const d of DOMEINEN) {
    for (const type of ['kaal', 'context']) {
      const rng = makeRng(`oefen-${d.id}-${type}-v${BANK_VERSIE}`);
      const gens = rng.shuffle(kies(d.id, type));
      let i = 0;
      while (oefen.filter((q) => q.domein === d.id && q.type === type).length < PER_CEL) {
        const g = gens[i % gens.length];
        const nr = String(oefen.filter((q) => q.domein === d.id && q.type === type).length + 1).padStart(2, '0');
        const q = maakVraag(g, rng, gezien, `${d.kort}-${type === 'kaal' ? 'K' : 'C'}-${nr}`, { bron: 'oefen' });
        if (q) oefen.push(q);
        i++;
        if (i > 5000) throw new Error(`Kan geen ${PER_CEL} unieke vragen maken voor ${d.id}/${type}`);
      }
    }
  }

  const toetsen = [];
  for (let t = 1; t <= TOETS_AANTAL; t++) {
    const rng = makeRng(`toets-${t}-v${BANK_VERSIE}`);
    const vragen = [];
    for (const [deelNaam, opbouw] of Object.entries(TOETS_OPBOUW)) {
      const deel = deelNaam === 'deel1' ? 1 : 2;
      const deelVragen = [];
      for (const [domein, type, aantal] of opbouw) {
        // deel 1: alleen vragen die zonder rekenmachine te doen zijn
        let gens = kies(domein, type, deel === 1 ? (g) => !g.calc : null);
        // deel 2: bij kale sommen bij voorkeur echte rekenmachine-sommen
        if (deel === 2 && type === 'kaal') {
          const rm = gens.filter((g) => g.calc);
          if (rm.length) gens = [...rm, ...rng.sample(gens.filter((g) => !g.calc), 2)];
        }
        gens = rng.shuffle(gens);
        for (let k = 0; k < aantal; k++) {
          const g = gens[(k + t) % gens.length];
          const q = maakVraag(g, rng, gezien, '', { bron: 'toets', toets: t, deel, calc: deel === 2 });
          if (!q) throw new Error(`Toets ${t}: geen unieke vraag voor ${g.id}`);
          deelVragen.push(q);
        }
      }
      // binnen een deel de vragen door elkaar
      vragen.push(...rng.shuffle(deelVragen));
    }
    vragen.forEach((q, i) => (q.id = `T${String(t).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`));
    toetsen.push({ nr: t, titel: `Oefentoets ${t}`, vragen });
  }

  _cache = { oefen, toetsen, perId: new Map([...oefen, ...toetsen.flatMap((t) => t.vragen)].map((q) => [q.id, q])) };
  return _cache;
}
