// Eenvoudige rekenmachine voor de vragen waarbij een rekenmachine mag.
// Eigen rekenparser (geen eval): + − × : ( ) √ x² en procent.

import { nl, clean } from './format.js';

export function berekenExpressie(invoer) {
  const s = String(invoer).replace(/\s+/g, '').replace(/[−–]/g, '-').replace(/[x*×]/gi, '×').replace(/[/:÷]/g, ':').replace(/,/g, '.');
  let i = 0;
  const kijk = () => s[i];
  const fout = () => {
    throw new Error('Ongeldige som');
  };
  function getal() {
    const start = i;
    while (/[0-9.]/.test(s[i] || '')) i++;
    const t = s.slice(start, i);
    if (!t || t === '.' || (t.match(/\./g) || []).length > 1) fout();
    return Number(t);
  }
  function factor() {
    let v;
    if (kijk() === '-') { i++; return -factor(); }
    if (kijk() === '+') { i++; return factor(); }
    if (kijk() === '√') { i++; v = factor(); if (v < 0) fout(); v = Math.sqrt(v); }
    else if (kijk() === '(') { i++; v = som(); if (kijk() !== ')') fout(); i++; }
    else v = getal();
    while (kijk() === '²' || kijk() === '%') {
      if (kijk() === '²') v = v * v;
      else v = v / 100;
      i++;
    }
    return v;
  }
  function term() {
    let v = factor();
    while (kijk() === '×' || kijk() === ':') {
      const op = s[i++];
      const w = factor();
      if (op === ':' && w === 0) throw new Error('Delen door 0 kan niet');
      v = op === '×' ? v * w : v / w;
    }
    return v;
  }
  function som() {
    let v = term();
    while (kijk() === '+' || kijk() === '-') {
      const op = s[i++];
      const w = term();
      v = op === '+' ? v + w : v - w;
    }
    return v;
  }
  if (!s) return 0;
  const v = som();
  if (i !== s.length || !Number.isFinite(v)) fout();
  return clean(v);
}

const KNOPPEN = [
  ['C', 'wis'], ['(', '('], [')', ')'], ['⌫', 'terug'],
  ['7', '7'], ['8', '8'], ['9', '9'], [':', ':'],
  ['4', '4'], ['5', '5'], ['6', '6'], ['×', '×'],
  ['1', '1'], ['2', '2'], ['3', '3'], ['−', '-'],
  ['0', '0'], [',', ','], ['√', '√'], ['+', '+'],
  ['x²', '²'], ['π', 'pi'], ['%', '%'], ['=', 'is'],
];

export function maakRekenmachine(container) {
  container.innerHTML = `
    <div class="rekenmachine" role="group" aria-label="Rekenmachine">
      <div class="rm-scherm">
        <div class="rm-vorige" aria-live="polite"></div>
        <input class="rm-invoer" inputmode="decimal" aria-label="Som invoeren" autocomplete="off" spellcheck="false">
      </div>
      <div class="rm-knoppen">${KNOPPEN.map(([t, a]) => `<button type="button" data-a="${a}" class="rm-knop${a === 'is' ? ' rm-is' : ''}${/[0-9,]/.test(a) ? ' rm-cijfer' : ''}">${t}</button>`).join('')}</div>
    </div>`;
  const invoer = container.querySelector('.rm-invoer');
  const vorige = container.querySelector('.rm-vorige');
  const reken = () => {
    try {
      const v = berekenExpressie(invoer.value.replace(/π/g, `(${Math.PI})`));
      vorige.textContent = invoer.value + ' =';
      invoer.value = nl(v).replace(/\./g, '').replace('−', '-');
    } catch (e) {
      vorige.textContent = e.message;
    }
  };
  container.querySelector('.rm-knoppen').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    const a = b.dataset.a;
    if (a === 'wis') { invoer.value = ''; vorige.textContent = ''; }
    else if (a === 'terug') invoer.value = invoer.value.slice(0, -1);
    else if (a === 'is') reken();
    else if (a === 'pi') invoer.value += 'π';
    else invoer.value += a;
  });
  invoer.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); reken(); }
  });
  return { focus: () => invoer.focus() };
}
