// Weergave van vragen: tekst met breuken, tabellen en grafieken (SVG).
import { nl } from './format.js';

export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/** Tekst veilig naar HTML, met [[3/4]] als gestapelde breuk. */
export function rich(s) {
  return esc(s).replace(/\[\[(−?\d+)\/(\d+)\]\]/g, '<span class="frac" aria-label="$1 gedeeld door $2"><span class="frac-t">$1</span><span class="frac-n">$2</span></span>');
}

export function tabelHTML(t) {
  const kop = t.kop.map((k) => `<th scope="col">${rich(k)}</th>`).join('');
  const rijen = t.rijen.map((r) => `<tr>${r.map((c, i) => (i === 0 ? `<th scope="row">${rich(c)}</th>` : `<td>${rich(c)}</td>`)).join('')}</tr>`).join('');
  return `<div class="overflow-x-auto my-4"><table class="vraag-tabel"><thead><tr>${kop}</tr></thead><tbody>${rijen}</tbody></table></div>`;
}

function mooieStap(bereik) {
  const ruw = bereik / 6;
  const macht = 10 ** Math.floor(Math.log10(ruw));
  for (const m of [1, 2, 2.5, 5, 10]) if (m * macht >= ruw) return m * macht;
  return 10 * macht;
}

export function grafiekSVG(g) {
  const W = 560, H = 280, ml = 48, mr = 16, mt = 30, mb = 36;
  const iw = W - ml - mr, ih = H - mt - mb;
  const w = g.waarden;
  let lo = Math.min(0, ...w), hi = Math.max(...w);
  const stap = mooieStap(hi - lo || 1);
  lo = Math.floor(lo / stap) * stap;
  hi = Math.ceil(hi / stap) * stap + (g.type === 'lijn' ? 0 : stap);
  if (hi === lo) hi = lo + stap;
  const y = (v) => mt + ih - ((v - lo) / (hi - lo)) * ih;
  const n = w.length;
  const band = iw / n;
  const x = (i) => ml + band * i + band / 2;
  let grid = '';
  for (let v = lo; v <= hi + 1e-9; v += stap) {
    grid += `<line x1="${ml}" x2="${W - mr}" y1="${y(v)}" y2="${y(v)}" class="g-grid${v === 0 ? ' g-nul' : ''}"/>`;
    grid += `<text x="${ml - 8}" y="${y(v) + 4}" text-anchor="end" class="g-as">${nl(v)}</text>`;
  }
  const labels = g.labels.map((l, i) => `<text x="${x(i)}" y="${H - mb + 20}" text-anchor="middle" class="g-as">${esc(l)}</text>`).join('');
  let data = '';
  if (g.type === 'staaf') {
    const bw = Math.min(56, band * 0.6);
    data = w.map((v, i) => `<rect x="${x(i) - bw / 2}" y="${y(Math.max(v, 0))}" width="${bw}" height="${Math.abs(y(v) - y(0))}" rx="4" class="g-staaf"/><text x="${x(i)}" y="${y(Math.max(v, 0)) - 6}" text-anchor="middle" class="g-waarde">${nl(v)}</text>`).join('');
  } else {
    const pts = w.map((v, i) => `${x(i)},${y(v)}`).join(' ');
    data = `<polyline points="${pts}" class="g-lijn"/>` + w.map((v, i) => `<circle cx="${x(i)}" cy="${y(v)}" r="4.5" class="g-punt"/><text x="${x(i)}" y="${y(v) - 10}" text-anchor="middle" class="g-waarde">${nl(v)}</text>`).join('');
  }
  const titel = `<text x="${ml}" y="18" class="g-titel">${esc(g.titel || '')}</text>`;
  const beschrijving = `${g.titel}: ${g.labels.map((l, i) => `${l} ${nl(w[i])}`).join(', ')}`;
  return `<figure class="my-4 grafiek"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(beschrijving)}" class="w-full h-auto">${titel}${grid}${data}${labels}</svg></figure>`;
}

/** De vraagtekst met tabel/grafiek op de juiste plek (vóór de laatste regel = de eigenlijke vraag). */
export function vraagHTML(q) {
  const regels = q.vraag.split('\n');
  const figuur = (q.tabel ? tabelHTML(q.tabel) : '') + (q.grafiek ? grafiekSVG(q.grafiek) : '');
  const p = (r) => `<p class="mb-2">${rich(r)}</p>`;
  if (!figuur) return regels.map(p).join('');
  if (regels.length === 1) return p(regels[0]) + figuur;
  return regels.slice(0, -1).map(p).join('') + figuur + `<p class="mb-2 font-semibold">${rich(regels[regels.length - 1])}</p>`;
}

export function uitwerkingHTML(q) {
  return `<ol class="uitwerking">${q.uitwerking.split('\n').map((r) => `<li>${rich(r)}</li>`).join('')}</ol>`;
}

/** Heel eenvoudige, veilige markdown voor het antwoord van de AI Coach. */
export function miniMarkdown(md) {
  const blokken = esc(md).split(/\n{2,}/);
  return blokken
    .map((b) => {
      const regels = b.split('\n');
      const inline = (t) => t.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/(^|[^*])\*(?!\s)(.+?)\*/g, '$1<em>$2</em>').replace(/`([^`]+)`/g, '<code>$1</code>');
      if (regels.every((r) => /^\s*([-*•]|\d+[.)])\s+/.test(r))) {
        const ol = /^\s*\d/.test(regels[0]);
        return `<${ol ? 'ol' : 'ul'}>${regels.map((r) => `<li>${inline(r.replace(/^\s*([-*•]|\d+[.)])\s+/, ''))}</li>`).join('')}</${ol ? 'ol' : 'ul'}>`;
      }
      if (/^#{1,4}\s/.test(regels[0])) return `<p><strong>${inline(regels[0].replace(/^#+\s/, ''))}</strong></p>` + (regels.length > 1 ? `<p>${regels.slice(1).map(inline).join('<br>')}</p>` : '');
      return `<p>${regels.map(inline).join('<br>')}</p>`;
    })
    .join('');
}
