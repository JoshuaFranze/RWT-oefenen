// AI Coach: een directe aanroep vanuit de browser naar de Anthropic Messages API.
// De API-key staat alleen in localStorage op dit apparaat en wordt nergens anders naartoe gestuurd.

import { leesInstellingen } from './storage.js';
import { antwoordTekst } from './check.js';

const URL = 'https://api.anthropic.com/v1/messages';

export const MODELLEN = [
  { id: 'claude-haiku-5-5', naam: 'Claude Haiku 5.5 (snel en zuinig, aanbevolen)' },
  { id: 'claude-sonnet-5-5', naam: 'Claude Sonnet 5.5 (uitgebreider, iets duurder)' },
];

export const SYSTEEMPROMPT = `Je bent een geduldige PABO-reken-coach. Analyseer de fout van de student, leg de misvatting uit, en geef een tip zonder direct het antwoord voor te kauwen.

Achtergrond: de student is een tweedejaars pabostudent die oefent voor de landelijke Rekentoets Wiskunde (RWT) op 3F-niveau. Ze kan last hebben van rekenangst.

Zo werk je:
- Begin met iets kleins wat de student wél goed doet of wat begrijpelijk is aan de fout. Wees warm, rustig en concreet; nooit betuttelend.
- Benoem de waarschijnlijke denkfout (bijvoorbeeld: verkeerde eenheid, komma verschoven, procent van het verkeerde geheel genomen, rest niet goed geïnterpreteerd, volgorde van bewerkingen).
- Geef één of twee denkstappen of een handige strategie (verhoudingstabel, schatten, terugrekenen, eenheden-trap, via een rond getal) waarmee de student het zelf kan oplossen.
- Noem het juiste eindantwoord níet, tenzij de student daar in een vervolgvraag expliciet om vraagt.
- Sluit af met een korte controlevraag of een mini-oefening in dezelfde stijl.
- Schrijf in het Nederlands, in gewone spreektaal, maximaal ongeveer 150 woorden. Gebruik korte alinea's of een kort lijstje, geen kopjes.
- Als het antwoord van de student eigenlijk goed is maar anders genoteerd (bijv. 0,5 in plaats van 1/2), zeg dat dan eerlijk.`;

const DOMEINNAAM = { getallen: 'Getallen', verhoudingen: 'Verhoudingen', meten: 'Meten & Meetkunde', verbanden: 'Verbanden' };

function vraagAlsTekst(q) {
  let t = q.vraag.replace(/\[\[(−?\d+)\/(\d+)\]\]/g, '$1/$2');
  if (q.tabel) t += '\n\nTabel:\n' + [q.tabel.kop, ...q.tabel.rijen].map((r) => r.join(' | ')).join('\n');
  if (q.grafiek) t += `\n\n${q.grafiek.type === 'staaf' ? 'Staafgrafiek' : 'Lijngrafiek'} "${q.grafiek.titel}": ` + q.grafiek.labels.map((l, i) => `${l} = ${q.grafiek.waarden[i]}`).join(', ');
  if (q.opties) t += '\n\nKeuzemogelijkheden: ' + q.opties.join(' / ');
  return t;
}

export function maakEersteBericht(q, studentAntwoord) {
  const juist = antwoordTekst(q).replace(/\[\[(−?\d+)\/(\d+)\]\]/g, '$1/$2');
  const uitwerking = q.uitwerking.replace(/\[\[(−?\d+)\/(\d+)\]\]/g, '$1/$2');
  return [
    `Domein: ${DOMEINNAAM[q.domein] || q.domein} (${q.type === 'kaal' ? 'kale som' : 'contextopgave'})`,
    `Rekenmachine toegestaan: ${q.calc ? 'ja' : 'nee'}`,
    '',
    `Vraag:\n${vraagAlsTekst(q)}`,
    '',
    `Antwoord van de student: ${studentAntwoord || '(geen antwoord)'}`,
    `Juiste antwoord (alleen voor jou, niet letterlijk noemen): ${juist}`,
    `Uitwerking (alleen voor jou): ${uitwerking.replace(/\n/g, ' ')}`,
    '',
    'Wat is waarschijnlijk de denkfout, en welke tip helpt de student verder?',
  ].join('\n');
}

export class CoachFout extends Error {
  constructor(msg, soort) {
    super(msg);
    this.soort = soort;
  }
}

/**
 * Stuurt het gesprek naar Claude en geeft {tekst, inhoud} terug.
 * `berichten` is de volledige geschiedenis (alleen aanvullen, nooit aanpassen).
 */
export async function vraagCoach(berichten, { signal } = {}) {
  const { anthropicKey, model } = leesInstellingen();
  if (!anthropicKey) throw new CoachFout('Er is nog geen API-key ingesteld.', 'geen-key');
  let res;
  try {
    res = await fetch(URL, {
      method: 'POST',
      signal,
      headers: {
        'content-type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2026-10-21',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: model || 'claude-haiku-5-5',
        max_tokens: 2000,
        system: SYSTEEMPROMPT,
        output_config: { effort: 'low' },
        messages: berichten,
      }),
    });
  } catch (e) {
    if (e.name === 'AbortError') throw e;
    throw new CoachFout('Geen verbinding met de AI Coach. Check je internet en probeer het opnieuw.', 'netwerk');
  }
  let data = null;
  try {
    data = await res.json();
  } catch {
    /* geen json */
  }
  if (!res.ok) {
    const detail = data?.error?.message || '';
    if (res.status === 401) throw new CoachFout('De API-key wordt niet geaccepteerd. Controleer hem in de instellingen.', 'key');
    if (res.status === 403) throw new CoachFout('Deze API-key heeft geen toegang tot dit model.', 'key');
    if (res.status === 404) throw new CoachFout('Dit model is niet beschikbaar voor jouw key. Kies een ander model in de instellingen.', 'model');
    if (res.status === 429) throw new CoachFout('Even rustig aan: de limiet van je API-key is bereikt. Probeer het over een minuutje opnieuw.', 'limiet');
    if (res.status === 529 || res.status >= 500) throw new CoachFout('De AI Coach is het even te druk. Probeer het zo nog eens.', 'druk');
    if (res.status === 400 && /credit|balance/i.test(detail)) throw new CoachFout('Je API-tegoed is op. Vul het aan op console.anthropic.com.', 'tegoed');
    throw new CoachFout(`De AI Coach gaf een foutmelding (${res.status})${detail ? ': ' + detail : ''}.`, 'anders');
  }
  if (data?.stop_reason === 'refusal') throw new CoachFout('De coach kon op deze vraag geen antwoord geven. Probeer het anders te formuleren.', 'weigering');
  const tekst = (data?.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('\n').trim();
  if (!tekst) throw new CoachFout('De coach gaf een leeg antwoord. Probeer het opnieuw.', 'leeg');
  return { tekst, inhoud: data.content };
}

/** Klein testje voor in de instellingen. */
export async function testCoach() {
  const { tekst } = await vraagCoach([{ role: 'user', content: 'Zeg in één korte, bemoedigende zin dat de verbinding werkt.' }]);
  return tekst;
}
