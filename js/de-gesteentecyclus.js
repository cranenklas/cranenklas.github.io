// ===========================================================
// Cranenklas aardrijkskunde — tool "De gesteentecyclus"
// Spel: gooi twee dobbelstenen en doorloop alle 7 plekken van de
// gesteentecyclus met zo min mogelijk worpen. De som bepaalt of een
// proces gebeurt. De camera verschuift en schaalt de hele kaart met
// een CSS-transform (de viewBox blijft altijd gelijk). Verder: geluid
// via de Web Audio API, vuurwerk, een ranglijst per apparaat en de sidebar.
// Cheat: toets 1 of 2 = eerste of tweede uitgang, toets 0 = een plek terug.
// ===========================================================
(function () {
  var NS = 'http://www.w3.org/2000/svg';
  function $(id) { return document.getElementById('gesteente-' + id); }
  function each(sel, fn) { [].forEach.call(document.querySelectorAll(sel), fn); }

  // S: de 7 plekken met hun positie op de kaart
  var S = {
    korst: { n: 'Continentale korst', p: [380, 160] },
    regoliet: { n: 'Regoliet', p: [640, 240] },
    sediment: { n: 'Sediment', p: [1100, 410] },
    sed: { n: 'Sedimentair gesteente', p: [1110, 535] },
    meta: { n: 'Metamorf gesteente', p: [1110, 720] },
    magma: { n: 'Magma', p: [1550, 940] },
    ign: { n: 'Stollingsgesteente', p: [1790, 250] }
  };
  // R: de routes (processen). d2 = tweede deel van een opheffing, die links weer begint.
  // l en l2: plek van de naam [x, y, text-anchor].
  var R = {
    verwering: { n: 'Verwering', d: 'M380,160 C450,170 560,200 640,240', l: [500, 175, 'middle'] },
    erosie: { n: 'Erosie en afzetting', d: 'M640,240 C780,300 900,290 1000,340 C1060,370 1100,380 1100,410', l: [800, 345, 'middle'] },
    begraving: { n: 'Begraving en cementatie', d: 'M1100,410 L1110,535', l: [1135, 478, 'start'] },
    metSed: { n: 'Metamorfose', d: 'M1110,535 L1110,720', l: [1135, 632, 'start'] },
    smelten: { n: 'Smelten', d: 'M1110,720 C1250,780 1350,900 1550,940', l: [1330, 850, 'middle'] },
    intrusie: { n: 'Intrusie en vulkanisme', d: 'M1550,940 C1680,880 1760,500 1790,250', l: [1690, 560, 'end'] },
    metIgn: { n: 'Metamorfose', d: 'M1790,250 C1900,450 1700,640 1450,650 C1300,655 1200,700 1110,720', l: [1640, 700, 'middle'] },
    opIgn: { n: 'Tektonische opheffing', d: 'M1790,250 C1830,330 1930,400 2000,420', d2: 'M0,420 C150,420 300,330 380,160', t: 'opheffing →', l: [1990, 455, 'end'], l2: [15, 405, 'start'] },
    opSed: { n: 'Tektonische opheffing', d: 'M1110,535 C1500,545 1800,520 2000,520', d2: 'M0,520 C200,520 330,360 380,160', t: 'opheffing →', l: [1990, 500, 'end'], l2: [15, 505, 'start'] },
    opMeta: { n: 'Tektonische opheffing', d: 'M1110,720 C1500,745 1800,745 2000,740', d2: 'M0,740 C150,740 290,480 370,170', t: 'opheffing →', l: [1990, 725, 'end'], l2: [15, 725, 'start'] }
  };
  // T: spelregels. Per plek de uitgangen: route, bestemming en de sommen [van, tot en met].
  var T = {
    korst: [{ r: 'verwering', to: 'regoliet', s: [8, 12] }],
    regoliet: [{ r: 'erosie', to: 'sediment', s: [8, 12] }],
    sediment: [{ r: 'begraving', to: 'sed', s: [9, 12] }],
    sed: [{ r: 'metSed', to: 'meta', s: [3, 4] }, { r: 'opSed', to: 'korst', s: [10, 11] }],
    meta: [{ r: 'smelten', to: 'magma', s: [3, 4] }, { r: 'opMeta', to: 'korst', s: [10, 11] }],
    magma: [{ r: 'intrusie', to: 'ign', s: [10, 11] }],
    ign: [{ r: 'metIgn', to: 'meta', s: [3, 4] }, { r: 'opIgn', to: 'korst', s: [9, 12] }]
  };
  var SH = { korst: 'Korst', regoliet: 'Regoliet', sediment: 'Sediment', sed: 'Sedimentair', meta: 'Metamorf', magma: 'Magma', ign: 'Stollingsgesteente' };

  var map = $('map'), tok = $('tok'), routes = $('routes'), labels = $('labels');

  // Routes tekenen: een donkere onderlaag (base) met een streepjeslijn (dash) erover
  Object.keys(R).forEach(function (k) {
    [R[k].d, R[k].d2].forEach(function (d) {
      if (!d) return;
      ['base', 'dash'].forEach(function (c) {
        var p = document.createElementNS(NS, 'path');
        p.setAttribute('d', d);
        p.setAttribute('class', 'gesteente-rt ' + c);
        p.dataset.r = k;
        routes.appendChild(p);
      });
    });
  });

  // Steentjes langs het regoliet
  ['rg1', 'rg2', 'rg3'].forEach(function (id) {
    var pa = $(id), L = pa.getTotalLength();
    for (var l = 10; l < L; l += 26) {
      var q = pa.getPointAtLength(l), c = document.createElementNS(NS, 'circle');
      c.setAttribute('cx', q.x + ((l * 7) % 9 - 4));
      c.setAttribute('cy', q.y + ((l * 5) % 7 - 3));
      c.setAttribute('r', 3 + (Math.floor(l) % 3));
      c.setAttribute('fill', Math.floor(l) % 52 < 26 ? '#6e5a48' : '#5c8a4a');
      pa.parentNode.insertBefore(c, pa.nextSibling);
    }
  });

  // Namen van de plekken (met een rondje op de plek zelf) en van de routes
  var pts = { korst: [230, 345, 'middle'], regoliet: [655, 222, 'start'], sediment: [960, 432, 'middle'], sed: [890, 548, 'start'], meta: [890, 770, 'start'], magma: [1550, 1062, 'middle'], ign: [1960, 345, 'end'] };
  function text(cls, l, s) {
    var t = document.createElementNS(NS, 'text');
    t.setAttribute('class', cls); t.setAttribute('x', l[0]); t.setAttribute('y', l[1]); t.setAttribute('text-anchor', l[2]);
    t.textContent = s;
    labels.appendChild(t);
    return t;
  }
  Object.keys(S).forEach(function (k) {
    var t = text('gesteente-sl', pts[k], S[k].n);
    var c = document.createElementNS(NS, 'circle');
    c.setAttribute('cx', S[k].p[0]); c.setAttribute('cy', S[k].p[1]); c.setAttribute('r', 9);
    c.setAttribute('fill', '#fbf4e6'); c.setAttribute('stroke', '#2a2118'); c.setAttribute('stroke-width', 4);
    labels.insertBefore(c, t);
  });
  Object.keys(R).forEach(function (k) {
    [R[k].l, R[k].l2].forEach(function (l) {
      if (!l) return;
      text('gesteente-pl', l, (l === R[k].l && R[k].t) || R[k].n);
    });
  });

  // ---------- Dobbelstenen ----------
  var PIPS = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };
  function face(el, n) {
    el.innerHTML = '';
    for (var i = 0; i < 9; i++) {
      var e = document.createElement('i');
      if (PIPS[n].indexOf(i) > -1) e.className = 'on';
      el.appendChild(e);
    }
  }
  face($('d1'), 3); face($('d2'), 4);

  // ---------- Camera ----------
  // De viewBox blijft altijd 0 -150 2000 1250. Een camerastand v = [x, y, breedte, hoogte]
  // in kaartcoördinaten wordt omgezet naar een transform van de hele SVG.
  var VX = [0, -150, 2000, 1250], cur = VX.slice(), camGen = 0;
  var frame = $('frame');
  function setVB(v) {
    cur = v;
    var u = frame.clientWidth * 2.5 / 2000, k = 800 / v[2];
    map.style.transform = 'translate(' + (-v[0] * u * k) + 'px,' + (-(v[1] + 150) * u * k) + 'px) scale(' + k + ')';
  }
  window.addEventListener('resize', function () { setVB(cur); });
  function cam(x, y, w) {
    var h = w * .625;
    setVB([Math.max(0, Math.min(2000 - w, x - w / 2)), Math.max(-150, Math.min(1100 - h, y - h / 2)), w, h]);
  }
  function ease(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  // Een nieuwe camerabeweging stopt een vorige die nog bezig is
  function animVB(to, dur, done) {
    var from = cur.slice(), t0 = performance.now(), gen = ++camGen;
    (function f(n) {
      if (gen !== camGen) return;
      var t = Math.min(1, (n - t0) / dur), e = ease(t);
      setVB(from.map(function (v, i) { return v + (to[i] - v) * e; }));
      if (t < 1) requestAnimationFrame(f); else if (done) done();
    })(t0);
  }
  // CV: camerastand per plek [midden x, midden y, breedte]
  var CV = { korst: [430, 310, 864], regoliet: [730, 285, 800], sediment: [1050, 560, 900], sed: [1250, 620, 900], meta: [1250, 820, 900], magma: [1550, 800, 960], ign: [1536, 330, 928] };
  function camTo(k, dur, done) {
    var v = CV[k], w = v[2], h = w * .625;
    animVB([Math.max(0, Math.min(2000 - w, v[0] - w / 2)), Math.max(-150, Math.min(1100 - h, v[1] - h / 2)), w, h], dur, done);
  }

  // ---------- Geluid (Web Audio API, zonder geluidsbestanden) ----------
  var AC = null, sound = true;
  function ac() {
    if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} }
    if (AC && AC.state === 'suspended') AC.resume();
    return AC;
  }
  function noise(t, dur, f, g) {
    var a = AC, n = Math.floor(a.sampleRate * dur), b = a.createBuffer(1, n, a.sampleRate), d = b.getChannelData(0);
    for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    var src = a.createBufferSource(); src.buffer = b;
    var fl = a.createBiquadFilter(); fl.type = 'bandpass'; fl.frequency.value = f; fl.Q.value = 1.2;
    var gn = a.createGain(); gn.gain.value = g;
    src.connect(fl); fl.connect(gn); gn.connect(a.destination); src.start(t);
  }
  function tone(t, fq, dur, g, type) {
    var a = AC, o = a.createOscillator(), gn = a.createGain();
    o.type = type || 'triangle'; o.frequency.value = fq;
    gn.gain.setValueAtTime(0, t); gn.gain.linearRampToValueAtTime(g, t + .02); gn.gain.exponentialRampToValueAtTime(.001, t + dur);
    o.connect(gn); gn.connect(a.destination); o.start(t); o.stop(t + dur + .05);
  }
  function diceSound() {
    if (!sound || !ac()) return;
    var t = AC.currentTime, gap = .045;
    for (var i = 0; i < 14; i++) { noise(t, .03, 1400 + Math.random() * 2200, .5 + Math.random() * .3); t += gap; gap *= 1.12; }
    noise(t + .02, .05, 500, .6);
  }
  function fanfare() {
    if (!sound || !ac()) return;
    var t = AC.currentTime;
    [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5].forEach(function (f, i) { tone(t + i * .14, f, .35, .18, 'triangle'); });
    tone(t + .9, 1318.5, .8, .15, 'triangle'); tone(t + .9, 1046.5, .8, .12, 'square');
  }
  function pop() { if (sound && AC) noise(AC.currentTime, .12, 800 + Math.random() * 900, .35); }
  $('snd').addEventListener('click', function () {
    sound = !sound;
    $('snd').textContent = 'Geluid: ' + (sound ? 'aan' : 'uit');
    if (sound) ac();
  });

  // ---------- Vuurwerk bij de finish ----------
  function fireworks() {
    var cv = $('fw'), fr = cv.parentNode, W = cv.width = fr.clientWidth, H = cv.height = fr.clientHeight, c = cv.getContext('2d');
    var ps = [], t0 = performance.now(), last = 0;
    var cols = ['#ffd23f', '#ff5a1a', '#fff', '#5d9fc4', '#7bd36b', '#ff7ab6'];
    function burst() {
      var x = W * (.15 + Math.random() * .7), y = H * (.12 + Math.random() * .4), col = cols[Math.floor(Math.random() * cols.length)];
      pop();
      for (var i = 0; i < 46; i++) { var a = Math.random() * 6.283, v = 1.5 + Math.random() * 3.2; ps.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, l: 1, c: col }); }
    }
    (function f(n) {
      var e = n - t0;
      c.clearRect(0, 0, W, H);
      if (e < 4200 && e - last > 380) { burst(); last = e; }
      ps.forEach(function (p) {
        p.x += p.vx; p.y += p.vy; p.vy += .045; p.vx *= .99; p.l -= .012;
        c.globalAlpha = Math.max(0, p.l); c.fillStyle = p.c; c.beginPath(); c.arc(p.x, p.y, 2.6, 0, 6.283); c.fill();
      });
      ps = ps.filter(function (p) { return p.l > 0; });
      c.globalAlpha = 1;
      if (e < 4200 || ps.length) requestAnimationFrame(f); else c.clearRect(0, 0, W, H);
    })(t0);
  }

  // ---------- Spel ----------
  var here = 'korst', throws = 0, busy = false, ovm = false, trail = ['korst'];
  var vis = { korst: true }, done = false, cheat = false;
  function nVis() { return Object.keys(vis).length; }
  function place(k) { var p = S[k].p; tok.setAttribute('transform', 'translate(' + p[0] + ',' + p[1] + ')'); }
  function fmt(x) { return x[1] === 12 ? x[0] + ' of hoger' : (x[0] + ' of ' + x[1]); }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  function refresh() {
    $('here').textContent = 'Je bent nu bij: ' + S[here].n;
    $('cnt').textContent = 'Worpen: ' + throws + (cheat ? ' · cheat actief' : '');
    each('.gesteente-rt', function (p) {
      p.classList.remove('opt', 'act');
      if (T[here].some(function (o) { return o.r === p.dataset.r; })) p.classList.add('opt');
    });
    $('chips').innerHTML = Object.keys(S).map(function (k) {
      return '<span class="gesteente-chip' + (vis[k] ? ' v' : '') + (k === here ? ' h' : '') + '">' + (vis[k] ? '✓ ' : '') + SH[k] + '</span>';
    }).join('');
    $('need').hidden = done;
    $('need').innerHTML = done ? '' : '<b>Wat moet je gooien?</b> (het totaal van beide dobbelstenen)<ul>' +
      T[here].map(function (o) { return '<li><b>' + fmt(o.s) + '</b> → ' + R[o.r].n + ', naar ' + S[o.to].n + '</li>'; }).join('') +
      '</ul><small>Gooi je iets anders? Dan blijf je staan.</small>';
    $('trail').textContent = 'Route: ' + trail.map(function (k) { return S[k].n; }).join(' → ');
  }

  function setStart(k) {
    here = k; throws = 0; trail = [k]; vis = {}; vis[k] = true; done = false; cheat = false;
    $('end').hidden = true; $('go').disabled = false; $('st').value = k;
    place(k);
    if (!ovm) camTo(k, 900);
    refresh();
    $('msg').textContent = 'Je start bij ' + S[k].n + '. Gooi de dobbelstenen en kijk of je een proces ondergaat.';
  }

  // De pion reist over de route; een opheffing heeft twee delen (rechts uit beeld, links weer in beeld)
  function travel(o) {
    var segs = [].slice.call(document.querySelectorAll('.gesteente-rt.base[data-r="' + o.r + '"]'));
    each('.gesteente-rt.dash[data-r="' + o.r + '"]', function (p) { p.classList.add('act'); });
    var i = 0;
    function run() {
      var path = segs[i], L = path.getTotalLength(), dur = segs.length > 1 ? 2200 : 3200, t0 = performance.now();
      (function f(n) {
        var t = Math.min(1, (n - t0) / dur), e = ease(t), p = path.getPointAtLength(e * L);
        tok.setAttribute('transform', 'translate(' + p.x + ',' + p.y + ')');
        if (!ovm) cam(p.x, p.y, Math.max(800, CV[o.from][2] * (1 - e) + CV[o.to][2] * e) + 350 * Math.sin(Math.PI * t));
        if (t < 1) requestAnimationFrame(f);
        else if (++i < segs.length) { $('msg').innerHTML = 'Je verdwijnt rechts uit beeld en komt links weer boven de grond.'; setTimeout(run, 600); }
        else arrive();
      })(t0);
    }
    function arrive() {
      here = o.to; trail.push(o.to); vis[o.to] = true; busy = false;
      if (nVis() === 7) { finish(); return; }
      $('go').disabled = false;
      refresh();
      $('msg').innerHTML = 'Aangekomen bij <b>' + S[here].n + '</b> na ' + throws + ' worpen.';
      if (!ovm) camTo(here, 500);
    }
    run();
  }

  function finish() {
    done = true; refresh();
    if (!ovm) camTo(here, 500);
    fanfare(); fireworks();
    $('msg').innerHTML = 'Je bent langs alle 7 plekken geweest!';
    $('end').hidden = false;
    var q = qual();
    $('end').innerHTML = '<b>Klaar!</b> Je doorliep de complete gesteentecyclus in <b>' + throws + ' worpen</b>.<br>' +
      (q ? 'Je staat in de top 10!<br><input id="gesteente-nm" maxlength="20" placeholder="Jouw naam" aria-label="Jouw naam"><button class="btn" id="gesteente-sv" type="button">Opslaan in ranglijst</button>'
         : (cheat ? 'Je gebruikte de cheat, dus je komt niet in de ranglijst.<br>' : 'Helaas, de top 10 is sneller. Probeer het nog eens!<br>')) +
      '<button class="btn ghost" id="gesteente-again" type="button">Opnieuw spelen</button>';
    if (q) $('sv').addEventListener('click', save);
    $('again').addEventListener('click', function () { setStart(here); $('lb').hidden = true; });
  }

  // ---------- Ranglijst: top 10 per apparaat ----------
  var KEY = 'cranenklas-gesteentecyclus-top10';
  function loadLb() {
    try { var x = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(x) ? x : []; } catch (e) { return []; }
  }
  var LB = loadLb();
  function qual() { return !cheat && (LB.length < 10 || throws < LB[LB.length - 1].t); }
  function save() {
    var nm = ($('nm').value || '').trim() || 'Anoniem';
    LB.push({ n: nm, t: throws, d: new Date().toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' }), r: trail.slice() });
    LB.sort(function (a, b) { return a.t - b.t; });
    LB = LB.slice(0, 10);
    try { localStorage.setItem(KEY, JSON.stringify(LB)); } catch (e) {}
    $('sv').disabled = true; $('sv').textContent = 'Opgeslagen ✓';
    showLb();
  }
  function showLb() {
    $('lb').hidden = false;
    $('lb').innerHTML = '<b>Ranglijst</b> (top 10 op dit apparaat, minste worpen bovenaan)' + (LB.length
      ? '<table><tr><th>#</th><th>Naam</th><th>Worpen</th><th>Datum</th><th>Route</th></tr>' + LB.map(function (r, i) {
          return '<tr><td>' + (i + 1) + '</td><td>' + esc(r.n) + '</td><td>' + esc(r.t) + '</td><td>' + esc(r.d) + '</td><td><details><summary>Bekijk</summary>' +
            (r.r || []).map(function (k) { return esc(SH[k] || k); }).join(' → ') + '</details></td></tr>';
        }).join('') + '</table>'
      : '<p>Nog geen scores op dit apparaat.</p>');
  }
  $('lbb').addEventListener('click', function () {
    if (!$('lb').hidden) $('lb').hidden = true; else showLb();
  });

  // ---------- Gooien ----------
  $('go').addEventListener('click', function () {
    if (busy) return;
    busy = true; $('go').disabled = true; throws++;
    $('cnt').textContent = 'Worpen: ' + throws + (cheat ? ' · cheat actief' : '');
    diceSound();
    $('d1').classList.add('roll'); $('d2').classList.add('roll');
    var iv = setInterval(function () { face($('d1'), 1 + Math.floor(Math.random() * 6)); face($('d2'), 1 + Math.floor(Math.random() * 6)); }, 90);
    setTimeout(function () {
      clearInterval(iv);
      var a = 1 + Math.floor(Math.random() * 6), b = 1 + Math.floor(Math.random() * 6), s = a + b;
      face($('d1'), a); face($('d2'), b);
      $('d1').classList.remove('roll'); $('d2').classList.remove('roll');
      var o = T[here].filter(function (o) { return s >= o.s[0] && s <= o.s[1]; })[0];
      if (o) {
        o.from = here;
        $('msg').innerHTML = 'Je gooide <b>' + s + '</b> (' + a + '+' + b + '). Proces: <b>' + R[o.r].n + '</b>! Je reist naar ' + S[o.to].n + '.';
        setTimeout(function () { travel(o); }, 700);
      } else {
        $('msg').innerHTML = 'Je gooide <b>' + s + '</b> (' + a + '+' + b + '). Geen proces: je blijft bij <b>' + S[here].n + '</b>.';
        busy = false; $('go').disabled = false;
      }
    }, 900);
  });

  // ---------- Cheat (telt niet als worp; geen ranglijst) ----------
  document.addEventListener('keydown', function (e) {
    if (busy || done || /INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName)) return;
    if (e.key === '1' || e.key === '2') {
      var o = T[here][+e.key - 1];
      if (!o) return;
      o.from = here; cheat = true; busy = true; $('go').disabled = true;
      $('msg').innerHTML = '<b>Cheat</b>: ' + R[o.r].n + ' naar ' + S[o.to].n + '.';
      travel(o);
    } else if (e.key === '0' && trail.length > 1) {
      cheat = true; trail.pop(); here = trail[trail.length - 1]; place(here);
      if (!ovm) camTo(here, 600);
      refresh();
      $('msg').innerHTML = '<b>Cheat</b>: een plek terug naar ' + S[here].n + '.';
    }
  });

  // ---------- Overzicht / camera volgen en startplek ----------
  $('ov').addEventListener('click', function () {
    ovm = !ovm;
    $('ov').textContent = ovm ? 'Camera volgen' : 'Overzicht';
    if (ovm) animVB(VX, 900); else camTo(here, 900);
  });
  Object.keys(S).forEach(function (k) {
    var o = document.createElement('option'); o.value = k; o.textContent = S[k].n; $('st').appendChild(o);
  });
  $('st').addEventListener('change', function (e) { if (!busy) setStart(e.target.value); });

  setStart('korst');
  cam(CV.korst[0], CV.korst[1], CV.korst[2]);

  // Sidebar in- en uitklappen
  var layout = document.querySelector('.layout');
  var toggle = document.getElementById('toggle');
  toggle.addEventListener('click', function () {
    var collapsed = layout.classList.toggle('collapsed');
    toggle.setAttribute('aria-expanded', String(!collapsed));
    toggle.setAttribute('aria-label', collapsed ? 'Sidebar uitklappen' : 'Sidebar inklappen');
    document.getElementById('sideList').hidden = collapsed;
  });

  // Links die voorlopig nog niets doen (Over mij, Contact)
  document.querySelectorAll('[data-stub]').forEach(function (a) {
    a.addEventListener('click', function (e) { e.preventDefault(); });
  });
})();
