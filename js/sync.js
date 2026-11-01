// Voortgang synchroniseren via een (geheime) GitHub Gist.
// Nodig: een GitHub Personal Access Token met alleen de scope "gist".

import { leesVoortgang, schrijfVoortgang, samenvoegen, leesInstellingen, schrijfInstellingen } from './storage.js';

const API = 'https://api.github.com';
const BESTAND = 'rwt-voortgang.json';
const OMSCHRIJVING = 'RWT 3F oefenen – voortgang (automatisch bijgehouden)';

let status = { staat: 'uit', tekst: 'Sync staat uit', tijd: null };
const luisteraars = new Set();
export function opStatus(fn) {
  luisteraars.add(fn);
  fn(status);
  return () => luisteraars.delete(fn);
}
function zet(staat, tekst) {
  status = { staat, tekst, tijd: Date.now() };
  luisteraars.forEach((f) => f(status));
}

async function gh(pad, token, opties = {}) {
  const res = await fetch(API + pad, {
    ...opties,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      ...(opties.body ? { 'Content-Type': 'application/json' } : {}),
    },
  });
  if (res.status === 401) throw new Error('Het GitHub-token klopt niet of is verlopen.');
  if (res.status === 403) throw new Error('GitHub weigert de toegang. Heeft het token de scope "gist"?');
  if (res.status === 404) {
    const e = new Error('Gist niet gevonden.');
    e.code = 404;
    throw e;
  }
  if (!res.ok) throw new Error(`GitHub gaf een fout (${res.status}).`);
  return res.json();
}

async function inhoudVan(gist, token) {
  const f = gist.files?.[BESTAND];
  if (!f) return null;
  let tekst = f.content;
  if (f.truncated && f.raw_url) {
    const r = await fetch(f.raw_url, { headers: { Authorization: `Bearer ${token}` } });
    tekst = await r.text();
  }
  try {
    return JSON.parse(tekst);
  } catch {
    return null;
  }
}

async function zoekOfMaakGist(token) {
  const inst = leesInstellingen();
  if (inst.gistId) {
    try {
      return await gh(`/gists/${inst.gistId}`, token);
    } catch (e) {
      if (e.code !== 404) throw e;
    }
  }
  // Zoek een bestaande voortgangs-gist (bijv. aangemaakt op een ander apparaat)
  for (let pagina = 1; pagina <= 5; pagina++) {
    const lijst = await gh(`/gists?per_page=100&page=${pagina}`, token);
    const hit = lijst.find((g) => g.files && g.files[BESTAND]);
    if (hit) {
      schrijfInstellingen({ ...leesInstellingen(), gistId: hit.id });
      return gh(`/gists/${hit.id}`, token);
    }
    if (lijst.length < 100) break;
  }
  const nieuw = await gh('/gists', token, {
    method: 'POST',
    body: JSON.stringify({ description: OMSCHRIJVING, public: false, files: { [BESTAND]: { content: JSON.stringify(leesVoortgang()) } } }),
  });
  schrijfInstellingen({ ...leesInstellingen(), gistId: nieuw.id });
  return nieuw;
}

let bezig = null;

/** Haalt de voortgang op, voegt samen en schrijft terug als er iets veranderd is. */
export async function synchroniseer() {
  const { githubToken } = leesInstellingen();
  if (!githubToken) {
    zet('uit', 'Sync staat uit');
    return { ok: false, reden: 'geen-token' };
  }
  if (bezig) return bezig;
  bezig = (async () => {
    zet('bezig', 'Synchroniseren…');
    try {
      const gist = await zoekOfMaakGist(githubToken);
      const remote = await inhoudVan(gist, githubToken);
      const lokaal = leesVoortgang();
      const samen = samenvoegen(lokaal, remote);
      const samenTekst = JSON.stringify(samen);
      if (samenTekst !== JSON.stringify(lokaal)) schrijfVoortgang(samen, { stil: true });
      if (!remote || samenTekst !== JSON.stringify(remote)) {
        await gh(`/gists/${gist.id}`, githubToken, { method: 'PATCH', body: JSON.stringify({ files: { [BESTAND]: { content: samenTekst } } }) });
      }
      zet('ok', 'Gesynchroniseerd');
      window.dispatchEvent(new CustomEvent('rwt:gesynchroniseerd'));
      return { ok: true };
    } catch (e) {
      zet('fout', e.message || 'Synchroniseren mislukt');
      return { ok: false, reden: e.message };
    } finally {
      bezig = null;
    }
  })();
  return bezig;
}

let timer = null;
export function startAutoSync() {
  window.addEventListener('rwt:voortgang', () => {
    if (!leesInstellingen().githubToken) return;
    clearTimeout(timer);
    zet('wacht', 'Wijzigingen worden zo opgeslagen…');
    timer = setTimeout(synchroniseer, 3000);
  });
  window.addEventListener('online', () => synchroniseer());
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') synchroniseer();
  });
  synchroniseer();
}

/** Alleen het token testen (voor de knop in de instellingen). */
export async function testToken(token) {
  const res = await fetch(API + '/gists?per_page=1', { headers: { Accept: 'application/vnd.github+json', Authorization: `Bearer ${token}`, 'X-GitHub-Api-Version': '2022-11-28' } });
  if (res.ok) return { ok: true };
  if (res.status === 401) return { ok: false, reden: 'Dit token wordt niet geaccepteerd.' };
  return { ok: false, reden: `GitHub antwoordde met status ${res.status}. Controleer de scope "gist".` };
}
