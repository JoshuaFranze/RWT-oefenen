// Domein Meten & Meetkunde: metriek stelsel, oppervlakte, inhoud, tijd, snelheid, meetkunde.
import { nl, euro, round, clean, tijd, duur, sup, NAMEN } from '../format.js';

const D = 'meten';

function decimalen(x) {
  const t = String(clean(x));
  return t.includes('.') ? t.split('.')[1].length : 0;
}

function omreken(r, eenheden, maakWaarde) {
  // eenheden: [naam, factor t.o.v. basiseenheid]
  let i, j, van, fv, naar, fn, v, ans;
  do {
    do { i = r.int(0, eenheden.length - 1); j = r.int(0, eenheden.length - 1); } while (i === j || Math.abs(i - j) > 3);
    [van, fv] = eenheden[i];
    [naar, fn] = eenheden[j];
    v = maakWaarde(fv > fn);
    ans = clean((v * fv) / fn);
  } while (decimalen(ans) > 3 || ans >= 1e6 || ans < 0.001);
  const factor = fv > fn ? clean(fv / fn) : clean(fn / fv);
  let uitwerking;
  if (fv === fn) {
    uitwerking = `1 ${van} = 1 ${naar}, dus het getal blijft hetzelfde: ${nl(ans)} ${naar}.`;
  } else if (fv > fn) {
    uitwerking = `1 ${van} = ${nl(factor)} ${naar}.\nJe gaat naar een kleinere eenheid, dus keer ${nl(factor)}: ${nl(v)} × ${nl(factor)} = ${nl(ans)} ${naar}.`;
  } else {
    uitwerking = `1 ${naar} = ${nl(factor)} ${van}.\nJe gaat naar een grotere eenheid, dus gedeeld door ${nl(factor)}: ${nl(v)} : ${nl(factor)} = ${nl(ans)} ${naar}.`;
  }
  return { vraag: `${nl(v)} ${van} = … ${naar}`, antwoord: ans, eenheid: naar, uitwerking, factorEen: fv === fn };
}

const waardeMaker = (r) => (naarKlein) => (naarKlein ? r.int(11, 999) / r.pick([10, 100]) : r.int(15, 9999) / r.pick([1, 10]));

export const generators = [
  // ---------- KAAL ----------
  {
    id: 'm-lengte', domein: D, type: 'kaal', calc: false,
    gen: (r) => omreken(r, [['km', 1000], ['hm', 100], ['m', 1], ['dm', 0.1], ['cm', 0.01], ['mm', 0.001]].filter((e, k) => k !== 1 || r.chance(0.3)), waardeMaker(r)),
  },
  {
    id: 'm-gewicht', domein: D, type: 'kaal', calc: false,
    gen: (r) => omreken(r, [['ton', 1e6], ['kg', 1000], ['hg', 100], ['g', 1], ['mg', 0.001]].filter((e, k) => k !== 2 || r.chance(0.4)), waardeMaker(r)),
  },
  {
    id: 'm-inhoud', domein: D, type: 'kaal', calc: false,
    gen(r) {
      const sets = [
        [['L', 1000], ['dL', 100], ['cL', 10], ['mL', 1]],
        [['m³', 1e6], ['dm³', 1000], ['cm³', 1]],
        [['m³', 1e6], ['L', 1000], ['dL', 100], ['cL', 10]],
        [['L', 1000], ['cm³', 1]],
        [['dm³', 1000], ['L', 1000], ['mL', 1], ['cm³', 1]],
      ];
      let q;
      do q = omreken(r, r.pick(sets), waardeMaker(r)); while (q.factorEen && r.chance(0.75));
      if (/dm³|cm³/.test(q.vraag) && /L/.test(q.vraag)) q.uitwerking += `\nOnthoud: 1 dm³ = 1 L en 1 cm³ = 1 mL.`;
      delete q.factorEen;
      return q;
    },
  },
  {
    id: 'm-oppervlakte-omrekenen', domein: D, type: 'kaal', calc: false,
    gen(r) {
      const q = omreken(r, [['km²', 1e6], ['ha', 1e4], ['are', 100], ['m²', 1], ['dm²', 0.01], ['cm²', 0.0001]], (naarKlein) => (naarKlein ? r.int(2, 99) / r.pick([1, 10]) : r.int(2, 999) * r.pick([10, 100, 1000]) / 10));
      q.uitwerking += `\nBij oppervlakte is elke stap tussen m², dm², cm² keer 100 (niet keer 10), want 1 m² = 10 dm × 10 dm.`;
      return q;
    },
  },
  {
    id: 'm-tijd', domein: D, type: 'kaal', calc: false,
    gen(r) {
      const v = r.int(0, 3);
      if (v === 0) {
        const u = r.pick([1.2, 1.4, 1.6, 2.4, 0.75, 1.25, 2.1, 3.3, 0.8, 1.9]);
        return { vraag: `${nl(u)} uur = … minuten`, antwoord: clean(u * 60), eenheid: 'minuten', uitwerking: `1 uur = 60 minuten.\n${nl(u)} × 60 = ${nl(clean(u * 60))} minuten.\nLet op: ${nl(u)} uur is níet ${Math.floor(u)} uur en ${Math.round((u % 1) * 100)} minuten!` };
      }
      if (v === 1) {
        const m = r.pick([75, 90, 105, 135, 150, 165, 195, 45, 15, 225, 48, 84]);
        return { vraag: `${m} minuten = … uur\nGeef je antwoord als kommagetal.`, antwoord: clean(m / 60), eenheid: 'uur', uitwerking: `${m >= 60 ? `${m} minuten = ${duur(m)}.\n` : ''}${m} : 60 = ${nl(clean(m / 60))} uur.` };
      }
      if (v === 2) {
        const h = r.int(1, 5), m = r.int(5, 55);
        return { vraag: `${h} uur en ${m} minuten = … minuten`, antwoord: h * 60 + m, eenheid: 'minuten', uitwerking: `${h} × 60 = ${h * 60} minuten.\n${h * 60} + ${m} = ${h * 60 + m} minuten.` };
      }
      const s = r.pick([1.5, 0.6, 2.5, 0.75, 4.2]);
      return { vraag: `${nl(s)} minuut = … seconden`, antwoord: clean(s * 60), eenheid: 'seconden', uitwerking: `1 minuut = 60 seconden.\n${nl(s)} × 60 = ${nl(clean(s * 60))} seconden.` };
    },
  },
  {
    id: 'm-rechthoek', domein: D, type: 'kaal', calc: false,
    gen(r) {
      const L = r.int(3, 25) + r.pick([0, 0.5]), W = r.int(2, 12);
      if (r.chance(0.5)) return { vraag: `Een rechthoek is ${nl(L)} cm lang en ${W} cm breed.\nWat is de oppervlakte?`, antwoord: clean(L * W), eenheid: 'cm²', uitwerking: `Oppervlakte = lengte × breedte.\n${nl(L)} × ${W} = ${nl(clean(L * W))} cm².` };
      return { vraag: `Een rechthoek is ${nl(L)} cm lang en ${W} cm breed.\nWat is de omtrek?`, antwoord: clean(2 * (L + W)), eenheid: 'cm', uitwerking: `Omtrek = alle zijden bij elkaar.\n${nl(L)} + ${W} + ${nl(L)} + ${W} = ${nl(clean(2 * (L + W)))} cm.` };
    },
  },
  {
    id: 'm-driehoek', domein: D, type: 'kaal', calc: false,
    gen(r) {
      const b = r.int(3, 20), h = r.int(2, 16);
      return { vraag: `Een driehoek heeft een basis van ${b} cm en een hoogte van ${h} cm.\nWat is de oppervlakte?`, antwoord: clean((b * h) / 2), eenheid: 'cm²', uitwerking: `Oppervlakte driehoek = basis × hoogte : 2.\n${b} × ${h} = ${b * h}, gedeeld door 2 = ${nl(clean((b * h) / 2))} cm².` };
    },
  },
  {
    id: 'm-balk', domein: D, type: 'kaal', calc: false,
    gen(r) {
      const [l, b, h] = [r.pick([10, 20, 25, 30, 40, 50]), r.pick([10, 15, 20, 25, 30]), r.pick([10, 20, 30, 40, 12])];
      const cm3 = l * b * h;
      return { vraag: `Een doos (balk) is ${l} cm lang, ${b} cm breed en ${h} cm hoog.\nHoeveel liter past erin?`, antwoord: clean(cm3 / 1000), eenheid: 'liter', uitwerking: `Inhoud = l × b × h = ${l} × ${b} × ${h} = ${nl(cm3)} cm³.\n1 liter = 1 dm³ = 1000 cm³.\n${nl(cm3)} : 1000 = ${nl(clean(cm3 / 1000))} liter.` };
    },
  },
  {
    id: 'm-cirkel', domein: D, type: 'kaal', calc: true,
    gen(r) {
      const r0 = r.int(3, 30) + r.pick([0, 0.5]);
      const metD = r.chance(0.4);
      if (r.chance(0.5)) {
        const ans = round(2 * 3.14 * r0, 1), alt = round(2 * Math.PI * r0, 1);
        return { vraag: `Een cirkel heeft een ${metD ? `diameter van ${nl(2 * r0)}` : `straal van ${nl(r0)}`} cm.\nBereken de omtrek. Gebruik π ≈ 3,14 en rond af op 1 decimaal.`, antwoord: ans, alternatieven: [alt], antwoordTekst: nl(ans, 1) + ' cm', eenheid: 'cm', uitwerking: `Omtrek = π × diameter.\n${metD ? '' : `Diameter = 2 × ${nl(r0)} = ${nl(2 * r0)} cm.\n`}3,14 × ${nl(2 * r0)} = ${nl(clean(6.28 * r0))}${clean(6.28 * r0) === ans ? '' : ` ≈ ${nl(ans, 1)}`} cm.${alt !== ans ? `\n(Met de π-knop krijg je ${nl(alt, 1)} cm; dat rekenen we ook goed.)` : ''}` };
      }
      const ans = round(3.14 * r0 * r0, 1), alt = round(Math.PI * r0 * r0, 1);
      return { vraag: `Een cirkel heeft een ${metD ? `diameter van ${nl(2 * r0)}` : `straal van ${nl(r0)}`} cm.\nBereken de oppervlakte. Gebruik π ≈ 3,14 en rond af op 1 decimaal.`, antwoord: ans, alternatieven: [alt], antwoordTekst: nl(ans, 1) + ' cm²', eenheid: 'cm²', uitwerking: `Oppervlakte = π × straal × straal.\n${metD ? `Straal = ${nl(2 * r0)} : 2 = ${nl(r0)} cm.\n` : ''}3,14 × ${nl(r0)} × ${nl(r0)} = ${nl(clean(3.14 * r0 * r0))} ≈ ${nl(ans, 1)} cm².${alt !== ans ? `\n(Met de π-knop krijg je ${nl(alt, 1)} cm²; dat rekenen we ook goed.)` : ''}` };
    },
  },
  {
    id: 'm-hoeken', domein: D, type: 'kaal', calc: false,
    gen(r) {
      const v = r.int(0, 2);
      if (v === 0) {
        const a = r.int(25, 85), b = r.int(25, 150 - a);
        return { vraag: `In een driehoek is één hoek ${a}° en een andere hoek ${b}°.\nHoe groot is de derde hoek?`, antwoord: 180 - a - b, eenheid: '°', uitwerking: `De hoeken van een driehoek zijn samen 180°.\n180 − ${a} − ${b} = ${180 - a - b}°.` };
      }
      if (v === 1) {
        const m = r.pick([5, 10, 15, 20, 25, 35, 40, 45, 50]);
        return { vraag: `Hoeveel graden draait de grote wijzer van een klok in ${m} minuten?`, antwoord: m * 6, eenheid: '°', uitwerking: `In 60 minuten draait de grote wijzer een hele cirkel: 360°.\nPer minuut: 360 : 60 = 6°.\n${m} × 6 = ${m * 6}°.` };
      }
      const a = r.int(20, 160);
      return { vraag: `Twee hoeken liggen samen op een rechte lijn (een gestrekte hoek). De ene hoek is ${a}°.\nHoe groot is de andere hoek?`, antwoord: 180 - a, eenheid: '°', uitwerking: `Een gestrekte hoek is 180°.\n180 − ${a} = ${180 - a}°.` };
    },
  },
  {
    id: 'm-snelheid-omrekenen', domein: D, type: 'kaal', calc: false,
    gen(r) {
      if (r.chance(0.5)) {
        const v = 18 * r.int(1, 7);
        return { vraag: `${v} km/u = … m/s`, antwoord: v / 3.6, eenheid: 'm/s', uitwerking: `${v} km per uur = ${nl(v * 1000)} m per 3600 seconden.\n${nl(v * 1000)} : 3600 = ${nl(v / 3.6)} m/s.\n(Snelle regel: km/u gedeeld door 3,6 = m/s.)` };
      }
      const v = r.int(2, 30);
      return { vraag: `${v} m/s = … km/u`, antwoord: clean(v * 3.6), eenheid: 'km/u', uitwerking: `${v} m per seconde = ${v} × 3600 = ${nl(v * 3600)} m per uur.\n${nl(v * 3600)} m = ${nl(clean(v * 3.6))} km, dus ${nl(clean(v * 3.6))} km/u.` };
    },
  },
  {
    id: 'm-tijdsduur', domein: D, type: 'kaal', calc: false,
    gen(r) {
      const s = r.int(7 * 12, 12 * 12) * 5, d = r.int(19, 70) * 5;
      return { vraag: `Hoeveel minuten zitten er tussen ${tijd(s)} en ${tijd(s + d)}?`, antwoord: d, eenheid: 'minuten', uitwerking: `Reken in stapjes via het hele uur.\nVan ${tijd(s)} tot ${tijd(Math.ceil((s + 1) / 60) * 60)} is ${Math.ceil((s + 1) / 60) * 60 - s} minuten, de rest tot ${tijd(s + d)} is ${s + d - Math.ceil((s + 1) / 60) * 60} minuten.\nSamen ${d} minuten (= ${duur(d)}).` };
    },
  },
  {
    id: 'm-vierkant', domein: D, type: 'kaal', calc: false,
    gen(r) {
      const z = r.int(3, 15);
      if (r.chance(0.5)) return { vraag: `Een vierkant heeft een oppervlakte van ${z * z} cm².\nHoe groot is de omtrek?`, antwoord: 4 * z, eenheid: 'cm', uitwerking: `Zijde × zijde = ${z * z}, dus de zijde is ${z} cm (${z} × ${z} = ${z * z}).\nOmtrek = 4 × ${z} = ${4 * z} cm.` };
      return { vraag: `Een vierkant heeft een omtrek van ${4 * z} cm.\nHoe groot is de oppervlakte?`, antwoord: z * z, eenheid: 'cm²', uitwerking: `Zijde = ${4 * z} : 4 = ${z} cm.\nOppervlakte = ${z} × ${z} = ${z * z} cm².` };
    },
  },

  // ---------- CONTEXT ----------
  {
    id: 'mc-laminaat', domein: D, type: 'context', calc: true,
    gen(r) {
      const L = r.int(25, 70) * 10, W = r.int(20, 45) * 10; // cm
      const opp = (L * W) / 10000;
      if (r.chance(0.5)) {
        const P = r.int(1195, 3495);
        const ans = Math.round((L * W * P) / 10000) / 100;
        return { vraag: `Een kamer is ${nl(L / 100)} m lang en ${nl(W / 100)} m breed. Er komt laminaat in van ${euro(P / 100)} per m².\nHoeveel kost het laminaat? Rond af op centen.`, antwoord: ans, voor: '€', uitwerking: `Oppervlakte: ${nl(L / 100)} × ${nl(W / 100)} = ${nl(opp)} m².\nKosten: ${nl(opp)} × ${euro(P / 100)} = ${nl(clean((L * W * P) / 1000000))} ≈ ${euro(ans)}.` };
      }
      const doos = r.pick([1.8, 2.2, 2.5, 1.5, 2.13]);
      let ans = Math.ceil(clean(opp / doos));
      return { vraag: `Een kamer is ${nl(L / 100)} m lang en ${nl(W / 100)} m breed. Een pak laminaat is genoeg voor ${nl(doos)} m².\nHoeveel pakken moet je minstens kopen?`, antwoord: ans, eenheid: 'pakken', uitwerking: `Oppervlakte: ${nl(L / 100)} × ${nl(W / 100)} = ${nl(opp)} m².\n${nl(opp)} : ${nl(doos)} = ${nl(round(opp / doos, 2))}…\nJe kunt geen half pak kopen, dus naar boven afronden: ${ans} pakken.` };
    },
  },
  {
    id: 'mc-aquarium', domein: D, type: 'context', calc: true,
    gen(r) {
      const L = r.pick([60, 80, 100, 120, 50, 70]), B = r.pick([30, 35, 40, 45]), H = r.pick([40, 45, 50, 35]), h0 = r.pick([3, 5, 6, 8]);
      const ans = clean((L * B * (H - h0)) / 1000);
      return { vraag: `Een aquarium is ${L} cm lang, ${B} cm breed en ${H} cm hoog. Het wordt gevuld tot ${h0} cm onder de rand.\nHoeveel liter water zit erin?`, antwoord: ans, eenheid: 'liter', uitwerking: `Waterhoogte: ${H} − ${h0} = ${H - h0} cm.\nInhoud: ${L} × ${B} × ${H - h0} = ${nl(L * B * (H - h0))} cm³.\n1000 cm³ = 1 liter, dus ${nl(ans)} liter.` };
    },
  },
  {
    id: 'mc-fietstijd', domein: D, type: 'context', calc: true,
    gen(r) {
      const v = r.pick([12, 15, 16, 18, 20, 24]);
      let t, d;
      do { t = 5 * r.int(2, 15); d = (v * t) / 60; } while (!Number.isInteger(d * 10) || t === 60);
      const naam = r.pick(NAMEN);
      return { vraag: `${naam} fietst met een gemiddelde snelheid van ${v} km/u naar de sportclub. Die is ${nl(d)} km verderop.\nHoeveel minuten doet ${naam} erover?`, antwoord: t, eenheid: 'minuten', uitwerking: `${v} km per 60 minuten, dus 1 km kost 60 : ${v} = ${nl(round(60 / v, 3))} ${60 / v === 1 ? 'minuut' : 'minuten'}.\n${nl(d)} × ${nl(round(60 / v, 3))} = ${t} minuten.\n(Of met een verhoudingstabel: ${v} km – 60 min, ${nl(d)} km – ${t} min.)` };
    },
  },
  {
    id: 'mc-trein', domein: D, type: 'context', calc: false,
    gen(r) {
      const dep = r.int(6 * 60, 21 * 60);
      const dur = r.int(35, 175);
      const stad = r.sample(['Groningen', 'Maastricht', 'Vlissingen', 'Den Helder', 'Enschede', 'Utrecht', 'Zwolle', 'Eindhoven'], 2);
      return { vraag: `De trein van ${stad[0]} naar ${stad[1]} vertrekt om ${tijd(dep)}. De reis duurt ${duur(dur)}.\nHoe laat komt de trein aan? Schrijf als uu:mm.`, invoer: 'tijd', antwoord: (dep + dur) % 1440, uitwerking: dur >= 60
        ? `${tijd(dep)} + ${Math.floor(dur / 60)} uur = ${tijd(dep + Math.floor(dur / 60) * 60)}.\nDaarna nog ${dur % 60} minuten erbij: ${tijd(dep + dur)}.`
        : dep % 60 + dur < 60 ? `${tijd(dep)} + ${dur} minuten = ${tijd(dep + dur)}.`
        : `Reken via het hele uur: ${tijd(dep)} + ${60 - (dep % 60)} minuten = ${tijd(dep + 60 - (dep % 60))}.\nDan nog ${dur - (60 - (dep % 60))} minuten erbij: ${tijd(dep + dur)}.` };
    },
  },
  {
    id: 'mc-plattegrond', domein: D, type: 'context', calc: true,
    gen(r) {
      const s = r.pick([50, 100, 200]);
      const a = r.int(4, 16) / 2, b = r.int(4, 12) / 2;
      const wa = (a * s) / 100, wb = (b * s) / 100;
      const ans = clean(wa * wb);
      return { vraag: `Op een plattegrond met schaal 1 : ${s} is het lokaal ${nl(a)} cm lang en ${nl(b)} cm breed.\nHoeveel m² is het lokaal in werkelijkheid?`, antwoord: ans, eenheid: 'm²', uitwerking: `1 cm op de tekening = ${s} cm = ${nl(s / 100)} m.\nLengte: ${nl(a)} × ${nl(s / 100)} = ${nl(wa)} m, breedte: ${nl(b)} × ${nl(s / 100)} = ${nl(wb)} m.\nOppervlakte: ${nl(wa)} × ${nl(wb)} = ${nl(ans)} m².\n(Let op: eerst de lengtes omrekenen, daarna pas vermenigvuldigen.)` };
    },
  },
  {
    id: 'mc-hek', domein: D, type: 'context', calc: false,
    gen(r) {
      const L = r.int(8, 30) + r.pick([0, 0.5]), W = r.int(5, 15), g = r.pick([1, 1.5, 2, 3]);
      const ans = clean(2 * (L + W) - g);
      return { vraag: `Een rechthoekige moestuin van de school is ${nl(L)} m lang en ${W} m breed. Er komt een hek omheen, behalve bij de ingang van ${nl(g)} m breed.\nHoeveel meter hek is er nodig?`, antwoord: ans, eenheid: 'm', uitwerking: `Omtrek: ${nl(L)} + ${W} + ${nl(L)} + ${W} = ${nl(clean(2 * (L + W)))} m.\nMin de ingang: ${nl(clean(2 * (L + W)))} − ${nl(g)} = ${nl(ans)} m.` };
    },
  },
  {
    id: 'mc-bekers', domein: D, type: 'context', calc: false,
    gen(r) {
      let L, c;
      do { L = r.pick([1, 1.5, 2, 1.75, 2.5, 3]); c = r.pick([150, 200, 250, 180, 300, 120]); } while ((L * 1000) % c === 0);
      const ans = Math.floor((L * 1000) / c);
      return { vraag: `Je hebt een fles met ${nl(L)} liter appelsap. Je schenkt bekers van ${c} ml vol.\nHoeveel bekers kun je helemaal vullen?`, antwoord: ans, eenheid: 'bekers', uitwerking: `${nl(L)} liter = ${L * 1000} ml.\n${L * 1000} : ${c} = ${ans} rest ${(L * 1000) % c}.\nDe rest is geen volle beker, dus ${ans} bekers.` };
    },
  },
  {
    id: 'mc-lift', domein: D, type: 'context', calc: false,
    gen(r) {
      let max, kar, pers;
      do { max = r.pick([450, 525, 630, 800, 1000, 900]); kar = r.int(4, 12) * 10; pers = r.pick([75, 80, 70, 85]); } while ((max - kar) % pers === 0);
      const ans = Math.floor((max - kar) / pers);
      return { vraag: `In een lift mag maximaal ${max} kg. Een conciërge gaat mee met een kar van ${kar} kg.\nHoeveel personen van gemiddeld ${pers} kg kunnen er nog bij (de conciërge niet meegeteld)?`, antwoord: ans, eenheid: 'personen', uitwerking: `Ruimte over: ${max} − ${kar} = ${max - kar} kg.\n${max - kar} : ${pers} = ${ans} rest ${(max - kar) % pers}.\nNaar beneden afronden, anders is de lift te zwaar: ${ans} personen.` };
    },
  },
  {
    id: 'mc-zwembad', domein: D, type: 'context', calc: true,
    gen(r) {
      const d = r.int(18, 60) / 10;
      const rr = d / 2;
      const ans = round(3.14 * rr * rr, 1), alt = round(Math.PI * rr * rr, 1);
      const wat = r.pick(['Een rond opblaaszwembad', 'Een rond trampolinedoek', 'Een ronde zandbak', 'Een rond tapijt']);
      return { vraag: `${wat} heeft een diameter van ${nl(d)} m.\nHoe groot is de oppervlakte? Gebruik π ≈ 3,14 en rond af op 1 decimaal.`, antwoord: ans, alternatieven: [alt], antwoordTekst: nl(ans, 1) + ' m²', eenheid: 'm²', uitwerking: `Straal = ${nl(d)} : 2 = ${nl(rr)} m.\nOppervlakte = π × r × r = 3,14 × ${nl(rr)} × ${nl(rr)} = ${nl(clean(3.14 * rr * rr))} ≈ ${nl(ans, 1)} m².\nValkuil: niet de diameter maar de straal in het kwadraat!` };
    },
  },
  {
    id: 'mc-film', domein: D, type: 'context', calc: false,
    gen(r) {
      const s = r.int(13 * 12, 21 * 12) * 5, d = r.int(85, 175);
      const pauze = r.chance(0.4) ? r.pick([10, 15, 20]) : 0;
      return { vraag: `De film in de bioscoop begint om ${tijd(s)} en duurt ${d} minuten${pauze ? `. Halverwege is er een pauze van ${pauze} minuten` : ''}.\nHoe laat is de film afgelopen? Schrijf als uu:mm.`, invoer: 'tijd', antwoord: (s + d + pauze) % 1440, uitwerking: `${d} minuten = ${duur(d)}.${pauze ? `\nMet pauze: ${d} + ${pauze} = ${d + pauze} minuten = ${duur(d + pauze)}.` : ''}\n${tijd(s)} + ${duur(d + pauze)} = ${tijd(s + d + pauze)}.` };
    },
  },
  {
    id: 'mc-verf', domein: D, type: 'context', calc: true,
    gen(r) {
      let L, H, dek, lagen, blik, liters;
      do {
        L = r.int(30, 80) / 10; H = r.pick([2.4, 2.5, 2.6, 2.8]); dek = r.pick([8, 10, 12]); lagen = r.pick([1, 2]); blik = r.pick([0.75, 1, 2.5]);
        liters = clean((L * H * lagen) / dek);
      } while (clean(liters / blik) % 1 === 0 || liters / blik < 1.1);
      const ans = Math.ceil(liters / blik);
      return { vraag: `Een muur is ${nl(L)} m breed en ${nl(H)} m hoog. Met 1 liter verf kun je ${dek} m² verven. De muur krijgt ${lagen === 2 ? '2 lagen' : '1 laag'} verf. Verf wordt verkocht in blikken van ${nl(blik)} liter.\nHoeveel blikken heb je minstens nodig?`, antwoord: ans, eenheid: 'blikken', uitwerking: `Oppervlakte: ${nl(L)} × ${nl(H)} = ${nl(clean(L * H))} m²${lagen === 2 ? `, met 2 lagen ${nl(clean(2 * L * H))} m²` : ''}.\nVerf: ${nl(clean(L * H * lagen))} : ${dek} = ${nl(round(liters, 3))} liter.\nBlikken: ${nl(round(liters, 3))} : ${nl(blik)} = ${nl(round(liters / blik, 2))}… → naar boven: ${ans} blikken.` };
    },
  },
  {
    id: 'mc-gemiddelde-snelheid', domein: D, type: 'context', calc: true,
    gen(r) {
      let v, t, d;
      do { v = r.pick([60, 72, 80, 90, 96, 100, 110, 84]); t = r.pick([45, 75, 90, 105, 135, 150, 40, 100]); d = (v * t) / 60; } while (!Number.isInteger(d));
      return { vraag: `Een auto rijdt ${d} km in ${duur(t)}.\nWat is de gemiddelde snelheid in km/u?`, antwoord: v, eenheid: 'km/u', uitwerking: `${t < 60 ? '' : `${duur(t)} = `}${t} minuten = ${nl(clean(t / 60))} uur.\nSnelheid = afstand : tijd = ${d} : ${nl(clean(t / 60))} = ${v} km/u.` };
    },
  },
  {
    id: 'mc-stappen', domein: D, type: 'context', calc: true,
    gen(r) {
      const s = r.int(55, 82), n = r.int(15, 90) * 100;
      const naam = r.pick(NAMEN);
      const ans = clean((s * n) / 100000);
      return { vraag: `Een stap van ${naam} is gemiddeld ${s} cm. Op een dag zet ${naam} ${nl(n)} stappen.\nHoeveel kilometer is dat?`, antwoord: ans, eenheid: 'km', uitwerking: `${nl(n)} × ${s} = ${nl(s * n)} cm.\n${nl(s * n)} cm = ${nl(clean((s * n) / 100))} m = ${nl(ans)} km.` };
    },
  },
  {
    id: 'mc-medicijn', domein: D, type: 'context', calc: false,
    gen(r) {
      const dosis = r.pick([2.5, 5, 7.5, 10]), keer = r.pick([2, 3, 4]);
      let fles;
      do fles = r.pick([100, 120, 150, 200, 250]); while (fles % (dosis * keer) === 0 && r.chance(0.3));
      const perDag = dosis * keer;
      const ans = Math.floor(fles / perDag);
      return { vraag: `Een kind krijgt ${keer} keer per dag ${nl(dosis)} ml hoestdrank. Een fles bevat ${fles} ml.\nHoeveel hele dagen kan het kind met één fles doen?`, antwoord: ans, eenheid: 'dagen', uitwerking: `Per dag: ${keer} × ${nl(dosis)} = ${nl(perDag)} ml.\n${fles} : ${nl(perDag)} = ${nl(round(fles / perDag, 2))}${fles % perDag ? '… → naar beneden afronden' : ''}.\nDus ${ans} hele dagen.` };
    },
  },
];
