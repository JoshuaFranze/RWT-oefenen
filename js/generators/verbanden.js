// Domein Verbanden: formules, tabellen, grafieken, patronen, gemiddelde/mediaan.
import { nl, euro, round, clean, tijd, NAMEN } from '../format.js';

const D = 'verbanden';
const DAGEN = ['ma', 'di', 'wo', 'do', 'vr', 'za'];
const DAGNAAM = { ma: 'maandag', di: 'dinsdag', wo: 'woensdag', do: 'donderdag', vr: 'vrijdag', za: 'zaterdag' };

function mediaan(arr) {
  const s = [...arr].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

export const generators = [
  // ---------- KAAL ----------
  {
    id: 'b-formule', domein: D, type: 'kaal', calc: false,
    gen(r) {
      const a = r.int(2, 25), b = r.pick([1.5, 2, 2.5, 3, 4, 0.5, 5, 0.75]), n = r.int(3, 20);
      const [K, x] = r.pick([['K', 'u'], ['P', 'n'], ['L', 't'], ['y', 'x']]);
      const ans = clean(a + b * n);
      return { vraag: `Gegeven is de formule ${K} = ${a} + ${nl(b)} × ${x}.\nBereken ${K} als ${x} = ${n}.`, antwoord: ans, uitwerking: `Vul ${x} = ${n} in: ${K} = ${a} + ${nl(b)} × ${n}.\nEerst keer: ${nl(b)} × ${n} = ${nl(clean(b * n))}.\nDan plus: ${a} + ${nl(clean(b * n))} = ${nl(ans)}.` };
    },
  },
  {
    id: 'b-reeks', domein: D, type: 'kaal', calc: false,
    gen(r) {
      const s = r.int(-5, 20), d = r.pick([3, 4, 5, 6, 7, 9, 11, -2, -3, 2.5, 0.5]);
      const n = r.pick([10, 12, 15, 20, 25, 30, 50]);
      const termen = [0, 1, 2, 3].map((i) => clean(s + i * d));
      const ans = clean(s + (n - 1) * d);
      return { vraag: `Bekijk de getallenrij: ${termen.map((t) => nl(t)).join('; ')}; …\nDe rij gaat op dezelfde manier verder. Wat is het ${n}e getal?`, antwoord: ans, uitwerking: `Elke stap gaat er ${nl(d)} ${d > 0 ? 'bij' : 'af'} (${d > 0 ? '+' : ''}${nl(d)}).\nVan het 1e naar het ${n}e getal zijn ${n - 1} stappen.\n${nl(s)} + ${n - 1} × ${nl(d)} = ${nl(ans)}.` };
    },
  },
  {
    id: 'b-gemiddelde', domein: D, type: 'kaal', calc: false,
    gen(r) {
      const k = r.int(4, 6);
      const gem = r.int(8, 40);
      const w = Array.from({ length: k - 1 }, () => gem + r.int(-7, 7));
      const laatste = gem * k - w.reduce((a, b) => a + b, 0);
      if (laatste < 1) w.push(gem); else w.push(laatste);
      const som = w.reduce((a, b) => a + b, 0);
      const g = clean(som / k);
      return { vraag: `Bereken het gemiddelde van deze getallen:\n${r.shuffle(w).join('   ')}`, antwoord: g, uitwerking: `Tel alles op: ${w.join(' + ')} = ${som}.\nDeel door het aantal getallen (${k}): ${som} : ${k} = ${nl(g)}.` };
    },
  },
  {
    id: 'b-mediaan', domein: D, type: 'kaal', calc: false,
    gen(r) {
      const k = r.pick([5, 7, 6, 8, 9]);
      const w = Array.from({ length: k }, () => r.int(2, 60));
      const m = mediaan(w);
      const s = [...w].sort((a, b) => a - b);
      return { vraag: `Wat is de mediaan van deze getallen?\n${w.join('   ')}`, antwoord: m, uitwerking: `Zet de getallen eerst op volgorde: ${s.join(', ')}.\n${k % 2 ? `Het middelste getal (nummer ${(k + 1) / 2}) is ${m}.` : `Er zijn twee middelste getallen: ${s[k / 2 - 1]} en ${s[k / 2]}. Het gemiddelde daarvan is ${nl(m)}.`}` };
    },
  },
  {
    id: 'b-formule-terug', domein: D, type: 'kaal', calc: false,
    gen(r) {
      const a = r.int(3, 30), b = r.pick([0.25, 0.5, 1.5, 2, 2.5, 3, 4, 5]), n = r.pick([4, 6, 8, 10, 12, 16, 20, 24, 40]);
      const K = clean(a + b * n);
      return { vraag: `Bij de formule K = ${a} + ${nl(b)} × n hoort K = ${nl(K)}.\nHoe groot is n?`, antwoord: n, uitwerking: `Werk terug: K − ${a} = ${nl(K)} − ${a} = ${nl(clean(K - a))}.\nDat is ${nl(b)} × n, dus n = ${nl(clean(K - a))} : ${nl(b)} = ${n}.\nControle: ${a} + ${nl(b)} × ${n} = ${nl(K)}. ✓` };
    },
  },
  {
    id: 'b-tabel', domein: D, type: 'kaal', calc: false,
    gen(r) {
      const s = r.int(2, 20), d = r.pick([3, 4, 5, 6, 1.5, 2.5, 7]);
      const xs = [1, 2, 3, 4, 5];
      const vraagX = r.pick([0, 10, 12, 15, 20]);
      const ans = clean(s + (vraagX - 1) * d);
      return {
        vraag: `In de tabel zie je een patroon. Bij elke stap van x komt er steeds evenveel bij y.\nWelke waarde hoort bij x = ${vraagX}?`,
        tabel: { kop: ['x', ...xs.map(String)], rijen: [['y', ...xs.map((x) => nl(clean(s + (x - 1) * d)))]] },
        antwoord: ans,
        uitwerking: `Per stap komt er ${nl(d)} bij.\n${vraagX === 0 ? `x = 0 is één stap terug vanaf x = 1: ${nl(s)} − ${nl(d)} = ${nl(ans)}.` : `Van x = 1 naar x = ${vraagX} zijn ${vraagX - 1} stappen: ${nl(s)} + ${vraagX - 1} × ${nl(d)} = ${nl(ans)}.`}\nDe formule is y = ${nl(clean(s - d))} + ${nl(d)} × x.`,
      };
    },
  },
  {
    id: 'b-gem-ontbrekend', domein: D, type: 'kaal', calc: false,
    gen(r) {
      const doel = r.pick([6, 6.5, 7, 7.5, 5.5, 8]);
      let c;
      do c = Array.from({ length: 3 }, () => r.int(45, 90) / 10); while (doel * 4 - c.reduce((a, b) => a + b, 0) > 10 || doel * 4 - c.reduce((a, b) => a + b, 0) < 4);
      const som = clean(c.reduce((a, b) => a + b, 0));
      const ans = clean(doel * 4 - som);
      const naam = r.pick(NAMEN);
      return { vraag: `${naam} heeft voor rekenen drie cijfers: ${c.map((x) => nl(x)).join(', ')}. Er komt nog één toets.\nWelk cijfer moet ${naam} halen om precies een ${nl(doel)} gemiddeld te staan?`, antwoord: ans, uitwerking: `Gemiddeld ${nl(doel)} over 4 toetsen betekent samen ${nl(doel)} × 4 = ${nl(doel * 4)}.\nDe eerste drie zijn samen ${nl(som)}.\n${nl(doel * 4)} − ${nl(som)} = ${nl(ans)}.` };
    },
  },
  {
    id: 'b-staaf', domein: D, type: 'kaal', calc: false,
    gen(r) {
      const stap = r.pick([5, 10, 20, 25]);
      const w = DAGEN.slice(0, 5).map(() => stap * r.int(2, 12));
      const lbl = DAGEN.slice(0, 5);
      const v = r.int(0, 1);
      const imax = w.indexOf(Math.max(...w)), imin = w.indexOf(Math.min(...w));
      const grafiek = { type: 'staaf', titel: 'Aantal verkochte broodjes in de kantine', labels: lbl, waarden: w, yLabel: 'broodjes' };
      if (v === 0) return { vraag: `Bekijk de staafgrafiek.\nHoeveel broodjes zijn er op de drukste dag meer verkocht dan op de rustigste dag?`, grafiek, antwoord: w[imax] - w[imin], uitwerking: `Drukste dag: ${DAGNAAM[lbl[imax]]} met ${w[imax]}. Rustigste dag: ${DAGNAAM[lbl[imin]]} met ${w[imin]}.\n${w[imax]} − ${w[imin]} = ${w[imax] - w[imin]}.` };
      const tot = w.reduce((a, b) => a + b, 0);
      return { vraag: `Bekijk de staafgrafiek.\nHoeveel broodjes zijn er die week in totaal verkocht?`, grafiek, antwoord: tot, uitwerking: `Tel alle staven op: ${w.join(' + ')} = ${tot}.` };
    },
  },
  {
    id: 'b-lijn', domein: D, type: 'kaal', calc: false,
    gen(r) {
      const uren = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00'];
      let w;
      do {
        w = [r.int(-2, 8)];
        for (let i = 1; i < 6; i++) w.push(w[i - 1] + r.int(i < 4 ? 0 : -5, i < 4 ? 6 : 2));
      } while (new Set(w.slice(1).map((x, i) => x - w[i])).size < 4 || Math.max(...w.slice(1).map((x, i) => x - w[i])) === [...w.slice(1).map((x, i) => x - w[i])].sort((a, b) => b - a)[1]);
      const diffs = w.slice(1).map((x, i) => x - w[i]);
      const imax = diffs.indexOf(Math.max(...diffs));
      const opties = uren.slice(0, 5).map((u, i) => `${u} – ${uren[i + 1]}`);
      return {
        vraag: `In de lijngrafiek zie je de temperatuur op een lentedag.\nIn welke periode steeg de temperatuur het meest?`,
        grafiek: { type: 'lijn', titel: 'Temperatuur (°C)', labels: uren, waarden: w, yLabel: '°C' },
        invoer: 'keuze', opties, antwoord: opties[imax],
        uitwerking: `Bereken per periode het verschil:\n${opties.map((o, i) => `${o}: ${diffs[i] >= 0 ? '+' : ''}${nl(diffs[i])} ${Math.abs(diffs[i]) === 1 ? 'graad' : 'graden'}`).join('\n')}\nDe grootste stijging is ${opties[imax]} (de steilste lijn omhoog).`,
      };
    },
  },
  {
    id: 'b-lijn-punten', domein: D, type: 'kaal', calc: false,
    gen(r) {
      const b = r.int(-5, 10), a = r.pick([2, 3, 4, 5, 0.5, 1.5, -2]);
      const x1 = r.int(1, 4);
      const x2 = r.int(12, 30);
      const y = (x) => clean(b + a * x);
      return { vraag: `Een rechte lijn gaat door de punten (0, ${nl(b)}) en (${x1}, ${nl(y(x1))}).\nWat is de y-waarde bij x = ${x2}?`, antwoord: y(x2), uitwerking: `Van x = 0 naar x = ${x1} gaat y van ${nl(b)} naar ${nl(y(x1))}: dat is ${nl(clean(a * x1))} in ${x1} stap(pen), dus ${nl(a)} per stap.\nBij x = ${x2}: ${nl(b)} + ${x2} × ${nl(a)} = ${nl(y(x2))}.` };
    },
  },

  // ---------- CONTEXT ----------
  {
    id: 'bc-taxi', domein: D, type: 'context', calc: true,
    gen(r) {
      const rB = r.int(150, 220), dr = r.pick([20, 25, 30, 40, 50]), k = r.int(4, 20);
      const rA = rB + dr;
      const sA = r.int(250, 450), sB = sA + dr * k;
      return {
        vraag: `Twee taxibedrijven hebben verschillende tarieven:\nTaxi Snel: ${euro(sA / 100)} instaptarief + ${euro(rA / 100)} per km\nTaxi Zuinig: ${euro(sB / 100)} instaptarief + ${euro(rB / 100)} per km\nBij hoeveel kilometer kosten beide taxi's precies evenveel?`,
        antwoord: k, eenheid: 'km',
        uitwerking: `Taxi Zuinig is bij het instappen ${euro((sB - sA) / 100)} duurder, maar per km ${euro(dr / 100)} goedkoper.\nDat verschil is ingehaald na ${euro((sB - sA) / 100)} : ${euro(dr / 100)} = ${k} km.\nControle: Snel: ${euro(sA / 100)} + ${k} × ${euro(rA / 100)} = ${euro((sA + k * rA) / 100)}; Zuinig: ${euro(sB / 100)} + ${k} × ${euro(rB / 100)} = ${euro((sB + k * rB) / 100)}.`,
      };
    },
  },
  {
    id: 'bc-abonnement', domein: D, type: 'context', calc: true,
    gen(r) {
      const vast = r.int(450, 1500), per = r.pick([8, 9, 10, 12, 15, 6]), m = r.int(40, 260);
      const tot = vast + per * m;
      return { vraag: `Een belabonnement kost ${euro(vast / 100)} per maand. Daarnaast betaal je ${euro(per / 100)} per gebelde minuut.\nIn maart belt Jesse ${m} minuten. Hoeveel moet Jesse die maand betalen?`, antwoord: tot / 100, voor: '€', uitwerking: `Bellen: ${m} × ${euro(per / 100)} = ${euro((per * m) / 100)}.\nTotaal: ${euro(vast / 100)} + ${euro((per * m) / 100)} = ${euro(tot / 100)}.\nAls formule: kosten = ${nl(vast / 100)} + ${nl(per / 100)} × minuten.` };
    },
  },
  {
    id: 'bc-bieb', domein: D, type: 'context', calc: true,
    gen(r) {
      const stap = r.pick([10, 20, 25, 50]);
      const lbl = DAGEN;
      let w;
      const v = r.int(0, 2);
      do w = lbl.map(() => stap * r.int(3, 16)); while (v === 1 && w.reduce((a, b) => a + b, 0) % 6 !== 0);
      const grafiek = { type: 'staaf', titel: 'Bezoekers van de bibliotheek per dag', labels: lbl, waarden: w, yLabel: 'bezoekers' };
      const tot = w.reduce((a, b) => a + b, 0);
      if (v === 0) return { vraag: `In de grafiek zie je hoeveel bezoekers de bibliotheek had.\nHoeveel bezoekers waren er die week in totaal?`, grafiek, antwoord: tot, uitwerking: `${w.join(' + ')} = ${nl(tot)} bezoekers.` };
      if (v === 1) return { vraag: `In de grafiek zie je hoeveel bezoekers de bibliotheek had.\nHoeveel bezoekers waren er gemiddeld per dag?`, grafiek, antwoord: tot / 6, uitwerking: `Totaal: ${w.join(' + ')} = ${nl(tot)}.\nGemiddeld: ${nl(tot)} : 6 dagen = ${nl(tot / 6)} bezoekers per dag.` };
      const i = r.int(0, 5);
      const p = round((w[i] / tot) * 100, 1);
      return { vraag: `In de grafiek zie je hoeveel bezoekers de bibliotheek had.\nHoeveel procent van alle bezoekers van die week kwam op ${DAGNAAM[lbl[i]]}? Rond af op 1 decimaal.`, grafiek, antwoord: p, antwoordTekst: nl(p, 1) + '%', eenheid: '%', uitwerking: `Totaal: ${nl(tot)} bezoekers. Op ${DAGNAAM[lbl[i]]}: ${w[i]}.\n${w[i]} : ${nl(tot)} × 100 = ${nl(round((w[i] / tot) * 100, 3))}…% ≈ ${nl(p, 1)}%.` };
    },
  },
  {
    id: 'bc-temperatuur', domein: D, type: 'context', calc: false,
    gen(r) {
      const uren = ['06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00'];
      const w = [r.int(-6, 4)];
      for (let i = 1; i < 7; i++) w.push(w[i - 1] + r.int(i < 5 ? 1 : -4, i < 5 ? 5 : 1));
      const [i, j] = [r.int(0, 2), r.int(3, 4)];
      return {
        vraag: `In de lijngrafiek zie je de temperatuur in De Bilt op een dag in maart.\nHoeveel graden is de temperatuur gestegen tussen ${uren[i]} en ${uren[j]}?`,
        grafiek: { type: 'lijn', titel: 'Temperatuur (°C)', labels: uren, waarden: w, yLabel: '°C' },
        antwoord: w[j] - w[i], eenheid: 'graden',
        uitwerking: `Om ${uren[i]}: ${nl(w[i])} °C. Om ${uren[j]}: ${nl(w[j])} °C.\n${nl(w[j])} − ${w[i] < 0 ? `(${nl(w[i])})` : w[i]} = ${w[j] - w[i]} graden.`,
      };
    },
  },
  {
    id: 'bc-lengtes', domein: D, type: 'context', calc: true,
    gen(r) {
      const namen = r.sample(NAMEN, 6);
      let l;
      do l = namen.map(() => r.int(128, 156)); while (l.reduce((a, b) => a + b, 0) % 6 === 0);
      const g = round(l.reduce((a, b) => a + b, 0) / 6, 1);
      return {
        vraag: `Juf Sara meet de lengte van zes kinderen uit groep 6.\nWat is hun gemiddelde lengte? Rond af op 1 decimaal.`,
        tabel: { kop: ['Naam', 'Lengte (cm)'], rijen: namen.map((n, i) => [n, String(l[i])]) },
        antwoord: g, antwoordTekst: nl(g, 1) + ' cm', eenheid: 'cm',
        uitwerking: `Totaal: ${l.join(' + ')} = ${l.reduce((a, b) => a + b, 0)} cm.\nGemiddeld: ${l.reduce((a, b) => a + b, 0)} : 6 = ${nl(round(l.reduce((a, b) => a + b, 0) / 6, 3))}… ≈ ${nl(g, 1)} cm.`,
      };
    },
  },
  {
    id: 'bc-fietsverhuur', domein: D, type: 'context', calc: false,
    gen(r) {
      const f = r.int(6, 15), p = r.pick([4, 4.5, 5, 5.5, 6, 7.5]);
      let B;
      do B = r.int(25, 80); while (((B - f) / p) % 1 === 0);
      const ans = 1 + Math.floor((B - f) / p);
      return { vraag: `Een fiets huren kost ${euro(f)} voor de eerste dag en daarna ${euro(p)} voor elke volgende dag.\nJe hebt ${euro(B)}. Hoeveel dagen kun je de fiets maximaal huren?`, antwoord: ans, eenheid: 'dagen', uitwerking: `Na de eerste dag heb je nog ${euro(B)} − ${euro(f)} = ${euro(B - f)}.\nDaarvan kun je ${euro(B - f)} : ${euro(p)} = ${nl(round((B - f) / p, 2))}… → ${ans - 1} extra dagen.\nTotaal: 1 + ${ans - 1} = ${ans} dagen.` };
    },
  },
  {
    id: 'bc-feest', domein: D, type: 'context', calc: false,
    gen(r) {
      const vast = r.int(5, 30) * 10, per = r.pick([7.5, 10, 12.5, 15, 8, 9.5]), p = r.int(20, 80);
      const ans = clean(vast + per * p);
      return { vraag: `Een feestzaal rekent met de formule:\nkosten = ${vast} + ${nl(per)} × aantal gasten (in euro's).\nWat kost een feest met ${p} gasten?`, antwoord: ans, voor: '€', uitwerking: `${nl(per)} × ${p} = ${nl(clean(per * p))}.\n${vast} + ${nl(clean(per * p))} = ${euro(ans)}.` };
    },
  },
  {
    id: 'bc-groei', domein: D, type: 'context', calc: true,
    gen(r) {
      const P = r.int(8, 60) * 100, g = r.pick([5, 10, 3, 4, 8, 2.5]), j = r.pick([2, 3]);
      const exact = P * (1 + g / 100) ** j;
      const ans = Math.round(clean(exact));
      const wat = r.pick(['Het aantal inwoners van een dorp', 'Het aantal leden van een sportvereniging', 'Het aantal bezoekers van een museum']);
      return { vraag: `${wat} is nu ${nl(P)}. Elk jaar groeit dat aantal met ${nl(g)}%.\nHoeveel is het na ${j} jaar? Rond af op een heel getal.`, antwoord: ans, uitwerking: `Elk jaar keer ${nl(1 + g / 100)} (100% + ${nl(g)}%).\n${nl(P)} × ${nl(1 + g / 100)}${j === 3 ? ` × ${nl(1 + g / 100)}` : ''} × ${nl(1 + g / 100)} = ${nl(round(exact, 3))}.\nAfgerond: ${nl(ans)}.\nLet op: niet ${j} × ${nl(g)}% erbij, want elk jaar groei je over het nieuwe aantal.` };
    },
  },
  {
    id: 'bc-cirkeldiagram', domein: D, type: 'context', calc: false,
    gen(r) {
      const N = r.pick([120, 180, 240, 300, 72, 90, 600]);
      let gr;
      do gr = r.pick([30, 45, 60, 90, 120, 150, 36, 72, 18, 40]); while (((N * gr) / 360) % 1 !== 0);
      const sport = r.pick(['voetbal', 'turnen', 'hockey', 'zwemmen', 'dansen', 'judo']);
      if (r.chance(0.5)) return { vraag: `Op een school is aan ${N} leerlingen gevraagd wat hun favoriete sport is. In het cirkeldiagram is het stuk voor ${sport} ${gr}°.\nHoeveel leerlingen kozen ${sport}?`, antwoord: (N * gr) / 360, eenheid: 'leerlingen', uitwerking: `Een hele cirkel is 360° = alle ${N} leerlingen.\n${gr}° is ${gr} : 360 = ${nl(round(gr / 360, 4))} deel.\n${N} × ${gr} : 360 = ${(N * gr) / 360} leerlingen.` };
      const n = (N * gr) / 360;
      return { vraag: `Van de ${N} leerlingen kozen er ${n} voor ${sport}. Dit wordt getekend in een cirkeldiagram.\nHoeveel graden is het stuk voor ${sport}?`, antwoord: gr, eenheid: '°', uitwerking: `${n} van de ${N} is ${n} : ${N} deel van de cirkel.\n${n} : ${N} × 360° = ${gr}°.` };
    },
  },
  {
    id: 'bc-parkeren', domein: D, type: 'context', calc: false,
    gen(r) {
      const t1 = r.pick([150, 200, 250, 300]), t2 = r.pick([100, 120, 150, 175, 200]), max = r.pick([1200, 1500, 1800, 2000]);
      const s = r.int(8 * 4, 12 * 4) * 15;
      const d = r.int(70, 600);
      const uren = Math.ceil(d / 60);
      const kosten = Math.min(max, t1 + (uren - 1) * t2);
      return {
        vraag: `Bij een parkeergarage gelden de tarieven uit de tabel.\nJe parkeert van ${tijd(s)} tot ${tijd(s + d)}.\nHoeveel moet je betalen?`,
        tabel: { kop: ['Tarief', 'Prijs'], rijen: [['Eerste uur', euro(t1 / 100)], ['Elk volgend (begonnen) uur', euro(t2 / 100)], ['Maximaal per dag', euro(max / 100)]] },
        antwoord: kosten / 100, voor: '€',
        uitwerking: `Parkeertijd: ${tijd(s)} tot ${tijd(s + d)} = ${Math.floor(d / 60)} uur en ${d % 60} minuten. Een begonnen uur telt als heel uur, dus ${uren} uur.\nEerste uur ${euro(t1 / 100)} + ${uren - 1} × ${euro(t2 / 100)} = ${euro((t1 + (uren - 1) * t2) / 100)}.${t1 + (uren - 1) * t2 > max ? `\nDat is meer dan het dagmaximum, dus je betaalt ${euro(max / 100)}.` : ''}`,
      };
    },
  },
  {
    id: 'bc-plant', domein: D, type: 'context', calc: false,
    gen(r) {
      const h = r.int(4, 20), g = r.pick([1.5, 2, 2.5, 3, 0.5, 1.2, 4]), w = r.int(4, 16);
      const T = clean(h + g * w);
      return { vraag: `Een zonnebloem is ${h} cm hoog. Hij groeit elke week ${nl(g)} cm.\nNa hoeveel weken is de zonnebloem ${nl(T)} cm hoog?`, antwoord: w, eenheid: 'weken', uitwerking: `Hij moet nog ${nl(T)} − ${h} = ${nl(clean(T - h))} cm groeien.\n${nl(clean(T - h))} : ${nl(g)} = ${w} weken.` };
    },
  },
  {
    id: 'bc-zakgeld-mediaan', domein: D, type: 'context', calc: false,
    gen(r) {
      const namen = r.sample(NAMEN, r.pick([6, 7, 8]));
      const w = namen.map(() => r.int(4, 30) / 2);
      const m = mediaan(w);
      const s = [...w].sort((a, b) => a - b);
      const k = w.length;
      return {
        vraag: `In de tabel staat hoeveel zakgeld een paar kinderen per week krijgen.\nWat is de mediaan van het zakgeld?`,
        tabel: { kop: ['Naam', 'Zakgeld'], rijen: namen.map((n, i) => [n, euro(w[i])]) },
        antwoord: m, voor: '€',
        uitwerking: `Op volgorde: ${s.map((x) => euro(x)).join(', ')}.\n${k % 2 ? `Het middelste bedrag is ${euro(m)}.` : `De twee middelste zijn ${euro(s[k / 2 - 1])} en ${euro(s[k / 2])}. Gemiddeld: ${euro(m)}.`}`,
      };
    },
  },
];
