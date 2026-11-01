// Domein Verhoudingen: procenten, breuken, verhoudingstabellen, schaal.
import { nl, euro, round, clean, fr, fracText, simplify, lcm, gcd, NAMEN } from '../format.js';

const D = 'verhoudingen';

function breukPaar(r, noemers) {
  const d = r.pick(noemers);
  let n;
  do n = r.int(1, d - 1); while (gcd(n, d) !== 1);
  return [n, d];
}

export const generators = [
  // ---------- KAAL ----------
  {
    id: 'v-procent-van', domein: D, type: 'kaal', calc: false,
    gen(r) {
      const p = r.pick([10, 20, 25, 30, 40, 60, 75, 15, 35, 5, 12.5, 120, 150, 110]);
      const base = 40 * r.int(2, 30);
      const ans = clean((p * base) / 100);
      const tien = base / 10;
      let uitw;
      if (p === 25) uitw = `25% = ${fr(1, 4)} deel.\n${nl(base)} : 4 = ${nl(ans)}.`;
      else if (p === 75) uitw = `75% = ${fr(3, 4)} deel.\n${nl(base)} : 4 = ${nl(base / 4)}, keer 3 = ${nl(ans)}.`;
      else if (p === 12.5) uitw = `12,5% = ${fr(1, 8)} deel.\n${nl(base)} : 8 = ${nl(ans)}.`;
      else if (p === 5) uitw = `10% van ${nl(base)} = ${nl(tien)}.\n5% is de helft daarvan: ${nl(ans)}.`;
      else if (p % 10 === 5) uitw = `10% van ${nl(base)} = ${nl(tien)}, 5% = ${nl(tien / 2)}.\n${p}% = ${(p - 5) / 10} × ${nl(tien)} + ${nl(tien / 2)} = ${nl(ans)}.`;
      else uitw = `10% van ${nl(base)} = ${nl(tien)}.\n${p}% = ${p / 10} × ${nl(tien)} = ${nl(ans)}.`;
      return { vraag: `Hoeveel is ${nl(p)}% van ${nl(base)}?`, antwoord: ans, uitwerking: uitw };
    },
  },
  {
    id: 'v-breuk-van', domein: D, type: 'kaal', calc: false,
    gen(r) {
      const [n, d] = breukPaar(r, [3, 4, 5, 6, 8, 12, 7]);
      const base = d * r.int(3, 25);
      const ans = (n * base) / d;
      return { vraag: `Hoeveel is ${fr(n, d)} van ${base}?`, antwoord: ans, uitwerking: n === 1 ? `${fr(1, d)} deel van ${base} is ${base} : ${d} = ${ans}.` : `Eerst ${fr(1, d)} deel: ${base} : ${d} = ${base / d}.\nDan ${fr(n, d)} deel: ${n} × ${base / d} = ${ans}.` };
    },
  },
  {
    id: 'v-breuken-plusmin', domein: D, type: 'kaal', calc: false,
    gen(r) {
      let a, b;
      do { a = breukPaar(r, [2, 3, 4, 5, 6, 8, 10, 12]); b = breukPaar(r, [2, 3, 4, 5, 6, 8, 10, 12]); } while (a[1] === b[1]);
      const plus = r.chance(0.55);
      if (!plus && a[0] / a[1] < b[0] / b[1]) [a, b] = [b, a];
      const heel = r.chance(0.35) ? r.int(1, 3) : 0;
      const L = lcm(a[1], b[1]);
      const an = a[0] * (L / a[1]) + heel * L, bn = b[0] * (L / b[1]);
      const tn = plus ? an + bn : an - bn;
      const eerste = heel ? `${heel} ${fr(a[0], a[1])}` : fr(a[0], a[1]);
      const [st, sm] = simplify(tn, L);
      return {
        vraag: `${eerste} ${plus ? '+' : '−'} ${fr(b[0], b[1])} = …\nGeef je antwoord als breuk of gemengd getal.`,
        antwoord: clean(tn / L), breuk: [tn, L], antwoordTekst: fracText(tn, L),
        uitwerking: `Maak de noemers gelijk: ${L} is een veelvoud van ${a[1]} en ${b[1]}.\n${[[eerste, an, a[1] === L && !heel], [fr(b[0], b[1]), bn, b[1] === L]].filter(([, , gelijk]) => !gelijk).map(([t, n]) => `${t} = ${fr(n, L)}`).join(' en ') || 'De noemers zijn al gelijk'}.\n${fr(an, L)} ${plus ? '+' : '−'} ${fr(bn, L)} = ${fr(tn, L)}${st !== tn || sm !== L ? ` = ${fracText(tn, L)}` : ''}.`,
      };
    },
  },
  {
    id: 'v-breuken-keer-deel', domein: D, type: 'kaal', calc: false,
    gen(r) {
      const v = r.int(0, 2);
      if (v === 0) {
        const a = breukPaar(r, [2, 3, 4, 5, 6, 7, 8]), b = breukPaar(r, [2, 3, 4, 5, 6, 9]);
        const t = a[0] * b[0], n = a[1] * b[1];
        return { vraag: `${fr(...a)} × ${fr(...b)} = …\nGeef je antwoord als breuk.`, antwoord: clean(t / n), breuk: [t, n], antwoordTekst: fracText(t, n), uitwerking: `Teller keer teller en noemer keer noemer.\n${fr(...a)} × ${fr(...b)} = ${fr(t, n)}${gcd(t, n) > 1 ? ` = ${fracText(t, n)}` : ''}.` };
      }
      if (v === 1) {
        const a = breukPaar(r, [3, 4, 5, 7, 8, 9]), k = r.int(2, 6);
        const t = a[0] * k, n = a[1];
        return { vraag: `${k} × ${fr(...a)} = …\nGeef je antwoord als breuk of gemengd getal.`, antwoord: clean(t / n), breuk: [t, n], antwoordTekst: fracText(t, n), uitwerking: `${k} × ${fr(...a)} = ${fr(t, n)}${t >= n || gcd(t, n) > 1 ? ` = ${fracText(t, n)}` : ''}.` };
      }
      const a = breukPaar(r, [2, 3, 4, 5, 6]), b = breukPaar(r, [2, 3, 4, 6, 8, 10]);
      const t = a[0] * b[1], n = a[1] * b[0];
      return { vraag: `${fr(...a)} : ${fr(...b)} = …\nGeef je antwoord als breuk, gemengd getal of heel getal.`, antwoord: clean(t / n), breuk: [t, n], antwoordTekst: fracText(t, n), uitwerking: `Delen door een breuk is vermenigvuldigen met het omgekeerde.\n${fr(...a)} : ${fr(...b)} = ${fr(...a)} × ${fr(b[1], b[0])} = ${fr(t, n)}${gcd(t, n) > 1 || t >= n ? ` = ${fracText(t, n)}` : ''}.` };
    },
  },
  {
    id: 'v-omzetten', domein: D, type: 'kaal', calc: false,
    gen(r) {
      const v = r.int(0, 3);
      if (v === 0) {
        const [n, d] = breukPaar(r, [2, 4, 5, 8, 20, 25, 40]);
        return { vraag: `Schrijf ${fr(n, d)} als kommagetal.`, antwoord: clean(n / d), uitwerking: `${fr(n, d)} = ${n} : ${d} = ${nl(clean(n / d))}.` };
      }
      if (v === 1) {
        const x = r.pick([r.int(1, 99) / 100, r.int(1, 99) / 1000, r.int(101, 250) / 100]);
        return { vraag: `Schrijf ${nl(x)} als percentage.`, antwoord: clean(x * 100), eenheid: '%', uitwerking: `1 = 100%, dus vermenigvuldig met 100.\n${nl(x)} × 100 = ${nl(clean(x * 100))}%.` };
      }
      if (v === 2) {
        const p = r.pick([r.int(1, 99), r.int(1, 99) + 0.5, r.int(101, 180)]);
        return { vraag: `Schrijf ${nl(p)}% als kommagetal.`, antwoord: clean(p / 100), uitwerking: `Procent betekent "per honderd", dus deel door 100.\n${nl(p)} : 100 = ${nl(clean(p / 100))}.` };
      }
      const [n, d] = breukPaar(r, [4, 5, 8, 20, 25, 40, 50]);
      return { vraag: `Schrijf ${fr(n, d)} als percentage.`, antwoord: clean((n / d) * 100), eenheid: '%', uitwerking: `${fr(n, d)} = ${n} : ${d} = ${nl(clean(n / d))}.\n${nl(clean(n / d))} × 100 = ${nl(clean((n / d) * 100))}%.` };
    },
  },
  {
    id: 'v-hoeveel-procent', domein: D, type: 'kaal', calc: false,
    gen(r) {
      const whole = r.pick([20, 25, 40, 50, 80, 200, 400, 120, 60, 250, 500]);
      let p, part;
      do { p = 5 * r.int(1, 19); part = (p * whole) / 100; } while (!Number.isInteger(part));
      return { vraag: `Hoeveel procent is ${nl(part)} van ${nl(whole)}?`, antwoord: p, eenheid: '%', uitwerking: `Deel het deel door het geheel: ${nl(part)} : ${nl(whole)} = ${nl(clean(part / whole))}.\n${nl(clean(part / whole))} × 100 = ${p}%.` };
    },
  },
  {
    id: 'v-verhoudingstabel', domein: D, type: 'kaal', calc: false,
    gen(r) {
      let a, b;
      do { a = r.int(2, 9); b = r.int(2, 15); } while (a === b);
      const k = r.pick([1.5, 2.5, 3, 4, 6, 0.5, 5, 7]);
      const c = clean(a * k), ans = clean(b * k);
      return { vraag: `Maak de verhouding gelijk:\n${a} : ${b} = ${nl(c)} : …`, antwoord: ans, uitwerking: `Van ${a} naar ${nl(c)} is keer ${nl(k)}.\nDus ook ${b} × ${nl(k)} = ${nl(ans)}.` };
    },
  },
  {
    id: 'v-schaal', domein: D, type: 'kaal', calc: false,
    gen(r) {
      const s = r.pick([10000, 20000, 25000, 50000, 100000, 200000]);
      if (r.chance(0.6)) {
        const cm = r.int(2, 15) + r.pick([0, 0.5]);
        const km = clean((cm * s) / 100000);
        return { vraag: `Op een kaart met schaal 1 : ${nl(s)} is een afstand ${nl(cm)} cm.\nHoeveel km is dat in werkelijkheid?`, antwoord: km, eenheid: 'km', uitwerking: `1 cm op de kaart = ${nl(s)} cm in het echt = ${nl(s / 100000)} km.\n${nl(cm)} × ${nl(s / 100000)} = ${nl(km)} km.` };
      }
      const cm = r.int(2, 12);
      const km = clean((cm * s) / 100000);
      return { vraag: `Twee dorpen liggen in werkelijkheid ${nl(km)} km van elkaar.\nHoeveel cm is dat op een kaart met schaal 1 : ${nl(s)}?`, antwoord: cm, eenheid: 'cm', uitwerking: `1 cm op de kaart = ${nl(s / 100000)} km in het echt.\n${nl(km)} : ${nl(s / 100000)} = ${cm} cm.` };
    },
  },
  {
    id: 'v-breuken-vergelijken', domein: D, type: 'kaal', calc: false,
    gen(r) {
      let br;
      do {
        br = Array.from({ length: 4 }, () => breukPaar(r, [3, 4, 5, 6, 7, 8, 9, 10, 12]));
      } while (new Set(br.map(([n, d]) => (n / d).toFixed(6))).size < 4);
      const grootst = r.chance(0.6);
      const w = br.map(([n, d]) => n / d);
      const doel = grootst ? Math.max(...w) : Math.min(...w);
      const idx = w.indexOf(doel);
      const opties = br.map(([n, d]) => `${n}/${d}`);
      return {
        vraag: `Welke breuk is het ${grootst ? 'grootst' : 'kleinst'}?`,
        invoer: 'keuze', opties, optieWeergave: br.map(([n, d]) => fr(n, d)), antwoord: opties[idx],
        uitwerking: `Reken elke breuk om naar een kommagetal:\n${br.map(([n, d]) => `${fr(n, d)} ≈ ${nl(round(n / d, 3))}`).join('\n')}\nDe ${grootst ? 'grootste' : 'kleinste'} is ${fr(...br[idx])}.`,
      };
    },
  },
  {
    id: 'v-vermeerderen', domein: D, type: 'kaal', calc: false,
    gen(r) {
      const base = 20 * r.int(2, 40);
      const p = r.pick([10, 15, 20, 25, 30, 35, 40, 5]);
      const op = r.chance(0.5);
      const ans = clean(op ? (base * (100 + p)) / 100 : (base * (100 - p)) / 100);
      return { vraag: `${op ? 'Vermeerder' : 'Verminder'} ${nl(base)} met ${p}%.`, antwoord: ans, uitwerking: `${p}% van ${nl(base)} = ${nl(clean((base * p) / 100))}.\n${nl(base)} ${op ? '+' : '−'} ${nl(clean((base * p) / 100))} = ${nl(ans)}.\nOf in één keer: ${nl(base)} × ${nl(op ? 1 + p / 100 : 1 - p / 100)} = ${nl(ans)}.` };
    },
  },
  {
    id: 'v-procent-rm', domein: D, type: 'kaal', calc: true,
    gen(r) {
      let part, whole;
      do { whole = r.int(130, 900); part = r.int(11, whole - 20); } while (((part * 1000) / whole) % 1 === 0);
      const ans = round((part / whole) * 100, 1);
      return { vraag: `Hoeveel procent is ${part} van ${whole}?\nRond af op 1 decimaal.`, antwoord: ans, antwoordTekst: nl(ans, 1), eenheid: '%', uitwerking: `${part} : ${whole} = ${nl(round(part / whole, 5))}…\nKeer 100: ${nl(round((part / whole) * 100, 3))}…%\nAfgerond: ${nl(ans, 1)}%.` };
    },
  },

  // ---------- CONTEXT ----------
  {
    id: 'vc-korting', domein: D, type: 'context', calc: false,
    gen(r) {
      const P = 20 * r.int(2, 12);
      const p = r.pick([10, 20, 25, 30, 40, 15, 35]);
      const ding = r.pick(['jas', 'spijkerbroek', 'fietstas', 'koptelefoon', 'rugzak', 'trui']);
      const ans = (P * (100 - p)) / 100;
      return { vraag: `Een ${ding} kost ${euro(P)}. In de uitverkoop krijg je ${p}% korting.\nHoeveel betaal je voor de ${ding}?`, antwoord: ans, voor: '€', uitwerking: `Korting: ${p}% van ${euro(P)} = ${euro((P * p) / 100)}.\nJe betaalt ${euro(P)} − ${euro((P * p) / 100)} = ${euro(ans)}.\nOf: je betaalt ${100 - p}% → ${nl((100 - p) / 100)} × ${euro(P)} = ${euro(ans)}.` };
    },
  },
  {
    id: 'vc-korting-rm', domein: D, type: 'context', calc: true,
    gen(r) {
      const P = r.int(15, 180) * 100 + r.pick([95, 99, 49, 50, 75]);
      const p = r.pick([15, 20, 25, 30, 35, 40, 12, 18]);
      const ans = round((P * (100 - p)) / 10000, 2);
      const ding = r.pick(['winterjas', 'paar sneakers', 'tent', 'skeelerset', 'boekenkast']);
      return { vraag: `Een ${ding} kost ${euro(P / 100)}. Je krijgt ${p}% korting.\nWat is de nieuwe prijs? Rond af op hele centen.`, antwoord: ans, voor: '€', uitwerking: `Je betaalt ${100 - p}% van de prijs.\n${nl((100 - p) / 100)} × ${euro(P / 100)} = ${nl(clean((P * (100 - p)) / 10000))}.\nAfgerond: ${euro(ans)}.` };
    },
  },
  {
    id: 'vc-btw', domein: D, type: 'context', calc: true,
    gen(r) {
      const [btw, wat] = r.pick([[21, ['een laptop', 'een fiets', 'een stofzuiger', 'een tablet']], [9, ['een kookboek', 'een verjaardagstaart', 'een groentepakket']]]);
      const E = btw === 9 ? r.int(12, 80) : r.int(15, 900);
      const I = (E * (100 + btw)) / 100;
      const ding = r.pick(wat);
      if (r.chance(0.5)) {
        return { vraag: `De prijs van ${ding} is ${euro(E)} zonder btw. Daar komt nog ${btw}% btw bij.\nWat is de prijs inclusief btw?`, antwoord: clean(I), voor: '€', uitwerking: `Inclusief btw = 100% + ${btw}% = ${100 + btw}%.\n${nl((100 + btw) / 100)} × ${euro(E)} = ${euro(I)}.` };
      }
      return { vraag: `${ding[0].toUpperCase() + ding.slice(1)} kost ${euro(I)}, inclusief ${btw}% btw.\nWat is de prijs zonder btw?`, antwoord: E, voor: '€', uitwerking: `Let op: de btw is ${btw}% van de prijs zónder btw. ${euro(I)} is dus ${100 + btw}%.\n${euro(I)} : ${nl((100 + btw) / 100)} = ${euro(E)}.\n(Niet ${btw}% van ${euro(I)} aftrekken, dat is de bekende valkuil!)` };
    },
  },
  {
    id: 'vc-procentuele-verandering', domein: D, type: 'context', calc: true,
    gen(r) {
      let O, p, N;
      const op = r.chance(0.55);
      do {
        O = 20 * r.int(2, 40);
        p = r.pick([5, 10, 15, 20, 25, 30, 40, 12, 8, 35]);
        N = (O * (op ? 100 + p : 100 - p)) / 100;
      } while (!Number.isInteger(N));
      const wat = r.pick([['De prijs van een tweedehands fiets', '€'], ['Het aantal leden van de voetbalclub', ''], ['De prijs van een treinabonnement', '€'], ['Het aantal leerlingen op school', '']]);
      const f = (x) => (wat[1] ? euro(x) : nl(x));
      return { vraag: `${wat[0]} ${op ? 'steeg' : 'daalde'} van ${f(O)} naar ${f(N)}.\nMet hoeveel procent is het ${op ? 'gestegen' : 'gedaald'}?`, antwoord: p, eenheid: '%', uitwerking: `Verschil: ${f(Math.abs(N - O))}.\nDeel door de oude waarde: ${nl(Math.abs(N - O))} : ${nl(O)} = ${nl(p / 100)}.\nDat is ${p}%.` };
    },
  },
  {
    id: 'vc-recept', domein: D, type: 'context', calc: false,
    gen(r) {
      const P1 = r.pick([4, 6, 8, 3]);
      let P2;
      do P2 = r.pick([2, 3, 5, 6, 10, 12, 9]); while (P2 === P1);
      const [ing, eenh, lo, hi] = r.pick([['bloem', 'gram', 30, 80], ['melk', 'ml', 40, 120], ['suiker', 'gram', 10, 40], ['boter', 'gram', 15, 40], ['rijst', 'gram', 60, 90], ['pasta', 'gram', 80, 120]]);
      const u = 5 * r.int(lo / 5, hi / 5);
      const A = P1 * u;
      const gerecht = r.pick(['pannenkoeken', 'een ovenschotel', 'cake', 'soep', 'een stamppot']);
      return { vraag: `In een recept voor ${gerecht} voor ${P1} personen staat ${A} ${eenh} ${ing}.\nHoeveel ${eenh} ${ing} heb je nodig voor ${P2} personen?`, antwoord: P2 * u, eenheid: eenh, uitwerking: `Voor 1 persoon: ${A} : ${P1} = ${u} ${eenh}.\nVoor ${P2} personen: ${P2} × ${u} = ${P2 * u} ${eenh}.` };
    },
  },
  {
    id: 'vc-schaal-kaart', domein: D, type: 'context', calc: true,
    gen(r) {
      const s = r.pick([25000, 50000, 40000, 75000, 125000, 200000, 15000]);
      const cm = r.int(21, 149) / 10;
      const km = clean((cm * s) / 100000);
      const wat = r.pick(['de fietsroute van school naar het bos', 'de wandeling langs de rivier', 'de weg tussen twee dorpen', 'de afstand van de camping tot het strand']);
      return { vraag: `Op een kaart met schaal 1 : ${nl(s)} meet je voor ${wat} ${nl(cm)} cm.\nHoeveel kilometer is dat in werkelijkheid?`, antwoord: km, eenheid: 'km', uitwerking: `1 cm op de kaart = ${nl(s)} cm = ${nl(s / 100)} m = ${nl(s / 100000)} km.\n${nl(cm)} × ${nl(s / 100000)} = ${nl(km)} km.` };
    },
  },
  {
    id: 'vc-verdelen', domein: D, type: 'context', calc: false,
    gen(r) {
      let a, b;
      do { a = r.int(1, 7); b = r.int(2, 9); } while (a === b || gcd(a, b) !== 1);
      const k = r.int(3, 25);
      const T = (a + b) * k;
      const [n1, n2] = r.sample(NAMEN, 2);
      const tweede = r.chance(0.5);
      return { vraag: `${n1} en ${n2} verdienen samen ${euro(T)} met het uitlaten van honden. Ze verdelen het geld in de verhouding ${a} : ${b} (${n1} : ${n2}).\nHoeveel krijgt ${tweede ? n2 : n1}?`, antwoord: (tweede ? b : a) * k, voor: '€', uitwerking: `Er zijn ${a} + ${b} = ${a + b} delen.\n1 deel = ${euro(T)} : ${a + b} = ${euro(k)}.\n${tweede ? n2 : n1} krijgt ${tweede ? b : a} delen: ${tweede ? b : a} × ${euro(k)} = ${euro((tweede ? b : a) * k)}.` };
    },
  },
  {
    id: 'vc-beste-koop', domein: D, type: 'context', calc: true,
    gen(r) {
      let gA, gB, pA, pB, kA, kB;
      do {
        gA = r.pick([250, 300, 400, 500, 750]);
        gB = r.pick([1000, 1200, 1500, 2000]);
        pA = r.int(80, 450);
        pB = r.int(Math.round((pA * gB) / gA * 0.8), Math.round((pA * gB) / gA * 1.15));
        kA = (pA / gA) * 1000; kB = (pB / gB) * 1000;
      } while (Math.abs(kA - kB) / Math.min(kA, kB) < 0.03);
      const prod = r.pick(['muesli', 'koffie', 'kaas', 'rijst', 'wasmiddel']);
      const goedkoopst = kA < kB ? 'Pak A' : 'Pak B';
      const g = (x) => (x >= 1000 ? `${nl(x / 1000)} kg` : `${x} gram`);
      return {
        vraag: `In de supermarkt liggen twee pakken ${prod}:\nPak A: ${g(gA)} voor ${euro(pA / 100)}\nPak B: ${g(gB)} voor ${euro(pB / 100)}\nWelk pak is per kilogram het goedkoopst?`,
        invoer: 'keuze', opties: ['Pak A', 'Pak B'], antwoord: goedkoopst,
        uitwerking: `Reken de prijs per kg uit.\nPak A: ${euro(pA / 100)} : ${nl(gA / 1000)} = ${euro(round(kA / 100, 2))} per kg.\nPak B: ${euro(pB / 100)} : ${nl(gB / 1000)} = ${euro(round(kB / 100, 2))} per kg.\n${goedkoopst} is per kg goedkoper.`,
      };
    },
  },
  {
    id: 'vc-klas-procent', domein: D, type: 'context', calc: false,
    gen(r) {
      const n = r.pick([20, 25, 30, 24, 32, 40, 28]);
      let p;
      do p = 5 * r.int(4, 16); while (!Number.isInteger((n * p) / 100));
      const [a, b] = r.pick([['is een meisje', 'Hoeveel jongens zitten er in de groep?'], ['komt op de fiets naar school', 'Hoeveel kinderen komen níet op de fiets?'], ['heeft een huisdier', 'Hoeveel kinderen hebben geen huisdier?']]);
      return { vraag: `In groep 6 zitten ${n} leerlingen. ${p}% van hen ${a}.\n${b}`, antwoord: n - (n * p) / 100, uitwerking: `${p}% van ${n} = ${(n * p) / 100}.\nDe rest: ${n} − ${(n * p) / 100} = ${n - (n * p) / 100}.\n(Of direct: ${100 - p}% van ${n} = ${n - (n * p) / 100}.)` };
    },
  },
  {
    id: 'vc-rente', domein: D, type: 'context', calc: true,
    gen(r) {
      const B = r.int(10, 80) * 100;
      const rr = r.pick([1.5, 1.8, 2, 2.5, 3, 1.2, 2.2]);
      const naam = r.pick(NAMEN);
      if (r.chance(0.5)) {
        const ans = clean((B * (100 + rr)) / 100);
        return { vraag: `${naam} zet ${euro(B)} op een spaarrekening. De rente is ${nl(rr)}% per jaar.\nHoeveel staat er na 1 jaar op de rekening?`, antwoord: ans, voor: '€', uitwerking: `Rente: ${nl(rr)}% van ${euro(B)} = ${euro(clean((B * rr) / 100))}.\n${euro(B)} + ${euro(clean((B * rr) / 100))} = ${euro(ans)}.` };
      }
      const een = (B * (100 + rr)) / 100;
      const ans = round((een * (100 + rr)) / 100, 2);
      return { vraag: `${naam} zet ${euro(B)} op een spaarrekening. De rente is ${nl(rr)}% per jaar en wordt elk jaar bij het saldo opgeteld (rente op rente).\nHoeveel staat er na 2 jaar op de rekening? Rond af op centen.`, antwoord: ans, voor: '€', uitwerking: `Na 1 jaar: ${euro(B)} × ${nl(1 + rr / 100)} = ${euro(een)}.\nNa 2 jaar: ${euro(een)} × ${nl(1 + rr / 100)} = ${nl(clean((een * (100 + rr)) / 100))}.\nAfgerond: ${euro(ans)}.` };
    },
  },
  {
    id: 'vc-stapelkorting', domein: D, type: 'context', calc: false,
    gen(r) {
      const p1 = r.pick([10, 20, 25, 30, 40, 50]), p2 = r.pick([10, 20, 25, 50]);
      const over = ((100 - p1) * (100 - p2)) / 100;
      const ans = clean(100 - over);
      return { vraag: `Een winkel geeft eerst ${p1}% korting op alles. Aan de kassa krijg je daarna nog eens ${p2}% korting op de nieuwe prijs.\nHoeveel procent korting krijg je in totaal op de oorspronkelijke prijs?`, antwoord: ans, eenheid: '%', uitwerking: `Neem een prijs van € 100.\nNa ${p1}% korting: € ${100 - p1}.\nNa nog ${p2}% korting: ${nl((100 - p2) / 100)} × ${100 - p1} = € ${nl(over)}.\nTotale korting: 100 − ${nl(over)} = ${nl(ans)}% (dus niet ${p1 + p2}%!).` };
    },
  },
  {
    id: 'vc-breuk-context', domein: D, type: 'context', calc: false,
    gen(r) {
      const a = breukPaar(r, [3, 4, 5, 6]), b = breukPaar(r, [2, 3, 4]);
      let N;
      do N = a[1] * b[1] * r.int(1, 8); while (N < 30 || N > 160);
      const fiets = (N * a[0]) / a[1];
      const rest = N - fiets;
      const loop = (rest * b[0]) / b[1];
      return { vraag: `Op school zitten in de bovenbouw ${N} kinderen. ${fr(...a)} deel van hen komt op de fiets. Van de rest komt ${fr(...b)} deel lopend.\nHoeveel kinderen komen lopend?`, antwoord: loop, uitwerking: `Op de fiets: ${fr(...a)} van ${N} = ${fiets}.\nDe rest: ${N} − ${fiets} = ${rest}.\nLopend: ${fr(...b)} van ${rest} = ${loop}.` };
    },
  },
  {
    id: 'vc-mengen', domein: D, type: 'context', calc: false,
    gen(r) {
      const w = r.pick([4, 5, 6, 7, 9, 3]);
      const delen = w + 1;
      let ml;
      do ml = delen * 50 * r.int(2, 12); while (ml % 250 !== 0 && ml % 100 !== 0);
      const L = ml / 1000;
      const ans = ml / delen;
      return { vraag: `Op een fles siroop staat: meng 1 deel siroop met ${w} delen water.\nJe wilt ${nl(L)} liter limonade maken.\nHoeveel ml siroop heb je nodig?`, antwoord: ans, eenheid: 'ml', uitwerking: `Er zijn 1 + ${w} = ${delen} delen.\n${nl(L)} liter = ${ml} ml.\n1 deel = ${ml} : ${delen} = ${ans} ml siroop.` };
    },
  },
  {
    id: 'vc-terugrekenen', domein: D, type: 'context', calc: true,
    gen(r) {
      if (r.chance(0.5)) {
        const p = r.pick([20, 25, 30, 40, 15, 10]);
        const O = 4 * r.int(5, 40);
        const X = (O * (100 - p)) / 100;
        return { vraag: `Na ${p}% korting betaal je ${euro(X)} voor een paar schoenen.\nWat was de oorspronkelijke prijs?`, antwoord: O, voor: '€', uitwerking: `${euro(X)} is ${100 - p}% van de oude prijs.\n${euro(X)} : ${nl((100 - p) / 100)} = ${euro(O)}.\nControle: ${p}% van ${euro(O)} = ${euro((O * p) / 100)}, en ${euro(O)} − ${euro((O * p) / 100)} = ${euro(X)}.` };
      }
      const p = r.pick([5, 8, 10, 12, 20, 4]);
      const O = 25 * r.int(2, 20);
      const X = (O * (100 + p)) / 100;
      return { vraag: `Na een prijsverhoging van ${p}% kost een kaartje voor het pretpark ${euro(X)}.\nWat kostte het kaartje vóór de verhoging?`, antwoord: O, voor: '€', uitwerking: `${euro(X)} is ${100 + p}% van de oude prijs.\n${euro(X)} : ${nl((100 + p) / 100)} = ${euro(O)}.` };
    },
  },
];
