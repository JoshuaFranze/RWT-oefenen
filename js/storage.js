// Lokale opslag. Voortgang wordt (optioneel) met een GitHub Gist gesynchroniseerd;
// de instellingen (GitHub-token en Anthropic API-key) blijven altijd alleen op dit apparaat.

const KEY_VOORTGANG = 'rwt.voortgang.v1';
const KEY_INSTELLINGEN = 'rwt.instellingen.v1';
const KEY_LOPEND = 'rwt.lopend.v1';

function lees(key, standaard) {
  try {
    const s = localStorage.getItem(key);
    return s ? JSON.parse(s) : standaard;
  } catch {
    return standaard;
  }
}
function schrijf(key, waarde) {
  try {
    if (waarde === null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(waarde));
    return true;
  } catch {
    return false;
  }
}

export function legeVoortgang() {
  return { v: 1, updatedAt: 0, vragen: {}, toetsen: [] };
}

export function leesVoortgang() {
  const p = lees(KEY_VOORTGANG, null);
  if (!p || typeof p !== 'object') return legeVoortgang();
  return { ...legeVoortgang(), ...p, vragen: p.vragen || {}, toetsen: Array.isArray(p.toetsen) ? p.toetsen : [] };
}

export function schrijfVoortgang(p, { stil = false } = {}) {
  schrijf(KEY_VOORTGANG, p);
  if (!stil) window.dispatchEvent(new CustomEvent('rwt:voortgang'));
}

function aanpassen(fn) {
  const p = leesVoortgang();
  fn(p);
  p.updatedAt = Date.now();
  schrijfVoortgang(p);
  return p;
}

/** Eerste poging op een vraag telt voor de statistiek. */
export function registreerAntwoord(qid, goed) {
  return aanpassen((p) => {
    const s = p.vragen[qid] || { n: 0, goed: 0 };
    s.n += 1;
    if (goed) s.goed += 1;
    s.laatsteGoed = !!goed;
    s.laatst = Date.now();
    p.vragen[qid] = s;
  });
}

export function voegToetsToe(res) {
  return aanpassen((p) => {
    p.toetsen.push(res);
    for (const [qid, goed] of Object.entries(res.correct || {})) {
      const s = p.vragen[qid] || { n: 0, goed: 0 };
      s.n += 1;
      if (goed) s.goed += 1;
      s.laatsteGoed = !!goed;
      s.laatst = res.datum;
      p.vragen[qid] = s;
    }
  });
}

export function wisVoortgang() {
  const p = legeVoortgang();
  p.updatedAt = Date.now();
  p.gewist = Date.now();
  schrijfVoortgang(p);
  schrijf(KEY_LOPEND, null);
}

/** Samenvoegen van twee apparaten: per vraag de recentste, toetsresultaten als vereniging. */
export function samenvoegen(a, b) {
  a = a || legeVoortgang();
  b = b || legeVoortgang();
  // Is op één apparaat bewust gewist, dan telt alleen wat daarna kwam.
  const gewist = Math.max(a.gewist || 0, b.gewist || 0);
  const uit = legeVoortgang();
  uit.gewist = gewist || undefined;
  for (const bron of [a, b]) {
    for (const [id, s] of Object.entries(bron.vragen || {})) {
      if ((s.laatst || 0) < gewist) continue;
      const huidig = uit.vragen[id];
      if (!huidig || (s.laatst || 0) > (huidig.laatst || 0) || ((s.laatst || 0) === (huidig.laatst || 0) && s.n > huidig.n)) uit.vragen[id] = s;
    }
    for (const t of bron.toetsen || []) {
      if ((t.datum || 0) < gewist) continue;
      if (!uit.toetsen.some((x) => x.id === t.id)) uit.toetsen.push(t);
    }
  }
  uit.toetsen.sort((x, y) => x.datum - y.datum);
  uit.updatedAt = Math.max(a.updatedAt || 0, b.updatedAt || 0);
  return uit;
}

export function leesInstellingen() {
  return { githubToken: '', gistId: '', anthropicKey: '', model: 'claude-haiku-5-5', ...lees(KEY_INSTELLINGEN, {}) };
}
export function schrijfInstellingen(s) {
  schrijf(KEY_INSTELLINGEN, s);
}

export function leesLopend() {
  return lees(KEY_LOPEND, null);
}
export function schrijfLopend(l) {
  schrijf(KEY_LOPEND, l);
}

export function opslagWerkt() {
  try {
    localStorage.setItem('rwt.test', '1');
    localStorage.removeItem('rwt.test');
    return true;
  } catch {
    return false;
  }
}
