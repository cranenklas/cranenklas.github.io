// ===========================================================
// Cranenklas aardrijkskunde — tool "Woordzoeker"
// Maakt een woordzoeker als werkblad op A4: woorden opschonen, het
// raster vullen (elk woord precies één keer), het verborgen antwoord
// precies laten uitkomen, een passend raster voorstellen, bijvullen
// uit de woordenbank (js/woordenbank.js) en het werkblad tekenen.
// Het tekenen gaat via één tekenobject met text, line en rect; er zijn
// drie uitvoerders: svg (voorbeeld op het scherm), canvas (kopiëren als
// afbeelding) en jsPDF (pdf, in vectoren). Coördinaten zijn millimeters
// op A4 staand (210 × 297).
// ===========================================================

/* ===== Woordzoeker: logica (geen DOM) ===== */
function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function cleanWord(s) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}
/* Woordenlijst uit het tekstvak: één per regel of gescheiden door komma's */
function parseWords(text) {
  const items = [], short = [], dup = [], seen = new Set();
  text.split(/[\n,;]+/).forEach(function (t) {
    const raw = t.trim().replace(/\s+/g, ' ');
    if (!raw) return;
    const clean = cleanWord(raw), label = raw.toUpperCase();
    if (!clean) return;
    if (clean.length < 3) { short.push(label); return; }
    if (seen.has(clean)) { dup.push(label); return; }
    seen.add(clean);
    items.push({ label: label, clean: clean });
  });
  return { items: items, short: short, dup: dup };
}
function parseAnswer(text) {
  const words = text.trim().split(/\s+/).map(cleanWord).filter(Boolean);
  return { words: words, letters: words.join('') };
}
/* Oplossingsvakjes: woorden als groepen, nooit gesplitst over twee regels */
const BOX_CAP = 24, BOX_GAP = 0.5;
function layoutAnswer(words) {
  const lines = []; let cur = [], used = 0;
  for (const w of words) {
    if (w.length > BOX_CAP) return { lines: [], tooLong: w };
    const need = (cur.length ? BOX_GAP : 0) + w.length;
    if (cur.length && used + need > BOX_CAP) { lines.push(cur); cur = [w]; used = w.length; }
    else { cur.push(w); used += need; }
  }
  if (cur.length) lines.push(cur);
  return { lines: lines, tooLong: null };
}
function dirList(o) {
  let d = [];
  if (o.h) d.push([1, 0]);
  if (o.v) d.push([0, 1]);
  if (o.d) d.push([1, 1], [1, -1]);
  if (o.back) d = d.concat(d.map(function (p) { return [-p[0], -p[1]]; }));
  return d;
}
function maxWordLen(o, W, H) {
  let m = 0;
  if (o.h) m = Math.max(m, W);
  if (o.v) m = Math.max(m, H);
  if (o.d) m = Math.max(m, Math.min(W, H));
  return m;
}
const ALL8 = [[1,0],[0,1],[1,1],[1,-1],[-1,0],[0,-1],[-1,-1],[-1,1]];
function countOccurrences(ch, W, H, w) {
  const L = w.length, found = new Set();
  for (const [dx, dy] of ALL8) {
    for (let y = 0; y < H; y++) {
      const ey = y + dy * (L - 1); if (ey < 0 || ey >= H) continue;
      for (let x = 0; x < W; x++) {
        const ex = x + dx * (L - 1); if (ex < 0 || ex >= W) continue;
        let ok = true;
        for (let i = 0; i < L; i++) if (ch[(y + dy * i) * W + x + dx * i] !== w[i]) { ok = false; break; }
        if (ok) { const a = y * W + x, b = ey * W + ex; found.add(a < b ? a + '-' + b : b + '-' + a); }
      }
    }
  }
  return found.size;
}
/* cfg: {W, H, words:[schoon], dirs:[[dx,dy]], answer:'schoon of leeg'} */
function generate(cfg, seed, budget) {
  const W = cfg.W, H = cfg.H, words = cfg.words, dirs = cfg.dirs, N = W * H;
  const L = cfg.answer ? cfg.answer.length : 0, answerMode = L > 0;
  const S = words.reduce(function (a, w) { return a + w.length; }, 0);
  const now = (typeof performance !== 'undefined') ? function () { return performance.now(); } : Date.now;
  const t0 = now(); budget = budget || 600;
  if (!words.length) return { ok: false, reason: 'empty' };
  if (answerMode && S + L < N) return { ok: false, reason: 'short', shortage: N - S - L };
  const rng = mulberry32(seed);
  const ch = new Array(N).fill(''), cnt = new Int16Array(N), pos = new Array(words.length).fill(null);
  let free = N;
  /* woorden die in een ander woord zitten: daar is "één keer" niet af te dwingen */
  const nested = words.map(function (w, i) {
    const r = w.split('').reverse().join('');
    return words.some(function (o, j) { return j !== i && (o.indexOf(w) >= 0 || o.indexOf(r) >= 0); });
  });
  function put(i, p) {
    const w = words[i];
    for (let k = 0; k < w.length; k++) { const c = (p.y + p.dy * k) * W + p.x + p.dx * k; if (!cnt[c]) { free--; ch[c] = w[k]; } cnt[c]++; }
    pos[i] = p;
  }
  function take(i) {
    const p = pos[i], w = words[i];
    for (let k = 0; k < w.length; k++) { const c = (p.y + p.dy * k) * W + p.x + p.dx * k; cnt[c]--; if (!cnt[c]) { free++; ch[c] = ''; } }
    pos[i] = null;
  }
  function options(i, maxK) {
    const w = words[i], Lw = w.length, buckets = [];
    for (const [dx, dy] of dirs) {
      for (let y = 0; y < H; y++) {
        const ey = y + dy * (Lw - 1); if (ey < 0 || ey >= H) continue;
        for (let x = 0; x < W; x++) {
          const ex = x + dx * (Lw - 1); if (ex < 0 || ex >= W) continue;
          let k = 0, ok = true;
          for (let n = 0; n < Lw; n++) {
            const c = ch[(y + dy * n) * W + x + dx * n];
            if (c) { if (c !== w[n]) { ok = false; break; } k++; }
          }
          if (!ok || k === Lw || k > maxK) continue;
          (buckets[k] || (buckets[k] = [])).push({ x: x, y: y, dx: dx, dy: dy });
        }
      }
    }
    return buckets;
  }
  function pick(buckets, target) {
    let tot = 0; const ws = [];
    for (let k = 0; k < buckets.length; k++) {
      if (!buckets[k]) { ws.push(0); continue; }
      const wgt = target === null ? (k === 0 ? 1 : k === 1 ? 1.3 : k === 2 ? 1 : 0.6) : Math.exp(-1.5 * Math.abs(k - target));
      ws.push(wgt); tot += wgt;
    }
    if (!tot) return null;
    let r = rng() * tot, k = 0;
    for (; k < ws.length; k++) { r -= ws[k]; if (ws[k] && r <= 0) break; }
    if (k >= ws.length) k = ws.length - 1;
    while (!buckets[k]) k--;
    const b = buckets[k];
    return b[Math.floor(rng() * b.length)];
  }
  function fillAll() {
    const todo = [];
    for (let i = 0; i < words.length; i++) if (!pos[i]) todo.push(i);
    for (let i = todo.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); const t = todo[i]; todo[i] = todo[j]; todo[j] = t; }
    todo.sort(function (a, b) { return words[b].length - words[a].length; });
    let rem = todo.reduce(function (a, i) { return a + words[i].length; }, 0);
    for (const i of todo) {
      const Lw = words[i].length;
      let target = null, maxK = 99;
      if (answerMode) {
        const need = free - L;                       /* zoveel nieuwe vakjes moeten er nog bedekt worden */
        target = Math.max(0, Lw - need * Lw / rem);  /* gewenste overlap voor dit woord */
        maxK = Math.max(0, rem - need);              /* meer overlap dan dit kan niet meer goedkomen */
      }
      const p = pick(options(i, maxK), target);
      if (p) put(i, p);
      rem -= Lw;
    }
  }
  function cost() {
    let un = 0;
    for (let i = 0; i < words.length; i++) if (!pos[i]) un += words[i].length;
    return un * 1000 + (answerMode ? Math.abs(free - L) : 0);
  }
  function snapshot() { return pos.slice(); }
  function restore(s) {
    for (let i = 0; i < words.length; i++) if (pos[i]) take(i);
    for (let i = 0; i < words.length; i++) if (s[i]) put(i, s[i]);
  }
  function finish() {
    const g = ch.slice(), freeIdx = [];
    for (let c = 0; c < N; c++) if (!g[c]) freeIdx.push(c);
    if (answerMode) freeIdx.forEach(function (c, n) { g[c] = cfg.answer[n]; });
    else {
      const pool = words.join('').replace(/[0-9]/g, '') + 'AEEINORSTDLKG';
      const src = pool.length ? pool : 'AEIOUNRST';
      for (let tries = 0; tries < 30; tries++) {
        freeIdx.forEach(function (c) { g[c] = src[Math.floor(rng() * src.length)]; });
        if (unique(g)) break;
        if (tries === 29) return null;
      }
    }
    if (answerMode && !unique(g)) return null;
    return {
      ok: true, W: W, H: H, grid: g, free: freeIdx,
      placed: pos.map(function (p, i) { return { i: i, x: p.x, y: p.y, dx: p.dx, dy: p.dy, len: words[i].length }; })
    };
  }
  function unique(g) {
    for (let i = 0; i < words.length; i++) if (!nested[i] && countOccurrences(g, W, H, words[i]) !== 1) return false;
    return true;
  }
  fillAll();
  let cur = cost(), best = cur, stale = 0, iter = 0;
  let bestInfo = { cost: cur, free: free };
  while (true) {
    if (cur === 0) { const res = finish(); if (res) { res.iter = iter; return res; } }
    if (now() - t0 > budget) break;
    iter++;
    const placedIdx = [];
    for (let i = 0; i < words.length; i++) if (pos[i]) placedIdx.push(i);
    const snap = snapshot();
    if (stale > 60 || !placedIdx.length) {           /* vastgelopen: helemaal opnieuw */
      for (const i of placedIdx) take(i);
      stale = 0; fillAll(); cur = cost();
    } else {
      const r = Math.min(placedIdx.length, 1 + Math.floor(rng() * 3));
      for (let n = 0; n < r; n++) {
        const j = Math.floor(rng() * placedIdx.length);
        take(placedIdx[j]); placedIdx.splice(j, 1);
      }
      fillAll();
      const c = cost();
      if (c < cur) { cur = c; stale = 0; }
      else if (c === cur || rng() < 0.03) { cur = c; stale++; }
      else { restore(snap); stale++; }
    }
    if (cur < best) { best = cur; bestInfo = { cost: cur, free: free }; }
  }
  const unplaced = [];
  for (let i = 0; i < words.length; i++) if (!pos[i]) unplaced.push(i);
  return { ok: false, reason: bestInfo.cost === 0 ? 'retry' : 'full', unplaced: unplaced, best: bestInfo, iter: iter };
}
/* Zoekt een rastergrootte in de buurt waarbij het wél lukt */
function suggestSize(cfg, opts, seed, deadlineMs) {
  const S = cfg.words.reduce(function (a, w) { return a + w.length; }, 0), L = cfg.answer.length;
  const longest = cfg.words.reduce(function (a, w) { return Math.max(a, w.length); }, 0);
  const cand = [];
  for (let w = 5; w <= 25; w++) for (let h = 5; h <= 25; h++) {
    if (w === cfg.W && h === cfg.H) continue;
    const O = S + L - w * h;
    if (O < 0 || O > cfg.words.length * 1.5) continue;
    if (maxWordLen(opts, w, h) < longest) continue;
    if (Math.abs(w - h) > Math.max(3, Math.abs(cfg.W - cfg.H))) continue;
    cand.push({ W: w, H: h, d: Math.abs(w - cfg.W) + Math.abs(h - cfg.H) + Math.abs(w - h) * 0.3 });
  }
  cand.sort(function (a, b) { return a.d - b.d; });
  const now = (typeof performance !== 'undefined') ? function () { return performance.now(); } : Date.now;
  const t0 = now();
  for (const c of cand.slice(0, 8)) {
    if (now() - t0 > deadlineMs) break;
    const r = generate({ W: c.W, H: c.H, words: cfg.words, dirs: cfg.dirs, answer: cfg.answer }, seed, 300);
    if (r.ok) return c;
  }
  return null;
}

/* Kiest woorden uit de woordenbank tot het raster past. Met antwoord: precies genoeg letters. Zonder: tot ruim de helft gevuld is. */
function pickFill(cfg, opts, db, genSeed, pickSeed) {
  const N = cfg.W * cfg.H, L = cfg.answer.length, n = cfg.words.length;
  const S = cfg.words.reduce(function (a, w) { return a + w.length; }, 0);
  const need = L ? N - S - L : Math.ceil(N * 0.55) - S;
  if (need <= 0) return { ok: false, reason: 'none' };
  /* in een groot, vol raster ontstaan korte woorden ook per toeval: daar alleen langere woorden bijvullen */
  const maxL = maxWordLen(opts, cfg.W, cfg.H), minL = N >= 256 ? 5 : N >= 144 ? 4 : 3;
  const rev = function (s) { return s.split('').reverse().join(''); };
  /* geen woorden die in een ander woord zitten (ZEE in ZEESTRAAT): die zijn in het raster dubbel te vinden */
  const clash = function (a, list) { return list.some(function (b) { return a.indexOf(b) >= 0 || b.indexOf(a) >= 0 || a.indexOf(rev(b)) >= 0 || b.indexOf(rev(a)) >= 0; }); };
  const pool = db.map(function (raw) { return { raw: raw, clean: cleanWord(raw) }; })
    .filter(function (c) { return c.clean.length >= minL && c.clean.length <= maxL && !clash(c.clean, cfg.words); });
  const rng = mulberry32(pickSeed);
  for (let a = 0; a < 4 && pool.length; a++) {
    const p = pool.slice();
    for (let i = p.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); const t = p[i]; p[i] = p[j]; p[j] = t; }
    const chosen = [], cleans = []; let sum = 0;
    for (const c of p) {
      const nTot = n + chosen.length + 1;
      if (L && sum + c.clean.length - need > Math.floor(nTot * 0.45)) continue;   /* zou te veel kruisingen vragen */
      if (clash(c.clean, cleans)) continue;
      chosen.push(c); cleans.push(c.clean); sum += c.clean.length;
      if (sum - need >= (L ? Math.ceil(nTot * 0.1) : 0)) break;
    }
    if (sum < need) continue;
    const r = generate({ W: cfg.W, H: cfg.H, words: cfg.words.concat(cleans), dirs: cfg.dirs, answer: cfg.answer }, genSeed, 450);
    if (r.ok) return { ok: true, add: chosen.map(function (c) { return c.raw; }) };
  }
  return { ok: false, reason: 'fail' };
}

/* ===== Woordzoeker: pagina (formulier, voorbeeld, werkblad tekenen) ===== */
(function () {
  const $ = function (id) { return document.getElementById(id); };
  const INK = '#141414', GREY = '#6B6B6B', FAINT = '#C8C8C8', PAPER = '#FFFFFF', RED = '#D4281C';
  const FONT = '"Atkinson Hyperlegible", system-ui, sans-serif';
  const EX = {
    words: ['verdamping', 'condensatie', 'neerslag', 'grondwater', 'infiltratie', 'rivier', 'gletsjer', 'oceaan', 'wolken',
      'ijskap', 'smeltwater', 'afvoer', 'waterdamp', 'bron', 'delta', 'zee-engte', 'sneeuw', 'meer'].join('\n'),
    answer: 'de kringloop van water', title: 'Woordzoeker waterkringloop', W: 12, H: 12
  };
  const TASK = 'Zoek de woorden in het raster en streep ze weg.';
  const TASK_ANS = ' De letters die overblijven vormen de oplossing.';
  const st = { seed: 20261008, variant: 1, cache: new Map(), cfg: null, key: '', err: null, form: null, ansLayout: null, taskAuto: true, sug: null };

  /* ---------- formulier lezen ---------- */
  function clampInt(v, lo, hi, dflt) { const n = parseInt(v, 10); return isNaN(n) ? dflt : Math.max(lo, Math.min(hi, n)); }
  function isKlas() { return $('klasJa').checked; }
  function students() { return clampInt($('students').value, 1, 40, 25); }
  function uniqueOn() { return isKlas() && $('unique').checked; }
  function sheets() { return isKlas() ? students() + 1 : 1; }
  function view() { return $('viewA').checked ? 'antwoord' : 'werkblad'; }
  function compactOn() { return uniqueOn() && $('withKey').checked && $('layCompact').checked; }
  function compactView() { return compactOn() && view() === 'antwoord'; }
  function perPage() { return st.cfg && Math.max(st.cfg.W, st.cfg.H) > 18 ? 4 : 6; }
  function firstOnPage() { const p = perPage(); return Math.floor((st.variant - 1) / p) * p + 1; }

  function read() {
    const opts = { h: $('dirH').checked, v: $('dirV').checked, d: $('dirD').checked, back: $('backwards').checked };
    const W = clampInt($('gw').value, 5, 25, 15), H = clampInt($('gh').value, 5, 25, 15);
    const pw = parseWords($('words').value), maxL = maxWordLen(opts, W, H);
    return {
      opts: opts, W: W, H: H, pw: pw,
      items: pw.items.filter(function (i) { return i.clean.length <= maxL; }),
      tooLong: pw.items.filter(function (i) { return i.clean.length > maxL; }).map(function (i) { return i.label; }),
      useAns: $('useAnswer').checked, ans: parseAnswer($('answer').value)
    };
  }

  function compute() {
    clearTimeout(timer); pending = false;
    const f = read(); st.form = f; st.sug = null;
    const S = f.items.reduce(function (a, i) { return a + i.clean.length; }, 0);
    $('wordStat').textContent = f.items.length + (f.items.length === 1 ? ' woord, ' : ' woorden, ') + S + ' letters';
    const notes = [];
    if (f.pw.short.length) notes.push('Te kort (minder dan 3 letters): ' + f.pw.short.join(', '));
    if (f.tooLong.length) notes.push('Te lang voor dit raster: ' + f.tooLong.join(', '));
    if (f.pw.dup.length) notes.push('Dubbel, één keer gebruikt: ' + f.pw.dup.join(', '));
    $('wordNotes').innerHTML = notes.map(function (n) { return '<li>' + esc(n) + '</li>'; }).join('');
    $('answerBox').hidden = !f.useAns;
    const nA = f.ans.letters.length;
    $('answerStat').textContent = nA + ' / 60 letters';
    $('answerStat').style.color = nA > 60 ? 'var(--rust)' : '';
    if (st.taskAuto) $('task').value = TASK + (f.useAns ? TASK_ANS : '');

    let err = null, lay = null;
    if (!f.items.length) err = { t: 'Vul eerst woorden in.', d: 'Een woord heeft minimaal 3 letters.' };
    else if (f.useAns) {
      if (!nA) err = { t: 'Vul een antwoord in.', d: 'Of zet het verborgen antwoord uit.' };
      else if (nA > 60) err = { t: 'Je antwoord heeft ' + nA + ' letters.', d: 'Het maximum is 60. Kort het antwoord in.' };
      else {
        lay = layoutAnswer(f.ans.words);
        if (lay.tooLong) err = { t: 'Het woord ' + lay.tooLong + ' is te lang.', d: 'Een woord in het antwoord heeft maximaal 24 letters.' };
        else if (lay.lines.length > 3) err = { t: 'Het antwoord past niet op drie regels.', d: 'Kort het antwoord in.' };
      }
    }
    st.err = err; st.ansLayout = (f.useAns && lay && !err) ? lay : null;
    st.cfg = { W: f.W, H: f.H, words: f.items.map(function (i) { return i.clean; }), dirs: dirList(f.opts), answer: f.useAns ? f.ans.letters : '' };
    const key = JSON.stringify([st.cfg, st.seed, uniqueOn()]);
    if (key !== st.key) { st.key = key; st.cache.clear(); if (!st.keepNote) $('fillNote').innerHTML = ''; }
    render();
  }

  function result(nr) {
    if (st.cache.has(nr)) return st.cache.get(nr);
    let r = null;
    for (let t = 0; t < 3; t++) {
      r = generate(st.cfg, st.seed + (uniqueOn() ? nr * 7919 : 0) + t * 104729, 600);
      if (r.ok || r.reason !== 'retry') break;
    }
    st.cache.set(nr, r);
    return r;
  }

  function failMsg(r) {
    const f = st.form, L = st.cfg.answer.length;
    if (r.reason === 'short') {
      return { kind: 'size', fill: true, t: 'Er blijven minstens ' + (L + r.shortage) + ' vakjes over, maar je antwoord heeft ' + L + ' letters.',
        d: 'Maak het antwoord ' + r.shortage + (r.shortage === 1 ? ' letter' : ' letters') + ' langer, voeg woorden toe of kies een kleiner raster.' };
    }
    if (r.reason === 'retry') return { t: 'Het lukt nu niet om alle woorden één keer te plaatsen.', d: 'Klik op Husselen om het opnieuw te proberen.' };
    if (L) return { kind: 'size', t: 'Het raster is te vol voor deze woorden en dit antwoord.', d: 'Kies een groter raster, haal een woord weg of kort het antwoord in.' };
    return { t: 'Niet alle woorden passen in een raster van ' + f.W + ' × ' + f.H + '.', d: 'Kies een groter raster of haal woorden weg.' };
  }

  /* ---------- tekenen: drie uitvoerders (svg voor het voorbeeld, canvas voor de afbeelding, jsPDF voor de pdf).
     paper() tekent het witte vel met een grijze rand; in de pdf is het papier zelf het vel. ---------- */
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function nn(v) { return Math.round(v * 100) / 100; }
  function svgOut() {
    const out = [];
    return {
      out: out,
      paper: function () { this.rect(0, 0, 210, 297, { fill: PAPER, stroke: FAINT, sw: 0.3 }); },
      text: function (x, y, s, o) {
        o = o || {};
        out.push('<text x="' + nn(x) + '" y="' + nn(y) + '" font-size="' + nn(o.size || 3.8) + '"' + (o.weight ? ' font-weight="' + o.weight + '"' : '') +
          (o.anchor ? ' text-anchor="' + o.anchor + '"' : '') + ' fill="' + (o.fill || INK) + '">' + esc(s) + '</text>');
      },
      line: function (x1, y1, x2, y2, o) {
        o = o || {};
        out.push('<line x1="' + nn(x1) + '" y1="' + nn(y1) + '" x2="' + nn(x2) + '" y2="' + nn(y2) + '" stroke="' + (o.stroke || INK) + '" stroke-width="' + nn(o.w || 0.3) + '"' + (o.cap ? ' stroke-linecap="round"' : '') + '/>');
      },
      rect: function (x, y, w, h, o) {
        o = o || {};
        out.push('<rect x="' + nn(x) + '" y="' + nn(y) + '" width="' + nn(w) + '" height="' + nn(h) + '" fill="' + (o.fill || 'none') + '" stroke="' + (o.stroke || 'none') + '" stroke-width="' + nn(o.sw || 0) + '"/>');
      }
    };
  }
  function canvasOut(ctx, sc) {
    return {
      paper: function () { this.rect(0, 0, 210, 297, { fill: PAPER, stroke: FAINT, sw: 0.3 }); },
      text: function (x, y, s, o) {
        o = o || {};
        ctx.font = (o.weight || 400) + ' ' + ((o.size || 3.8) * sc) + 'px ' + FONT;
        ctx.textAlign = o.anchor === 'middle' ? 'center' : o.anchor === 'end' ? 'right' : 'left';
        ctx.fillStyle = o.fill || INK; ctx.fillText(s, x * sc, y * sc);
      },
      line: function (x1, y1, x2, y2, o) {
        o = o || {};
        ctx.beginPath(); ctx.lineWidth = (o.w || 0.3) * sc; ctx.lineCap = o.cap ? 'round' : 'butt'; ctx.strokeStyle = o.stroke || INK;
        ctx.moveTo(x1 * sc, y1 * sc); ctx.lineTo(x2 * sc, y2 * sc); ctx.stroke();
      },
      rect: function (x, y, w, h, o) {
        o = o || {};
        if (o.fill && o.fill !== 'none') { ctx.fillStyle = o.fill; ctx.fillRect(x * sc, y * sc, w * sc, h * sc); }
        if (o.stroke && o.stroke !== 'none') { ctx.lineWidth = (o.sw || 0.3) * sc; ctx.strokeStyle = o.stroke; ctx.strokeRect(x * sc, y * sc, w * sc, h * sc); }
      }
    };
  }

  /* jsPDF: millimeters op A4, lettergrootte in punten (1 mm = 72 / 25,4 pt) */
  const PT = 72 / 25.4;
  /* fonts: [naam, stijl] voor normaal en vet */
  function pdfOut(doc, fonts) {
    return {
      paper: function () {},
      text: function (x, y, s, o) {
        o = o || {};
        const f = o.weight >= 700 ? fonts.bold : fonts.normal;
        doc.setFont(f[0], f[1]);
        doc.setFontSize((o.size || 3.8) * PT);
        doc.setTextColor(o.fill || INK);
        doc.text(String(s), x, y, { align: o.anchor === 'middle' ? 'center' : o.anchor === 'end' ? 'right' : 'left', baseline: 'alphabetic' });
      },
      line: function (x1, y1, x2, y2, o) {
        o = o || {};
        doc.setLineWidth(o.w || 0.3); doc.setDrawColor(o.stroke || INK); doc.setLineCap(o.cap ? 'round' : 'butt');
        doc.line(x1, y1, x2, y2);
      },
      rect: function (x, y, w, h, o) {
        o = o || {};
        const fill = o.fill && o.fill !== 'none', stroke = o.stroke && o.stroke !== 'none';
        if (fill) doc.setFillColor(o.fill);
        if (stroke) { doc.setLineWidth(o.sw || 0.3); doc.setDrawColor(o.stroke); doc.setLineCap('butt'); }
        if (fill || stroke) doc.rect(x, y, w, h, fill && stroke ? 'FD' : fill ? 'F' : 'S');
      }
    };
  }

  function drawGrid(g, r, gx, gy, cell, solved, markFree) {
    const W = r.W, H = r.H;
    for (let i = 1; i < W; i++) g.line(gx + i * cell, gy, gx + i * cell, gy + H * cell, { stroke: FAINT, w: 0.15 });
    for (let i = 1; i < H; i++) g.line(gx, gy + i * cell, gx + W * cell, gy + i * cell, { stroke: FAINT, w: 0.15 });
    if (solved) {
      /* rode omlijning: eerst alle dikke rode lijnen, dan iets dunnere witte eroverheen */
      const ends = r.placed.map(function (p) {
        return [gx + (p.x + 0.5) * cell, gy + (p.y + 0.5) * cell, gx + (p.x + p.dx * (p.len - 1) + 0.5) * cell, gy + (p.y + p.dy * (p.len - 1) + 0.5) * cell];
      });
      ends.forEach(function (e) { g.line(e[0], e[1], e[2], e[3], { stroke: RED, w: cell * 0.78, cap: true }); });
      ends.forEach(function (e) { g.line(e[0], e[1], e[2], e[3], { stroke: PAPER, w: cell * 0.78 - Math.max(0.5, cell * 0.09), cap: true }); });
    }
    g.rect(gx, gy, W * cell, H * cell, { stroke: INK, sw: 0.5 });
    const free = solved && markFree ? new Set(r.free) : null, fs = cell * 0.6;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const c = y * W + x;
      g.text(gx + (x + 0.5) * cell, gy + (y + 0.5) * cell + fs * 0.36, r.grid[c], { size: fs, anchor: 'middle', weight: free && free.has(c) ? 700 : 400 });
    }
  }
  function listPlan(labels, f) {
    const maxLen = labels.reduce(function (a, l) { return Math.max(a, l.length); }, 0);
    const colW = Math.max(22, maxLen * f * 0.66 + 6);
    const cols = Math.max(1, Math.min(6, Math.floor(180 / colW), labels.length));
    const rows = Math.ceil(labels.length / cols), lh = f * 1.5;
    return { f: f, cols: cols, rows: rows, lh: lh, h: rows * lh };
  }
  function drawList(g, labels, x, y, p) {
    const cw = 180 / p.cols;
    labels.forEach(function (l, i) { g.text(x + Math.floor(i / p.rows) * cw, y + (i % p.rows) * p.lh + p.f, l, { size: p.f }); });
  }
  const BOX = 7.5;
  function answerH(lay) { return 5.5 + lay.lines.length * BOX + (lay.lines.length - 1) * 2; }
  function drawAnswer(g, lay, x, y, filled) {
    g.text(x, y + 3.6, 'Oplossing', { size: 3.8, weight: 700 });
    lay.lines.forEach(function (line, li) {
      let cx = x; const by = y + 5.5 + li * (BOX + 2);
      line.forEach(function (w) {
        for (let k = 0; k < w.length; k++) {
          g.rect(cx, by, BOX, BOX, { stroke: INK, sw: 0.35 });
          if (filled) g.text(cx + BOX / 2, by + BOX / 2 + 1.7, w[k], { size: 4.6, weight: 700, anchor: 'middle' });
          cx += BOX;
        }
        cx += BOX * 0.5;
      });
    });
  }
  function wrap(str, maxChars, maxLines) {
    const words = str.trim().split(/\s+/).filter(Boolean), lines = []; let cur = '';
    words.forEach(function (w) {
      if (cur && (cur + ' ' + w).length > maxChars) { lines.push(cur); cur = w; } else cur = cur ? cur + ' ' + w : w;
    });
    if (cur) lines.push(cur);
    return lines.slice(0, maxLines);
  }
  function labels() { return st.form.items.map(function (i) { return i.label; }).sort(function (a, b) { return a.localeCompare(b, 'nl'); }); }

  /* Eén A4 staand (210 × 297 mm, marge 15 mm): alles wordt zo geschaald dat het op één pagina past */
  function drawSheet(g, r, opt) {
    const X = 15, solved = opt.view === 'antwoord';
    g.paper();
    if (opt.school) g.text(X, 19, opt.school, { size: 3.4, fill: GREY });
    const tag = solved ? ('Antwoordblad' + (opt.nr ? ' nr. ' + opt.nr : '')) : (opt.nr ? 'Nr. ' + opt.nr : '');
    if (tag) g.text(195, 19, tag, { size: 3.4, fill: GREY, anchor: 'end', weight: 700 });
    const title = opt.title || 'Woordzoeker';
    g.text(X, 30, title, { size: Math.max(4.5, Math.min(7.5, 180 / (title.length * 0.56))), weight: 700 });
    if (!solved) {
      g.text(X, 40, 'Naam:', { size: 3.8 }); g.line(28, 40.7, 98, 40.7, { w: 0.25 });
      g.text(103, 40, 'Klas:', { size: 3.8 }); g.line(114, 40.7, 138, 40.7, { w: 0.25 });
      g.text(143, 40, 'Datum:', { size: 3.8 }); g.line(158, 40.7, 195, 40.7, { w: 0.25 });
    }
    const task = wrap(opt.task || '', 92, 2);
    task.forEach(function (l, i) { g.text(X, 48.5 + i * 5, l, { size: 3.8 }); });
    const top = task.length ? 48.5 + (task.length - 1) * 5 + 5 : 45;
    const lab = opt.showList ? labels() : [], lay = st.ansLayout, aH = lay ? answerH(lay) + 6 : 0;
    let lp = null, cell = 0;
    const sizes = [3.7, 3.4, 3.1, 2.8, 2.5];
    for (let i = 0; i < sizes.length; i++) {
      lp = lab.length ? listPlan(lab, sizes[i]) : null;
      cell = Math.min(180 / r.W, (281 - top - (lp ? lp.h + 7 : 0) - aH) / r.H, 12);
      if (cell >= 6) break;
    }
    const gx = X + (180 - cell * r.W) / 2;
    drawGrid(g, r, gx, top, cell, solved, !!lay);
    let y = top + cell * r.H + 7;
    if (lp) { drawList(g, lab, X, y - 1, lp); y += lp.h + 6; }
    if (lay) drawAnswer(g, lay, X, y - 1, solved);
    g.text(105, 289.5, 'Gemaakt met cranenklas.github.io', { size: 2.8, fill: GREY, anchor: 'middle' });
    return cell;
  }
  /* Compact antwoordblad: meerdere oplossingen op één A4, elk met het nummer van het werkblad */
  function drawCompact(g, first, per, total) {
    const X = 15, last = Math.min(total, first + per - 1), school = $('school').value.trim(), title = $('title').value.trim() || 'Woordzoeker';
    g.paper();
    if (school) g.text(X, 19, school, { size: 3.4, fill: GREY });
    g.text(195, 19, 'Antwoorden nr. ' + first + (last > first ? ' t/m ' + last : ''), { size: 3.4, fill: GREY, anchor: 'end', weight: 700 });
    g.text(X, 30, title, { size: Math.max(4.5, Math.min(7.5, 180 / (title.length * 0.56))), weight: 700 });
    let top = 38;
    if (st.ansLayout) { g.text(X, 38.5, 'Oplossing: ' + st.form.ans.words.join(' '), { size: 4, weight: 700 }); top = 45; }
    const rows = per / 2, tw = 87, th = (281 - top - (rows - 1) * 5) / rows;
    for (let k = 0; k < per && first + k <= total; k++) {
      const nr = first + k, r = result(nr), tx = X + (k % 2) * (tw + 6), ty = top + Math.floor(k / 2) * (th + 5);
      g.text(tx, ty + 3.8, 'Nr. ' + nr, { size: 3.8, weight: 700 });
      if (!r.ok) { g.text(tx, ty + 11, 'Niet gelukt. Klik op Husselen.', { size: 3.2, fill: GREY }); continue; }
      const cell = Math.min(tw / r.W, (th - 6.5) / r.H);
      drawGrid(g, r, tx + (tw - cell * r.W) / 2, ty + 6.5, cell, true, !!st.ansLayout);
    }
    g.text(105, 289.5, 'Gemaakt met cranenklas.github.io', { size: 2.8, fill: GREY, anchor: 'middle' });
  }
  function blankSheet() {
    const g = svgOut();
    g.paper();
    g.text(105, 140, 'Hier komt je woordzoeker', { size: 6, fill: GREY, anchor: 'middle' });
    return g.out.join('');
  }
  function sheetOpts(nr, v) {
    return { view: v || view(), nr: uniqueOn() ? nr : 0, title: $('title').value.trim(), school: $('school').value.trim(), task: $('task').value, showList: $('showList').checked };
  }

  /* ---------- scherm bijwerken ---------- */
  const CHECK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12.5 L10 18 L20 6"/></svg>';
  function showBad(m, extra) {
    $('status').innerHTML = '<div class="fb bad"><p><b>' + esc(m.t) + '</b></p><p>' + esc(m.d) + '</p>' + (extra || '') + '</div>';
  }
  function fillBtn(m) { return m.fill ? '<button class="btn ghost small" id="useFill" type="button">Woorden bijvullen</button>' : ''; }
  function setOut(ok) { $('dl').disabled = !ok; $('copy').disabled = !ok; }

  function render() {
    updatePrint();
    const nr = uniqueOn() ? st.variant : 1;
    if (st.err) { showBad(st.err); $('sheet').innerHTML = blankSheet(); setOut(false); return; }
    const r = result(nr);
    st.cur = r;
    if (!r.ok) {
      const m = failMsg(r);
      showBad(m, fillBtn(m)); $('sheet').innerHTML = blankSheet(); setOut(false);
      if (m.kind === 'size') suggest(m);
      return;
    }
    const g = svgOut(); let cell = 10;
    if (compactView()) drawCompact(g, firstOnPage(), perPage(), sheets());
    else cell = drawSheet(g, r, sheetOpts(nr));
    $('sheet').innerHTML = g.out.join('');
    setOut(!busy);
    const n = st.cfg.words.length, L = st.cfg.answer.length;
    if (cell < 4.2) {
      showBad({ t: 'Dit past niet meer leesbaar op één A4.', d: 'Kies een kleiner raster, gebruik minder woorden of verberg de woordenlijst.' });
    } else {
      $('status').innerHTML = '<div class="fb good">' + CHECK + '<span>' + n + (n === 1 ? ' woord' : ' woorden') + ' geplaatst.' +
        (L ? ' De ' + L + ' letters die overblijven vormen je antwoord.' : '') + '</span></div>';
    }
  }

  /* Zoekt na een mislukte poging een rastergrootte waarbij het wél lukt */
  function suggest(m) {
    const key = st.key, cfg = st.cfg, opts = st.form.opts;
    setTimeout(function () {
      if (key !== st.key) return;
      const s = suggestSize(cfg, opts, st.seed, 1400);
      if (key !== st.key || !s) return;
      st.sug = s;
      showBad(m, '<p>Met een raster van ' + s.W + ' × ' + s.H + ' lukt het wel.</p><div class="row"><button class="btn ghost small" id="useSug" type="button">Raster aanpassen naar ' + s.W + ' × ' + s.H + '</button>' + fillBtn(m) + '</div>');
    }, 40);
  }

  function updatePrint() {
    const klas = isKlas(), n = students(), withKey = $('withKey').checked, uni = uniqueOn(), all = $('whoAll').checked;
    $('klasOpts').hidden = !klas;
    const per = perPage(), compact = compactOn();
    $('keyWhoBox').hidden = !withKey || uni;
    $('keyLayBox').hidden = !withKey || !uni;
    $('keyHint').hidden = !withKey || !uni;
    $('keyHint').textContent = compact ? per + ' oplossingen per pagina. Handig als je zelf nakijkt.' : 'Elke leerling krijgt het antwoordblad met zijn eigen nummer en kijkt zelf na.';
    $('uniqueHint').hidden = !uni;
    let pages, parts, hint;
    if (!klas) {
      pages = 2; parts = 'het werkblad en het antwoordblad';
      hint = 'Print dubbelzijdig, dan staat het antwoordblad op de achterkant.';
    } else {
      const w = n + 1, k = !withKey ? 0 : compact ? Math.ceil(w / per) : (uni || all) ? w : 1;
      pages = w + k;
      parts = w + ' werkbladen' + (!k ? '' : compact ? ' en ' + k + (k === 1 ? ' pagina' : " pagina's") + ' met antwoorden' : ' en ' + k + (k === 1 ? ' antwoordblad' : ' antwoordbladen'));
      hint = 'Print enkelzijdig.' + (k ? ' De antwoorden staan achteraan in de pdf.' : '');
    }
    st.pages = pages;
    $('pageCount').textContent = 'Je pdf bevat ' + pages + " pagina's: " + parts + '.';
    $('printHint').textContent = hint;
    const total = sheets();
    if (st.variant > total) st.variant = total;
    $('variant').hidden = !uni;
    if (compactView()) {
      const first = firstOnPage(), last = Math.min(total, first + per - 1);
      $('vLabel').textContent = 'Nr. ' + first + ' t/m ' + last + ' van ' + total;
      $('prevV').disabled = first <= 1; $('nextV').disabled = last >= total;
    } else {
      $('vLabel').textContent = 'Nummer ' + st.variant + ' van ' + total;
      $('prevV').disabled = st.variant <= 1; $('nextV').disabled = st.variant >= total;
    }
  }

  /* ---------- afbeelding kopiëren: raster, woordenlijst en oplossingsvakjes ---------- */
  function buildImage() {
    const r = st.cur, pad = 6, sc = 8, solved = view() === 'antwoord';
    const lab = $('showList').checked ? labels() : [], lp = lab.length ? listPlan(lab, 3.7) : null, lay = st.ansLayout;
    const cell = Math.min(180 / r.W, 12), gh = cell * r.H;
    const h = pad + gh + (lp ? 7 + lp.h : 0) + (lay ? 6 + answerH(lay) : 0) + pad;
    const cv = document.createElement('canvas'); cv.width = (180 + pad * 2) * sc; cv.height = Math.ceil(h * sc);
    const ctx = cv.getContext('2d'), g = canvasOut(ctx, sc);
    g.rect(0, 0, 180 + pad * 2, h, { fill: PAPER });
    drawGrid(g, r, pad + (180 - cell * r.W) / 2, pad, cell, solved, !!lay);
    let y = pad + gh + 7;
    if (lp) { drawList(g, lab, pad, y - 1, lp); y += lp.h + 6; }
    if (lay) drawAnswer(g, lay, pad, y - 1, solved);
    return cv;
  }
  function note(html, cls) { $('outMsg').innerHTML = '<div class="fb ' + (cls || 'note') + '">' + html + '</div>'; }
  function copyImage() {
    if (!st.cur || !st.cur.ok) return;
    const cv = buildImage();
    const fallback = function () {
      note('<p>Kopiëren lukt niet in deze browser. Klik met de rechtermuisknop op de afbeelding hieronder en kies Afbeelding kopiëren.</p><img alt="Woordzoeker als afbeelding" src="' + cv.toDataURL('image/png') + '">');
    };
    try {
      const blob = new Promise(function (res, rej) { cv.toBlob(function (b) { b ? res(b) : rej(new Error('geen afbeelding')); }, 'image/png'); });
      navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]).then(function () {
        note(CHECK + '<span>Gekopieerd. Plak de afbeelding in Word of Google Documenten.</span>', 'good');
      }, fallback);
    } catch (e) { fallback(); }
  }

  /* ---------- pdf downloaden ----------
     jsPDF (js/vendor) en het lettertype worden pas bij de eerste download geladen.
     Volgorde: zonder klas het werkblad en het antwoordblad; met klas eerst alle
     werkbladen (leerlingen + 1), daarna de antwoorden volgens de gekozen optie. */
  const VENDOR = document.currentScript.src.replace(/[^/]*$/, '') + 'vendor/';
  function loadScript(src) {
    return new Promise(function (res, rej) {
      const el = document.createElement('script');
      el.src = src; el.onload = res; el.onerror = function () { rej(new Error(src)); };
      document.head.appendChild(el);
    });
  }
  let pdfLibs = null;
  function pdfReady() {
    if (!pdfLibs) {
      /* lukt het lettertype niet, dan gebruikt de pdf Helvetica */
      pdfLibs = loadScript(VENDOR + 'jspdf.umd.min.js').then(function () {
        return loadScript(VENDOR + 'atkinson-hyperlegible.js').catch(function () {});
      });
      pdfLibs.catch(function () { pdfLibs = null; });
    }
    return pdfLibs;
  }
  function newDoc() {
    const doc = new window.jspdf.jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait', compress: true });
    /* Elk lettertype een eigen naam in de pdf, zodat normaal en vet ook bij printers en kopiëren uit elkaar te houden zijn */
    let fonts = { normal: ['helvetica', 'normal'], bold: ['helvetica', 'bold'], atkinson: false };
    const ttf = window.ATKINSON_TTF;
    if (ttf) {
      try {
        doc.addFileToVFS('AtkinsonHyperlegible-Regular.ttf', ttf.normal);
        doc.addFont('AtkinsonHyperlegible-Regular.ttf', 'AtkinsonHyperlegible-Regular', 'normal');
        doc.addFileToVFS('AtkinsonHyperlegible-Bold.ttf', ttf.bold);
        doc.addFont('AtkinsonHyperlegible-Bold.ttf', 'AtkinsonHyperlegible-Bold', 'normal');
        fonts = { normal: ['AtkinsonHyperlegible-Regular', 'normal'], bold: ['AtkinsonHyperlegible-Bold', 'normal'], atkinson: true };
      } catch (e) { /* Helvetica */ }
    }
    doc.setProperties({ title: $('title').value.trim() || 'Woordzoeker', creator: 'cranenklas.github.io' });
    return { doc: doc, fonts: fonts };
  }
  /* Bestandsnaam: woordzoeker-<titel>, in kleine letters met streepjes (zonder "woordzoeker" dubbel) */
  function fileName() {
    const t = ($('title').value.trim()).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').replace(/^woordzoeker(-|$)/, '');
    return 'woordzoeker' + (t ? '-' + t : '') + '.pdf';
  }
  function tick() { return new Promise(function (res) { setTimeout(res, 0); }); }
  let busy = false;
  async function makePdf() {
    if (busy || !st.cur || !st.cur.ok) return;
    busy = true; setOut(false);
    const key = st.key, uni = uniqueOn(), total = sheets();
    const changed = function () { if (key !== st.key) throw new Error('changed'); };
    try {
      note('<p>Pdf maken…</p>');
      await pdfReady();
      changed();
      /* Unieke woordzoeker per leerling: elk nummer een eigen raster. Lukt een
         nummer niet, dan andere startwaarden proberen (tussendoor even ruimte
         voor de browser, zodat de pagina niet bevriest). */
      if (uni) {
        for (let nr = 1; nr <= total; nr++) {
          note('<p>Bezig: ' + nr + ' van ' + total + '</p>');
          await tick(); changed();
          let r = result(nr);
          for (let t = 3; !r.ok && t < 40; t++) {
            await tick(); changed();
            r = generate(st.cfg, st.seed + nr * 7919 + t * 104729, 600);
          }
          if (!r.ok) throw new Error('nr ' + nr);
          st.cache.set(nr, r);
        }
      }
      note('<p>Pdf maken…</p>');
      await tick(); changed();
      const P = newDoc(), doc = P.doc, g = pdfOut(doc, P.fonts);
      let n = 0;
      const page = function () { if (n++) doc.addPage('a4', 'portrait'); };
      const sheet = function (nr, v) { page(); drawSheet(g, result(uni ? nr : 1), sheetOpts(nr, v)); };
      if (!isKlas()) { sheet(1, 'werkblad'); sheet(1, 'antwoord'); }
      else {
        for (let nr = 1; nr <= total; nr++) sheet(nr, 'werkblad');
        if ($('withKey').checked) {
          if (compactOn()) { const per = perPage(); for (let f = 1; f <= total; f += per) { page(); drawCompact(g, f, per, total); } }
          else if (uni || $('whoAll').checked) { for (let nr = 1; nr <= total; nr++) sheet(nr, 'antwoord'); }
          else sheet(1, 'antwoord');
        }
      }
      doc.save(fileName());
      note(CHECK + '<span>Je pdf met ' + n + " pagina's is gedownload." + (P.fonts.atkinson ? '' : ' (Met lettertype Helvetica.)') + '</span>', 'good');
    } catch (e) {
      if (e && e.message === 'changed') note('<p>Je hebt iets veranderd tijdens het maken van de pdf. Klik nog een keer op Download pdf.</p>');
      else if (e && /^nr /.test(e.message)) note('<p>Het lukt niet om voor ' + e.message.replace('nr', 'nummer') + ' een woordzoeker te maken. Kies een groter raster of haal een woord weg.</p>', 'bad');
      else note('<p>De pdf maken lukte niet. Controleer je internetverbinding en probeer het opnieuw.</p>', 'bad');
    } finally {
      busy = false;
      render();
    }
  }

  /* ---------- onthouden in deze browser: schoolnaam, woordenlijst laten zien, afdrukken
     en de onderwerpen bij het bijvullen. Woorden, antwoord, raster en richtingen niet:
     de pagina opent altijd met het voorbeeld. ---------- */
  const STORE = 'cranenklas-woordzoeker';
  const KEEP = ['showList', 'klasJa', 'klasNee', 'unique', 'withKey', 'whoDocent', 'whoAll', 'layCompact', 'layFull'];
  function saveSettings() {
    const s = { school: $('school').value, students: $('students').value, topics: chosenTopics().map(function (t) { return t.onderwerp; }) };
    KEEP.forEach(function (id) { s[id] = $(id).checked; });
    try { localStorage.setItem(STORE, JSON.stringify(s)); } catch (e) {}
  }
  function loadSettings() {
    let s = null;
    try { s = JSON.parse(localStorage.getItem(STORE) || 'null'); } catch (e) {}
    if (!s || typeof s !== 'object') return;
    if (typeof s.school === 'string') $('school').value = s.school.slice(0, 60);
    if (s.students != null) $('students').value = clampInt(s.students, 1, 40, 25);
    /* bij keuzerondjes alleen het gekozen rondje aanzetten */
    KEEP.forEach(function (id) { if (typeof s[id] === 'boolean' && (s[id] || $(id).type === 'checkbox')) $(id).checked = s[id]; });
    if (Array.isArray(s.topics)) document.querySelectorAll('#topics input').forEach(function (c) { c.checked = s.topics.indexOf(WOORDENBANK[Number(c.dataset.i)].onderwerp) >= 0; });
  }

  /* ---------- gebeurtenissen ---------- */
  let timer = null, pending = false;
  function later() { pending = true; clearTimeout(timer); timer = setTimeout(compute, 280); }
  function fillExample() {
    $('words').value = EX.words; $('answer').value = EX.answer; $('title').value = EX.title;
    $('gw').value = EX.W; $('gh').value = EX.H; $('useAnswer').checked = true;
    $('egNote').hidden = false; $('fillNote').innerHTML = '';
    compute();
  }
  ['words', 'answer'].forEach(function (id) { $(id).addEventListener('input', function () { $('egNote').hidden = true; fillNote(''); later(); }); });
  ['gw', 'gh'].forEach(function (id) {
    $(id).addEventListener('input', later);
    /* alleen opnieuw rekenen als er echt iets veranderd is: anders verdwijnt een knop in de melding onder de muis */
    $(id).addEventListener('change', function () {
      this.value = clampInt(this.value, 5, 25, 15);
      if (pending || !st.cfg || Number($('gw').value) !== st.cfg.W || Number($('gh').value) !== st.cfg.H) compute();
    });
  });
  $('students').addEventListener('input', function () { render(); });
  $('students').addEventListener('change', function () { this.value = clampInt(this.value, 1, 40, 25); render(); });
  document.querySelectorAll('.stepper button').forEach(function (b) {
    b.addEventListener('click', function () {
      const inp = $(b.dataset.for);
      inp.value = clampInt((parseInt(inp.value, 10) || 0) + Number(b.dataset.step), Number(inp.min), Number(inp.max), Number(inp.min));
      if (inp.id === 'students') render(); else compute();
    });
  });
  ['dirH', 'dirV', 'dirD'].forEach(function (id) {
    $(id).addEventListener('change', function () {
      if (!$('dirH').checked && !$('dirV').checked && !$('dirD').checked) {
        this.checked = true;
        const h = $('dirHint'); h.classList.remove('warn'); void h.offsetWidth; h.classList.add('warn');
        return;
      }
      $('dirHint').classList.remove('warn');
      compute();
    });
  });
  ['backwards', 'useAnswer'].forEach(function (id) { $(id).addEventListener('change', compute); });
  $('task').addEventListener('input', function () { st.taskAuto = false; render(); });
  ['title', 'school'].forEach(function (id) { $(id).addEventListener('input', render); });
  ['showList', 'viewW', 'viewA', 'withKey', 'whoDocent', 'whoAll', 'layCompact', 'layFull'].forEach(function (id) { $(id).addEventListener('change', render); });
  ['klasNee', 'klasJa', 'unique'].forEach(function (id) { $(id).addEventListener('change', function () { st.variant = 1; compute(); }); });
  $('prevV').addEventListener('click', function () {
    st.variant = Math.max(1, compactView() ? firstOnPage() - perPage() : st.variant - 1); render();
  });
  $('nextV').addEventListener('click', function () {
    st.variant = Math.min(sheets(), compactView() ? firstOnPage() + perPage() : st.variant + 1); render();
  });
  $('shuffle').addEventListener('click', function () { st.seed = Math.floor(Math.random() * 1e9); compute(); });
  $('example').addEventListener('click', fillExample);
  function fillNote(html) { $('fillNote').innerHTML = html ? '<div class="fb note">' + html + '</div>' : ''; }
  /* onderwerpen kiezen: de woordenbank is ingedeeld in de thema's van de methode */
  $('topics').innerHTML = WOORDENBANK.map(function (t, i) {
    return '<label><input type="checkbox" id="topic' + i + '" data-i="' + i + '"><span>' + esc(t.onderwerp) + '</span><span class="stat">' + t.woorden.length + '</span></label>';
  }).join('');
  function chosenTopics() { return Array.prototype.slice.call(document.querySelectorAll('#topics input:checked')).map(function (c) { return WOORDENBANK[Number(c.dataset.i)]; }); }
  function chosenWords() { const seen = {}; chosenTopics().forEach(function (t) { t.woorden.forEach(function (w) { seen[w] = 1; }); }); return Object.keys(seen); }
  function topicStat() {
    const n = chosenTopics().length, w = chosenWords().length;
    $('topicStat').textContent = n ? n + (n === 1 ? ' onderwerp, ' : ' onderwerpen, ') + w + ' woorden' : 'Kies minimaal één onderwerp.';
    $('fillGo').disabled = !n;
  }
  function openFill(scroll) {
    $('fillPanel').hidden = false; $('fill').setAttribute('aria-expanded', 'true'); topicStat();
    if (scroll) { const c = document.querySelector('.controls'); c.scrollTop += $('fillPanel').getBoundingClientRect().top - c.getBoundingClientRect().top - 90; }
  }
  $('topics').addEventListener('change', topicStat);
  $('topicAll').addEventListener('click', function () { document.querySelectorAll('#topics input').forEach(function (c) { c.checked = true; }); topicStat(); });
  $('topicNone').addEventListener('click', function () { document.querySelectorAll('#topics input').forEach(function (c) { c.checked = false; }); topicStat(); });
  function fillWords() {
    compute();
    if (st.err && st.form.items.length) { fillNote('<p>Los eerst de melding bij het antwoord op.</p>'); return; }
    const res = pickFill(st.cfg, st.form.opts, chosenWords(), st.seed + (uniqueOn() ? 7919 : 0), Math.floor(Math.random() * 1e9));
    if (!res.ok) {
      fillNote(res.reason === 'none' ? '<p>Er zijn geen extra woorden nodig.</p>' : '<p>Met deze onderwerpen lukt het niet. Kies er een onderwerp bij, maak het raster kleiner of het antwoord langer.</p>');
      return;
    }
    const ta = $('words');
    ta.value = ta.value.replace(/\s+$/, '') + (ta.value.trim() ? '\n' : '') + res.add.join('\n');
    $('egNote').hidden = true;
    fillNote('<p><b>' + res.add.length + (res.add.length === 1 ? ' woord' : ' woorden') + ' toegevoegd:</b> ' + esc(res.add.join(', ').toUpperCase()) + '</p>');
    st.keepNote = true; compute(); st.keepNote = false;
  }
  $('fill').addEventListener('click', function () {
    if ($('fillPanel').hidden) openFill(false); else { $('fillPanel').hidden = true; this.setAttribute('aria-expanded', 'false'); }
  });
  $('fillGo').addEventListener('click', fillWords);
  $('helpBtn').addEventListener('click', function () {
    const open = this.getAttribute('aria-expanded') !== 'true';
    this.setAttribute('aria-expanded', String(open)); $('tipStudents').hidden = !open;
  });
  $('status').addEventListener('click', function (e) {
    if (e.target.id === 'useSug' && st.sug) { $('gw').value = st.sug.W; $('gh').value = st.sug.H; compute(); }
    if (e.target.id === 'useFill') openFill(true);
  });
  $('dl').addEventListener('click', makePdf);
  $('copy').addEventListener('click', copyImage);
  $('toggle').addEventListener('click', function () {
    const c = $('layout').classList.toggle('collapsed');
    this.setAttribute('aria-expanded', String(!c));
    this.setAttribute('aria-label', c ? 'Sidebar uitklappen' : 'Sidebar inklappen');
    $('sideList').hidden = c;
  });
  /* Links die voorlopig nog niets doen (Over mij, Contact) */
  document.querySelectorAll('[data-stub]').forEach(function (a) { a.addEventListener('click', function (e) { e.preventDefault(); }); });

  /* Op een smal scherm (laptop, tablet liggend) begint de sidebar ingeklapt, zodat het voorbeeld groot genoeg is */
  if (window.innerWidth > 760 && window.innerWidth < 1100) { $('toggle').click(); }
  loadSettings();
  /* elke wijziging in de instellingen meteen bewaren (ook de knoppen − en +, Alles en Niets) */
  ['change', 'input', 'click'].forEach(function (ev) { document.querySelector('.controls').addEventListener(ev, saveSettings); });
  fillExample();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(render);
})();
