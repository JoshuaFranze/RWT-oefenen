// RWT 3F oefenen – hoofdapplicatie (vanilla JS, geen build-stap nodig).
import { bouwBank, DOMEINEN } from './bank.js';
import { checkAnswer, antwoordTekst } from './check.js';
import { vraagHTML, uitwerkingHTML, rich, esc, miniMarkdown } from './render.js';
import * as store from './storage.js';
import { startAutoSync, synchroniseer, opStatus, testToken } from './sync.js';
import { vraagCoach, maakEersteBericht, MODELLEN, testCoach } from './ai.js';
import { schaalscore, advies, NORM, nodigVoor3F } from './normering.js';
import { maakRekenmachine } from './calculator.js';

const bank = bouwBank();
const app = document.getElementById('app');
const modalRoot = document.getElementById('modal-root');
const DOM = Object.fromEntries(DOMEINEN.map((d) => [d.id, d]));
const DOMEINKLEUR = { getallen: '#3b82c4', verhoudingen: '#8b6cc4', meten: '#c9852e', verbanden: '#2f9d6f' };
const fijnePointer = window.matchMedia?.('(pointer: fine)').matches;

const GOED = ['Goed zo!', 'Helemaal goed!', 'Netjes gedaan!', 'Top, dat klopt.', 'Lekker bezig!', 'Yes, goed!'];
const FOUT = ['Nog niet helemaal.', 'Bijna, kijk nog eens rustig.', 'Dat klopt nog niet – geen probleem.', 'Hmm, nog niet goed.'];
const TIPS = [
  'Schrijf tussenstappen op: je hoofd hoeft niet alles tegelijk te onthouden.',
  'Schat eerst even. Dan zie je meteen of je antwoord ongeveer kan kloppen.',
  'Lees de vraag twee keer en kijk goed wat er écht gevraagd wordt.',
  'Fouten maken hoort bij oefenen. Elke fout vertelt je waar je nog kunt groeien.',
  'Een verhoudingstabel is je beste vriend bij procenten, schaal en recepten.',
  'Twijfel je over een eenheid? Teken de trap: km – hm – dam – m – dm – cm – mm.',
  'Even vastgelopen? Adem drie keer rustig in en uit en begin daarna opnieuw.',
  'Kort en vaak oefenen werkt beter dan één keer heel lang.',
  'Bij procenten: zoek eerst uit wat de 100% is.',
  'Reken tijd altijd om naar minuten, dan maak je minder snel fouten.',
];
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const shuffle = (a) => {
  a = [...a];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
const datum = (ts) => new Date(ts).toLocaleString('nl-NL', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });

let opruimen = [];
function bijOpruimen(fn) {
  opruimen.push(fn);
}

// ---------------------------------------------------------------- router
function route() {
  opruimen.forEach((f) => {
    try { f(); } catch { /* */ }
  });
  opruimen = [];
  const [, a = '', b, c] = (location.hash.slice(1) || '/').split('/');
  document.querySelectorAll('[data-nav]').forEach((el) => {
    const actief = (el.dataset.nav === 'home' && a === '') || el.dataset.nav === a || (el.dataset.nav === 'oefenen' && a === 'sessie') || (el.dataset.nav === 'toetsen' && (a === 'toets' || a === 'resultaat'));
    if (actief) el.setAttribute('aria-current', 'page');
    else el.removeAttribute('aria-current');
  });
  switch (a) {
    case 'oefenen': viewOefenKeuze(b); break;
    case 'sessie': viewSessie(); break;
    case 'toetsen': viewToetsen(); break;
    case 'toets': viewToets(Number(b)); break;
    case 'resultaat': viewResultaat(b, c); break;
    default: viewHome();
  }
  window.scrollTo({ top: 0 });
}

// ---------------------------------------------------------------- hulpjes UI
function badge(tekst, kleur = '#6b7676') {
  return `<span class="inline-flex items-center gap-1 text-xs font-extrabold uppercase tracking-wide px-2.5 py-1 rounded-full" style="background:${kleur}1a;color:${kleur}">${esc(tekst)}</span>`;
}
function domeinBadge(id) {
  return badge(DOM[id].naam, DOMEINKLEUR[id]);
}
function balk(pct, kleur) {
  return `<div class="balk" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(pct)}"><span style="width:${Math.max(0, Math.min(100, pct))}%;${kleur ? `background:${kleur}` : ''}"></span></div>`;
}

function toast(tekst) {
  const t = document.createElement('div');
  t.className = 'fixed bottom-5 left-1/2 -translate-x-1/2 z-[60] kaart px-5 py-3 font-bold verschijn';
  t.setAttribute('role', 'status');
  t.textContent = tekst;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3200);
}

function openModal(html, { onOpen, klein } = {}) {
  const vorigeFocus = document.activeElement;
  const el = document.createElement('div');
  el.className = 'modal-achter';
  el.innerHTML = `<div class="modal kaart p-6 sm:p-8 verschijn ${klein ? '!max-w-md' : ''}" role="dialog" aria-modal="true">${html}</div>`;
  modalRoot.appendChild(el);
  const sluit = () => {
    el.remove();
    document.removeEventListener('keydown', esc_);
    vorigeFocus?.focus?.();
  };
  const esc_ = (e) => {
    if (e.key === 'Escape') sluit();
  };
  document.addEventListener('keydown', esc_);
  el.addEventListener('mousedown', (e) => {
    if (e.target === el) sluit();
  });
  el.querySelectorAll('[data-sluit]').forEach((b) => b.addEventListener('click', sluit));
  onOpen?.(el, sluit);
  (el.querySelector('[autofocus]') || el.querySelector('button, input, select'))?.focus();
  return sluit;
}

function bevestig(titel, tekst, ok = 'Ja, ga door', annuleer = 'Nee, terug') {
  return new Promise((resolve) => {
    let klaar = false;
    openModal(
      `<h2 class="text-xl font-extrabold mb-2">${esc(titel)}</h2><p class="text-[#4b5757] mb-6">${tekst}</p>
       <div class="flex flex-wrap gap-3 justify-end"><button class="knop knop-rand" data-nee>${esc(annuleer)}</button><button class="knop knop-primair" data-ja autofocus>${esc(ok)}</button></div>`,
      {
        klein: true,
        onOpen(el, sluit) {
          el.querySelector('[data-ja]').addEventListener('click', () => { klaar = true; sluit(); resolve(true); });
          el.querySelector('[data-nee]').addEventListener('click', () => { klaar = true; sluit(); resolve(false); });
          const obs = new MutationObserver(() => {
            if (!el.isConnected) { obs.disconnect(); if (!klaar) resolve(false); }
          });
          obs.observe(modalRoot, { childList: true });
        },
      },
    );
  });
}

function rustmoment() {
  openModal(
    `<div class="text-center">
      <h2 class="text-xl font-extrabold">Even een rustmoment</h2>
      <p class="text-[#6b7676]">Volg de cirkel. Adem in als hij groter wordt, adem langzaam uit als hij kleiner wordt.</p>
      <div class="adem-cirkel" aria-hidden="true"></div>
      <p class="text-2xl font-extrabold text-[#2f7d6d]" data-adem aria-live="polite">Adem in…</p>
      <p class="text-sm text-[#6b7676] mt-4">Rekenen gaat beter met een rustig hoofd. Neem de tijd die je nodig hebt.</p>
      <button class="knop knop-primair mt-6" data-sluit>Ik ben er weer klaar voor</button>
    </div>`,
    {
      klein: true,
      onOpen(el) {
        const t = el.querySelector('[data-adem]');
        const start = Date.now();
        const iv = setInterval(() => {
          if (!el.isConnected) return clearInterval(iv);
          const s = ((Date.now() - start) / 1000) % 12;
          t.textContent = s < 4 ? 'Adem in…' : s < 6 ? 'Even vasthouden' : 'En rustig uit…';
        }, 250);
      },
    },
  );
}

// ---------------------------------------------------------------- statistiek
function statsPerDomein() {
  const p = store.leesVoortgang();
  return DOMEINEN.map((d) => {
    const vragen = bank.oefen.filter((q) => q.domein === d.id);
    let geprobeerd = 0, goed = 0;
    for (const q of vragen) {
      const s = p.vragen[q.id];
      if (s) {
        geprobeerd++;
        if (s.laatsteGoed) goed++;
      }
    }
    return { ...d, totaal: vragen.length, geprobeerd, goed };
  });
}
function foutjes() {
  const p = store.leesVoortgang();
  return Object.entries(p.vragen).filter(([id, s]) => !s.laatsteGoed && bank.perId.has(id)).map(([id]) => bank.perId.get(id));
}

// ---------------------------------------------------------------- HOME
function viewHome() {
  const stats = statsPerDomein();
  const p = store.leesVoortgang();
  const fout = foutjes();
  const totaalGeprobeerd = stats.reduce((a, s) => a + s.geprobeerd, 0);
  const res = p.toetsen;
  const beste = res.length ? Math.max(...res.map((r) => r.schaal)) : null;
  const laatste = res[res.length - 1];
  const lopend = store.leesLopend();
  app.innerHTML = `
  <section class="grid gap-6 md:grid-cols-5 verschijn">
    <div class="kaart p-6 sm:p-8 md:col-span-3">
      <p class="text-sm font-extrabold uppercase tracking-wide text-[#2f7d6d]">Welkom terug</p>
      <h1 class="text-3xl sm:text-4xl font-extrabold mt-1 mb-3">Fijn dat je er bent.</h1>
      <p class="text-[#4b5757] mb-5">${totaalGeprobeerd === 0 ? 'Begin rustig met een paar vragen. Er is geen tijdsdruk en je kunt altijd een uitwerking of de AI Coach erbij pakken.' : `Je hebt al <strong>${totaalGeprobeerd}</strong> van de 400 oefenvragen gemaakt. Mooi bezig!`}</p>
      <div class="feedback-info rounded-2xl p-4 mb-6 flex gap-3"><span aria-hidden="true">💡</span><p class="text-[#5c4a2c]"><strong>Tip van vandaag:</strong> ${esc(pick(TIPS))}</p></div>
      <div class="flex flex-wrap gap-3">
        <button class="knop knop-primair" data-snel="mix">10 vragen door elkaar</button>
        ${fout.length ? `<button class="knop knop-warm" data-snel="fouten">Herhaal je foutjes (${fout.length})</button>` : ''}
        <button class="knop knop-rand" data-rust>Even rustmoment</button>
      </div>
    </div>
    <div class="kaart p-6 sm:p-8 md:col-span-2 flex flex-col">
      <h2 class="text-lg font-extrabold mb-1">Oefentoetsen</h2>
      <p class="text-[#6b7676] text-sm mb-4">10 toetsen van 55 vragen, met een indicatie van je schaalscore (3F = ${NORM.grens3F}).</p>
      ${lopend ? `<div class="feedback-info rounded-2xl p-3 mb-4 text-sm"><strong>Toets ${lopend.nr} staat nog open.</strong> Je kunt verdergaan waar je gebleven was.</div>` : ''}
      <dl class="grid grid-cols-2 gap-3 mb-5">
        <div class="rounded-2xl bg-[#f7f5f0] p-3"><dt class="text-xs font-bold text-[#6b7676]">Gemaakt</dt><dd class="text-2xl font-extrabold">${res.length}</dd></div>
        <div class="rounded-2xl bg-[#f7f5f0] p-3"><dt class="text-xs font-bold text-[#6b7676]">Beste score</dt><dd class="text-2xl font-extrabold">${beste ?? '–'}${beste !== null && beste >= NORM.grens3F ? ' <span class="text-base">✓</span>' : ''}</dd></div>
      </dl>
      ${laatste ? `<p class="text-sm text-[#6b7676] mb-4">Laatste: toets ${laatste.toets} · ${laatste.schaal} punten · <a class="underline font-bold text-[#2f7d6d]" href="#/resultaat/${laatste.id}">bekijk</a></p>` : ''}
      <a href="#/toetsen" class="knop knop-zacht mt-auto">${lopend ? 'Ga verder met de toets' : 'Naar de toetsen'}</a>
    </div>
  </section>
  <section class="mt-8">
    <h2 class="text-xl font-extrabold mb-4">Oefenen per domein</h2>
    <div class="grid gap-4 sm:grid-cols-2">
      ${stats.map((s) => `
        <a href="#/oefenen/${s.id}" class="kaart p-5 block hover:shadow-md transition-shadow">
          <div class="flex items-start justify-between gap-3 mb-2">
            <div><h3 class="font-extrabold text-lg">${esc(s.naam)}</h3><p class="text-sm text-[#6b7676]">${esc(s.omschrijving)}</p></div>
            <span class="w-10 h-10 rounded-xl flex-none flex items-center justify-center font-extrabold text-white" style="background:${DOMEINKLEUR[s.id]}">${s.kort}</span>
          </div>
          ${balk((s.geprobeerd / s.totaal) * 100, DOMEINKLEUR[s.id])}
          <p class="text-sm mt-2 text-[#4b5757]"><strong>${s.geprobeerd}</strong> van ${s.totaal} geoefend${s.geprobeerd ? ` · <strong>${Math.round((s.goed / s.geprobeerd) * 100)}%</strong> goed bij de laatste poging` : ''}</p>
        </a>`).join('')}
    </div>
  </section>`;
  app.querySelector('[data-rust]').addEventListener('click', rustmoment);
  app.querySelectorAll('[data-snel]').forEach((b) =>
    b.addEventListener('click', () => {
      startSessie(b.dataset.snel === 'fouten' ? { domein: 'alle', soort: 'beide', modus: 'fouten', aantal: 20 } : { domein: 'alle', soort: 'beide', modus: 'nieuw', aantal: 10 });
    }),
  );
  const her = () => { if (!location.hash || location.hash === '#/') route(); };
  window.addEventListener('rwt:gesynchroniseerd', her);
  bijOpruimen(() => window.removeEventListener('rwt:gesynchroniseerd', her));
}

// ---------------------------------------------------------------- OEFENEN: keuze
let laatsteKeuze = { domein: 'alle', soort: 'beide', modus: 'nieuw', aantal: 10 };

function keuzeGroep(naam, label, opties, gekozen) {
  return `<fieldset class="mb-6"><legend class="font-extrabold mb-2">${label}</legend><div class="flex flex-wrap gap-2">
    ${opties.map(([w, t, sub]) => `<button type="button" class="optie !w-auto" data-groep="${naam}" data-waarde="${w}" aria-pressed="${w === gekozen}"><span class="bolletje"></span><span>${t}${sub ? `<span class="block text-xs font-semibold text-[#6b7676]">${sub}</span>` : ''}</span></button>`).join('')}
  </div></fieldset>`;
}

function viewOefenKeuze(domein) {
  const k = { ...laatsteKeuze };
  if (domein && DOM[domein]) k.domein = domein;
  const aantalFout = foutjes().length;
  const teken = () => {
    app.innerHTML = `
    <div class="kaart p-6 sm:p-8 verschijn">
      <h1 class="text-2xl sm:text-3xl font-extrabold mb-1">Oefenen</h1>
      <p class="text-[#6b7676] mb-6">Kies wat je wilt oefenen. Je krijgt direct feedback, een uitwerking en (als je wilt) hulp van de AI Coach.</p>
      ${keuzeGroep('domein', 'Domein', [['alle', 'Alles door elkaar'], ...DOMEINEN.map((d) => [d.id, d.naam])], k.domein)}
      ${keuzeGroep('soort', 'Soort vragen', [['beide', 'Allebei'], ['kaal', 'Kale sommen', 'zonder verhaaltje'], ['context', 'Contextvragen', 'met een situatie']], k.soort)}
      ${keuzeGroep('modus', 'Welke vragen', [['nieuw', 'Nieuwe eerst', 'wat je nog niet gemaakt hebt'], ['fouten', 'Mijn foutjes', `${aantalFout} vragen`], ['mix', 'Willekeurig']], k.modus)}
      ${keuzeGroep('aantal', 'Hoeveel vragen', [['5', '5'], ['10', '10'], ['20', '20'], ['50', '50']], String(k.aantal))}
      <div class="flex flex-wrap items-center gap-3"><button class="knop knop-primair" data-start>Start met oefenen</button><span class="text-sm text-[#6b7676]" data-info></span></div>
    </div>`;
    const pool = kiesOefenvragen({ ...k, aantal: 999 });
    app.querySelector('[data-info]').textContent = pool.length ? `${Math.min(pool.length, k.aantal)} vragen klaar` : 'Geen vragen gevonden met deze keuze.';
    app.querySelector('[data-start]').disabled = !pool.length;
    app.querySelectorAll('[data-groep]').forEach((b) =>
      b.addEventListener('click', () => {
        k[b.dataset.groep] = b.dataset.groep === 'aantal' ? Number(b.dataset.waarde) : b.dataset.waarde;
        teken();
        app.querySelector(`[data-groep="${b.dataset.groep}"][data-waarde="${b.dataset.waarde}"]`)?.focus();
      }),
    );
    app.querySelector('[data-start]').addEventListener('click', () => startSessie(k));
  };
  teken();
}

function kiesOefenvragen({ domein, soort, modus, aantal }) {
  const p = store.leesVoortgang();
  const filter = (q) => (domein === 'alle' || q.domein === domein) && (soort === 'beide' || q.type === soort);
  let pool;
  if (modus === 'fouten') {
    pool = shuffle(foutjes().filter(filter));
  } else {
    pool = shuffle(bank.oefen.filter(filter));
    if (modus === 'nieuw') {
      const rang = (q) => {
        const s = p.vragen[q.id];
        if (!s) return 0;
        if (!s.laatsteGoed) return 1;
        return 2 + (s.laatst || 0) / 1e13;
      };
      pool.sort((a, b) => rang(a) - rang(b));
    }
  }
  return pool.slice(0, aantal);
}

// ---------------------------------------------------------------- OEFENEN: sessie
let sessie = null;

function startSessie(keuze) {
  laatsteKeuze = { ...keuze };
  const vragen = kiesOefenvragen(keuze);
  if (!vragen.length) {
    toast('Er zijn (nog) geen vragen voor deze keuze.');
    return;
  }
  sessie = { vragen, index: 0, resultaten: [], keuze };
  if (location.hash === '#/sessie') route();
  else location.hash = '#/sessie';
}

function antwoordInvoerHTML(q, waarde = '', { id = 'antwoord' } = {}) {
  if (q.invoer === 'keuze') {
    const weergave = q.optieWeergave || q.opties;
    return `<div class="grid gap-2 sm:grid-cols-2" role="group" aria-label="Kies een antwoord">${q.opties.map((o, i) => `<button type="button" class="optie" data-optie="${esc(o)}" aria-pressed="${o === waarde}"><span class="bolletje"></span><span>${rich(weergave[i])}</span></button>`).join('')}</div>`;
  }
  const placeholder = q.invoer === 'tijd' ? 'uu:mm' : q.breuk ? 'bijv. 3/4 of 1 1/2' : '';
  const hint = q.invoer === 'tijd' ? 'Schrijf de tijd als uu:mm, bijvoorbeeld 14:05.' : q.breuk ? 'Typ een breuk met een schuine streep, bijvoorbeeld 5/12 of 1 1/3.' : 'Gebruik een komma voor decimalen, bijvoorbeeld 12,5.';
  const voor = q.voor ? `<span class="plak">${esc(q.voor)}</span>` : '';
  const na = q.eenheid && q.invoer !== 'tijd' ? `<span class="plak">${esc(q.eenheid)}</span>` : '';
  return `<label for="${id}" class="block font-bold mb-2">Jouw antwoord</label>
    <div class="flex items-center gap-3 max-w-md">${voor}<input id="${id}" class="invoer antwoord-veld" inputmode="${q.invoer === 'tijd' ? 'numeric' : 'text'}" autocomplete="off" spellcheck="false" placeholder="${placeholder}" value="${esc(waarde)}">${na}</div>
    <p class="text-sm text-[#6b7676] mt-2">${hint}</p>`;
}

function koppelKeuze(container, onKies) {
  container.querySelectorAll('[data-optie]').forEach((b) =>
    b.addEventListener('click', () => {
      container.querySelectorAll('[data-optie]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      onKies(b.dataset.optie);
    }),
  );
}

function rekenmachineKnop(q, plek) {
  if (!q.calc) return '';
  return `<button type="button" class="knop knop-rand !py-2 text-sm" data-rm-toggle aria-expanded="false">🧮 Rekenmachine</button>`;
}
function koppelRekenmachine(root) {
  const knop = root.querySelector('[data-rm-toggle]');
  const vak = root.querySelector('[data-rm-vak]');
  if (!knop || !vak) return;
  let rm = null;
  knop.addEventListener('click', () => {
    const open = vak.classList.toggle('hidden') === false;
    knop.setAttribute('aria-expanded', String(open));
    if (open && !rm) rm = maakRekenmachine(vak);
    if (open) rm.focus();
  });
}

function viewSessie() {
  if (!sessie) {
    location.hash = '#/oefenen';
    return;
  }
  if (sessie.index >= sessie.vragen.length) return sessieKlaar();
  const q = sessie.vragen[sessie.index];
  const n = sessie.vragen.length;
  let poging = 0;
  let gekozen = '';
  let afgerond = false;
  app.innerHTML = `
  <div class="verschijn">
    <div class="flex flex-wrap items-center gap-2 mb-3">
      <span class="font-extrabold">Vraag ${sessie.index + 1} van ${n}</span>
      ${domeinBadge(q.domein)} ${badge(q.type === 'kaal' ? 'Kaal' : 'Context')} ${q.calc ? badge('Rekenmachine mag', '#2f7d6d') : badge('Zonder rekenmachine', '#c9852e')}
      <button class="ml-auto text-sm font-bold text-[#6b7676] hover:underline" data-stop>Stoppen</button>
    </div>
    ${balk((sessie.index / n) * 100)}
    <div class="grid gap-6 lg:grid-cols-[1fr_auto] mt-5">
      <div class="kaart p-6 sm:p-8" data-qid="${q.id}">
        <div class="vraag-tekst mb-6">${vraagHTML(q)}</div>
        <div data-invoer>${antwoordInvoerHTML(q)}</div>
        <div class="flex flex-wrap gap-3 mt-5" data-acties>
          <button class="knop knop-primair" data-controleer>Controleer</button>
          ${rekenmachineKnop(q)}
        </div>
        <div data-melding class="mt-4" aria-live="assertive"></div>
        <div data-feedback class="mt-4"></div>
      </div>
      <aside data-rm-vak class="hidden kaart p-4 h-fit lg:sticky lg:top-24"></aside>
    </div>
  </div>`;
  koppelRekenmachine(app);
  const invoer = app.querySelector('#antwoord');
  const melding = app.querySelector('[data-melding]');
  const feedback = app.querySelector('[data-feedback]');
  const acties = app.querySelector('[data-acties]');
  if (invoer && fijnePointer) invoer.focus();
  koppelKeuze(app.querySelector('[data-invoer]'), (o) => { gekozen = o; melding.innerHTML = ''; });
  const waarde = () => (q.invoer === 'keuze' ? gekozen : invoer.value);

  app.querySelector('[data-stop]').addEventListener('click', async () => {
    if (sessie.resultaten.length === 0 || (await bevestig('Stoppen met oefenen?', 'Je voortgang tot nu toe is al opgeslagen.', 'Ja, stoppen', 'Verder oefenen'))) sessieKlaar();
  });

  const volgende = () => {
    sessie.index++;
    viewSessie();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toonOplossing = (studentAntwoord, wasGoed) => {
    afgerond = true;
    acties.innerHTML = `<button class="knop knop-primair" data-volgende>${sessie.index + 1 < n ? 'Volgende vraag →' : 'Bekijk je resultaat'}</button>${rekenmachineKnop(q)}`;
    koppelRekenmachine(app);
    acties.querySelector('[data-volgende]').addEventListener('click', volgende);
    if (invoer) invoer.readOnly = true;
    app.querySelectorAll('[data-optie]').forEach((b) => (b.disabled = true));
    feedback.innerHTML = `
      <div class="${wasGoed ? 'feedback-goed' : 'feedback-fout'} rounded-2xl p-5 verschijn">
        <p class="font-extrabold text-lg mb-1">${wasGoed ? esc(pick(GOED)) : 'Zo zit het:'}</p>
        ${wasGoed ? '' : `<p class="mb-1">Jouw antwoord: <strong>${esc(studentAntwoord || '–')}</strong></p>`}
        <p class="mb-3">Het juiste antwoord is <strong>${rich(antwoordTekst(q))}</strong>.</p>
        <details ${wasGoed ? '' : 'open'} class="mt-2"><summary class="cursor-pointer font-bold">Uitwerking</summary><div class="mt-2">${uitwerkingHTML(q)}</div></details>
      </div>
      ${wasGoed ? '' : '<div data-coach class="mt-4"></div>'}`;
    if (!wasGoed) coachBlok(feedback.querySelector('[data-coach]'), q, studentAntwoord);
    acties.querySelector('[data-volgende]').focus();
  };

  const controleer = () => {
    if (afgerond) return volgende();
    const inv = waarde();
    const r = checkAnswer(q, inv);
    if (r.status === 'leeg') {
      melding.innerHTML = `<p class="text-[#7a4d12] font-bold">Vul eerst een antwoord in${q.invoer === 'keuze' ? ' (kies een van de mogelijkheden)' : ''}.</p>`;
      return;
    }
    if (r.status === 'onleesbaar') {
      melding.innerHTML = `<p class="text-[#7a4d12] font-bold">Ik kan dit antwoord niet goed lezen. ${q.invoer === 'tijd' ? 'Schrijf de tijd als uu:mm.' : 'Gebruik alleen cijfers, een komma, een minteken of een breuk zoals 3/4.'}</p>`;
      return;
    }
    melding.innerHTML = '';
    poging++;
    const goed = r.status === 'goed';
    if (poging === 1) {
      store.registreerAntwoord(q.id, goed);
      sessie.resultaten.push({ id: q.id, goed, antwoord: inv });
    }
    if (goed) return toonOplossing(inv, true);
    if (poging === 1) {
      feedback.innerHTML = `
        <div class="feedback-fout rounded-2xl p-5 verschijn">
          <p class="font-extrabold text-lg mb-1">${esc(pick(FOUT))}</p>
          <p class="mb-4">Lees de vraag nog eens rustig. Klopt de eenheid? Kun je je antwoord controleren met een schatting?</p>
          <div class="flex flex-wrap gap-3"><button class="knop knop-zacht" data-opnieuw>Probeer het opnieuw</button><button class="knop knop-rand" data-toon>Laat het antwoord zien</button></div>
        </div>`;
      feedback.querySelector('[data-opnieuw]').addEventListener('click', () => {
        feedback.innerHTML = '';
        if (invoer) { invoer.select(); invoer.focus(); }
      });
      feedback.querySelector('[data-toon]').addEventListener('click', () => toonOplossing(inv, false));
      return;
    }
    toonOplossing(inv, false);
  };
  app.querySelector('[data-controleer]').addEventListener('click', controleer);
  invoer?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); controleer(); }
  });
}

function sessieKlaar() {
  const r = sessie?.resultaten || [];
  const goed = r.filter((x) => x.goed).length;
  const fout = r.filter((x) => !x.goed);
  const pct = r.length ? Math.round((goed / r.length) * 100) : 0;
  const keuze = sessie?.keuze || laatsteKeuze;
  sessie = null;
  app.innerHTML = `
  <div class="kaart p-6 sm:p-10 max-w-2xl mx-auto text-center verschijn">
    <p class="text-5xl mb-3" aria-hidden="true">${pct >= 80 ? '🌟' : pct >= 50 ? '🌱' : '🤍'}</p>
    <h1 class="text-2xl sm:text-3xl font-extrabold mb-2">${r.length ? `${goed} van de ${r.length} in één keer goed` : 'Sessie gestopt'}</h1>
    <p class="text-[#4b5757] mb-6">${!r.length ? 'Geen probleem. Kom terug wanneer je er zin in hebt.' : pct >= 80 ? 'Wat een mooie score! Je mag trots zijn.' : pct >= 50 ? 'Goed bezig. Met de foutjes erbij oefenen word je steeds sterker.' : 'Elke vraag die je oefent, maakt de echte toets makkelijker. Rustig doorgaan!'}</p>
    ${fout.length ? `<div class="text-left mb-6"><h2 class="font-extrabold mb-2">Deze vragen kun je nog eens bekijken:</h2><ul class="space-y-2">${fout.map((f) => { const q = bank.perId.get(f.id); return `<li class="rounded-xl bg-[#f7f5f0] p-3 text-sm">${domeinBadge(q.domein)} <span class="ml-1">${rich(q.vraag.split('\n').slice(-1)[0])}</span> <span class="block mt-1 text-[#6b7676]">Jouw antwoord: ${esc(f.antwoord)} · juist: <strong>${rich(antwoordTekst(q))}</strong></span></li>`; }).join('')}</ul></div>` : ''}
    <div class="flex flex-wrap justify-center gap-3">
      <button class="knop knop-primair" data-weer>Nog een rondje</button>
      ${fout.length ? '<button class="knop knop-warm" data-fouten>Oefen mijn foutjes</button>' : ''}
      <a class="knop knop-rand" href="#/">Naar het overzicht</a>
    </div>
  </div>`;
  app.querySelector('[data-weer]').addEventListener('click', () => startSessie(keuze));
  app.querySelector('[data-fouten]')?.addEventListener('click', () => startSessie({ ...keuze, modus: 'fouten', domein: 'alle', soort: 'beide', aantal: 20 }));
}

// ---------------------------------------------------------------- AI COACH
function coachBlok(el, q, studentAntwoord) {
  const berichten = [];
  let controller = null;
  el.innerHTML = `<button class="knop knop-zacht" data-vraag>✨ Vraag de AI Coach</button>`;
  bijOpruimen(() => controller?.abort());
  const teken = (status = '') => {
    const gesprek = berichten
      .slice(1)
      .map((b) => (b.role === 'assistant' ? `<div class="coach-tekst">${miniMarkdown(b.weergave)}</div>` : `<div class="coach-bericht-student my-3"><p>${esc(b.content)}</p></div>`))
      .join('');
    el.innerHTML = `
      <div class="coach rounded-2xl p-5 verschijn">
        <p class="font-extrabold mb-2 flex items-center gap-2"><span aria-hidden="true">✨</span> AI Coach</p>
        <div aria-live="polite">${gesprek}${status}</div>
        ${berichten.length >= 2 && !status ? `
          <form class="mt-4 flex gap-2" data-vervolg>
            <label for="vervolg-${q.id}" class="sr-only">Stel een vervolgvraag</label>
            <input id="vervolg-${q.id}" class="invoer !text-base" placeholder="Stel een vervolgvraag, bijv. ‘Kun je het anders uitleggen?’" maxlength="500" autocomplete="off">
            <button class="knop knop-primair !px-4" type="submit">Stuur</button>
          </form>` : ''}
      </div>`;
    el.querySelector('[data-vervolg]')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const t = e.target.querySelector('input').value.trim();
      if (t) stuur(t);
    });
  };
  const stuur = async (tekst) => {
    berichten.push({ role: 'user', content: tekst });
    teken(`<p class="text-[#4b5757] laden">De coach denkt even met je mee</p>`);
    controller = new AbortController();
    try {
      const { tekst: antwoord, inhoud } = await vraagCoach(berichten.map(({ role, content }) => ({ role, content })), { signal: controller.signal });
      berichten.push({ role: 'assistant', content: inhoud, weergave: antwoord });
      teken();
    } catch (e) {
      if (e.name === 'AbortError') return;
      berichten.pop();
      const naarInstellingen = e.soort === 'geen-key' || e.soort === 'key' || e.soort === 'model';
      teken(`<div class="feedback-info rounded-xl p-4"><p class="mb-3">${esc(e.message)}${e.soort === 'geen-key' ? ' Met je eigen Anthropic API-key kan de coach je fouten uitleggen.' : ''}</p>
        <div class="flex flex-wrap gap-2">${naarInstellingen ? '<button class="knop knop-primair !py-2" data-inst>Instellingen openen</button>' : ''}<button class="knop knop-rand !py-2" data-opnieuw>Opnieuw proberen</button></div></div>`);
      el.querySelector('[data-inst]')?.addEventListener('click', () => openInstellingen('ai'));
      el.querySelector('[data-opnieuw]')?.addEventListener('click', () => stuur(tekst));
    }
  };
  el.querySelector('[data-vraag]').addEventListener('click', () => stuur(maakEersteBericht(q, studentAntwoord)));
}

// ---------------------------------------------------------------- TOETSEN overzicht
function viewToetsen() {
  const p = store.leesVoortgang();
  const lopend = store.leesLopend();
  const nodig = nodigVoor3F();
  app.innerHTML = `
  <div class="verschijn">
    <div class="kaart p-6 sm:p-8 mb-6">
      <h1 class="text-2xl sm:text-3xl font-extrabold mb-2">Oefentoetsen</h1>
      <p class="text-[#4b5757] mb-4">Elke toets lijkt qua opbouw op de echte RWT: <strong>55 vragen</strong>, eerst <strong>17 vragen zonder rekenmachine</strong>, daarna <strong>38 vragen met rekenmachine</strong>. Je krijgt pas aan het eind je score en de uitwerkingen.</p>
      <ul class="text-sm text-[#4b5757] space-y-1 mb-2 list-disc pl-5">
        <li>Er is geen tijdslimiet. Neem de tijd die je nodig hebt.</li>
        <li>Je kunt tussendoor stoppen; je antwoorden worden bewaard.</li>
        <li>Met ongeveer <strong>${nodig} van de 55</strong> goed zit je op de 3F-grens (${NORM.grens3F} punten). Dit is een indicatie.</li>
      </ul>
    </div>
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      ${bank.toetsen.map((t) => {
        const pogingen = p.toetsen.filter((r) => r.toets === t.nr);
        const beste = pogingen.length ? pogingen.reduce((a, b) => (b.schaal > a.schaal ? b : a)) : null;
        const bezig = lopend?.nr === t.nr;
        return `<div class="kaart p-5 flex flex-col">
          <div class="flex items-center justify-between mb-2"><h2 class="font-extrabold text-lg">${esc(t.titel)}</h2>${beste ? (beste.schaal >= NORM.grens3F ? badge('3F ✓', '#2f7d4f') : badge('nog niet', '#b4643c')) : ''}</div>
          <p class="text-sm text-[#6b7676] mb-4">${bezig ? `Bezig: ${Object.values(lopend.antwoorden || {}).filter((v) => String(v).trim()).length} van 55 ingevuld` : beste ? `Beste score: <strong>${beste.schaal}</strong> (${beste.ruw}/55) · ${pogingen.length}× gemaakt` : 'Nog niet gemaakt'}</p>
          <div class="mt-auto flex flex-wrap gap-2">
            <a class="knop ${bezig ? 'knop-warm' : 'knop-primair'} !py-2" href="#/toets/${t.nr}">${bezig ? 'Ga verder' : pogingen.length ? 'Opnieuw maken' : 'Start toets'}</a>
            ${beste ? `<a class="knop knop-rand !py-2" href="#/resultaat/${beste.id}">Resultaat</a>` : ''}
          </div>
        </div>`;
      }).join('')}
    </div>
    ${p.toetsen.length ? `
    <div class="kaart p-6 mt-6">
      <h2 class="font-extrabold text-lg mb-3">Al je resultaten</h2>
      <div class="overflow-x-auto"><table class="w-full text-left text-sm">
        <thead><tr class="text-[#6b7676]"><th class="py-2 pr-4">Datum</th><th class="pr-4">Toets</th><th class="pr-4">Goed</th><th class="pr-4">Score</th><th></th></tr></thead>
        <tbody>${[...p.toetsen].reverse().map((r) => `<tr class="border-t border-[#eeeae2]"><td class="py-2 pr-4">${datum(r.datum)}</td><td class="pr-4">${r.toets}</td><td class="pr-4">${r.ruw}/55</td><td class="pr-4 font-extrabold ${r.schaal >= NORM.grens3F ? 'text-[#2f7d4f]' : ''}">${r.schaal}</td><td><a class="underline font-bold text-[#2f7d6d]" href="#/resultaat/${r.id}">bekijk</a></td></tr>`).join('')}</tbody>
      </table></div>
    </div>` : ''}
  </div>`;
}

// ---------------------------------------------------------------- TOETS maken
function viewToets(nr) {
  const toets = bank.toetsen.find((t) => t.nr === nr);
  if (!toets) {
    location.hash = '#/toetsen';
    return;
  }
  const lopend = store.leesLopend();
  if (lopend && lopend.nr === nr) return toetsScherm(toets, lopend);
  app.innerHTML = `
  <div class="kaart p-6 sm:p-10 max-w-2xl mx-auto verschijn">
    <p class="text-sm font-extrabold uppercase tracking-wide text-[#2f7d6d]">${esc(toets.titel)}</p>
    <h1 class="text-2xl sm:text-3xl font-extrabold mt-1 mb-4">Klaar om te beginnen?</h1>
    ${lopend ? `<div class="feedback-info rounded-2xl p-4 mb-4 text-sm">Let op: toets ${lopend.nr} staat nog open. Als je deze toets start, wordt die andere toets niet bewaard.</div>` : ''}
    <ol class="space-y-3 mb-6">
      <li class="flex gap-3"><span class="w-7 h-7 flex-none rounded-full bg-[#fbf0df] text-[#7a4d12] font-extrabold flex items-center justify-center">1</span><span><strong>Deel 1 – 17 vragen zonder rekenmachine.</strong> Hoofdrekenen en handig rekenen. Kladpapier mag!</span></li>
      <li class="flex gap-3"><span class="w-7 h-7 flex-none rounded-full bg-[#e3f1ec] text-[#1f5c50] font-extrabold flex items-center justify-center">2</span><span><strong>Deel 2 – 38 vragen met rekenmachine.</strong> Vooral contextvragen. De rekenmachine zit in de app.</span></li>
    </ol>
    <p class="text-[#4b5757] mb-6">Je kunt binnen een deel heen en weer bladeren en vragen markeren om later nog eens naar te kijken. Na deel 1 kun je niet meer terug. Je ziet je score en alle uitwerkingen aan het eind.</p>
    <div class="flex flex-wrap gap-3"><button class="knop knop-primair" data-start>Start de toets</button><button class="knop knop-rand" data-rust>Eerst even rustmoment</button></div>
  </div>`;
  app.querySelector('[data-rust]').addEventListener('click', rustmoment);
  app.querySelector('[data-start]').addEventListener('click', () => {
    const nieuw = { nr, deel: 1, index: 0, antwoorden: {}, vlaggen: {}, start: Date.now() };
    store.schrijfLopend(nieuw);
    toetsScherm(toets, nieuw);
  });
}

function toetsScherm(toets, st) {
  const opslaan = () => store.schrijfLopend(st);
  const deelVragen = toets.vragen.filter((q) => q.deel === st.deel);
  const offset = st.deel === 1 ? 0 : toets.vragen.findIndex((q) => q.deel === 2);
  if (st.index < offset || st.index >= offset + deelVragen.length) st.index = offset;
  const q = toets.vragen[st.index];
  const lokaal = st.index - offset;
  const ingevuld = deelVragen.filter((v) => String(st.antwoorden[v.id] ?? '').trim()).length;
  const laatsteVanDeel = lokaal === deelVragen.length - 1;
  app.innerHTML = `
  <div class="verschijn">
    <div class="flex flex-wrap items-center gap-2 mb-3">
      <span class="font-extrabold">${esc(toets.titel)} · Deel ${st.deel}</span>
      ${st.deel === 1 ? badge('Zonder rekenmachine', '#c9852e') : badge('Met rekenmachine', '#2f7d6d')}
      <span class="text-sm text-[#6b7676]">${ingevuld} van ${deelVragen.length} ingevuld</span>
      <button class="ml-auto text-sm font-bold text-[#6b7676] hover:underline" data-rust>Even pauze</button>
      <a class="text-sm font-bold text-[#6b7676] hover:underline" href="#/toetsen">Later verder</a>
    </div>
    ${balk(((lokaal + 1) / deelVragen.length) * 100)}
    <div class="grid gap-6 lg:grid-cols-[1fr_auto] mt-5">
      <div class="kaart p-6 sm:p-8" data-qid="${q.id}">
        <div class="flex items-center justify-between gap-3 mb-4">
          <p class="font-extrabold text-[#6b7676]">Vraag ${st.index + 1} <span class="font-semibold">van 55</span></p>
          <button class="text-sm font-bold rounded-full px-3 py-1 ${st.vlaggen[q.id] ? 'bg-[#fbf0df] text-[#7a4d12]' : 'bg-[#f7f5f0] text-[#6b7676]'}" data-vlag aria-pressed="${!!st.vlaggen[q.id]}">${st.vlaggen[q.id] ? '★ Gemarkeerd' : '☆ Markeer'}</button>
        </div>
        <div class="vraag-tekst mb-6">${vraagHTML(q)}</div>
        <div data-invoer>${antwoordInvoerHTML(q, st.antwoorden[q.id] || '')}</div>
        <div class="flex flex-wrap gap-3 mt-6">
          <button class="knop knop-rand" data-vorige ${lokaal === 0 ? 'disabled' : ''}>← Vorige</button>
          ${laatsteVanDeel ? `<button class="knop knop-primair" data-afronden>${st.deel === 1 ? 'Klaar met deel 1' : 'Toets inleveren'}</button>` : '<button class="knop knop-primair" data-volgende>Volgende →</button>'}
          ${st.deel === 2 ? '<button type="button" class="knop knop-rand" data-rm-toggle aria-expanded="false">🧮 Rekenmachine</button>' : ''}
        </div>
      </div>
      <aside class="space-y-4 lg:w-[300px]">
        <div data-rm-vak class="hidden kaart p-4"></div>
        <div class="kaart p-4">
          <p class="font-extrabold mb-3 text-sm">Vragen deel ${st.deel}</p>
          <div class="flex flex-wrap gap-2">${deelVragen.map((v, i) => `<button class="raster-knop ${String(st.antwoorden[v.id] ?? '').trim() ? 'beantwoord' : ''} ${i === lokaal ? 'huidig' : ''} ${st.vlaggen[v.id] ? 'vlag' : ''}" data-ga="${offset + i}" aria-label="Vraag ${offset + i + 1}${String(st.antwoorden[v.id] ?? '').trim() ? ', ingevuld' : ''}${st.vlaggen[v.id] ? ', gemarkeerd' : ''}">${offset + i + 1}</button>`).join('')}</div>
          <button class="knop knop-zacht w-full mt-4 !py-2 text-sm" data-afronden>${st.deel === 1 ? 'Naar deel 2' : 'Toets inleveren'}</button>
        </div>
      </aside>
    </div>
  </div>`;
  koppelRekenmachine(app);
  const invoer = app.querySelector('#antwoord');
  if (invoer && fijnePointer) invoer.focus();
  invoer?.addEventListener('input', () => {
    st.antwoorden[q.id] = invoer.value;
    opslaan();
    app.querySelector(`[data-ga="${st.index}"]`)?.classList.toggle('beantwoord', !!invoer.value.trim());
  });
  koppelKeuze(app.querySelector('[data-invoer]'), (o) => {
    st.antwoorden[q.id] = o;
    opslaan();
    app.querySelector(`[data-ga="${st.index}"]`)?.classList.add('beantwoord');
  });
  const ga = (i) => {
    st.index = i;
    opslaan();
    toetsScherm(toets, st);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  app.querySelector('[data-rust]').addEventListener('click', rustmoment);
  app.querySelector('[data-vorige]').addEventListener('click', () => lokaal > 0 && ga(st.index - 1));
  app.querySelector('[data-volgende]')?.addEventListener('click', () => ga(st.index + 1));
  invoer?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (!laatsteVanDeel) ga(st.index + 1);
    }
  });
  app.querySelectorAll('[data-ga]').forEach((b) => b.addEventListener('click', () => ga(Number(b.dataset.ga))));
  app.querySelector('[data-vlag]').addEventListener('click', () => {
    st.vlaggen[q.id] = !st.vlaggen[q.id];
    opslaan();
    toetsScherm(toets, st);
  });
  app.querySelectorAll('[data-afronden]').forEach((b) =>
    b.addEventListener('click', async () => {
      const leeg = deelVragen.length - deelVragen.filter((v) => String(st.antwoorden[v.id] ?? '').trim()).length;
      const vlag = deelVragen.filter((v) => st.vlaggen[v.id]).length;
      const extra = [leeg ? `Je hebt nog <strong>${leeg}</strong> ${leeg === 1 ? 'vraag' : 'vragen'} niet ingevuld.` : 'Je hebt alle vragen ingevuld.', vlag ? `Er ${vlag === 1 ? 'is' : 'zijn'} <strong>${vlag}</strong> gemarkeerd.` : ''].join(' ');
      if (st.deel === 1) {
        if (await bevestig('Door naar deel 2?', `${extra} Na deze stap kun je deel 1 niet meer aanpassen.`, 'Ja, naar deel 2', 'Nog even kijken')) {
          st.deel = 2;
          st.index = offset + deelVragen.length;
          opslaan();
          toetsScherm(toets, st);
          window.scrollTo({ top: 0 });
        }
      } else if (await bevestig('Toets inleveren?', `${extra} Daarna zie je je score en alle uitwerkingen.`, 'Ja, inleveren', 'Nog even kijken')) {
        leverIn(toets, st);
      }
    }),
  );
}

function leverIn(toets, st) {
  const correct = {};
  const perDomein = {};
  const perDeel = { 1: { goed: 0, totaal: 0 }, 2: { goed: 0, totaal: 0 } };
  let ruw = 0;
  for (const q of toets.vragen) {
    const goed = checkAnswer(q, st.antwoorden[q.id] || '').status === 'goed';
    correct[q.id] = goed;
    if (goed) ruw++;
    perDomein[q.domein] ??= { goed: 0, totaal: 0 };
    perDomein[q.domein].totaal++;
    perDeel[q.deel].totaal++;
    if (goed) {
      perDomein[q.domein].goed++;
      perDeel[q.deel].goed++;
    }
  }
  const res = {
    id: 'r' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    toets: toets.nr,
    datum: Date.now(),
    duurMin: Math.round((Date.now() - (st.start || Date.now())) / 60000),
    ruw,
    totaal: toets.vragen.length,
    schaal: schaalscore(ruw, toets.vragen.length),
    perDomein,
    perDeel,
    antwoorden: Object.fromEntries(Object.entries(st.antwoorden).filter(([, v]) => String(v).trim())),
    correct,
  };
  store.voegToetsToe(res);
  store.schrijfLopend(null);
  location.hash = `#/resultaat/${res.id}`;
}

// ---------------------------------------------------------------- RESULTAAT
function viewResultaat(id, filter = 'fout') {
  const res = store.leesVoortgang().toetsen.find((r) => r.id === id);
  const toets = res && bank.toetsen.find((t) => t.nr === res.toets);
  if (!res || !toets) {
    app.innerHTML = `<div class="kaart p-8 text-center"><p class="mb-4">Dit resultaat kon ik niet vinden.</p><a class="knop knop-primair" href="#/toetsen">Naar de toetsen</a></div>`;
    return;
  }
  const adv = advies(res.schaal, res.perDomein);
  const min = NORM.ankers[0][1], max = NORM.ankers[NORM.ankers.length - 1][1];
  const pos = (v) => ((v - min) / (max - min)) * 100;
  const gehaald = res.schaal >= NORM.grens3F;
  const lijst = toets.vragen.map((q, i) => ({ q, i, goed: !!res.correct[q.id], antwoord: res.antwoorden[q.id] || '' }));
  const getoond = filter === 'alle' ? lijst : lijst.filter((x) => !x.goed);
  app.innerHTML = `
  <div class="verschijn">
    <div class="kaart p-6 sm:p-10 mb-6">
      <p class="text-sm font-extrabold uppercase tracking-wide text-[#2f7d6d]">${esc(toets.titel)} · ${datum(res.datum)}${res.duurMin ? ` · ${res.duurMin} min` : ''}</p>
      <div class="flex flex-wrap items-end gap-x-8 gap-y-2 mt-2 mb-6">
        <div><p class="text-sm font-bold text-[#6b7676]">Schaalscore (indicatie)</p><p class="text-6xl font-extrabold ${gehaald ? 'text-[#2f7d4f]' : 'text-[#2f3a3a]'}">${res.schaal}</p></div>
        <div class="pb-2"><p class="text-sm font-bold text-[#6b7676]">Goed</p><p class="text-3xl font-extrabold">${res.ruw} <span class="text-lg text-[#6b7676]">/ ${res.totaal}</span></p></div>
        <div class="pb-2"><p class="text-sm font-bold text-[#6b7676]">3F-grens</p><p class="text-3xl font-extrabold">${NORM.grens3F}</p></div>
      </div>
      <div class="meter mb-2" aria-hidden="true"><div class="meter-grens" style="left:${pos(NORM.grens3F)}%"></div><div class="meter-pijl" style="left:${pos(res.schaal)}%"></div></div>
      <div class="relative h-5 text-xs text-[#6b7676] mb-6"><span class="absolute left-0">${min}</span><span class="absolute -translate-x-1/2 font-bold" style="left:${pos(NORM.grens3F)}%">3F</span><span class="absolute right-0">${max}</span></div>
      <div class="${gehaald ? 'feedback-goed' : 'feedback-info'} rounded-2xl p-5">
        <h1 class="text-xl font-extrabold mb-1">${esc(adv.titel)}</h1>
        <p>${esc(adv.tekst)}</p>
        ${adv.tips.length ? `<p class="mt-2"><strong>Tip voor ${esc(DOM[adv.zwakst].naam)}:</strong> ${esc(adv.tips[0])}</p>` : ''}
      </div>
      <p class="text-xs text-[#6b7676] mt-3">De schaalscore is een benadering van de Cito-normering (ongeveer ${nodigVoor3F()} van de 55 goed = ${NORM.grens3F}). De echte omrekening kan per toetsversie iets verschillen.</p>
    </div>
    <div class="grid gap-6 md:grid-cols-2 mb-6">
      <div class="kaart p-6"><h2 class="font-extrabold text-lg mb-4">Per domein</h2>
        ${DOMEINEN.map((d) => { const s = res.perDomein[d.id] || { goed: 0, totaal: 0 }; return `<div class="mb-4"><div class="flex justify-between text-sm font-bold mb-1"><span>${esc(d.naam)}</span><span>${s.goed}/${s.totaal}</span></div>${balk(s.totaal ? (s.goed / s.totaal) * 100 : 0, DOMEINKLEUR[d.id])}</div>`; }).join('')}
      </div>
      <div class="kaart p-6"><h2 class="font-extrabold text-lg mb-4">Per deel</h2>
        ${[1, 2].map((d) => { const s = res.perDeel[d]; return `<div class="mb-4"><div class="flex justify-between text-sm font-bold mb-1"><span>Deel ${d} ${d === 1 ? '(zonder rekenmachine)' : '(met rekenmachine)'}</span><span>${s.goed}/${s.totaal}</span></div>${balk((s.goed / s.totaal) * 100)}</div>`; }).join('')}
        <div class="flex flex-wrap gap-2 mt-6"><a class="knop knop-primair !py-2" href="#/toets/${toets.nr}">Toets opnieuw maken</a><a class="knop knop-rand !py-2" href="#/toetsen">Alle toetsen</a></div>
      </div>
    </div>
    <div class="kaart p-6 sm:p-8">
      <div class="flex flex-wrap items-center gap-3 mb-4">
        <h2 class="font-extrabold text-lg mr-auto">Nakijken</h2>
        <a class="knop !py-1.5 text-sm ${filter !== 'alle' ? 'knop-primair' : 'knop-rand'}" href="#/resultaat/${res.id}/fout">Alleen fouten (${lijst.filter((x) => !x.goed).length})</a>
        <a class="knop !py-1.5 text-sm ${filter === 'alle' ? 'knop-primair' : 'knop-rand'}" href="#/resultaat/${res.id}/alle">Alle vragen</a>
      </div>
      ${getoond.length ? '' : '<p class="text-[#4b5757]">Geen fouten. Wauw! 🎉</p>'}
      <div class="space-y-3">${getoond.map(({ q, i, goed, antwoord }) => `
        <details class="rounded-2xl border border-[#e6e1d8] ${goed ? 'bg-[#f6fbf7]' : 'bg-[#fffaf6]'}" data-review="${q.id}">
          <summary class="cursor-pointer p-4 flex flex-wrap items-center gap-2">
            <span class="font-extrabold w-8">${i + 1}.</span><span aria-label="${goed ? 'goed' : 'fout'}">${goed ? '✅' : '🔸'}</span> ${domeinBadge(q.domein)}
            <span class="text-sm text-[#4b5757] basis-full sm:basis-auto sm:ml-2">Jouw antwoord: <strong>${esc(antwoord || '(niet ingevuld)')}</strong>${goed ? '' : ` · juist: <strong>${rich(antwoordTekst(q))}</strong>`}</span>
          </summary>
          <div class="px-4 pb-4">
            <div class="vraag-tekst mb-3">${vraagHTML(q)}</div>
            <div class="rounded-xl bg-white border border-[#eeeae2] p-4">${uitwerkingHTML(q)}</div>
            ${goed ? '' : '<div data-coach class="mt-3"></div>'}
          </div>
        </details>`).join('')}</div>
    </div>
  </div>`;
  app.querySelectorAll('[data-review]').forEach((d) => {
    const q = bank.perId.get(d.dataset.review);
    const c = d.querySelector('[data-coach]');
    if (c) coachBlok(c, q, res.antwoorden[q.id] || '');
  });
}

// ---------------------------------------------------------------- INSTELLINGEN
function openInstellingen(focusSectie) {
  const s = store.leesInstellingen();
  openModal(
    `<div class="flex items-start justify-between gap-4 mb-6"><h2 class="text-2xl font-extrabold">Instellingen</h2><button class="knop knop-rand !px-3 !py-1.5" data-sluit aria-label="Sluiten">✕</button></div>

    <section class="mb-8" id="sectie-sync">
      <h3 class="font-extrabold text-lg mb-1">1. Voortgang synchroniseren (GitHub Gist)</h3>
      <p class="text-sm text-[#4b5757] mb-3">Zo kun je op je laptop en je telefoon verder waar je gebleven was. Je voortgang wordt opgeslagen in een geheime Gist op je eigen GitHub-account.</p>
      <ol class="text-sm text-[#4b5757] list-decimal pl-5 mb-3 space-y-1">
        <li>Maak een token aan via <a class="underline font-bold text-[#2f7d6d]" href="https://github.com/settings/tokens/new?scopes=gist&description=RWT%20oefenen%20sync" target="_blank" rel="noopener">github.com/settings/tokens</a> (classic). Vink alleen <strong>gist</strong> aan.</li>
        <li>Plak het token hieronder en klik op <em>Opslaan &amp; synchroniseren</em>.</li>
        <li>Doe op je andere apparaat hetzelfde (met hetzelfde token): de app vindt de Gist vanzelf.</li>
      </ol>
      <label class="block text-sm font-bold mb-1" for="inst-pat">GitHub Personal Access Token</label>
      <div class="flex gap-2 mb-2"><input id="inst-pat" type="password" class="invoer !text-base" placeholder="ghp_…" autocomplete="off" spellcheck="false" value="${esc(s.githubToken)}"><button class="knop knop-rand !px-3" type="button" data-toon="inst-pat" aria-label="Token tonen">👁</button></div>
      <label class="block text-sm font-bold mb-1" for="inst-gist">Gist-ID <span class="font-normal text-[#6b7676]">(wordt automatisch ingevuld)</span></label>
      <input id="inst-gist" class="invoer !text-base mb-3" placeholder="automatisch" autocomplete="off" spellcheck="false" value="${esc(s.gistId)}">
      <div class="flex flex-wrap gap-2"><button class="knop knop-primair !py-2" data-sync-opslaan>Opslaan &amp; synchroniseren</button>${s.githubToken ? '<button class="knop knop-rand !py-2" data-sync-uit>Ontkoppelen</button>' : ''}</div>
      <p class="text-sm mt-2" data-sync-status aria-live="polite"></p>
    </section>

    <section class="mb-8" id="sectie-ai">
      <h3 class="font-extrabold text-lg mb-1">2. AI Coach (Anthropic Claude)</h3>
      <p class="text-sm text-[#4b5757] mb-3">Met je eigen API-key kan de AI Coach bij elk fout antwoord uitleggen waar het misging, zonder het antwoord voor te zeggen. Een key maak je aan op <a class="underline font-bold text-[#2f7d6d]" href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener">console.anthropic.com</a>. Een uitleg kost meestal minder dan een cent.</p>
      <label class="block text-sm font-bold mb-1" for="inst-key">Anthropic API Key</label>
      <div class="flex gap-2 mb-2"><input id="inst-key" type="password" class="invoer !text-base" placeholder="sk-ant-…" autocomplete="off" spellcheck="false" value="${esc(s.anthropicKey)}"><button class="knop knop-rand !px-3" type="button" data-toon="inst-key" aria-label="Key tonen">👁</button></div>
      <label class="block text-sm font-bold mb-1" for="inst-model">Model</label>
      <select id="inst-model" class="invoer !text-base mb-3">${MODELLEN.map((m) => `<option value="${m.id}" ${m.id === s.model ? 'selected' : ''}>${esc(m.naam)}</option>`).join('')}</select>
      <div class="flex flex-wrap gap-2"><button class="knop knop-primair !py-2" data-ai-opslaan>Opslaan</button><button class="knop knop-rand !py-2" data-ai-test>Test de coach</button>${s.anthropicKey ? '<button class="knop knop-rand !py-2" data-ai-uit>Key verwijderen</button>' : ''}</div>
      <p class="text-sm mt-2" data-ai-status aria-live="polite"></p>
    </section>

    <section class="mb-6">
      <h3 class="font-extrabold text-lg mb-1">3. Je gegevens</h3>
      <p class="text-sm text-[#4b5757] mb-3">Je token en API-key blijven alleen op dit apparaat (in de browser). Ze worden nooit in de Gist of in de code van de app opgeslagen. Wil je ze kwijt? Klik dan op ontkoppelen of verwijderen.</p>
      <div class="flex flex-wrap gap-2">
        <button class="knop knop-rand !py-2" data-export>Voortgang downloaden</button>
        <label class="knop knop-rand !py-2 cursor-pointer">Voortgang importeren<input type="file" accept="application/json,.json" class="sr-only" data-import></label>
        <button class="knop knop-rand !py-2 !text-[#b4643c]" data-wis>Alle voortgang wissen</button>
      </div>
    </section>
    <div class="text-right"><button class="knop knop-zacht" data-sluit>Klaar</button></div>`,
    {
      onOpen(el, sluit) {
        if (focusSectie === 'ai') setTimeout(() => { el.querySelector('#sectie-ai').scrollIntoView({ block: 'start' }); el.querySelector('#inst-key').focus(); }, 30);
        el.querySelectorAll('[data-toon]').forEach((b) => b.addEventListener('click', () => {
          const inp = el.querySelector('#' + b.dataset.toon);
          inp.type = inp.type === 'password' ? 'text' : 'password';
        }));
        const syncStatus = el.querySelector('[data-sync-status]');
        const aiStatus = el.querySelector('[data-ai-status]');
        const zetStatus = (p, tekst, ok) => { p.textContent = tekst; p.className = `text-sm mt-2 font-bold ${ok === true ? 'text-[#2f7d4f]' : ok === false ? 'text-[#b4643c]' : 'text-[#6b7676]'}`; };

        el.querySelector('[data-sync-opslaan]').addEventListener('click', async () => {
          const token = el.querySelector('#inst-pat').value.trim();
          const gistId = el.querySelector('#inst-gist').value.trim();
          if (!token) return zetStatus(syncStatus, 'Vul eerst een token in.', false);
          zetStatus(syncStatus, 'Token controleren…');
          const t = await testToken(token);
          if (!t.ok) return zetStatus(syncStatus, t.reden, false);
          store.schrijfInstellingen({ ...store.leesInstellingen(), githubToken: token, gistId });
          zetStatus(syncStatus, 'Synchroniseren…');
          const r = await synchroniseer();
          el.querySelector('#inst-gist').value = store.leesInstellingen().gistId || '';
          zetStatus(syncStatus, r.ok ? 'Gekoppeld! Je voortgang wordt nu automatisch bijgehouden.' : `Niet gelukt: ${r.reden}`, r.ok);
          if (r.ok) route();
        });
        el.querySelector('[data-sync-uit]')?.addEventListener('click', () => {
          store.schrijfInstellingen({ ...store.leesInstellingen(), githubToken: '', gistId: '' });
          el.querySelector('#inst-pat').value = '';
          el.querySelector('#inst-gist').value = '';
          synchroniseer();
          zetStatus(syncStatus, 'Ontkoppeld. Je voortgang staat nog wel op dit apparaat.', true);
        });
        const aiOpslaan = () => {
          store.schrijfInstellingen({ ...store.leesInstellingen(), anthropicKey: el.querySelector('#inst-key').value.trim(), model: el.querySelector('#inst-model').value });
        };
        el.querySelector('[data-ai-opslaan]').addEventListener('click', () => {
          aiOpslaan();
          zetStatus(aiStatus, store.leesInstellingen().anthropicKey ? 'Opgeslagen. De AI Coach staat klaar.' : 'Opgeslagen (zonder key is de coach uit).', true);
        });
        el.querySelector('[data-ai-test]').addEventListener('click', async () => {
          aiOpslaan();
          zetStatus(aiStatus, 'Even testen…');
          try {
            const t = await testCoach();
            zetStatus(aiStatus, `Het werkt! De coach zegt: “${t}”`, true);
          } catch (e) {
            zetStatus(aiStatus, e.message, false);
          }
        });
        el.querySelector('[data-ai-uit]')?.addEventListener('click', () => {
          store.schrijfInstellingen({ ...store.leesInstellingen(), anthropicKey: '' });
          el.querySelector('#inst-key').value = '';
          zetStatus(aiStatus, 'De key is verwijderd van dit apparaat.', true);
        });
        el.querySelector('[data-export]').addEventListener('click', () => {
          const blob = new Blob([JSON.stringify(store.leesVoortgang(), null, 2)], { type: 'application/json' });
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = `rwt-voortgang-${new Date().toISOString().slice(0, 10)}.json`;
          a.click();
          setTimeout(() => URL.revokeObjectURL(a.href), 1000);
        });
        el.querySelector('[data-import]').addEventListener('change', async (e) => {
          const f = e.target.files[0];
          if (!f) return;
          try {
            const data = JSON.parse(await f.text());
            if (!data || typeof data !== 'object' || !('vragen' in data)) throw new Error();
            const samen = store.samenvoegen(store.leesVoortgang(), data);
            samen.updatedAt = Date.now();
            store.schrijfVoortgang(samen);
            toast('Voortgang geïmporteerd.');
            route();
          } catch {
            toast('Dit bestand kon ik niet lezen.');
          }
        });
        el.querySelector('[data-wis]').addEventListener('click', async () => {
          sluit();
          if (await bevestig('Alle voortgang wissen?', 'Al je antwoorden en toetsresultaten worden verwijderd, ook op je andere apparaten als sync aan staat. Dit kan niet ongedaan worden gemaakt.', 'Ja, alles wissen', 'Annuleren')) {
            store.wisVoortgang();
            toast('Je voortgang is gewist.');
            route();
          }
        });
      },
    },
  );
}

// ---------------------------------------------------------------- start
function syncWeergave() {
  const dot = document.getElementById('sync-dot');
  const tekst = document.getElementById('sync-tekst');
  opStatus((s) => {
    const kleur = { uit: 'bg-gray-300', bezig: 'bg-amber-400', wacht: 'bg-amber-300', ok: 'bg-emerald-500', fout: 'bg-rose-400' }[s.staat];
    dot.className = `inline-block w-2 h-2 rounded-full mr-1 align-middle ${kleur}`;
    tekst.textContent = s.staat === 'uit' ? 'Sync uit' : s.staat === 'ok' ? 'Gesynct' : s.staat === 'fout' ? 'Sync-fout' : 'Bezig…';
    document.getElementById('sync-pill').title = s.tekst;
  });
  document.getElementById('sync-pill').addEventListener('click', () => {
    if (store.leesInstellingen().githubToken) synchroniseer().then((r) => toast(r.ok ? 'Voortgang gesynchroniseerd.' : `Sync niet gelukt: ${r.reden}`));
    else openInstellingen();
  });
}

document.getElementById('open-instellingen').addEventListener('click', () => openInstellingen());
window.addEventListener('hashchange', route);
syncWeergave();
if (!store.opslagWerkt()) toast('Let op: je browser bewaart niets (privévenster?). Je voortgang gaat verloren.');
route();
startAutoSync();

// voor tests en debuggen
window.__rwt = { bank, store };
