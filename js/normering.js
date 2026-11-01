// Normering: ruwe score (0–55) -> schaalscore, met de 3F-grens op 575.
//
// LET OP: de echte Cito-omrekentabel verschilt per toetsversie en is niet openbaar.
// Deze omrekening is een benadering: ongeveer 60% goed (33 van 55) komt uit op 575.
// Heb je een officiële omrekentabel? Pas dan de ankerpunten hieronder aan.

export const NORM = {
  max: 55,
  grens3F: 575,
  // [ruwe score, schaalscore] – daartussen wordt lineair geïnterpoleerd
  ankers: [
    [0, 450],
    [20, 525],
    [33, 575],
    [45, 625],
    [55, 675],
  ],
};

export function schaalscore(ruw, totaal = NORM.max) {
  const x = (ruw / totaal) * NORM.max;
  const a = NORM.ankers;
  for (let i = 1; i < a.length; i++) {
    if (x <= a[i][0]) {
      const [x0, y0] = a[i - 1];
      const [x1, y1] = a[i];
      return Math.round(y0 + ((x - x0) / (x1 - x0)) * (y1 - y0));
    }
  }
  return a[a.length - 1][1];
}

/** Hoeveel vragen goed nodig zijn voor 3F. */
export function nodigVoor3F() {
  for (let i = 0; i <= NORM.max; i++) if (schaalscore(i) >= NORM.grens3F) return i;
  return NORM.max;
}

const DOMEINTIPS = {
  getallen: 'Oefen hoofdrekenen met slimme strategieën (rijgen, splitsen, compenseren) en let op kommagetallen en negatieve getallen.',
  verhoudingen: 'Werk met de verhoudingstabel en de 10%-strategie. Let bij btw en korting goed op waar de 100% bij hoort.',
  meten: 'Leer het metriek stelsel als trap (×10 per stap, ×100 bij m², ×1000 bij m³) en reken tijd altijd in minuten.',
  verbanden: 'Lees tabellen en grafieken rustig af en schrijf tussenstappen op. Bij formules: eerst invullen, dan keer, dan plus.',
};

/**
 * Advies op basis van schaalscore en score per domein.
 * perDomein: { getallen: {goed, totaal}, ... }
 */
export function advies(schaal, perDomein = {}) {
  let niveau, titel, tekst;
  if (schaal >= 625) {
    niveau = 'ruim';
    titel = 'Ruim voldoende – je zit stevig boven 3F';
    tekst = 'Dit is een hele sterke score. Blijf af en toe een toets maken om scherp te blijven, en ga met vertrouwen de echte toets in.';
  } else if (schaal >= 575) {
    niveau = 'gehaald';
    titel = '3F-niveau gehaald';
    tekst = 'Je zit boven de 3F-grens. Kijk nog even naar je zwakste domein, dan bouw je wat extra marge op.';
  } else if (schaal >= 550) {
    niveau = 'bijna';
    titel = 'Bijna! Je zit net onder 3F';
    tekst = 'Het scheelt maar een paar vragen. Gericht oefenen op je zwakste onderdeel levert nu het meeste op.';
  } else if (schaal >= 500) {
    niveau = 'onderweg';
    titel = 'Je bent goed onderweg';
    tekst = 'De basis is er. Oefen per domein, bekijk bij elke fout de uitwerking en vraag de AI Coach om uitleg.';
  } else {
    niveau = 'start';
    titel = 'Rustig opbouwen';
    tekst = 'Geen paniek: dit is precies waarom je oefent. Begin met de kale sommen per domein; die geven de meeste houvast.';
  }
  const lijst = Object.entries(perDomein)
    .filter(([, v]) => v.totaal > 0)
    .map(([d, v]) => ({ domein: d, pct: v.goed / v.totaal }))
    .sort((a, b) => a.pct - b.pct);
  const zwakst = lijst[0];
  const tips = zwakst && zwakst.pct < 0.75 ? [DOMEINTIPS[zwakst.domein]] : [];
  return { niveau, titel, tekst, zwakst: zwakst?.domein, tips };
}
