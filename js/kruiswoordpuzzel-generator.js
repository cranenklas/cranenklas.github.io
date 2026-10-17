// ===========================================================
// Cranenklas aardrijkskunde — tool "Kruiswoordpuzzel": generator
// Pure logica zonder DOM: woorden opschonen (norm), IJ als één vakje
// (tokenize), het oplossingswoord in groepen (parseSolution), de woorden
// laten kruisen (buildLayout), de grijze vakjes van de oplossing kiezen
// (markSolution) en de beste van een aantal pogingen houden (generate).
// In de browser staat alles onder window.XW; in Node via require().
// De pagina zelf staat in js/kruiswoordpuzzel.js.
// ===========================================================
(function (root) {
  'use strict';

  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function shuffle(arr, rng) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      const tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    }
    return arr;
  }

  // Hoofdletters, geen accenten, geen spaties of streepjes. Cijfers blijven staan.
  function norm(s) {
    return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '')
      .toUpperCase().replace(/[^A-Z0-9]/g, '');
  }

  // IJ is in de kruiswoordpuzzel één vakje.
  function tokenize(s) {
    const out = [];
    for (let i = 0; i < s.length; i++) {
      if (s[i] === 'I' && s[i + 1] === 'J') { out.push('IJ'); i++; }
      else out.push(s[i]);
    }
    return out;
  }

  // Oplossing: woorden gescheiden door spaties = groepen vakjes.
  function parseSolution(str) {
    return String(str || '').split(/\s+/).map(norm).filter(Boolean).map(tokenize);
  }

  function buildLayout(list, rng) {
    const order = list.map(function (w) { return { w: w, k: w.t.length + rng() * 3 }; })
      .sort(function (x, y) { return y.k - x.k; }).map(function (x) { return x.w; });
    const grid = new Map();
    const placed = [];
    let minR = 0, maxR = 0, minC = 0, maxC = 0;
    const key = function (r, c) { return r + ',' + c; };
    const occ = function (r, c) { return grid.has(key(r, c)); };

    function canPlace(t, r0, c0, d) {
      const dr = d === 'd' ? 1 : 0, dc = d === 'a' ? 1 : 0, n = t.length;
      if (occ(r0 - dr, c0 - dc) || occ(r0 + n * dr, c0 + n * dc)) return -1;
      let cross = 0;
      for (let k = 0; k < n; k++) {
        const r = r0 + k * dr, c = c0 + k * dc;
        const cell = grid.get(key(r, c));
        if (cell) {
          if (cell.t !== t[k] || cell.dirs[d] !== undefined) return -1;
          cross++;
        } else if (occ(r + dc, c + dr) || occ(r - dc, c - dr)) return -1;
      }
      return cross;
    }

    function place(w, r0, c0, d) {
      const dr = d === 'd' ? 1 : 0, dc = d === 'a' ? 1 : 0;
      const wi = placed.length;
      for (let k = 0; k < w.t.length; k++) {
        const r = r0 + k * dr, c = c0 + k * dc;
        let cell = grid.get(key(r, c));
        if (!cell) { cell = { t: w.t[k], r: r, c: c, dirs: {} }; grid.set(key(r, c), cell); }
        cell.dirs[d] = wi;
        if (r < minR) minR = r; if (r > maxR) maxR = r;
        if (c < minC) minC = c; if (c > maxC) maxC = c;
      }
      placed.push({ id: w.id, w: w.w, t: w.t, clue: w.clue, r: r0, c: c0, d: d, num: 0 });
    }

    place(order[0], 0, 0, 'a');
    const pending = order.slice(1);
    let progress = true;
    while (progress && pending.length) {
      progress = false;
      for (let pi = 0; pi < pending.length; pi++) {
        const w = pending[pi];
        let bestC = null;
        for (const cell of grid.values()) {
          for (let i = 0; i < w.t.length; i++) {
            if (w.t[i] !== cell.t) continue;
            for (const d of ['a', 'd']) {
              if (cell.dirs[d] !== undefined) continue;
              const r0 = d === 'd' ? cell.r - i : cell.r;
              const c0 = d === 'a' ? cell.c - i : cell.c;
              const cr = canPlace(w.t, r0, c0, d);
              if (cr < 1) continue;
              const n = w.t.length;
              const r1 = r0 + (d === 'd' ? n - 1 : 0), c1 = c0 + (d === 'a' ? n - 1 : 0);
              const nr = Math.max(maxR, r1) - Math.min(minR, r0) + 1;
              const nc = Math.max(maxC, c1) - Math.min(minC, c0) + 1;
              const sc = cr * 30 - nr * nc * 0.5 - Math.abs(nr - nc) * 2 + rng() * 6;
              if (!bestC || sc > bestC.sc) bestC = { sc: sc, r0: r0, c0: c0, d: d };
            }
          }
        }
        if (bestC) {
          place(w, bestC.r0, bestC.c0, bestC.d);
          pending.splice(pi, 1); pi--; progress = true;
        }
      }
    }

    const rows = maxR - minR + 1, cols = maxC - minC + 1;
    placed.forEach(function (w) { w.r -= minR; w.c -= minC; });
    const cells = [];
    for (let r = 0; r < rows; r++) { cells.push(new Array(cols).fill(null)); }
    placed.forEach(function (w, wi) {
      for (let k = 0; k < w.t.length; k++) {
        const r = w.r + (w.d === 'd' ? k : 0), c = w.c + (w.d === 'a' ? k : 0);
        let x = cells[r][c];
        if (!x) { x = cells[r][c] = { t: w.t[k], a: -1, d: -1, num: 0 }; }
        x[w.d] = wi;
      }
    });
    const starts = [], seenS = new Set();
    placed.forEach(function (w) {
      const k = w.r * 1000 + w.c;
      if (!seenS.has(k)) { seenS.add(k); starts.push([w.r, w.c]); }
    });
    starts.sort(function (p, q) { return p[0] - q[0] || p[1] - q[1]; });
    const numAt = new Map();
    starts.forEach(function (s, i) { numAt.set(s[0] * 1000 + s[1], i + 1); cells[s[0]][s[1]].num = i + 1; });
    placed.forEach(function (w) { w.num = numAt.get(w.r * 1000 + w.c); });

    return { rows: rows, cols: cols, cells: cells, placed: placed, unplaced: pending.map(function (w) { return w; }) };
  }

  function markSolution(lay, flat, rng) {
    const candidates = flat.map(function (t) {
      const arr = [];
      for (let r = 0; r < lay.rows; r++) for (let c = 0; c < lay.cols; c++) {
        const x = lay.cells[r][c];
        if (x && x.t === t) arr.push({ r: r, c: c, x: x });
      }
      return arr;
    });
    const miss = candidates.findIndex(function (a) { return !a.length; });
    if (miss >= 0) return { marks: null, penalty: 0, missing: flat[miss] };
    let best = null;
    for (let n = 0; n < 60; n++) {
      const used = new Set(), usedWords = new Map();
      const order = shuffle(flat.map(function (_, i) { return i; }), rng);
      const choice = new Array(flat.length);
      let ok = true, pen = 0;
      for (const j of order) {
        let bc = null;
        for (const cd of candidates[j]) {
          const k = cd.r * 1000 + cd.c;
          if (used.has(k)) continue;
          const ws = [cd.x.a, cd.x.d].filter(function (v) { return v >= 0; });
          let p = 0;
          ws.forEach(function (w) { p += (usedWords.get(w) || 0) * 10; });
          if (ws.length > 1) p += 1;
          p += rng() * 0.9;
          if (!bc || p < bc.p) bc = { p: p, cd: cd, ws: ws };
        }
        if (!bc) { ok = false; break; }
        used.add(bc.cd.r * 1000 + bc.cd.c);
        bc.ws.forEach(function (w) { usedWords.set(w, (usedWords.get(w) || 0) + 1); });
        pen += Math.floor(bc.p / 10);
        choice[j] = bc.cd;
      }
      if (!ok) continue;
      if (!best || pen < best.pen) { best = { pen: pen, choice: choice.slice() }; if (pen === 0) break; }
    }
    if (!best) return { marks: null, penalty: 0, missing: null, tooMany: true };
    return {
      marks: best.choice.map(function (cd, j) { return { r: cd.r, c: cd.c, i: j }; }),
      penalty: best.pen, missing: null
    };
  }

  // items: [{id, w (genormaliseerd), clue}]  groups: parseSolution()
  function generate(items, groups, seed, attempts) {
    const list = [], seen = new Set(), skipped = [];
    items.forEach(function (it) {
      const t = tokenize(it.w);
      if (t.length < 2) { skipped.push({ id: it.id, w: it.w, why: 'kort' }); return; }
      if (seen.has(it.w)) { skipped.push({ id: it.id, w: it.w, why: 'dubbel' }); return; }
      seen.add(it.w);
      list.push({ id: it.id, w: it.w, t: t, clue: it.clue });
    });
    const flat = [].concat.apply([], groups);
    if (!list.length) return { empty: true, skipped: skipped, placed: [], groups: groups, flat: flat };
    let best = null;
    for (let a = 0; a < attempts; a++) {
      const rng = mulberry32((seed * 7919 + a * 104729 + 13) >>> 0);
      const lay = buildLayout(list, rng);
      let mk = null;
      if (flat.length) mk = markSolution(lay, flat, rng);
      let score = lay.placed.length * 100000 - lay.rows * lay.cols * 10 - Math.abs(lay.rows - lay.cols) * 30;
      if (flat.length) score += mk.marks ? 20000 - mk.penalty * 3000 : -8000;
      if (!best || score > best.score) best = { score: score, lay: lay, mk: mk };
    }
    const lay = best.lay;
    const marks = best.mk && best.mk.marks ? best.mk.marks : null;
    const markAt = new Map();
    if (marks) marks.forEach(function (m) { markAt.set(m.r * 1000 + m.c, m.i); });
    const byNum = function (p, q) { return p.num - q.num; };
    return {
      empty: false, rows: lay.rows, cols: lay.cols, cells: lay.cells, placed: lay.placed,
      across: lay.placed.filter(function (w) { return w.d === 'a'; }).sort(byNum),
      down: lay.placed.filter(function (w) { return w.d === 'd'; }).sort(byNum),
      unplaced: lay.unplaced, skipped: skipped,
      groups: groups, flat: flat, marks: marks, markAt: markAt,
      markInfo: best.mk ? { penalty: best.mk.penalty, missing: best.mk.missing, tooMany: !!best.mk.tooMany } : null
    };
  }

  const api = { mulberry32: mulberry32, shuffle: shuffle, norm: norm, tokenize: tokenize, parseSolution: parseSolution, generate: generate };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.XW = api;
})(typeof window !== 'undefined' ? window : globalThis);
