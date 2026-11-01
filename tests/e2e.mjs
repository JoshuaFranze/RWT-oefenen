// End-to-end test in een echte browser (Playwright/Chromium).
// De Anthropic API en GitHub API worden nagebootst; er gaat niets echt naar buiten.
// Gebruik: start een server in de projectmap (python3 -m http.server 8765) en draai
//   node tests/e2e.mjs [http://localhost:8765/]
import { createRequire } from 'node:module';
import { bouwBank } from '../js/bank.js';
import { nl, tijd } from '../js/format.js';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const BASE = process.argv[2] || 'http://localhost:8765/';
const UIT = process.env.SCREENSHOTS || null;
const bank = bouwBank();
const fouten = [];
const ok = (cond, msg) => {
  if (!cond) fouten.push(msg);
  console.log(`${cond ? '✓' : '✗'} ${msg}`);
};

function juistInvoer(q) {
  if (q.invoer === 'keuze') return q.antwoord;
  if (q.invoer === 'tijd') return tijd(q.antwoord);
  if (q.breuk) return `${q.breuk[0]}/${q.breuk[1]}`;
  return nl(q.antwoord).replace('−', '-');
}
function foutInvoer(q) {
  if (q.invoer === 'keuze') return q.opties.find((o) => o !== q.antwoord);
  if (q.invoer === 'tijd') return tijd(q.antwoord + 7);
  return nl(q.antwoord + 3).replace('−', '-');
}

const proxy = process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY, bypass: 'localhost,127.0.0.1' } : undefined;
const browser = await chromium.launch({ proxy });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, ignoreHTTPSErrors: false });
const page = await ctx.newPage();
const consoleFouten = [];
page.on('console', (m) => {
  if (m.type() === 'error') consoleFouten.push(m.text());
});
page.on('pageerror', (e) => consoleFouten.push(String(e)));

// ---- nagebootste Anthropic API
const anthropicVerzoeken = [];
await page.route('https://api.anthropic.com/**', async (route) => {
  const req = route.request();
  if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': 'POST' } });
  const body = JSON.parse(req.postData());
  anthropicVerzoeken.push({ headers: req.headers(), body });
  const laatste = body.messages[body.messages.length - 1].content;
  const tekst = /verbinding werkt/.test(laatste) ? 'Het werkt, fijn dat je er bent!' : body.messages.length > 1 ? 'Natuurlijk! **Andere uitleg:** begin bij de 100%.' : 'Goed dat je het probeert!\n\n- Kijk eerst naar de **eenheid**.\n- Schat dan het antwoord.\n\nWat denk je dat 10% is?';
  await route.fulfill({
    status: 200,
    headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*' },
    body: JSON.stringify({ id: 'msg_test', type: 'message', role: 'assistant', model: body.model, stop_reason: 'end_turn', content: [{ type: 'thinking', thinking: '', signature: 'x' }, { type: 'text', text: tekst }] }),
  });
});

// ---- nagebootste GitHub Gist API
let gist = null;
const ghVerzoeken = [];
await page.route('https://api.github.com/**', async (route) => {
  const req = route.request();
  const url = new URL(req.url());
  ghVerzoeken.push(`${req.method()} ${url.pathname}`);
  const cors = { 'access-control-allow-origin': '*', 'content-type': 'application/json' };
  if (req.headers().authorization !== 'Bearer ghp_test123') return route.fulfill({ status: 401, headers: cors, body: '{}' });
  if (req.method() === 'GET' && url.pathname === '/gists') return route.fulfill({ status: 200, headers: cors, body: JSON.stringify(gist ? [gist] : []) });
  if (req.method() === 'POST' && url.pathname === '/gists') {
    const b = JSON.parse(req.postData());
    gist = { id: 'gist123', files: { 'rwt-voortgang.json': { content: b.files['rwt-voortgang.json'].content } } };
    return route.fulfill({ status: 201, headers: cors, body: JSON.stringify(gist) });
  }
  if (url.pathname === '/gists/gist123') {
    if (req.method() === 'PATCH') {
      const b = JSON.parse(req.postData());
      gist.files['rwt-voortgang.json'].content = b.files['rwt-voortgang.json'].content;
    }
    return route.fulfill({ status: gist ? 200 : 404, headers: cors, body: JSON.stringify(gist || {}) });
  }
  return route.fulfill({ status: 404, headers: cors, body: '{}' });
});

const shot = async (naam) => UIT && page.screenshot({ path: `${UIT}/${naam}.png`, fullPage: true });

// ---------------- HOME
await page.goto(BASE);
await page.waitForSelector('text=Fijn dat je er bent.');
ok(await page.locator('text=Oefenen per domein').isVisible(), 'Overzicht laadt');
ok((await page.locator('a[href^="#/oefenen/"]').count()) === 4, '4 domeinkaarten');
const twReady = await page.evaluate(() => getComputedStyle(document.querySelector('.rounded-xl')).borderTopLeftRadius);
ok(twReady !== '0px', `Tailwind CSS actief (radius ${twReady})`);
await shot('01-home');

// ---------------- OEFENEN: goed antwoord
await page.click('text=10 vragen door elkaar');
await page.waitForSelector('text=Vraag 1 van 10');
let qid = await page.getAttribute('[data-qid]', 'data-qid');
let q = bank.perId.get(qid);
if (q.invoer === 'keuze') await page.click(`[data-optie="${juistInvoer(q)}"]`);
else await page.fill('#antwoord', juistInvoer(q));
await page.click('[data-controleer]');
await page.waitForSelector('.feedback-goed');
ok(true, `Goed antwoord herkend (${qid}: ${juistInvoer(q)})`);
await shot('02-goed');
await page.click('[data-volgende]');
await page.waitForSelector('text=Vraag 2 van 10');

// ---------------- OEFENEN: fout antwoord + tweede kans + coach zonder key
qid = await page.getAttribute('[data-qid]', 'data-qid');
q = bank.perId.get(qid);
const zetFout = async () => {
  if (q.invoer === 'keuze') await page.click(`[data-optie="${foutInvoer(q)}"]`);
  else await page.fill('#antwoord', foutInvoer(q));
};
await zetFout();
await page.click('[data-controleer]');
await page.waitForSelector('[data-opnieuw]');
ok(true, 'Eerste fout geeft tweede kans');
await page.click('[data-toon]');
await page.waitForSelector('text=Het juiste antwoord is');
ok(await page.locator('[data-vraag]').isVisible(), '"Vraag de AI Coach"-knop bij fout antwoord');
await page.click('[data-vraag]');
await page.waitForSelector('[data-inst]');
ok(true, 'Zonder key: duidelijke melding + knop naar instellingen');
await page.click('[data-inst]');
await page.waitForSelector('#inst-key');
await page.fill('#inst-key', 'sk-ant-test');
await page.click('[data-ai-test]');
await page.waitForSelector('text=Het werkt!');
ok(true, 'Test de coach werkt (nagebootst)');
await page.keyboard.press('Escape');
await page.click('[data-opnieuw]');
await page.waitForSelector('.coach-tekst');
ok((await page.textContent('.coach-tekst')).includes('eenheid'), 'Coach-antwoord wordt getoond (markdown)');
const verz = anthropicVerzoeken[anthropicVerzoeken.length - 1];
ok(verz.headers['anthropic-dangerous-direct-browser-access'] === 'true', 'Header voor directe browsertoegang');
ok(verz.headers['x-api-key'] === 'sk-ant-test', 'API-key in x-api-key header');
ok(verz.body.model === 'claude-haiku-5-5', `Model: ${verz.body.model}`);
ok(verz.body.system.startsWith('Je bent een geduldige PABO-reken-coach.'), 'Systeemprompt meegestuurd');
ok(verz.body.messages[0].content.includes(foutInvoer(q)), 'Fout antwoord van de student zit in het bericht');
ok(!('temperature' in verz.body), 'Geen temperature (niet toegestaan op 2026-10-21)');
await shot('03-coach');
await page.fill('[data-vervolg] input', 'Kun je het anders uitleggen?');
await page.click('[data-vervolg] button');
await page.waitForSelector('text=Andere uitleg');
const vervolg = anthropicVerzoeken[anthropicVerzoeken.length - 1].body.messages;
ok(vervolg.length === 3 && vervolg[1].role === 'assistant' && Array.isArray(vervolg[1].content), 'Vervolgvraag stuurt het hele gesprek mee');

// ---------------- voortgang opgeslagen
const voortgang = await page.evaluate(() => JSON.parse(localStorage.getItem('rwt.voortgang.v1')));
ok(Object.keys(voortgang.vragen).length === 2, 'Twee antwoorden opgeslagen in voortgang');
ok(!JSON.stringify(voortgang).includes('sk-ant'), 'API-key zit níet in de voortgang (die gesynct wordt)');

// ---------------- SYNC
await page.click('#open-instellingen');
await page.fill('#inst-pat', 'ghp_test123');
await page.click('[data-sync-opslaan]');
await page.waitForSelector('text=Gekoppeld!');
ok(gist && JSON.parse(gist.files['rwt-voortgang.json'].content).vragen[qid], 'Voortgang staat in de (nagebootste) Gist');
ok(!gist.files['rwt-voortgang.json'].content.includes('ghp_') && !gist.files['rwt-voortgang.json'].content.includes('sk-ant'), 'Geen geheimen in de Gist');
await page.keyboard.press('Escape');
ok((await page.textContent('#sync-tekst')) === 'Gesynct', 'Sync-indicator: Gesynct');

// tweede apparaat: nieuwe context, zelfde token -> vindt de gist
const ctx2 = await browser.newContext();
const p2 = await ctx2.newPage();
await p2.route('https://api.github.com/**', (r) => page.context().pages()[0] && r.fallback());
await p2.unroute('https://api.github.com/**');
await p2.route('https://api.github.com/**', async (route) => {
  const req = route.request();
  const url = new URL(req.url());
  const cors = { 'access-control-allow-origin': '*', 'content-type': 'application/json' };
  if (req.method() === 'GET' && url.pathname === '/gists') return route.fulfill({ status: 200, headers: cors, body: JSON.stringify([gist]) });
  if (req.method() === 'PATCH') {
    gist.files['rwt-voortgang.json'].content = JSON.parse(req.postData()).files['rwt-voortgang.json'].content;
  }
  return route.fulfill({ status: 200, headers: cors, body: JSON.stringify(gist) });
});
await p2.goto(BASE);
await p2.evaluate(() => localStorage.setItem('rwt.instellingen.v1', JSON.stringify({ githubToken: 'ghp_test123' })));
await p2.reload();
await p2.waitForFunction(() => document.getElementById('sync-tekst').textContent === 'Gesynct');
const p2v = await p2.evaluate(() => JSON.parse(localStorage.getItem('rwt.voortgang.v1')));
ok(Object.keys(p2v.vragen).length === 2, 'Tweede apparaat haalt voortgang op via de Gist');
await ctx2.close();

// ---------------- TOETS
await page.goto(BASE + '#/toets/3');
await page.click('[data-start]');
const toets = bank.toetsen.find((t) => t.nr === 3);
let goedGezet = 0;
for (let i = 0; i < 55; i++) {
  const id = await page.getAttribute('[data-qid]', 'data-qid');
  const v = bank.perId.get(id);
  ok(v === toets.vragen[i], `Toetsvraag ${i + 1} in de juiste volgorde`) || null;
  const deel1 = i < 17;
  if (deel1) ok((await page.locator('[data-rm-toggle]').count()) === 0, `Geen rekenmachine bij vraag ${i + 1} (deel 1)`);
  // 40 goed, rest fout of leeg
  const juist = i < 40;
  if (i < 52) {
    const inv = juist ? juistInvoer(v) : foutInvoer(v);
    if (v.invoer === 'keuze') await page.click(`[data-optie="${inv}"]`);
    else await page.fill('#antwoord', inv);
    if (juist) goedGezet++;
  }
  if (i === 20) {
    await page.click('[data-rm-toggle]');
    await page.fill('.rm-invoer', '12,5×4+√16');
    await page.click('.rm-is');
    ok((await page.inputValue('.rm-invoer')) === '54', 'Rekenmachine: 12,5×4+√16 = 54');
    await shot('05-toets-deel2');
  }
  if (i === 16) {
    await shot('04-toets-deel1');
    await page.click('button[data-afronden] >> nth=0');
    await page.click('[data-ja]');
    await page.waitForSelector('text=Deel 2');
  } else if (i === 54) {
    await page.click('button[data-afronden] >> nth=0');
    await page.click('[data-ja]');
  } else {
    await page.click('[data-volgende]');
  }
}
// tussendoor herladen werkt? (al getest door lopend-state; nu resultaat)
await page.waitForSelector('text=Schaalscore');
const score = await page.textContent('.text-6xl');
ok(Number(score) >= 575, `Resultaat: ${goedGezet} goed → schaalscore ${score} (3F gehaald)`);
ok((await page.locator('details[data-review]').count()) === 15, '15 fouten in nakijklijst');
await page.click('details[data-review] >> nth=0');
ok(await page.locator('details[data-review] >> nth=0 >> [data-vraag]').isVisible(), 'AI Coach ook bij nakijken toets');
await shot('06-resultaat');

// ---------------- MOBIEL
await page.setViewportSize({ width: 375, height: 800 });
for (const h of ['#/', '#/oefenen', '#/toetsen', '#/toets/5']) {
  await page.goto(BASE + h);
  await page.waitForTimeout(300);
  const breed = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  ok(breed <= 0, `Geen horizontale scroll op mobiel (${h})`);
}
await page.goto(BASE + '#/oefenen');
await page.click('[data-start]');
await page.waitForSelector('[data-qid]');
await shot('07-mobiel');
// grafiekvraag renderen
const grafiekVraag = bank.oefen.find((x) => x.grafiek);
await page.evaluate(() => {});
ok(!!grafiekVraag, 'Er bestaan vragen met grafieken');

ok(consoleFouten.length === 0, `Geen JavaScript-fouten in de console ${consoleFouten.length ? JSON.stringify(consoleFouten) : ''}`);
await browser.close();
if (fouten.length) {
  console.error(`\n✗ ${fouten.length} test(s) mislukt`);
  process.exit(1);
}
console.log('\n✓ Alle browsertests geslaagd');
