// ===========================================================
// Cranenklas aardrijkskunde — tool "Kruiswoordpuzzel": pagina
// Tabel met woorden en omschrijvingen (met suggesties uit de databank,
// js/kruiswoordbank.js), oplossingswoord, werkblad, afdrukken, het
// venster Voorbeelden kiezen, online invullen en de versleepbare lijn.
// De puzzel zelf maakt js/kruiswoordpuzzel-generator.js (window.XW).
// Het A4-blad wordt getekend via één tekenobject met text, line en rect,
// net als bij de woordzoeker; er zijn drie uitvoerders: svg (voorbeeld op
// het scherm), canvas (kopiëren als afbeelding) en jsPDF (pdf, in
// vectoren). Coördinaten zijn millimeters op A4 staand (210 × 297).
// ===========================================================
(function () {
  'use strict';
  var XW = window.XW, norm = XW.norm, parseSolution = XW.parseSolution, generate = XW.generate;
  var MAXW = 20;
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  /* Databank (js/kruiswoordbank.js): onderwerpen met paren [woord, omschrijving] */
  var BANK = typeof KRUISWOORDBANK !== 'undefined' ? KRUISWOORDBANK : [];
  /* Voor het aanvullen tijdens het typen: het woord zoals in het raster (FÖHN wordt FOHN) */
  var ALL = [];
  BANK.forEach(function (t) { t.items.forEach(function (it) { ALL.push({ w: norm(it[0]), c: it[1], topic: t.name }); }); });

  /* Het voorbeeld waarmee de tool opent: alle woorden van het eerste onderwerp van de databank (Water) */
  var EX = {
    titel: 'Kruiswoordpuzzel waterkringloop', oplossing: 'KRINGLOOP',
    woorden: BANK.length ? BANK[0].items : []
  };

  /* Toestand. Alle invoer van de puzzel staat in één object (invoer), zodat
     JSON.stringify(invoer) genoeg is om de puzzel later te bewaren of aan het
     werkboek toe te voegen. Een woord: { id, woord, omschrijving, databank }. */
  var invoer = { titel: '', school: '', oplossing: '', seed: 1, woorden: [] };
  var nextId = 1, mode = 'werkblad', puzzle = null, example = true, timer = null, version = 0;
  var opts = { wordlist: false };
  var klas = { on: false, n: 25, unique: false, answers: 'docent', compact: true };
  var cache = new Map();
  var rowsBox = $('#rows'), stage = $('#stage'), main = $('#main'), splitter = $('#splitter');

  function byId(id) { for (var i = 0; i < invoer.woorden.length; i++) if (String(invoer.woorden[i].id) === String(id)) return invoer.woorden[i]; return null; }
  function blankRow() { return { id: nextId++, woord: '', omschrijving: '', databank: false }; }
  function edited() { example = false; $('#exHint').hidden = true; wordNote(''); }
  function schedule() { clearTimeout(timer); timer = setTimeout(rebuild, 260); }
  function attempts() { return invoer.woorden.filter(function (r) { return norm(r.woord); }).length > 14 ? 150 : 220; }

  /* Meldingen bij de woorden (toevoegen, plakken, maximum) */
  function wordNote(m) { $('#wordNote').innerHTML = m ? '<div class="fb note"><p>' + esc(m) + '</p></div>' : ''; }

  /* ---------- Tabel met woord en omschrijving ---------- */
  function rowEl(row, i) {
    var el = document.createElement('div');
    el.className = 'kw-row' + (row.databank ? ' has-auto' : '');
    el.dataset.id = row.id;
    el.innerHTML =
      '<div class="kw-num">' + (i + 1) + '</div>' +
      '<div class="kw-wc"><div class="kw-ghost" aria-hidden="true"><span class="gt"></span><span class="gr"></span></div>' +
      '<input class="kw-win" type="text" role="combobox" aria-autocomplete="list" aria-expanded="false" autocomplete="off" autocapitalize="characters" spellcheck="false" aria-label="Woord ' + (i + 1) + '" placeholder="Woord">' +
      '</div>' +
      '<div class="kw-cc"><input class="kw-cin" type="text" autocomplete="off" aria-label="Omschrijving ' + (i + 1) + '" placeholder="Omschrijving"><span class="kw-auto" hidden>databank</span></div>' +
      '<button class="kw-x" type="button" aria-label="Rij ' + (i + 1) + ' verwijderen">×</button>' +
      '<ul class="kw-ac" role="listbox" hidden></ul>';
    $('.kw-win', el).value = row.woord;
    $('.kw-cin', el).value = row.omschrijving;
    $('.kw-auto', el).hidden = !row.databank;
    return el;
  }
  function renderTable() {
    rowsBox.innerHTML = '';
    invoer.woorden.forEach(function (r, i) { rowsBox.appendChild(rowEl(r, i)); });
    updateCounts();
  }
  function setAuto(el, row) { el.classList.toggle('has-auto', !!row.databank); $('.kw-auto', el).hidden = !row.databank; }

  var ac = { id: null, items: [], idx: 0 };
  function suggest(p) {
    if (p.length < 2) return [];
    var seen = {}, out = [];
    ALL.forEach(function (x) { if (x.w.indexOf(p) === 0 && !seen[x.w]) { seen[x.w] = 1; out.push(x); } });
    return out.sort(function (a, b) { return a.w.length - b.w.length || (a.w < b.w ? -1 : 1); }).slice(0, 5);
  }
  function updateGhost(el, reset) {
    var inp = $('.kw-win', el), list = $('.kw-ac', el);
    var typed = inp.value, p = norm(typed);
    var ok = document.activeElement === inp && typed.toUpperCase() === p && p.length >= 2;
    var items = ok ? suggest(p) : [];
    if (reset || ac.id !== el.dataset.id) ac.idx = 0;
    ac.id = el.dataset.id; ac.items = items;
    if (ac.idx >= items.length) ac.idx = 0;
    $('.gt', el).textContent = typed.toUpperCase();
    var cur = items[ac.idx];
    $('.gr', el).textContent = cur ? cur.w.slice(p.length) : '';
    list.innerHTML = items.map(function (it, i) {
      return '<li role="option" data-i="' + i + '" aria-selected="' + (i === ac.idx) + '" class="' + (i === ac.idx ? 'on' : '') + '"><span class="w"><b>' + esc(p) + '</b>' + esc(it.w.slice(p.length)) + '</span><span class="c">' + esc(it.c) + '</span></li>';
    }).join('');
    list.hidden = !items.length;
    inp.setAttribute('aria-expanded', String(!!items.length));
  }
  function closeAC(el) {
    $('.kw-ac', el).hidden = true; $('.gr', el).textContent = ''; $('.kw-win', el).setAttribute('aria-expanded', 'false'); ac.items = [];
  }
  function acceptItem(el, it) {
    var row = byId(el.dataset.id), cin = $('.kw-cin', el);
    row.woord = it.w; $('.kw-win', el).value = it.w;
    if (!row.omschrijving.trim() || row.databank) { row.omschrijving = it.c; row.databank = true; cin.value = it.c; }
    setAuto(el, row); closeAC(el); edited(); schedule();
    cin.focus();
  }

  rowsBox.addEventListener('input', function (e) {
    var el = e.target.closest('.kw-row'); if (!el) return;
    var row = byId(el.dataset.id);
    if (e.target.classList.contains('kw-win')) { row.woord = e.target.value; updateGhost(el, true); }
    else if (e.target.classList.contains('kw-cin')) { row.omschrijving = e.target.value; row.databank = false; setAuto(el, row); }
    else return;
    edited(); schedule(); updateCounts();
  });
  rowsBox.addEventListener('focusin', function (e) { if (e.target.classList.contains('kw-win')) updateGhost(e.target.closest('.kw-row'), true); });
  rowsBox.addEventListener('focusout', function (e) {
    if (!e.target.classList.contains('kw-win')) return;
    var el = e.target.closest('.kw-row');
    setTimeout(function () { if (document.activeElement !== $('.kw-win', el)) closeAC(el); }, 120);
  });
  rowsBox.addEventListener('mousedown', function (e) {
    var li = e.target.closest('.kw-ac li'); if (!li) return;
    e.preventDefault();
    var el = li.closest('.kw-row'); acceptItem(el, ac.items[+li.dataset.i]);
  });
  rowsBox.addEventListener('keydown', function (e) {
    var t = e.target; if (!t.classList.contains('kw-win')) return;
    var el = t.closest('.kw-row'), open = !$('.kw-ac', el).hidden && ac.items.length > 0;
    if (e.key === 'ArrowDown' && open) { e.preventDefault(); ac.idx = (ac.idx + 1) % ac.items.length; updateGhost(el, false); }
    else if (e.key === 'ArrowUp' && open) { e.preventDefault(); ac.idx = (ac.idx - 1 + ac.items.length) % ac.items.length; updateGhost(el, false); }
    else if (open && ((e.key === 'Tab' && !e.shiftKey) || e.key === 'Enter')) { e.preventDefault(); acceptItem(el, ac.items[ac.idx]); }
    else if (open && e.key === 'ArrowRight' && t.selectionStart === t.value.length) { e.preventDefault(); acceptItem(el, ac.items[ac.idx]); }
    else if (open && e.key === 'Escape') { e.preventDefault(); closeAC(el); }
    else if (e.key === 'Enter') { e.preventDefault(); $('.kw-cin', el).focus(); }
  });
  rowsBox.addEventListener('click', function (e) {
    var b = e.target.closest('.kw-x'); if (!b) return;
    var el = b.closest('.kw-row');
    invoer.woorden = invoer.woorden.filter(function (r) { return String(r.id) !== el.dataset.id; });
    if (!invoer.woorden.length) invoer.woorden.push(blankRow());
    renderTable(); edited(); schedule();
  });

  /* Voegt woorden toe in lege rijen of nieuwe rijen. Geeft het aantal terug; full = het maximum is bereikt. */
  function addWords(list) {
    var added = 0, full = false, have = {}, rows = invoer.woorden;
    rows.forEach(function (r) { var n = norm(r.woord); if (n) have[n] = 1; });
    list.forEach(function (it) {
      var n = norm(it.w); if (!n || have[n]) return;
      var blank = null;
      for (var i = 0; i < rows.length; i++) if (!norm(rows[i].woord) && !rows[i].omschrijving.trim()) { blank = rows[i]; break; }
      if (blank) { blank.woord = it.w; blank.omschrijving = it.c || ''; blank.databank = !!it.auto; }
      else if (rows.length < MAXW) rows.push({ id: nextId++, woord: it.w, omschrijving: it.c || '', databank: !!it.auto });
      else { full = true; return; }
      have[n] = 1; added++;
    });
    edited(); renderTable(); schedule();
    return { n: added, full: full };
  }
  function addedNote(res) {
    wordNote(res.n + (res.n === 1 ? ' woord toegevoegd.' : ' woorden toegevoegd.') + (res.full ? ' Maximaal ' + MAXW + ' woorden. De rest is niet toegevoegd.' : ''));
  }

  $('#addRow').onclick = function () {
    if (invoer.woorden.length >= MAXW) { wordNote('Maximaal ' + MAXW + ' woorden.'); return; }
    var r = blankRow(); invoer.woorden.push(r); renderTable();
    /* de nieuwe rij staat onderaan de tabel, onder de knoppen: cursor erin en de hele rij in beeld */
    var el = $('[data-id="' + r.id + '"]', rowsBox);
    $('.kw-win', el).focus({ preventScroll: true });
    el.scrollIntoView({ block: 'nearest' });
  };
  $('#clearBtn').onclick = function () { invoer.woorden = [blankRow(), blankRow(), blankRow()]; edited(); renderTable(); schedule(); };
  $('#exBtn').onclick = function () { loadExample(); };
  function showPaste(open) { $('#pasteBox').hidden = !open; $('#pasteBtn').setAttribute('aria-expanded', String(open)); }
  $('#pasteBtn').onclick = function () { var open = $('#pasteBox').hidden; showPaste(open); if (open) $('#pasteText').focus(); };
  $('#pasteCancel').onclick = function () { showPaste(false); };
  $('#pasteGo').onclick = function () {
    var out = [];
    $('#pasteText').value.split(/\r?\n/).forEach(function (line) {
      if (!line.trim()) return;
      var w = line, c = '';
      if (line.indexOf('\t') >= 0) { var p = line.split('\t'); w = p[0]; c = p.slice(1).join(' ').trim(); }
      else if (line.indexOf('=') >= 0) { var q = line.indexOf('='); w = line.slice(0, q); c = line.slice(q + 1).trim(); }
      if (norm(w)) out.push({ w: w.trim(), c: c });
    });
    var res = addWords(out);
    $('#pasteText').value = ''; showPaste(false);
    addedNote(res);
  };

  /* ---------- Overige invoer ---------- */
  $('#sol').addEventListener('input', function (e) { invoer.oplossing = e.target.value; edited(); schedule(); updateCounts(); });
  $('#title').addEventListener('input', function (e) { invoer.titel = e.target.value; renderPreview(); });
  $('#school').addEventListener('input', function (e) { invoer.school = e.target.value; renderPreview(); });
  $('#wl').addEventListener('change', function (e) { opts.wordlist = e.target.checked; renderPreview(); });

  function updateCounts() {
    var n = invoer.woorden.filter(function (r) { return norm(r.woord); }).length;
    $('#count').textContent = n + ' van maximaal ' + MAXW + ' woorden';
    $('#addRow').disabled = invoer.woorden.length >= MAXW;
    var g = parseSolution(invoer.oplossing), flat = [].concat.apply([], g);
    $('#solCount').textContent = flat.length
      ? flat.length + (flat.length === 1 ? ' letter' : ' letters') + (g.length > 1 ? ' in ' + g.length + ' woorden' : '') + '. IJ telt als één vakje.'
      : 'Zonder oplossingswoord krijgt de puzzel geen grijze vakjes.';
  }

  /* ---------- Klas ---------- */
  function uniqueOn() { return klas.on && klas.unique; }
  function klasSummary() {
    if (!klas.on) return '2 pagina’s: het werkblad en het antwoordblad op de achterkant.';
    var ws = klas.n + 1, ans;
    if (klas.answers === 'leerling') ans = ws;
    else if (klas.unique) ans = klas.compact ? Math.ceil(ws / 4) : ws;
    else ans = 1;
    return (ws + ans) + ' pagina’s: ' + ws + ' werkbladen en ' + ans + (ans === 1 ? ' antwoordblad' : ' antwoordbladen') + '.';
  }
  function updateKlas() {
    $('#klasNee').checked = !klas.on; $('#klasJa').checked = klas.on;
    $('#klasBox').hidden = !klas.on;
    $('#kcomp').hidden = !(klas.on && klas.unique && klas.answers === 'docent');
    $('#pages').textContent = klasSummary();
  }
  function clampInt(v, lo, hi, dflt) { var n = parseInt(v, 10); return isNaN(n) ? dflt : Math.max(lo, Math.min(hi, n)); }
  function klasChanged() { version++; updateKlas(); renderPreview(); saveSettings(); }
  $('#klasNee').addEventListener('change', function () { klas.on = false; klasChanged(); });
  $('#klasJa').addEventListener('change', function () { klas.on = true; klasChanged(); });
  $('#kn').addEventListener('input', function (e) { klas.n = clampInt(e.target.value, 1, 40, 1); klasChanged(); });
  $('#kn').addEventListener('change', function (e) { e.target.value = klas.n; });
  $$('.stepper button').forEach(function (b) {
    b.addEventListener('click', function () {
      var inp = $('#' + b.dataset.for);
      klas.n = clampInt((parseInt(inp.value, 10) || 0) + Number(b.dataset.step), 1, 40, 1);
      inp.value = klas.n; klasChanged();
    });
  });
  $('#kuniq').addEventListener('change', function (e) { klas.unique = e.target.checked; klasChanged(); });
  $$('input[name="ka"]').forEach(function (r) { r.addEventListener('change', function () { klas.answers = r.value; klasChanged(); }); });
  $$('input[name="kc"]').forEach(function (r) { r.addEventListener('change', function () { klas.compact = r.value === 'compact'; klasChanged(); }); });
  $('#qBtn').onclick = function () { var t = $('#qText'); t.hidden = !t.hidden; this.setAttribute('aria-expanded', String(!t.hidden)); };

  /* ---------- Voorbeelden kiezen ---------- */
  var bankTopic = 0, bankSel = {}, lastFocus = null;
  function haveSet() { var h = {}; invoer.woorden.forEach(function (r) { var n = norm(r.woord); if (n) h[n] = 1; }); return h; }
  function renderBank() {
    var t = BANK[bankTopic], have = haveSet();
    $('#topics').innerHTML = BANK.map(function (b, i) { return '<button type="button" data-t="' + i + '"' + (i === bankTopic ? ' aria-current="true"' : '') + '>' + esc(b.name) + '</button>'; }).join('');
    $('#items').innerHTML = !t ? '' : t.items.map(function (it, i) {
      var h = have[norm(it[0])], k = bankTopic + '-' + i;
      if (bankSel[k] === undefined) bankSel[k] = !h;
      return '<label class="kw-item' + (h ? ' have' : '') + '"><input type="checkbox" data-k="' + k + '"' + (bankSel[k] && !h ? ' checked' : '') + (h ? ' disabled' : '') + '><span><b>' + esc(it[0]) + '</b>' + (h ? ' <span class="c">(staat al in de tabel)</span>' : '') + '<br><span class="c">' + esc(it[1]) + '</span></span></label>';
    }).join('');
    updateDlg();
  }
  function selectedCount() { return $$('#items input:checked').length; }
  function updateDlg() { var n = selectedCount(), t = BANK[bankTopic]; $('#dlgInfo').textContent = n + ' van ' + (t ? t.items.length : 0) + ' aangevinkt'; $('#dlgAdd').disabled = !n; }
  function openBank() { lastFocus = document.activeElement; bankTopic = 0; bankSel = {}; renderBank(); $('#overlay').hidden = false; $('#dlgClose').focus(); }
  function closeBank() { $('#overlay').hidden = true; if (lastFocus) lastFocus.focus(); }
  $('#bankBtn').onclick = openBank;
  $('#dlgClose').onclick = closeBank;
  $('#overlay').addEventListener('mousedown', function (e) { if (e.target === $('#overlay')) closeBank(); });
  $('#topics').addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b) return; bankTopic = +b.dataset.t; renderBank(); });
  $('#items').addEventListener('change', function (e) { if (e.target.dataset.k) { bankSel[e.target.dataset.k] = e.target.checked; updateDlg(); } });
  $('#dlgAll').onclick = function () { $$('#items input:not(:disabled)').forEach(function (i) { i.checked = true; bankSel[i.dataset.k] = true; }); updateDlg(); };
  $('#dlgAdd').onclick = function () {
    var list = [];
    $$('#items input:checked').forEach(function (i) { var idx = +i.dataset.k.split('-')[1], it = BANK[bankTopic].items[idx]; list.push({ w: it[0], c: it[1], auto: true }); });
    var res = addWords(list); closeBank();
    addedNote(res);
  };
  document.addEventListener('keydown', function (e) {
    var ov = $('#overlay'); if (ov.hidden) return;
    if (e.key === 'Escape') { e.preventDefault(); closeBank(); return; }
    if (e.key === 'Tab') {
      var f = $$('button:not(:disabled), input:not(:disabled)', ov).filter(function (x) { return x.offsetParent !== null; });
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  /* ---------- Puzzel opbouwen ---------- */
  var gen = { items: [], groups: [] };
  function rebuild() {
    clearTimeout(timer);
    gen.items = invoer.woorden.map(function (r) { return { id: r.id, w: norm(r.woord), clue: (r.omschrijving || '').trim() }; }).filter(function (x) { return x.w; });
    gen.groups = parseSolution(invoer.oplossing);
    puzzle = generate(gen.items, gen.groups, invoer.seed, gen.items.length > 14 ? 150 : 220);
    puzzle.placed.forEach(function (w, i) { w.i = i; });
    puzzle.seed = invoer.seed;
    cache.clear(); version++;
    playReset(); renderStatus(); renderPreview(); updateCounts();
  }
  function hasPuzzle(P) { P = P || puzzle; return !!(P && !P.empty && P.placed.length); }

  /* Eigen indeling per leerling: elk nummer een eigen seed (nummer 1 is de puzzel van het voorbeeld).
     Werkblad en antwoordblad met hetzelfde nummer gebruiken dezelfde puzzel. Lukt een nummer minder
     goed dan nummer 1 (een woord past niet, of de oplossing niet), dan nog een paar seeds proberen. */
  function puzzleFor(nr) {
    if (!uniqueOn() || nr <= 1) return puzzle;
    if (cache.has(nr)) return cache.get(nr);
    var best = null;
    for (var t = 0; t < 8; t++) {
      var s = invoer.seed + (nr - 1) * 1009 + t * 100003;
      var P = generate(gen.items, gen.groups, s, attempts());
      P.placed.forEach(function (w, i) { w.i = i; });
      P.seed = s;
      var score = P.placed.length * 10 + (P.marks ? 5 : 0);
      if (!best || score > best.score) best = { P: P, score: score };
      if (P.placed.length >= puzzle.placed.length && (P.marks || !puzzle.marks)) break;
    }
    cache.set(nr, best.P);
    return best.P;
  }

  var ICON_OK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12.5 L10 18 L20 6"/></svg>';
  function renderStatus() {
    var el = $('#status'), P = puzzle, ok = true, msg;
    if (!P || P.empty) { ok = false; msg = 'Vul minstens twee woorden in. De puzzel verschijnt vanzelf.'; if (P && P.skipped && P.skipped.length) msg += ' Een woord heeft minstens twee letters nodig.'; }
    else {
      var parts = [], n = P.placed.length;
      parts.push(n + (n === 1 ? ' woord' : ' woorden') + ' geplaatst.');
      if (P.unplaced.length) { ok = false; parts.push(P.unplaced.map(function (w) { return w.w; }).join(', ') + ' past niet in de puzzel. Klik op Husselen of pas het woord aan.'); }
      if (P.flat.length) {
        var mi = P.markInfo;
        if (P.marks) parts.push('De ' + P.flat.length + ' letters van je oplossing zijn grijs gemarkeerd.' + (mi.penalty ? ' Een paar woorden hebben daardoor meer dan één grijs vakje.' : ''));
        else if (mi && mi.missing) { ok = false; parts.push('De letter ' + mi.missing + ' uit je oplossing komt in geen enkel woord voor. Pas de oplossing of een woord aan.'); }
        else { ok = false; parts.push('De oplossing past niet in deze puzzel.'); }
      }
      if (P.skipped.length) { ok = false; parts.push('Overgeslagen (te kort of dubbel): ' + P.skipped.map(function (s) { return s.w; }).join(', ') + '.'); }
      var miss = P.placed.filter(function (w) { return !w.clue; }).map(function (w) { return w.w; });
      if (miss.length) { ok = false; parts.push('Omschrijving ontbreekt bij: ' + miss.join(', ') + '.'); }
      msg = parts.join(' ');
    }
    el.innerHTML = ok ? '<div class="fb good">' + ICON_OK + '<span>' + esc(msg) + '</span></div>' : '<div class="fb bad"><p>' + esc(msg) + '</p></div>';
    setOut();
  }

  /* ---------- Tekenen: drie uitvoerders (svg voor het voorbeeld, canvas voor de afbeelding,
     jsPDF voor de pdf). paper() tekent het witte vel met een grijze rand; in de pdf is het
     papier zelf het vel. Een rechthoek met r krijgt ronde hoeken. ---------- */
  var INK = '#141414', GREY = '#6B6B6B', FAINT = '#C8C8C8', PAPER = '#FFFFFF', RED = '#D4281C', MARK = '#D9D9D9', MISS = '#8E3A18';
  var FONT = '"Atkinson Hyperlegible", system-ui, sans-serif';
  function nn(v) { return Math.round(v * 100) / 100; }
  function svgOut() {
    var out = [];
    return {
      out: out,
      paper: function () { this.rect(0, 0, 210, 297, { fill: PAPER, stroke: FAINT, sw: 0.3 }); },
      text: function (x, y, s, o) {
        o = o || {};
        out.push('<text x="' + nn(x) + '" y="' + nn(y) + '" font-size="' + nn(o.size || 3.4) + '"' + (o.weight ? ' font-weight="' + o.weight + '"' : '') +
          (o.anchor ? ' text-anchor="' + o.anchor + '"' : '') + ' fill="' + (o.fill || INK) + '">' + esc(s) + '</text>');
      },
      line: function (x1, y1, x2, y2, o) {
        o = o || {};
        out.push('<line x1="' + nn(x1) + '" y1="' + nn(y1) + '" x2="' + nn(x2) + '" y2="' + nn(y2) + '" stroke="' + (o.stroke || INK) + '" stroke-width="' + nn(o.w || 0.3) + '"/>');
      },
      rect: function (x, y, w, h, o) {
        o = o || {};
        out.push('<rect x="' + nn(x) + '" y="' + nn(y) + '" width="' + nn(w) + '" height="' + nn(h) + '"' + (o.r ? ' rx="' + nn(o.r) + '"' : '') +
          ' fill="' + (o.fill || 'none') + '" stroke="' + (o.stroke || 'none') + '" stroke-width="' + nn(o.sw || 0) + '"/>');
      }
    };
  }
  function canvasOut(ctx, sc) {
    return {
      paper: function () { this.rect(0, 0, 210, 297, { fill: PAPER }); },
      text: function (x, y, s, o) {
        o = o || {};
        ctx.font = (o.weight || 400) + ' ' + ((o.size || 3.4) * sc) + 'px ' + FONT;
        ctx.textAlign = o.anchor === 'middle' ? 'center' : o.anchor === 'end' ? 'right' : 'left';
        ctx.fillStyle = o.fill || INK; ctx.fillText(String(s), x * sc, y * sc);
      },
      line: function (x1, y1, x2, y2, o) {
        o = o || {};
        ctx.beginPath(); ctx.lineWidth = (o.w || 0.3) * sc; ctx.lineCap = 'butt'; ctx.strokeStyle = o.stroke || INK;
        ctx.moveTo(x1 * sc, y1 * sc); ctx.lineTo(x2 * sc, y2 * sc); ctx.stroke();
      },
      rect: function (x, y, w, h, o) {
        o = o || {};
        ctx.beginPath();
        if (o.r && ctx.roundRect) ctx.roundRect(x * sc, y * sc, w * sc, h * sc, o.r * sc); else ctx.rect(x * sc, y * sc, w * sc, h * sc);
        if (o.fill && o.fill !== 'none') { ctx.fillStyle = o.fill; ctx.fill(); }
        if (o.stroke && o.stroke !== 'none') { ctx.lineWidth = (o.sw || 0.3) * sc; ctx.strokeStyle = o.stroke; ctx.stroke(); }
      }
    };
  }
  /* jsPDF: millimeters op A4, lettergrootte in punten (1 mm = 72 / 25,4 pt) */
  var PT = 72 / 25.4;
  function pdfOut(doc, fonts) {
    return {
      paper: function () {},
      text: function (x, y, s, o) {
        o = o || {};
        var f = o.weight >= 700 ? fonts.bold : fonts.normal;
        doc.setFont(f[0], f[1]);
        doc.setFontSize((o.size || 3.4) * PT);
        doc.setTextColor(o.fill || INK);
        doc.text(String(s), x, y, { align: o.anchor === 'middle' ? 'center' : o.anchor === 'end' ? 'right' : 'left', baseline: 'alphabetic' });
      },
      line: function (x1, y1, x2, y2, o) {
        o = o || {};
        doc.setLineWidth(o.w || 0.3); doc.setDrawColor(o.stroke || INK); doc.setLineCap('butt');
        doc.line(x1, y1, x2, y2);
      },
      rect: function (x, y, w, h, o) {
        o = o || {};
        var fill = o.fill && o.fill !== 'none', stroke = o.stroke && o.stroke !== 'none';
        if (fill) doc.setFillColor(o.fill);
        if (stroke) { doc.setLineWidth(o.sw || 0.3); doc.setDrawColor(o.stroke); doc.setLineCap('butt'); }
        var style = fill && stroke ? 'FD' : fill ? 'F' : 'S';
        if (fill || stroke) { if (o.r) doc.roundedRect(x, y, w, h, o.r, o.r, style); else doc.rect(x, y, w, h, style); }
      }
    };
  }

  /* Breedte van tekst in Atkinson Hyperlegible (normaal en vet), in honderdsten van de lettergrootte,
     voor de tekens 32 t/m 126. Zo breken voorbeeld, afbeelding en pdf de tekst op dezelfde plek af. */
  var WN = [28,28,30,66,59,93,70,16,30,30,43,60,20,37,20,38,65,40,55,57,61,58,60,51,62,60,20,20,55,60,55,52,78,63,62,66,67,57,55,71,69,41,51,63,54,82,69,73,60,75,62,60,56,69,59,84,62,60,61,32,38,32,55,40,27,53,57,50,56,54,31,56,55,28,25,49,24,84,55,55,57,58,34,47,32,54,44,65,46,43,46,32,23,32,56];
  var WB = [32,28,41,78,62,98,70,22,37,37,43,62,24,37,24,44,65,45,59,60,63,61,63,54,62,56,24,24,57,62,57,61,75,69,64,67,69,58,54,72,68,46,56,66,54,84,70,76,63,78,65,62,62,66,66,88,70,69,62,33,44,33,59,43,31,55,60,52,60,57,37,60,57,32,26,57,31,89,57,57,60,60,37,53,38,57,53,72,53,52,52,37,23,37,53];
  function textW(s, size, bold) {
    var t = bold ? WB : WN, w = 0;
    s = String(s).normalize('NFD');
    for (var i = 0; i < s.length; i++) {
      var c = s.charCodeAt(i);
      if (c >= 0x300 && c <= 0x36F) continue;
      w += c >= 32 && c < 127 ? t[c - 32] : (c === 0xB7 || c === 0x2019) ? 30 : 62;
    }
    return w * size / 100;
  }
  /* Tekst in regels van maximaal maxW mm; firstW is de ruimte op de eerste regel (na een label) */
  function wrapText(str, maxW, size, bold, firstW) {
    var words = String(str).trim().split(/\s+/).filter(Boolean), lines = [], cur = '';
    function room() { return lines.length ? maxW : (firstW == null ? maxW : firstW); }
    words.forEach(function (w) {
      var next = cur ? cur + ' ' + w : w;
      if (!cur || textW(next, size, bold) <= room()) { cur = next; }
      else { lines.push(cur); cur = w; }
      /* een woord dat op zichzelf te lang is: afbreken */
      while (textW(cur, size, bold) > room() && cur.length > 1) {
        var k = cur.length - 1;
        while (k > 1 && textW(cur.slice(0, k), size, bold) > room()) k--;
        lines.push(cur.slice(0, k)); cur = cur.slice(k);
      }
    });
    if (cur || !lines.length) lines.push(cur);
    return lines;
  }

  /* ---------- A4-blad: dezelfde opbouw als het voorbeeld (marge 15 mm, 4,2 mm tussen de blokken) ---------- */
  var X = 15, CW = 180, TOP = 13.2, GAP = 4.2, BOTTOM = 284, TAG = 'ANTWOORDBLAD';
  function foot(g) { g.text(105, 289.5, 'Gemaakt met cranenklas.github.io', { size: 2.8, fill: GREY, anchor: 'middle' }); }
  /* Kop: titel links (met ANTWOORDBLAD erachter), school en nummer rechts. Geeft de onderkant van de kop terug. */
  function drawHead(g, title, right, isAnswer) {
    g.paper();
    title = title || 'Kruiswoordpuzzel';
    var rLines = right ? wrapText(right, Math.min(80, textW(right, 3.4) + 0.1), 3.4).slice(0, 2) : [];
    var rW = rLines.reduce(function (a, l) { return Math.max(a, textW(l, 3.4)); }, 0);
    var tagW = isAnswer ? textW(TAG, 3.2, true) + 5.2 : 0;
    var avail = CW - (rW ? rW + GAP : 0) - (tagW ? tagW + 2.6 : 0);
    var size = Math.min(6.9, Math.max(4.5, avail / Math.max(1, textW(title, 1, true))));
    var tLines = textW(title, size, true) <= avail ? [title] : wrapText(title, avail, size, true).slice(0, 2);
    var lh = size * 1.15, y = TOP + size * 0.95;
    tLines.forEach(function (l, i) { g.text(X, y + i * lh, l, { size: size, weight: 700 }); });
    if (tagW) {
      var ly = y + (tLines.length - 1) * lh, tx = X + textW(tLines[tLines.length - 1], size, true) + 2.6, ph = 4.6, py = ly - size * 0.34 - ph / 2;
      g.rect(tx, py, tagW, ph, { stroke: RED, sw: 0.4, r: ph / 2 });
      g.text(tx + tagW / 2, py + ph / 2 + 3.2 * 0.36, TAG, { size: 3.2, weight: 700, fill: RED, anchor: 'middle' });
    }
    rLines.forEach(function (l, i) { g.text(195, y + i * 4.4, l, { size: 3.4, fill: GREY, anchor: 'end' }); });
    return Math.max(TOP + tLines.length * lh, rLines.length ? y + (rLines.length - 1) * 4.4 + 1.2 : 0);
  }
  /* Raster: witte vakjes met zwarte rand, grijs voor de oplossing, startnummer linksboven,
     nummer van de oplossingsletter rechtsonder; op het antwoordblad de letters in rood */
  function drawGrid(g, P, gx, gy, cell, answer) {
    var markAt = P.markAt || new Map(), ns = Math.max(1.6, cell * 0.3), ss = Math.max(1.4, cell * 0.26);
    for (var r = 0; r < P.rows; r++) for (var c = 0; c < P.cols; c++) {
      var x = P.cells[r][c]; if (!x) continue;
      var m = markAt.get(r * 1000 + c), cx = gx + c * cell, cy = gy + r * cell;
      g.rect(cx, cy, cell, cell, { fill: m !== undefined ? MARK : PAPER, stroke: INK, sw: 0.26 });
      if (x.num) g.text(cx + 0.5, cy + 0.3 + ns * 0.78, x.num, { size: ns, weight: 700 });
      if (m !== undefined) g.text(cx + cell - 0.5, cy + cell - 0.45, m + 1, { size: ss, weight: 700, anchor: 'end' });
      if (answer) {
        /* De letter blijft tussen het startnummer (boven) en het nummer van de oplossingsletter (onder).
           In een groot vakje is daar ruimte genoeg; in een klein vakje (compact antwoordblad) schuift of krimpt de letter. */
        var ls = cell * (x.t.length > 1 ? 0.42 : 0.56), base = cy + cell / 2 + ls * 0.36 + 0.26;
        var top = cy + (x.num ? 0.3 + ns * 0.78 + 0.15 : 0.3), bot = cy + cell - (m !== undefined ? 0.45 + ss * 0.72 + 0.15 : 0.4);
        ls = Math.min(ls, (bot - top) / 0.72);
        base = Math.min(Math.max(base, top + ls * 0.72), bot);
        g.text(cx + cell / 2, base, x.t, { size: ls, weight: 700, anchor: 'middle', fill: RED });
      }
    }
  }
  /* Omschrijvingen in twee kolommen: Horizontaal en Verticaal */
  var COLW = (CW - 7.4) / 2, NUMW = 5.3;
  function cluePlan(P, size) {
    var lh = size * 1.3;
    var cols = [['Horizontaal', P.across], ['Verticaal', P.down]].map(function (c) {
      var h = 7, items = c[1].map(function (w) {
        var lines = wrapText(w.clue || '(omschrijving ontbreekt)', COLW - NUMW - 1.6, size);
        h += lines.length * lh + 1.06;
        return { num: w.num, lines: lines, miss: !w.clue };
      });
      return { label: c[0], items: items, h: h };
    });
    return { size: size, lh: lh, cols: cols, h: Math.max(cols[0].h, cols[1].h) };
  }
  function drawClues(g, cp, y) {
    cp.cols.forEach(function (col, i) {
      var x = X + i * (COLW + 7.4);
      g.text(x, y + 3.7 * 0.95, col.label, { size: 3.7, weight: 700 });
      g.line(x, y + 5.3, x + COLW, y + 5.3, { w: 0.4 });
      var iy = y + 7;
      col.items.forEach(function (it) {
        g.text(x + NUMW, iy + cp.size, it.num, { size: cp.size, weight: 700, anchor: 'end' });
        it.lines.forEach(function (l, k) { g.text(x + NUMW + 1.6, iy + cp.size + k * cp.lh, l, { size: cp.size, fill: it.miss ? MISS : INK }); });
        iy += it.lines.length * cp.lh + 1.06;
      });
    });
  }
  /* Oplossingsvakjes: per woord een groep, groepen lopen door op de volgende regel */
  var BW = 7.4, BH = 7.9;
  function solPlan(P) {
    var rows = [[]], x = 0, idx = 0;
    P.groups.forEach(function (gr) {
      var left = gr.length;
      while (left > 0) {
        var fit = Math.floor((CW - x + 0.26) / (BW - 0.26));
        if (fit < Math.min(left, Math.floor(CW / BW)) && x > 0) { rows.push([]); x = 0; continue; }
        var n = Math.min(left, Math.max(1, fit));
        rows[rows.length - 1].push({ x: x, n: n, i: idx });
        idx += n; left -= n; x += n * (BW - 0.26) + 0.26 + GAP;
        if (left > 0) { rows.push([]); x = 0; }
      }
    });
    return { rows: rows, h: 6.1 + rows.length * BH + (rows.length - 1) * 2.1 };
  }
  function drawSol(g, P, sp, y, answer) {
    g.text(X, y + 3.44, 'Oplossing:', { size: 3.44, weight: 700 });
    sp.rows.forEach(function (row, ri) {
      var by = y + 6.1 + ri * (BH + 2.1);
      row.forEach(function (grp) {
        for (var k = 0; k < grp.n; k++) {
          var bx = X + grp.x + k * (BW - 0.26), i = grp.i + k;
          g.rect(bx, by, BW, BH, { fill: PAPER, stroke: INK, sw: 0.26 });
          g.text(bx + 0.55, by + 0.3 + 2.1 * 0.78, i + 1, { size: 2.1, weight: 700 });
          if (answer) g.text(bx + BW / 2, by + BH / 2 + 4.2 * 0.36 + 0.5, P.flat[i], { size: 4.2, weight: 700, anchor: 'middle', fill: RED });
        }
      });
    });
  }
  /* Eén werkblad of antwoordblad. o: { answer, nr, title, school, wordlist } */
  function drawSheet(g, P, o) {
    var right = [o.school, o.nr ? 'Nr. ' + o.nr : ''].filter(Boolean).join(' · ');
    var y = drawHead(g, o.title, right, o.answer) + GAP;
    if (!hasPuzzle(P)) {
      g.text(105, 140, 'Vul minstens twee woorden in.', { size: 4.2, fill: '#555555', anchor: 'middle' });
      g.text(105, 146, 'De puzzel verschijnt hier vanzelf.', { size: 4.2, fill: '#555555', anchor: 'middle' });
      foot(g); return;
    }
    var hasSol = !!P.marks;
    if (!o.answer) {
      var fx = X, fy = y + 3;
      [['Naam:', 66.1], ['Klas:', 21.2], ['Datum:', 29.1]].forEach(function (f) {
        g.text(fx, fy, f[0], { size: 3.2 }); fx += textW(f[0], 3.2) + 1.6;
        g.line(fx, fy + 0.6, fx + f[1], fy + 0.6, { w: 0.26 }); fx += f[1] + 4.8;
      });
      y += 3.6 + GAP;
      var il = wrapText('Los de puzzel op met de omschrijvingen.' + (hasSol ? ' De letters in de grijze vakjes vormen de oplossing.' : ''), CW, 3.3);
      il.forEach(function (l, i) { g.text(X, y + 3.3 + i * 4.3, l, { size: 3.3, fill: '#333333' }); });
      y += il.length * 4.3 + GAP;
    }
    var words = !o.answer && o.wordlist ? P.placed.map(function (w) { return w.w; }).sort().join(' · ') : '';
    var labelW = textW('Woorden: ', 3.3, true), wl = words ? wrapText(words, CW, 3.3, false, CW - labelW) : [];
    var sp = hasSol ? solPlan(P) : null, natural = Math.min(10.05, CW / P.cols), sizes = [3.44, 3.2, 2.95, 2.7, 2.5], cp = null, cell = 0;
    for (var i = 0; i < sizes.length; i++) {
      cp = cluePlan(P, sizes[i]);
      var below = GAP + cp.h + (wl.length ? GAP + wl.length * 4.3 : 0) + (sp ? GAP + sp.h : 0);
      cell = Math.min(natural, (BOTTOM - y - below) / P.rows);
      if (cell >= Math.min(natural, 6)) break;
    }
    drawGrid(g, P, X + (CW - cell * P.cols) / 2, y, cell, o.answer);
    y += cell * P.rows + GAP;
    drawClues(g, cp, y); y += cp.h;
    if (wl.length) {
      y += GAP;
      g.text(X, y + 3.3, 'Woorden:', { size: 3.3, weight: 700 });
      wl.forEach(function (l, k) { g.text(k ? X : X + labelW, y + 3.3 + k * 4.3, l, { size: 3.3 }); });
      y += wl.length * 4.3;
    }
    if (sp) drawSol(g, P, sp, y + GAP, o.answer);
    foot(g);
  }
  /* Compact antwoordblad: vier oplossingen verkleind op één A4, elk met het nummer van het werkblad */
  function drawCompact(g, list, o) {
    var first = list[0].nr, last = list[list.length - 1].nr;
    var y = drawHead(g, o.title, [o.school, 'Nr. ' + first + (last > first ? ' t/m ' + last : '')].filter(Boolean).join(' · '), true) + GAP;
    if (puzzle.marks) {
      g.text(X, y + 3.44, 'Oplossing: ' + puzzle.groups.map(function (gr) { return gr.join(''); }).join(' '), { size: 3.44, weight: 700 });
      y += 4.5 + GAP;
    }
    var tw = 87, th = (BOTTOM - y - 5) / 2;
    list.forEach(function (it, k) {
      var tx = X + (k % 2) * (tw + 6), ty = y + Math.floor(k / 2) * (th + 5), P = it.P;
      g.text(tx, ty + 3.4, 'Nr. ' + it.nr, { size: 3.4, weight: 700 });
      if (!hasPuzzle(P)) return;
      var cell = Math.min(tw / P.cols, (th - 6) / P.rows, 10.05);
      drawGrid(g, P, tx + (tw - cell * P.cols) / 2, ty + 6, cell, true);
    });
    foot(g);
  }
  function sheetOpts(nr, answer) {
    return { answer: answer, nr: uniqueOn() ? nr : 0, title: invoer.titel.trim(), school: invoer.school.trim(), wordlist: opts.wordlist };
  }

  /* ---------- Online invullen ---------- */
  var play = { entries: [], els: [], r: 0, c: 0, dir: 'a', bad: new Set(), done: false };
  var hid = document.createElement('input');
  hid.id = 'hid'; hid.type = 'text'; hid.className = 'kw-hid'; hid.autocomplete = 'off'; hid.autocapitalize = 'characters'; hid.spellcheck = false;
  hid.setAttribute('aria-label', 'Typ je antwoord in het gekozen vakje');
  document.body.appendChild(hid);

  function gridHTML(P, show) {
    var h = '', markAt = P.markAt || new Map();
    for (var r = 0; r < P.rows; r++) for (var c = 0; c < P.cols; c++) {
      var x = P.cells[r][c];
      if (!x) { h += '<div class="e"></div>'; continue; }
      var m = markAt.get(r * 1000 + c);
      h += '<div class="f' + (m !== undefined ? ' mark' : '') + (x.t.length > 1 ? ' ij' : '') + '" data-r="' + r + '" data-c="' + c + '">' +
        (x.num ? '<i class="n">' + x.num + '</i>' : '') + '<span class="l">' + (show ? x.t : '') + '</span>' +
        (m !== undefined ? '<b class="si">' + (m + 1) + '</b>' : '') + '</div>';
    }
    return h;
  }
  function solHTML(P, letterAt) {
    var i = 0;
    return P.groups.map(function (g) {
      return '<div class="kw-sg">' + g.map(function () { var k = i++; return '<div class="kw-sb"><i>' + (k + 1) + '</i><span>' + esc(letterAt(k)) + '</span></div>'; }).join('') + '</div>';
    }).join('');
  }
  function playReset() {
    play.bad.clear(); play.done = false;
    if (!hasPuzzle()) { play.entries = []; return; }
    play.entries = puzzle.cells.map(function (row) { return row.map(function () { return ''; }); });
    var w = puzzle.placed.slice().sort(function (a, b) { return a.num - b.num || (a.d === 'a' ? -1 : 1); })[0];
    play.r = w.r; play.c = w.c; play.dir = w.d;
  }
  function curWord() {
    var x = puzzle.cells[play.r][play.c];
    var wi = play.dir === 'a' ? x.a : x.d;
    if (wi < 0) { play.dir = play.dir === 'a' ? 'd' : 'a'; wi = play.dir === 'a' ? x.a : x.d; }
    return wi;
  }
  function wordCells(wi) {
    var w = puzzle.placed[wi];
    return w.t.map(function (_, k) { return [w.r + (w.d === 'd' ? k : 0), w.c + (w.d === 'a' ? k : 0)]; });
  }
  function selectCell(r, c, toggle) {
    var x = puzzle.cells[r][c]; if (!x) return;
    if (play.r === r && play.c === c) { if (toggle && x.a >= 0 && x.d >= 0) play.dir = play.dir === 'a' ? 'd' : 'a'; }
    else { play.r = r; play.c = c; if ((play.dir === 'a' ? x.a : x.d) < 0) play.dir = play.dir === 'a' ? 'd' : 'a'; }
    setMsg(''); paintPlay();
  }
  function advance() {
    var cs = wordCells(curWord());
    var i = cs.findIndex(function (p) { return p[0] === play.r && p[1] === play.c; });
    if (i < cs.length - 1) { play.r = cs[i + 1][0]; play.c = cs[i + 1][1]; }
  }
  function retreat() {
    var cs = wordCells(curWord());
    var i = cs.findIndex(function (p) { return p[0] === play.r && p[1] === play.c; });
    if (i > 0) { play.r = cs[i - 1][0]; play.c = cs[i - 1][1]; }
  }
  function typeChar(ch) {
    if (play.done) return;
    var x = puzzle.cells[play.r][play.c], e = play.entries[play.r][play.c];
    play.bad.delete(play.r + ',' + play.c);
    if (x.t === 'IJ') {
      var n = (e.length >= 2 || e === '') ? ch : e + ch;
      play.entries[play.r][play.c] = n;
      if (n.length === 2) advance();
    } else { play.entries[play.r][play.c] = ch; advance(); }
    setMsg(''); checkDone(); paintPlay();
  }
  function back() {
    if (play.done) return;
    var e = play.entries[play.r][play.c];
    if (e) { play.entries[play.r][play.c] = e.slice(0, -1); }
    else { retreat(); play.entries[play.r][play.c] = ''; }
    play.bad.delete(play.r + ',' + play.c); setMsg(''); paintPlay();
  }
  function moveBy(dr, dc) {
    var r = play.r + dr, c = play.c + dc;
    while (r >= 0 && c >= 0 && r < puzzle.rows && c < puzzle.cols) {
      var x = puzzle.cells[r][c];
      if (x) {
        play.r = r; play.c = c;
        var want = dc ? 'a' : 'd', has = want === 'a' ? x.a : x.d;
        if (has >= 0) play.dir = want; else if ((play.dir === 'a' ? x.a : x.d) < 0) play.dir = want === 'a' ? 'd' : 'a';
        break;
      }
      r += dr; c += dc;
    }
    setMsg(''); paintPlay();
  }
  function nextWord(step) {
    var order = puzzle.placed.slice().sort(function (a, b) { return a.num - b.num || (a.d === 'a' ? -1 : 1); });
    var i = order.indexOf(puzzle.placed[curWord()]);
    var n = order[(i + step + order.length) % order.length];
    play.r = n.r; play.c = n.c; play.dir = n.d; setMsg(''); paintPlay();
  }
  function checkDone() {
    var all = true;
    for (var r = 0; r < puzzle.rows; r++) for (var c = 0; c < puzzle.cols; c++) {
      var x = puzzle.cells[r][c]; if (x && play.entries[r][c] !== x.t) all = false;
    }
    play.done = all;
  }
  function setMsg(m, good) { var el = $('#pMsg'); if (el) { el.textContent = m; el.className = good ? 'good' : 'bad'; } }
  function doCheck() {
    var bad = 0, empty = 0; play.bad.clear();
    for (var r = 0; r < puzzle.rows; r++) for (var c = 0; c < puzzle.cols; c++) {
      var x = puzzle.cells[r][c]; if (!x) continue;
      var e = play.entries[r][c];
      if (!e || (x.t === 'IJ' && e === 'I')) { empty++; continue; }
      if (e !== x.t) { bad++; play.bad.add(r + ',' + c); }
    }
    paintPlay();
    if (bad) setMsg(bad + (bad === 1 ? ' letter klopt niet.' : ' letters kloppen niet.') + ' Ze staan rood.');
    else if (empty) setMsg('Tot nu toe klopt alles. Nog ' + empty + ' vakjes leeg.', true);
  }
  function revealCell(r, c) { var x = puzzle.cells[r][c]; if (x) { play.entries[r][c] = x.t; play.bad.delete(r + ',' + c); } }
  var ACTIONS = {
    check: doCheck,
    letter: function () { revealCell(play.r, play.c); setMsg(''); checkDone(); paintPlay(); },
    word: function () { wordCells(curWord()).forEach(function (p) { revealCell(p[0], p[1]); }); setMsg(''); checkDone(); paintPlay(); },
    clear: function () { playReset(); setMsg(''); paintPlay(); }
  };

  function paintPlay() {
    if (!hasPuzzle() || !play.els.length || !$('#play')) return;
    var wi = curWord(), inW = {};
    wordCells(wi).forEach(function (p) { inW[p[0] * 1000 + p[1]] = 1; });
    play.els.forEach(function (row, r) {
      row.forEach(function (el, c) {
        if (!el) return;
        el.classList.toggle('onword', !!inW[r * 1000 + c]);
        el.classList.toggle('oncell', r === play.r && c === play.c);
        el.classList.toggle('bad', play.bad.has(r + ',' + c));
        el.querySelector('.l').textContent = play.entries[r][c];
      });
    });
    var w = puzzle.placed[wi], bar = $('#playBar');
    if (play.done) {
      bar.className = 'kw-play-bar done';
      var word = puzzle.marks ? puzzle.groups.map(function (g) { return g.join(''); }).join(' ') : '';
      bar.innerHTML = '<span>Goed gedaan, alle woorden kloppen.' + (word ? ' De oplossing is: ' + esc(word) + '.' : '') + '</span>';
    } else {
      bar.className = 'kw-play-bar';
      bar.innerHTML = '<span class="pb-n">' + w.num + ' ' + (w.d === 'a' ? 'horizontaal' : 'verticaal') + '</span><span>' + esc(w.clue || '(omschrijving ontbreekt)') + '</span>';
    }
    $$('#playClues li').forEach(function (li) { li.classList.toggle('on', +li.dataset.wi === wi); });
    if (puzzle.marks) $('#playSol').innerHTML = '<div class="kw-sol-label">Oplossing</div><div class="kw-solbox">' + solHTML(puzzle, function (k) { var m = puzzle.marks[k]; return play.entries[m.r][m.c]; }) + '</div>';
  }
  function layoutPlay() {
    var g = $('#playGrid'), wrap = $('#pgw'); if (!g || !wrap) return;
    var cs = Math.max(26, Math.min(46, Math.floor((wrap.clientWidth - 6) / puzzle.cols)));
    g.style.setProperty('--cs', cs + 'px');
  }
  /* focus: alleen bij het kiezen van de weergave, niet tijdens het typen in de tabel */
  function renderPlay(focus) {
    var P = puzzle;
    if (!hasPuzzle() || !play.entries.length) { stage.innerHTML = '<p class="kw-empty">Vul minstens twee woorden in om de puzzel online te kunnen invullen.</p>'; return; }
    function clist(label, list) { return '<div><h4>' + label + '</h4><ol>' + list.map(function (w) { return '<li data-wi="' + w.i + '"><b>' + w.num + '</b><span>' + esc(w.clue || '(omschrijving ontbreekt)') + '</span></li>'; }).join('') + '</ol></div>'; }
    stage.innerHTML = '<div class="kw-play" id="play"><div class="kw-play-bar" id="playBar"></div>' +
      '<div class="kw-play-body"><div class="kw-play-grid" id="pgw"><div class="kw-xw" id="playGrid" style="--cols:' + P.cols + '" role="grid" aria-label="Kruiswoordpuzzel">' + gridHTML(P, false) + '</div><div class="kw-play-sol" id="playSol"></div></div>' +
      '<div class="kw-play-clues" id="playClues">' + clist('Horizontaal', P.across) + clist('Verticaal', P.down) + '</div></div>' +
      '<div class="kw-play-actions"><button class="btn ghost small" type="button" data-act="check">Controleer</button><button class="btn ghost small" type="button" data-act="letter">Toon letter</button><button class="btn ghost small" type="button" data-act="word">Toon woord</button><button class="btn ghost small" type="button" data-act="clear">Wis alles</button><span id="pMsg" role="status"></span></div></div>';
    play.els = [];
    for (var r = 0; r < P.rows; r++) play.els.push(new Array(P.cols).fill(null));
    $$('#playGrid .f').forEach(function (el) { play.els[+el.dataset.r][+el.dataset.c] = el; });
    layoutPlay(); paintPlay();
    if (focus) hid.focus({ preventScroll: true });
  }
  stage.addEventListener('click', function (e) {
    if (mode !== 'invullen' || !$('#play')) return;
    var f = e.target.closest('.kw-xw .f');
    if (f) { selectCell(+f.dataset.r, +f.dataset.c, true); hid.focus({ preventScroll: true }); return; }
    var li = e.target.closest('.kw-play-clues li');
    if (li) { var w = puzzle.placed[+li.dataset.wi]; play.r = w.r; play.c = w.c; play.dir = w.d; setMsg(''); paintPlay(); hid.focus({ preventScroll: true }); return; }
    var b = e.target.closest('[data-act]');
    if (b) { ACTIONS[b.dataset.act](); hid.focus({ preventScroll: true }); }
  });
  hid.addEventListener('keydown', function (e) {
    if (mode !== 'invullen' || !play.entries.length) return;
    var k = e.key;
    if (k === 'Backspace') { e.preventDefault(); back(); }
    else if (k === 'Delete') { e.preventDefault(); if (!play.done) { play.entries[play.r][play.c] = ''; play.bad.delete(play.r + ',' + play.c); paintPlay(); } }
    else if (k === 'ArrowLeft') { e.preventDefault(); moveBy(0, -1); }
    else if (k === 'ArrowRight') { e.preventDefault(); moveBy(0, 1); }
    else if (k === 'ArrowUp') { e.preventDefault(); moveBy(-1, 0); }
    else if (k === 'ArrowDown') { e.preventDefault(); moveBy(1, 0); }
    else if (k === 'Tab') { e.preventDefault(); nextWord(e.shiftKey ? -1 : 1); }
    else if (k === ' ' || k === 'Enter') { e.preventDefault(); selectCell(play.r, play.c, true); }
  });
  hid.addEventListener('input', function () {
    var v = hid.value; hid.value = '';
    if (mode !== 'invullen' || !play.entries.length) return;
    for (var i = 0; i < v.length; i++) { var n = norm(v[i]); if (n) typeChar(n[0]); }
  });

  /* ---------- Voorbeeld tonen ---------- */
  function renderPreview(focus) {
    if (mode === 'invullen') { renderPlay(focus); return; }
    var g = svgOut(), answer = mode === 'antwoord';
    drawSheet(g, puzzleFor(1), sheetOpts(1, answer));
    stage.innerHTML = '<svg class="kw-paper" viewBox="0 0 210 297" role="img" aria-label="Voorbeeld van het ' + (answer ? 'antwoordblad' : 'werkblad') + ' op A4">' + g.out.join('') + '</svg>';
  }
  $$('input[name="view"]').forEach(function (r) { r.addEventListener('change', function () { mode = r.value; renderPreview(true); }); });
  $('#shuffle').onclick = function () { invoer.seed++; rebuild(); };
  if (window.ResizeObserver) new ResizeObserver(function () { if (mode === 'invullen') layoutPlay(); }).observe(stage);

  /* ---------- Kopieer als afbeelding: het getoonde blad (werkblad of antwoordblad) op A4 ---------- */
  var CHECK = ICON_OK;
  function note(html, cls) { $('#outMsg').innerHTML = html ? '<div class="fb ' + (cls || 'note') + '">' + html + '</div>' : ''; }
  var busy = false;
  function setOut() { var ok = !busy && hasPuzzle(); $('#pdfBtn').disabled = !ok; $('#imgBtn').disabled = !ok; }
  function buildImage() {
    var sc = 5, cv = document.createElement('canvas');
    cv.width = 210 * sc; cv.height = 297 * sc;
    drawSheet(canvasOut(cv.getContext('2d'), sc), puzzleFor(1), sheetOpts(1, mode === 'antwoord'));
    return cv;
  }
  function copyImage() {
    if (!hasPuzzle()) return;
    var ready = document.fonts && document.fonts.load ? Promise.all([document.fonts.load('400 20px "Atkinson Hyperlegible"'), document.fonts.load('700 20px "Atkinson Hyperlegible"')]).catch(function () {}) : Promise.resolve();
    ready.then(function () {
      var cv = buildImage();
      var fallback = function () {
        note('<p>Kopiëren lukt niet in deze browser. Klik met de rechtermuisknop op de afbeelding hieronder en kies Afbeelding kopiëren.</p><img alt="Kruiswoordpuzzel als afbeelding" src="' + cv.toDataURL('image/png') + '">');
      };
      try {
        var blob = new Promise(function (res, rej) { cv.toBlob(function (b) { if (b) res(b); else rej(new Error('geen afbeelding')); }, 'image/png'); });
        navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]).then(function () {
          note(CHECK + '<span>Gekopieerd. Plak de afbeelding in Word of Google Documenten.</span>', 'good');
        }, fallback);
      } catch (e) { fallback(); }
    });
  }

  /* ---------- PDF downloaden ----------
     jsPDF (js/vendor) en het lettertype worden pas bij de eerste download geladen.
     Volgorde: zonder klas het werkblad en het antwoordblad; met klas eerst alle
     werkbladen (leerlingen + 1), daarna de antwoordbladen volgens de gekozen optie.
     Het aantal pagina's is gelijk aan klasSummary(). */
  var VENDOR = document.currentScript.src.replace(/[^/]*$/, '') + 'vendor/';
  function loadScript(src) {
    return new Promise(function (res, rej) {
      var el = document.createElement('script');
      el.src = src; el.onload = res; el.onerror = function () { rej(new Error(src)); };
      document.head.appendChild(el);
    });
  }
  var pdfLibs = null;
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
    var doc = new window.jspdf.jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait', compress: true });
    var fonts = { normal: ['helvetica', 'normal'], bold: ['helvetica', 'bold'], atkinson: false };
    var ttf = window.ATKINSON_TTF;
    if (ttf) {
      try {
        doc.addFileToVFS('AtkinsonHyperlegible-Regular.ttf', ttf.normal);
        doc.addFont('AtkinsonHyperlegible-Regular.ttf', 'AtkinsonHyperlegible-Regular', 'normal');
        doc.addFileToVFS('AtkinsonHyperlegible-Bold.ttf', ttf.bold);
        doc.addFont('AtkinsonHyperlegible-Bold.ttf', 'AtkinsonHyperlegible-Bold', 'normal');
        fonts = { normal: ['AtkinsonHyperlegible-Regular', 'normal'], bold: ['AtkinsonHyperlegible-Bold', 'normal'], atkinson: true };
      } catch (e) { /* Helvetica */ }
    }
    doc.setProperties({ title: invoer.titel.trim() || 'Kruiswoordpuzzel', creator: 'cranenklas.github.io' });
    return { doc: doc, fonts: fonts };
  }
  /* Bestandsnaam: kruiswoordpuzzel-<titel>, in kleine letters met streepjes (zonder "kruiswoordpuzzel" dubbel) */
  function fileName() {
    var t = invoer.titel.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').replace(/^kruiswoordpuzzel(-|$)/, '');
    return 'kruiswoordpuzzel' + (t ? '-' + t : '') + '.pdf';
  }
  function tick() { return new Promise(function (res) { setTimeout(res, 0); }); }
  /* Alle pagina's van de pdf, in volgorde: { nr, answer } of { compact: [nummers] } */
  function pdfPages() {
    var pages = [], ws = klas.on ? klas.n + 1 : 1, nr;
    if (!klas.on) return [{ nr: 1, answer: false }, { nr: 1, answer: true }];
    for (nr = 1; nr <= ws; nr++) pages.push({ nr: nr, answer: false });
    if (klas.answers === 'leerling' || (klas.unique && !klas.compact)) { for (nr = 1; nr <= ws; nr++) pages.push({ nr: nr, answer: true }); }
    else if (klas.unique) { for (var f = 1; f <= ws; f += 4) { var list = []; for (nr = f; nr < f + 4 && nr <= ws; nr++) list.push(nr); pages.push({ compact: list }); } }
    else pages.push({ nr: 1, answer: true });
    return pages;
  }
  async function makePdf() {
    if (busy || !hasPuzzle()) return;
    busy = true; setOut();
    var v = version;
    var changed = function () { if (v !== version) throw new Error('changed'); };
    try {
      note('<p>PDF maken…</p>');
      await pdfReady();
      changed();
      var pages = pdfPages(), ws = klas.on ? klas.n + 1 : 1;
      if (uniqueOn()) {
        for (var nr = 2; nr <= ws; nr++) {
          note('<p>Bezig: ' + nr + ' van ' + ws + '</p>');
          await tick(); changed();
          puzzleFor(nr);
        }
      }
      note('<p>PDF maken…</p>');
      await tick(); changed();
      var D = newDoc(), doc = D.doc, g = pdfOut(doc, D.fonts);
      pages.forEach(function (p, i) {
        if (i) doc.addPage('a4', 'portrait');
        if (p.compact) drawCompact(g, p.compact.map(function (n) { return { nr: n, P: puzzleFor(n) }; }), sheetOpts(1, true));
        else drawSheet(g, puzzleFor(p.nr), sheetOpts(p.nr, p.answer));
      });
      doc.save(fileName());
      note(CHECK + '<span>Je PDF met ' + pages.length + ' pagina’s is gedownload.' + (D.fonts.atkinson ? '' : ' (Met lettertype Helvetica.)') + '</span>', 'good');
    } catch (e) {
      if (e && e.message === 'changed') note('<p>Je hebt iets veranderd tijdens het maken van de PDF. Klik nog een keer op Download PDF.</p>');
      else note('<p>De PDF maken lukte niet. Controleer je internetverbinding en probeer het opnieuw.</p>', 'bad');
    } finally {
      busy = false; setOut();
    }
  }
  $('#pdfBtn').onclick = makePdf;
  $('#imgBtn').onclick = copyImage;

  /* ---------- Sidebar, versleepbare lijn en voorbeeld verbergen ---------- */
  /* Standaard krijgt het voorbeeld 35% van de ruimte rechts van het menu (minimaal 440 px) en de invoer
     de rest; dat rekent mee met de venstergrootte. Een gesleepte breedte wordt bewaard en gaat voor. */
  var PV_SHARE = 0.35, PV_MIN = 440, IN_MIN = 340, SPLIT_W = 14, STORE_W = 'cranenklas-kruiswoordpuzzel-breedte';
  var wanted = null;  /* null: de standaardverdeling */
  function defaultIn() { var room = main.clientWidth; return room - SPLIT_W - Math.max(PV_MIN, Math.round(room * PV_SHARE)); }
  function clampIn(w) {
    var max = Math.max(IN_MIN, main.clientWidth - SPLIT_W - PV_MIN);
    return Math.min(Math.max(w, IN_MIN), max);
  }
  function curIn() { return clampIn(wanted === null ? defaultIn() : wanted); }
  function applyIn() {
    var w = curIn();
    main.style.setProperty('--inw', w + 'px');
    splitter.setAttribute('aria-valuenow', String(Math.round(w)));
    splitter.setAttribute('aria-valuemax', String(Math.round(clampIn(5000))));
  }
  /* w = null zet terug naar de standaardverdeling en vergeet de bewaarde breedte */
  function setWanted(w, save) {
    wanted = w; applyIn();
    if (save) {
      try { if (w === null) localStorage.removeItem(STORE_W); else localStorage.setItem(STORE_W, String(Math.round(clampIn(w)))); }
      catch (err) { /* opslag niet beschikbaar */ }
    }
  }
  try { var saved = parseInt(localStorage.getItem(STORE_W), 10); if (saved) wanted = saved; } catch (err) { /* opslag niet beschikbaar */ }
  applyIn();
  window.addEventListener('resize', applyIn);
  /* de sidebar klapt met een overgang in en uit: de lijn rekent mee zodra main van breedte verandert */
  if (window.ResizeObserver) new ResizeObserver(applyIn).observe(main);
  splitter.addEventListener('pointerdown', function (e) {
    if (e.button !== undefined && e.button > 0) return;
    splitter.setPointerCapture(e.pointerId); splitter.classList.add('on'); document.body.classList.add('kw-drag');
  });
  splitter.addEventListener('pointermove', function (e) {
    if (!splitter.hasPointerCapture(e.pointerId)) return;
    setWanted(e.clientX - $('#inpanel').getBoundingClientRect().left, false);
  });
  function endDrag(e) {
    if (splitter.hasPointerCapture && splitter.hasPointerCapture(e.pointerId)) splitter.releasePointerCapture(e.pointerId);
    splitter.classList.remove('on'); document.body.classList.remove('kw-drag'); if (wanted !== null) setWanted(wanted, true);
  }
  splitter.addEventListener('pointerup', endDrag);
  splitter.addEventListener('pointercancel', endDrag);
  splitter.addEventListener('dblclick', function () { setWanted(null, true); });
  splitter.addEventListener('keydown', function (e) {
    var cur = curIn();
    if (e.key === 'ArrowLeft') { e.preventDefault(); setWanted(cur - 30, true); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); setWanted(cur + 30, true); }
    else if (e.key === 'Home') { e.preventDefault(); setWanted(null, true); }
  });
  $('#toggle').addEventListener('click', function () {
    var c = $('#layout').classList.toggle('collapsed');
    this.setAttribute('aria-expanded', String(!c));
    this.setAttribute('aria-label', c ? 'Sidebar uitklappen' : 'Sidebar inklappen');
    $('#sideList').hidden = c;
    applyIn();
  });
  $('#pvHide').onclick = function () { main.classList.add('nopv'); $('#pvShow').focus(); };
  $('#pvShow').onclick = function () { main.classList.remove('nopv'); applyIn(); if (mode === 'invullen') layoutPlay(); $('#pvHide').focus(); };
  /* Links die voorlopig nog niets doen (Over mij, Contact) */
  $$('[data-stub]').forEach(function (a) { a.addEventListener('click', function (e) { e.preventDefault(); }); });

  /* ---------- Onthouden in deze browser (zoals bij de woordzoeker): school, woordenlijst
     laten zien en afdrukken. Woorden, oplossing en titel niet: de pagina opent altijd
     met het voorbeeld. ---------- */
  var STORE = 'cranenklas-kruiswoordpuzzel';
  function saveSettings() {
    var s = { school: invoer.school, wordlist: opts.wordlist, klas: klas };
    try { localStorage.setItem(STORE, JSON.stringify(s)); } catch (e) { /* opslag niet beschikbaar */ }
  }
  function loadSettings() {
    var s = null;
    try { s = JSON.parse(localStorage.getItem(STORE) || 'null'); } catch (e) { /* opslag niet beschikbaar */ }
    if (!s || typeof s !== 'object') return;
    if (typeof s.school === 'string') invoer.school = s.school.slice(0, 60);
    if (typeof s.wordlist === 'boolean') opts.wordlist = s.wordlist;
    var k = s.klas;
    if (k && typeof k === 'object') {
      if (typeof k.on === 'boolean') klas.on = k.on;
      klas.n = clampInt(k.n, 1, 40, 25);
      if (typeof k.unique === 'boolean') klas.unique = k.unique;
      if (k.answers === 'docent' || k.answers === 'leerling') klas.answers = k.answers;
      if (typeof k.compact === 'boolean') klas.compact = k.compact;
    }
  }
  ['#school', '#wl'].forEach(function (s) { $(s).addEventListener('input', saveSettings); $(s).addEventListener('change', saveSettings); });

  /* ---------- Start ---------- */
  function loadExample() {
    invoer.woorden = EX.woorden.map(function (it) { return { id: nextId++, woord: it[0], omschrijving: it[1], databank: false }; });
    invoer.oplossing = EX.oplossing; invoer.titel = EX.titel;
    $('#sol').value = invoer.oplossing; $('#title').value = invoer.titel;
    example = true; $('#exHint').hidden = false; wordNote('');
    renderTable(); updateKlas(); rebuild();
  }
  /* Op een smal scherm (laptop, tablet liggend) begint de sidebar ingeklapt, zodat het voorbeeld groot genoeg is */
  if (window.innerWidth > 760 && window.innerWidth < 1100) { $('#toggle').click(); }
  loadSettings();
  $('#school').value = invoer.school; $('#wl').checked = opts.wordlist; $('#kn').value = klas.n; $('#kuniq').checked = klas.unique;
  $$('input[name="ka"]').forEach(function (r) { r.checked = r.value === klas.answers; });
  $$('input[name="kc"]').forEach(function (r) { r.checked = (r.value === 'compact') === klas.compact; });
  loadExample();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { if (mode !== 'invullen') renderPreview(); });
})();
