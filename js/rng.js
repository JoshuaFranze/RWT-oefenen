// Seeded random: dezelfde seed geeft altijd dezelfde vragen.
// Zo blijven de oefenvragen en toetsen stabiel en kan voortgang aan een vraag-id gekoppeld worden.

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashString(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function makeRng(seed) {
  const r = mulberry32(typeof seed === 'string' ? hashString(seed) : seed);
  const api = {
    next: r,
    int(a, b) {
      return a + Math.floor(r() * (b - a + 1));
    },
    pick(arr) {
      return arr[Math.floor(r() * arr.length)];
    },
    shuffle(arr) {
      const a = [...arr];
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(r() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    },
    chance(p) {
      return r() < p;
    },
    sample(arr, k) {
      return api.shuffle(arr).slice(0, k);
    },
  };
  return api;
}
