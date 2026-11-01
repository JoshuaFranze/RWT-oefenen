// Domein Getallen: getalbegrip, hoofdrekenen, bewerkingen, negatieve getallen, kommagetallen.
import { nl, nlh, euro, round, clean, sup, NAMEN } from '../format.js';

const D = 'getallen';

export const generators = [
  // ---------- KAAL ----------
  {
    id: 'g-aftrekken', domein: D, type: 'kaal', calc: false,
    gen(r) {
      if (r.chance(0.5)) {
        const k = r.int(3, 9), m = r.int(1, k - 1);
        const a = k * 1000 + r.int(1, 9);
        const b = m * 1000 - r.int(1, 9);
        const rond = m * 1000;
        return {
          vraag: `${nl(a)} − ${nl(b)} = …`,
          antwoord: a - b,
          uitwerking: `${nl(b)} ligt dicht bij ${nl(rond)}.\n${nl(a)} − ${nl(rond)} = ${nl(a - rond)}.\nJe hebt ${rond - b} te veel afgetrokken, dus tel dat er weer bij: ${nl(a - rond)} + ${rond - b} = ${nl(a - b)}.`,
        };
      }
      const a = r.int(2100, 9800);
      const b = r.int(1100, a - 300);
      const bh = Math.floor(b / 100) * 100;
      return {
        vraag: `${nl(a)} − ${nl(b)} = …`,
        antwoord: a - b,
        uitwerking: `Splits ${nl(b)} in ${nl(bh)} en ${b - bh}.\n${nl(a)} − ${nl(bh)} = ${nl(a - bh)}.\n${nl(a - bh)} − ${b - bh} = ${nl(a - b)}.`,
      };
    },
  },
  {
    id: 'g-vermenigvuldigen-slim', domein: D, type: 'kaal', calc: false,
    gen(r) {
      const v = r.int(0, 4);
      if (v === 0) {
        const q = r.int(3, 30), n = 4 * q;
        return { vraag: `25 × ${n} = …`, antwoord: 25 * n, uitwerking: `25 × 4 = 100.\n${n} = ${q} × 4, dus 25 × ${n} = ${q} × 100 = ${nl(25 * n)}.` };
      }
      if (v === 1) {
        const n = r.int(12, 89);
        return { vraag: `99 × ${n} = …`, antwoord: 99 * n, uitwerking: `99 × ${n} = 100 × ${n} − 1 × ${n}.\n${nl(100 * n)} − ${n} = ${nl(99 * n)}.` };
      }
      if (v === 2) {
        const k = r.int(2, 9), n = 8 * k;
        return { vraag: `125 × ${n} = …`, antwoord: 125 * n, uitwerking: `125 × 8 = 1000.\n${n} = ${k} × 8, dus 125 × ${n} = ${k} × 1000 = ${nl(125 * n)}.` };
      }
      if (v === 3) {
        const n = 2 * r.int(61, 499);
        return { vraag: `${n} × 5 = …`, antwoord: n * 5, uitwerking: `× 5 is hetzelfde als × 10 en dan : 2.\n${n} × 10 = ${nl(n * 10)}, de helft is ${nl(n * 5)}.` };
      }
      const a = r.int(13, 19) , b = r.int(21, 49);
      return { vraag: `${a} × ${b} = …`, antwoord: a * b, uitwerking: `Splits: ${a} × ${b} = 10 × ${b} + ${a - 10} × ${b}.\n${10 * b} + ${(a - 10) * b} = ${a * b}.` };
    },
  },
  {
    id: 'g-delen', domein: D, type: 'kaal', calc: false,
    gen(r) {
      if (r.chance(0.5)) {
        const b = r.pick([20, 30, 40, 50, 60, 80, 25]);
        const q = r.int(12, 90);
        const a = b * q;
        return { vraag: `${nl(a)} : ${b} = …`, antwoord: q, uitwerking: `Tip: maak het jezelf makkelijk.\n${nl(a)} : ${b} = ${q}, want ${q} × ${b} = ${nl(a)}.` };
      }
      const b = r.pick([0.2, 0.5, 0.04, 0.05, 0.25, 0.3, 0.06, 0.4]);
      const q = r.int(4, 60);
      const a = clean(b * q);
      const f = b < 0.1 ? 100 : 10;
      return {
        vraag: `${nl(a)} : ${nl(b)} = …`,
        antwoord: q,
        uitwerking: `Vermenigvuldig beide getallen met ${f}; de uitkomst blijft gelijk.\n${nl(a)} : ${nl(b)} = ${nl(clean(a * f))} : ${nl(clean(b * f))} = ${q}.`,
      };
    },
  },
  {
    id: 'g-komma-maal', domein: D, type: 'kaal', calc: false,
    gen(r) {
      const geen10 = (lo, hi) => { let x; do x = r.int(lo, hi); while (x % 10 === 0); return x; };
      const ai = r.chance(0.6) ? r.int(2, 9) : geen10(11, 49);
      const da = ai < 10 ? r.int(1, 2) : 1;
      const bi = r.int(2, 9);
      const db = r.int(1, 2);
      const a = ai / 10 ** da, b = bi / 10 ** db;
      const p = ai * bi;
      const ans = clean(p / 10 ** (da + db));
      return {
        vraag: `${nl(a)} × ${nl(b)} = …`,
        antwoord: ans,
        uitwerking: `Reken eerst zonder komma: ${ai} × ${bi} = ${p}.\nIn de opgave staan samen ${da + db} cijfers achter de komma, dus ook in de uitkomst: ${nl(ans)}.\nControle met schatten: ${nl(a)} × ${nl(b)} moet kleiner zijn dan ${nl(a)}.`,
      };
    },
  },
  {
    id: 'g-komma-plusmin', domein: D, type: 'kaal', calc: false,
    gen(r) {
      const A = r.int(100, 999) * 10; // honderdsten, 1 decimaal
      const B = r.int(100, 999);
      const C = r.int(3, 95);
      const ans = (A + B - C) / 100;
      return {
        vraag: `${nl(A / 100)} + ${nl(B / 100)} − ${nl(C / 100)} = …`,
        antwoord: clean(ans),
        uitwerking: `Zet de komma's onder elkaar (vul aan met nullen): ${nl(A / 100, 2)} + ${nl(B / 100, 2)} = ${nl((A + B) / 100, 2)}.\nDaarna ${nl((A + B) / 100, 2)} − ${nl(C / 100, 2)} = ${nl(ans, 2)}.`,
      };
    },
  },
  {
    id: 'g-negatief', domein: D, type: 'kaal', calc: false,
    gen(r) {
      const v = r.int(0, 3);
      if (v === 0) {
        const a = -r.int(3, 19), b = r.int(5, 30), c = r.int(10, 40);
        return { vraag: `${nl(a)} + ${b} − ${c} = …`, antwoord: a + b - c, uitwerking: `Denk aan een getallenlijn.\n${nl(a)} + ${b} = ${nl(a + b)}.\n${nl(a + b)} − ${c} = ${nl(a + b - c)}.` };
      }
      if (v === 1) {
        const a = -r.int(3, 12), b = -r.int(3, 12);
        return { vraag: `${nl(a)} × ${nlh(b)} = …`, antwoord: a * b, uitwerking: `Min keer min is plus.\n${-a} × ${-b} = ${a * b}.` };
      }
      if (v === 2) {
        const a = -r.int(5, 25), b = -r.int(2, 15);
        return { vraag: `${nl(a)} − ${nlh(b)} = …`, antwoord: a - b, uitwerking: `Iets negatiefs aftrekken is hetzelfde als optellen: ${nl(a)} − ${nlh(b)} = ${nl(a)} + ${-b}.\nDat is ${nl(a - b)}.` };
      }
      const b = r.int(3, 9), q = -r.int(3, 12);
      return { vraag: `${nl(q * b)} : ${b} = …`, antwoord: q, uitwerking: `Min gedeeld door plus is min.\n${-q * b} : ${b} = ${-q}, dus het antwoord is ${nl(q)}.` };
    },
  },
  {
    id: 'g-machten', domein: D, type: 'kaal', calc: false,
    gen(r) {
      const v = r.int(0, 3);
      if (v === 0) {
        const n = r.int(11, 25);
        return { vraag: `${n}${sup(2)} = …`, antwoord: n * n, uitwerking: `${n}${sup(2)} betekent ${n} × ${n}.\n${n} × ${n} = ${n * n}.` };
      }
      if (v === 1) {
        const n = r.int(11, 20);
        return { vraag: `√${n * n} = …`, antwoord: n, uitwerking: `Zoek het getal dat keer zichzelf ${n * n} is.\n${n} × ${n} = ${n * n}, dus √${n * n} = ${n}.` };
      }
      if (v === 2) {
        const b = r.int(2, 5), e = b === 2 ? r.int(4, 7) : b === 3 ? r.int(3, 4) : 3;
        return { vraag: `${b}${sup(e)} = …`, antwoord: b ** e, uitwerking: `${b}${sup(e)} = ${Array(e).fill(b).join(' × ')} = ${b ** e}.` };
      }
      const a = r.int(2, 9), b = r.int(2, 6);
      return { vraag: `${a}${sup(2)} + ${b}${sup(3)} = …`, antwoord: a * a + b ** 3, uitwerking: `${a}${sup(2)} = ${a * a} en ${b}${sup(3)} = ${b ** 3}.\n${a * a} + ${b ** 3} = ${a * a + b ** 3}.` };
    },
  },
  {
    id: 'g-volgorde', domein: D, type: 'kaal', calc: false,
    gen(r) {
      if (r.chance(0.5)) {
        const a = r.int(2, 20), b = r.int(2, 9), c = r.int(2, 9), e = r.int(2, 6), d = e * r.int(2, 9);
        const ans = a + b * c - d / e;
        return { vraag: `${a} + ${b} × ${c} − ${d} : ${e} = …`, antwoord: ans, uitwerking: `Eerst keer en delen, daarna plus en min.\n${b} × ${c} = ${b * c} en ${d} : ${e} = ${d / e}.\n${a} + ${b * c} − ${d / e} = ${ans}.` };
      }
      const c = r.int(2, 6), q = r.int(2, 9), b = r.int(2, 30), a = b + c * q, d = r.int(2, 9), e = r.int(2, 9);
      const ans = q + d * e;
      return { vraag: `(${a} − ${b}) : ${c} + ${d} × ${e} = …`, antwoord: ans, uitwerking: `Eerst de haakjes: ${a} − ${b} = ${a - b}.\nDan delen en keer: ${a - b} : ${c} = ${q} en ${d} × ${e} = ${d * e}.\nTot slot: ${q} + ${d * e} = ${ans}.` };
    },
  },
  {
    id: 'g-afronden', domein: D, type: 'kaal', calc: false,
    gen(r) {
      if (r.chance(0.55)) {
        let x;
        const d = r.int(1, 2);
        do x = r.int(10001, 99999); while (x % 10 === 0 || (d === 1 && x % 100 === 0));
        x /= 1000;
        const woord = d === 1 ? '1 decimaal (tienden)' : '2 decimalen (honderdsten)';
        const ans = round(x, d);
        return { vraag: `Rond ${nl(x)} af op ${woord}.`, antwoord: ans, antwoordTekst: nl(ans, d), uitwerking: `Kijk naar het cijfer direct na de ${d === 1 ? 'tienden' : 'honderdsten'}.\nIs dat 5 of meer, dan rond je naar boven af; anders naar beneden.\n${nl(x)} wordt ${nl(ans, d)}.` };
      }
      const n = r.int(10001, 99999);
      const [stap, woord] = r.pick([[100, 'honderdtallen'], [1000, 'duizendtallen'], [10, 'tientallen']]);
      const ans = Math.round(n / stap) * stap;
      return { vraag: `Rond ${nl(n)} af op ${woord}.`, antwoord: ans, uitwerking: `${nl(n)} ligt tussen ${nl(Math.floor(n / stap) * stap)} en ${nl(Math.floor(n / stap) * stap + stap)}.\nHet ligt het dichtst bij ${nl(ans)}.` };
    },
  },
  {
    id: 'g-schatten', domein: D, type: 'kaal', calc: false,
    gen(r) {
      const R1 = r.pick([20, 30, 40, 50, 60, 70, 80]);
      const R2 = r.pick([20, 30, 40, 50, 60, 200, 300]);
      const off = () => { let o; do o = r.int(-4, 4); while (o === 0); return o / 10; };
      const a = clean(R1 + off()), b = clean(R2 + off());
      const p = R1 * R2;
      const opties = [p / 10, p, p * 10, p * 100].map((x) => nl(x));
      return {
        vraag: `Welke uitkomst ligt het dichtst bij ${nl(a)} × ${nl(b)}?\nReken niet precies uit, maar schat.`,
        invoer: 'keuze', opties, antwoord: nl(p),
        uitwerking: `Rond af: ${nl(a)} ≈ ${R1} en ${nl(b)} ≈ ${R2}.\n${R1} × ${R2} = ${nl(p)}.\n(Precies is het ${nl(round(a * b, 2))}.)`,
      };
    },
  },
  {
    id: 'g-getalbegrip', domein: D, type: 'kaal', calc: false,
    gen(r) {
      const v = r.int(0, 2);
      if (v === 0) {
        const A = r.int(15, 90) * 10, B = A + 2 * r.int(3, 45);
        const M = (A + B) / 2;
        return { vraag: `Welk getal ligt precies midden tussen ${nl(A / 100)} en ${nl(B / 100)}?`, antwoord: clean(M / 100), uitwerking: `Tel op en deel door 2.\n${nl(A / 100)} + ${nl(B / 100)} = ${nl((A + B) / 100)}.\n${nl((A + B) / 100)} : 2 = ${nl(M / 100)}.` };
      }
      if (v === 1) {
        const x = r.int(11, 99) / 10;
        const [eenheid, f] = r.pick([['tienden', 10], ['honderdsten', 100], ['duizendsten', 1000]]);
        return { vraag: `Hoeveel ${eenheid} zijn ${nl(x)}?`, antwoord: clean(x * f), uitwerking: `1 = ${f} ${eenheid}.\n${nl(x)} × ${f} = ${nl(clean(x * f))} ${eenheid}.` };
      }
      const x = r.int(11, 999) / 1000;
      const [woord, f] = r.pick([['10 keer zo groot', 10], ['100 keer zo groot', 100], ['1000 keer zo groot', 1000], ['10 keer zo klein', 0.1], ['100 keer zo klein', 0.01]]);
      const ans = clean(x * f);
      return { vraag: `Welk getal is ${woord} als ${nl(x)}?`, antwoord: ans, uitwerking: `${f > 1 ? `Keer ${f}: de komma schuift ${Math.log10(f)} plaats(en) naar rechts.` : `Gedeeld door ${round(1 / f)}: de komma schuift ${round(-Math.log10(f))} plaats(en) naar links.`}\n${nl(x)} wordt ${nl(ans)}.` };
    },
  },
  {
    id: 'g-rekenmachine', domein: D, type: 'kaal', calc: true,
    gen(r) {
      const v = r.int(0, 2);
      if (v === 0) {
        const A = r.int(1000, 9999), B = r.int(100, 999), C = r.int(1000, 9999);
        const exact = (A * B) / 1000 - C / 10;
        const ans = round(exact, 1);
        return { vraag: `Bereken ${nl(A / 100)} × ${nl(B / 10)} − ${nl(C / 10)}.\nRond af op 1 decimaal.`, antwoord: ans, antwoordTekst: nl(ans, 1), uitwerking: `Eerst keer: ${nl(A / 100)} × ${nl(B / 10)} = ${nl(clean((A * B) / 1000))}.\nDan min: ${nl(clean((A * B) / 1000))} − ${nl(C / 10)} = ${nl(clean(exact))}.\nAfgerond: ${nl(ans, 1)}.` };
      }
      if (v === 1) {
        let a, b;
        do { a = r.int(1000, 9999); b = r.int(13, 47); } while (a % b === 0);
        const ans = round(a / b, 2);
        return { vraag: `Bereken ${nl(a)} : ${b}.\nRond af op 2 decimalen.`, antwoord: ans, antwoordTekst: nl(ans, 2), uitwerking: `${nl(a)} : ${b} = ${nl(round(a / b, 5))}…\nKijk naar het derde cijfer achter de komma om af te ronden: ${nl(ans, 2)}.` };
      }
      let n;
      do n = r.int(120, 990); while (Number.isInteger(Math.sqrt(n)));
      const ans = round(Math.sqrt(n), 1);
      return { vraag: `Bereken √${n}.\nRond af op 1 decimaal.`, antwoord: ans, antwoordTekst: nl(ans, 1), uitwerking: `√${n} = ${nl(round(Math.sqrt(n), 4))}…\nAfgerond op 1 decimaal: ${nl(ans, 1)}.\nControle: ${nl(ans, 1)} × ${nl(ans, 1)} ≈ ${nl(round(ans * ans, 1))}.` };
    },
  },

  // ---------- CONTEXT ----------
  {
    id: 'gc-temperatuur', domein: D, type: 'context', calc: false,
    gen(r) {
      if (r.chance(0.5)) {
        const t1 = -r.int(2, 12), d = r.int(5, 18);
        const tijd1 = r.pick(['06:00', '05:00', '07:00']), tijd2 = r.pick(['13:00', '14:00', '15:00']);
        return { vraag: `Om ${tijd1} is het in Enschede ${nl(t1)} °C. Tot ${tijd2} stijgt de temperatuur ${d} graden.\nHoe warm is het om ${tijd2}?`, antwoord: t1 + d, eenheid: '°C', uitwerking: `Begin bij ${nl(t1)} en ga ${d} stappen omhoog.\n${nl(t1)} + ${d} = ${nl(t1 + d)} °C.` };
      }
      const [stadA, stadB] = r.sample(['Moskou', 'Oslo', 'Helsinki', 'Reykjavik', 'Warschau'], 2);
      const stadC = r.pick(['Rome', 'Lissabon', 'Athene', 'Madrid', 'Malaga']);
      const tA = -r.int(4, 22), tC = r.int(6, 21);
      void stadB;
      return { vraag: `Op een winterdag is het in ${stadA} ${nl(tA)} °C en in ${stadC} ${tC} °C.\nHoeveel graden is het in ${stadC} warmer dan in ${stadA}?`, antwoord: tC - tA, eenheid: 'graden', uitwerking: `Van ${nl(tA)} naar 0 is ${-tA} graden. Van 0 naar ${tC} is ${tC} graden.\nSamen: ${-tA} + ${tC} = ${tC - tA} graden.` };
    },
  },
  {
    id: 'gc-wisselgeld', domein: D, type: 'context', calc: false,
    gen(r) {
      const naam = r.pick(NAMEN);
      const items = r.sample([['een schrift', 95, 250], ['een pen', 99, 399], ['een liniaal', 75, 249], ['een gum', 45, 125], ['een etui', 395, 895], ['een agenda', 495, 1295], ['een rekenmachine', 795, 1595], ['een tas', 1295, 2495]], 3);
      const prijzen = items.map(([, lo, hi]) => 5 * r.int(Math.ceil(lo / 5), Math.floor(hi / 5)));
      const tot = prijzen.reduce((a, b) => a + b, 0);
      const biljet = tot < 2000 ? 2000 : tot < 5000 ? 5000 : 10000;
      return {
        vraag: `${naam} koopt ${((l) => l.slice(0, -1).join(', ') + ' en ' + l[l.length - 1])(items.map(([n], i) => `${n} van ${euro(prijzen[i] / 100)}`))}.\n${naam} betaalt met een biljet van ${euro(biljet / 100)}.\nHoeveel geld krijgt ${naam} terug?`,
        antwoord: (biljet - tot) / 100, voor: '€',
        uitwerking: `Totaal: ${prijzen.map((p) => euro(p / 100)).join(' + ')} = ${euro(tot / 100)}.\nTerug: ${euro(biljet / 100)} − ${euro(tot / 100)} = ${euro((biljet - tot) / 100)}.`,
      };
    },
  },
  {
    id: 'gc-busjes', domein: D, type: 'context', calc: false,
    gen(r) {
      if (r.chance(0.55)) {
        let n, k, c;
        do { n = r.int(23, 95); k = r.int(3, 8); c = r.pick([5, 6, 7, 8, 9]); } while ((n + k) % c === 0);
        const ans = Math.ceil((n + k) / c);
        return { vraag: `Groep 7 en 8 gaan op excursie: ${n} kinderen en ${k} begeleiders. Ze gaan met busjes waarin ${c} personen passen (de chauffeur niet meegerekend).\nHoeveel busjes zijn er minstens nodig?`, antwoord: ans, eenheid: 'busjes', uitwerking: `Totaal: ${n} + ${k} = ${n + k} personen.\n${n + k} : ${c} = ${Math.floor((n + k) / c)} rest ${(n + k) % c}.\nOok voor de laatste ${(n + k) % c} ${(n + k) % c === 1 ? 'persoon' : 'personen'} is een busje nodig, dus ${ans} busjes.` };
      }
      let tot, per;
      do { per = r.int(3, 6); tot = r.int(40, 150); } while (tot % per === 0);
      const ding = r.pick([['stickers', 'stickers'], ['knikkers', 'knikkers'], ['kralen', 'kralen'], ['koekjes', 'koekjes']]);
      const ans = Math.floor(tot / per);
      return { vraag: `De juf heeft ${tot} ${ding[0]}. Elk kind krijgt er ${per}.\nHoeveel kinderen kunnen er ${per} ${ding[1]} krijgen?`, antwoord: ans, eenheid: 'kinderen', uitwerking: `${tot} : ${per} = ${ans} rest ${tot % per}.\nDe rest is niet genoeg voor nog een kind, dus ${ans} kinderen.` };
    },
  },
  {
    id: 'gc-loon', domein: D, type: 'context', calc: true,
    gen(r) {
      const naam = r.pick(NAMEN);
      const loon = 2 * r.int(560, 820); // centen, even
      const uren = r.pick([3, 3.5, 4, 4.5, 5, 6, 2.5]);
      const dagen = r.int(2, 5);
      const tot = (loon * uren * dagen) / 100;
      return { vraag: `${naam} werkt in een supermarkt en verdient ${euro(loon / 100)} per uur. ${naam} werkt ${dagen} dagen per week, elke dag ${nl(uren)} uur.\nHoeveel verdient ${naam} per week?`, antwoord: clean(tot), voor: '€', uitwerking: `Uren per week: ${dagen} × ${nl(uren)} = ${nl(dagen * uren)} uur.\n${nl(dagen * uren)} × ${euro(loon / 100)} = ${euro(tot)}.` };
    },
  },
  {
    id: 'gc-saldo', domein: D, type: 'context', calc: true,
    gen(r) {
      const naam = r.pick(NAMEN);
      const S = -r.int(1500, 8000), st = r.int(50, 250) * 100, u = r.int(1000, 9999);
      const nieuw = S + st - u;
      return { vraag: `Op de bankrekening van ${naam} staat ${euro(S / 100).replace('€ −', '−€ ')} (rood). ${naam} krijgt ${euro(st / 100)} salaris bijgeschreven en betaalt daarna een rekening van ${euro(u / 100)}.\nWat is het nieuwe saldo? Een tekort schrijf je met een minteken.`, antwoord: clean(nieuw / 100), voor: '€', uitwerking: `${nl(S / 100, 2)} + ${nl(st / 100, 2)} = ${nl((S + st) / 100, 2)}.\n${nl((S + st) / 100, 2)} − ${nl(u / 100, 2)} = ${nl(nieuw / 100, 2)}.\nHet nieuwe saldo is ${euro(nieuw / 100)}.` };
    },
  },
  {
    id: 'gc-productie', domein: D, type: 'context', calc: true,
    gen(r) {
      const p = r.int(12, 48) * 50, u = r.pick([6, 7.5, 8, 6.5]), d = r.pick([5, 4, 6]);
      const product = r.pick(['flessen', 'blikjes', 'potten pindakaas', 'pakken melk']);
      const ans = p * u * d;
      return { vraag: `Een fabriek vult ${nl(p)} ${product} per uur. De machine draait ${nl(u)} uur per dag, ${d} dagen per week.\nHoeveel ${product} zijn dat per week?`, antwoord: ans, uitwerking: `Per dag: ${nl(p)} × ${nl(u)} = ${nl(p * u)}.\nPer week: ${nl(p * u)} × ${d} = ${nl(ans)}.` };
    },
  },
  {
    id: 'gc-grote-getallen', domein: D, type: 'context', calc: false,
    gen(r) {
      if (r.chance(0.5)) {
        const x = r.int(11, 99) / r.pick([10, 100]);
        const wat = r.pick(['Een tv-programma had', 'Een filmpje op internet is bekeken door', 'Een festival trok in totaal', 'Een land heeft']);
        const achter = wat.endsWith('heeft') ? 'inwoners' : wat.includes('bekeken') ? 'mensen' : wat.includes('tv') ? 'kijkers' : 'bezoekers';
        return { vraag: `${wat} ${nl(x)} miljoen ${achter}.\nSchrijf dit aantal als een gewoon getal.`, antwoord: clean(x * 1e6), uitwerking: `1 miljoen = 1.000.000.\n${nl(x)} × 1.000.000 = ${nl(clean(x * 1e6))}.` };
      }
      const v = r.pick([2.5, 3, 7.5, 4, 8, 1.5]);
      return { vraag: `Een satelliet legt ${nl(v)} km per seconde af.\nHoeveel kilometer is dat per uur?`, antwoord: clean(v * 3600), eenheid: 'km', uitwerking: `1 uur = 60 × 60 = 3600 seconden.\n${nl(v)} × 3600 = ${nl(clean(v * 3600))} km.` };
    },
  },
  {
    id: 'gc-verst', domein: D, type: 'context', calc: false,
    gen(r) {
      const basis = r.int(2, 4);
      const delen = r.sample([0.5, 0.45, 0.405, 0.54, 0.045, 0.504, 0.055, 0.4], 4);
      const namen = r.sample(NAMEN, 4);
      const waarden = delen.map((d) => clean(basis + d));
      const verst = r.chance(0.6);
      const doel = verst ? Math.max(...waarden) : Math.min(...waarden);
      const winnaar = namen[waarden.indexOf(doel)];
      const sport = r.pick(['verspringen', 'hoogspringen']);
      void sport;
      return {
        vraag: `Bij verspringen springen vier kinderen:\n${namen.map((n, i) => `${n}: ${nl(waarden[i])} m`).join('\n')}\nWie sprong het ${verst ? 'verst' : 'minst ver'}?`,
        invoer: 'keuze', opties: namen, antwoord: winnaar,
        uitwerking: `Vul aan tot hetzelfde aantal decimalen: ${waarden.map((w) => nl(w, 3)).join('; ')}.\nNu kun je ze makkelijk vergelijken: ${winnaar} sprong ${nl(doel)} m.`,
      };
    },
  },
  {
    id: 'gc-sparen', domein: D, type: 'context', calc: true,
    gen(r) {
      const naam = r.pick(NAMEN);
      let per, doel;
      do { per = r.pick([175, 225, 250, 275, 325, 350, 375, 450]); doel = r.int(25, 120) * 100 + r.pick([0, 50, 95, 99]); } while (doel % per === 0);
      const ans = Math.ceil(doel / per);
      const ding = r.pick(['een spel', 'een step', 'een paar schoenen', 'een koptelefoon', 'een skateboard']);
      return { vraag: `${naam} spaart elke week ${euro(per / 100)} voor ${ding} van ${euro(doel / 100)}.\nNa hoeveel weken heeft ${naam} genoeg geld?`, antwoord: ans, eenheid: 'weken', uitwerking: `${euro(doel / 100)} : ${euro(per / 100)} = ${nl(round(doel / per, 2))}…\nNa ${ans - 1} weken is het nog net niet genoeg (${euro(((ans - 1) * per) / 100)}), na ${ans} weken wel (${euro((ans * per) / 100)}).` };
    },
  },
  {
    id: 'gc-kassa-afronden', domein: D, type: 'context', calc: false,
    gen(r) {
      let c;
      do c = r.int(500, 4999); while (c % 5 === 0);
      const afg = Math.round(c / 5) * 5;
      return { vraag: `In Nederland wordt bij contant betalen het totaalbedrag afgerond op 5 cent.\nBij de bakker kost je boodschappen ${euro(c / 100)}. Je betaalt contant.\nHoeveel moet je betalen?`, antwoord: afg / 100, voor: '€', uitwerking: `Bedragen eindigend op 1 of 2 cent rond je af naar 0, op 3 of 4 naar 5, op 6 of 7 naar 5, en op 8 of 9 naar 10.\n${euro(c / 100)} wordt ${euro(afg / 100)}.` };
    },
  },
  {
    id: 'gc-rekening-delen', domein: D, type: 'context', calc: true,
    gen(r) {
      let tot, n;
      do { tot = r.int(2500, 18000); n = r.pick([3, 6, 7, 9, 11, 12]); } while (tot % n === 0);
      const ans = round(tot / 100 / n, 2);
      const waar = r.pick(['een etentje', 'een cadeau voor de juf', 'pizza', 'een uitje naar de bioscoop']);
      return { vraag: `${n} vrienden betalen samen ${waar}. Het kost in totaal ${euro(tot / 100)}. Iedereen betaalt evenveel.\nHoeveel betaalt ieder? Rond af op hele centen.`, antwoord: ans, voor: '€', uitwerking: `${euro(tot / 100)} : ${n} = ${nl(round(tot / 100 / n, 4))}…\nAfgerond op centen: ${euro(ans)}.` };
    },
  },
];
