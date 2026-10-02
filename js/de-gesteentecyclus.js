// ===========================================================
// Cranenklas aardrijkskunde — tool "De gesteentecyclus"
// Spel: gooi twee dobbelstenen en doorloop alle 7 plekken van de
// gesteentecyclus met zo min mogelijk worpen. De som bepaalt of een
// proces gebeurt. De camera verschuift en schaalt de hele kaart met
// een CSS-transform (de viewBox blijft altijd gelijk); het venster mag
// elke verhouding hebben. Extra: klik op de magmabel (uitbarsting) of
// op een wolk (regen). Regen, lava, rook en vuurwerk worden op een
// canvas over het venster getekend. Geluid via de Web Audio API,
// ranglijst per apparaat, en de sidebar.
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
  // SH: korte namen voor de bovenste rij, de keuzelijst en de ranglijst
  var SH = { korst: 'Korst', regoliet: 'Regoliet', sediment: 'Sediment', sed: 'Sedimentair', meta: 'Metamorf', magma: 'Magma', ign: 'Stolling' };

  var map = $('map'), tok = $('tok'), routes = $('routes'), labels = $('labels'), frame = $('frame');

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
  // De tekening blijft vast (viewBox 0 -150 2000 1250) en wordt met CSS verschoven
  // en geschaald. Een camerastand c = [midden x, midden y, breedte] past altijd
  // helemaal in het venster (de kleinste van de twee schalen).
  // X0, Y0 = linksboven in beeld (kaartcoördinaten), SC = pixels per kaarteenheid.
  var fw = 1, fh = 1, B = 1, camS = [430, 310, 864], X0 = 0, Y0 = -150, SC = 1, ovm = false;
  var fx = $('fx'), ctx = fx.getContext('2d');
  function measure() {
    fw = frame.clientWidth; fh = frame.clientHeight; B = Math.min(fw / 800, fh / 500);
    map.style.width = 2000 * B + 'px';
    fx.width = fw; fx.height = fh;
  }
  function setCam(c) {
    camS = c;
    var w = c[2], h = w * .625, s = Math.min(fw / w, fh / h), vw = fw / s, vh = fh / s;
    var x = c[0] - vw / 2, y = c[1] - vh / 2;
    x = vw >= 2000 ? (2000 - vw) / 2 : Math.max(0, Math.min(2000 - vw, x));
    y = vh >= 1250 ? 1100 - vh : Math.max(-150, Math.min(1100 - vh, y));
    X0 = x; Y0 = y; SC = s;
    map.style.transform = 'translate(' + (-x * s) + 'px,' + (-(y + 150) * s) + 'px) scale(' + (s / B) + ')';
  }
  function ovCam() { return [1000, 1100, Math.min(2000, 3200 * fh / fw)]; }
  function ease(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  // Een nieuwe camerabeweging stopt een vorige die nog bezig is
  var camAnim = 0;
  function animCam(to, dur, done) {
    var from = camS.slice(), t0 = performance.now(), id = ++camAnim;
    (function f(n) {
      if (id !== camAnim) return;
      var t = Math.min(1, (n - t0) / dur), e = ease(t);
      setCam(from.map(function (v, i) { return v + (to[i] - v) * e; }));
      if (t < 1) requestAnimationFrame(f); else if (done) done();
    })(t0);
  }
  // CV: camerastand per plek [midden x, midden y, breedte]
  var CV = { korst: [430, 310, 864], regoliet: [730, 285, 800], sediment: [1050, 560, 900], sed: [1250, 620, 900], meta: [1250, 820, 900], magma: [1550, 800, 960], ign: [1536, 330, 928] };
  function camTo(k, dur, done) { animCam(CV[k], dur, done); }
  function home() { return ovm ? ovCam() : CV[here]; }

  // ---------- Geluid (Web Audio API, zonder geluidsbestanden) ----------
  var AC = null, sound = true, rainNode = null;
  function ac() {
    if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} }
    if (AC && AC.state === 'suspended') AC.resume();
    return AC;
  }
  function nbuf(dur, fade) {
    var n = Math.floor(AC.sampleRate * dur), b = AC.createBuffer(1, n, AC.sampleRate), d = b.getChannelData(0);
    for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (fade ? 1 - i / n : 1);
    return b;
  }
  function noise(t, dur, f, g, type) {
    var src = AC.createBufferSource(); src.buffer = nbuf(dur, true);
    var fl = AC.createBiquadFilter(); fl.type = type || 'bandpass'; fl.frequency.value = f; fl.Q.value = 1.2;
    var gn = AC.createGain(); gn.gain.value = g;
    src.connect(fl); fl.connect(gn); gn.connect(AC.destination); src.start(t);
  }
  function tone(t, fq, dur, g, type, fq2) {
    var o = AC.createOscillator(), gn = AC.createGain();
    o.type = type || 'triangle'; o.frequency.setValueAtTime(fq, t);
    if (fq2) o.frequency.exponentialRampToValueAtTime(fq2, t + dur);
    gn.gain.setValueAtTime(0, t); gn.gain.linearRampToValueAtTime(g, t + .02); gn.gain.exponentialRampToValueAtTime(.001, t + dur);
    o.connect(gn); gn.connect(AC.destination); o.start(t); o.stop(t + dur + .05);
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
  // Uitbarsting: aanzwellende lage dreun, knal na 1,2 s, daarna rommelen
  function boom(delay) {
    if (!sound || !ac()) return;
    var t = AC.currentTime + delay;
    var src = AC.createBufferSource(); src.buffer = nbuf(5.2, false);
    var lp = AC.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 110;
    var g = AC.createGain();
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.5, t + 1.15); g.gain.linearRampToValueAtTime(1.1, t + 1.3);
    g.gain.linearRampToValueAtTime(.55, t + 3); g.gain.linearRampToValueAtTime(0, t + 5.1);
    src.connect(lp); lp.connect(g); g.connect(AC.destination); src.start(t);
    noise(t + 1.2, 1.8, 380, 1.3, 'lowpass'); noise(t + 1.2, .5, 1800, .5); tone(t + 1.2, 95, 1.4, .7, 'sine', 32);
    for (var i = 0; i < 9; i++) noise(t + 1.5 + Math.random() * 2.6, .18, 300 + Math.random() * 500, .45, 'lowpass');
  }
  // Zacht regengeluid zolang een van de wolken regent (en het geluid aan staat)
  function rainSound() {
    var want = sound && (rain.c1 || rain.c2);
    if (want && !rainNode && ac()) {
      var src = AC.createBufferSource(); src.buffer = nbuf(2, false); src.loop = true;
      var hp = AC.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 1800;
      var g = AC.createGain(); g.gain.value = .06;
      src.connect(hp); hp.connect(g); g.connect(AC.destination); src.start(); rainNode = src;
    } else if (!want && rainNode) { try { rainNode.stop(); } catch (e) {} rainNode = null; }
  }
  $('snd').addEventListener('click', function () {
    sound = !sound;
    $('snd').textContent = 'Geluid: ' + (sound ? 'aan' : 'uit');
    if (sound) ac();
    rainSound();
  });

  // ---------- Effecten op het canvas (regen, uitbarsting, rook, vuurwerk) en borrelend magma ----------
  // SURF: het aardoppervlak (regen en lava stoppen daar)
  var SURF = [[0, 230], [120, 190], [215, 150], [275, 188], [380, 68], [520, 190], [600, 232], [760, 300], [1480, 300], [1640, 150], [1700, 128], [1760, 128], [1830, 150], [2000, 300]];
  function surfY(x) {
    for (var i = 1; i < SURF.length; i++) {
      if (x <= SURF[i][0]) { var a = SURF[i - 1], b = SURF[i]; return a[1] + (b[1] - a[1]) * (x - a[0]) / (b[0] - a[0]); }
    }
    return 300;
  }
  // CL: per wolk [links, rechts, onderkant] waar de regen begint
  var CL = { c1: [540, 735, 122], c2: [1305, 1515, 126] };
  var rain = { c1: false, c2: false };
  var drops = [], lava = [], smoke = [], fwP = [], erupt = null, smoking = false, fwT = null, lastSmoke = 0, lastFw = 0, lastT = 0;
  ['c1', 'c2'].forEach(function (id) {
    $(id).addEventListener('click', function () {
      rain[id] = !rain[id];
      $(id).setAttribute('fill', rain[id] ? '#aeb9c4' : '#fff');
      rainSound();
    });
  });
  var bubs = [].map.call(document.querySelectorAll('#gesteente-map .gesteente-bub circle'), function (el, i) {
    return { el: el, bx: +el.getAttribute('cx'), by: +el.getAttribute('cy'), r: +el.getAttribute('r'), ph: i * 1.7, per: 3200 + (i * 731) % 2600 };
  });
  var cond = $('cond'), condL = cond.getTotalLength();
  var CR = [1730, 126];   // krater

  function X(x) { return (x - X0) * SC; }
  function Y(y) { return (y - Y0) * SC; }
  function loop(now) {
    var dt = Math.min(3, (now - lastT) / 16.7 || 1), i, p;
    lastT = now;
    // Magma borrelt alleen als het in beeld is: rondjes draaien, stijgen, krimpen en beginnen opnieuw
    if (Y0 + fh / SC > 880) bubs.forEach(function (b) {
      var t = ((now + b.ph * 900) % b.per) / b.per, a = t * 12.566 + b.ph;
      b.el.setAttribute('cx', (b.bx + 7 * Math.cos(a)).toFixed(1));
      b.el.setAttribute('cy', (b.by - 34 * t + 7 * Math.sin(a)).toFixed(1));
      b.el.setAttribute('r', (b.r * Math.min(1, t / .15) * (t < .75 ? 1 : 1 - (t - .75) / .25)).toFixed(1));
    });
    ctx.clearRect(0, 0, fw, fh);
    // Regen
    ['c1', 'c2'].forEach(function (id) {
      if (!rain[id]) return;
      var c = CL[id];
      for (var j = 0; j < 3 * dt; j++) drops.push({ x: c[0] + Math.random() * (c[1] - c[0]), y: c[2], v: 9 + Math.random() * 4 });
    });
    if (drops.length) {
      ctx.strokeStyle = '#3f86b5'; ctx.lineWidth = Math.max(1, 2.4 * SC); ctx.lineCap = 'round'; ctx.beginPath();
      drops.forEach(function (d) { d.y += d.v * dt; d.x -= 1.6 * dt; ctx.moveTo(X(d.x), Y(d.y)); ctx.lineTo(X(d.x + 3), Y(d.y - 15)); });
      ctx.stroke();
      drops = drops.filter(function (d) { return d.y < surfY(d.x); });
    }
    // Uitbarsting: magma stijgt door de pijp (0-1,2 s), knal en lava (1,2-4,3 s), klaar na 5 s
    if (erupt) {
      var e = now - erupt.t0;
      if (e >= 0 && e < 1200) {
        p = cond.getPointAtLength(condL * Math.min(1, e / 1100));
        ctx.fillStyle = '#ffe27a'; ctx.globalAlpha = .9; ctx.beginPath();
        ctx.arc(X(p.x), Y(p.y), (22 + 6 * Math.sin(e / 40)) * SC, 0, 6.283); ctx.fill(); ctx.globalAlpha = 1;
      }
      if (e >= 1200 && !erupt.bang) {
        erupt.bang = true;
        frame.classList.add('shk');
        setTimeout(function () { frame.classList.remove('shk'); }, 900);
        for (i = 0; i < 90; i++) lava.push(mkLava(1.6));
      }
      if (e >= 1200 && e < 4300) for (i = 0; i < 2.2 * dt; i++) lava.push(mkLava(1));
      if (e >= 5000) {
        smoking = erupt.smoke; erupt = null; busy = false;
        if (!done) $('go').disabled = false;
        animCam(home(), 800);
        $('msg').innerHTML = 'De vulkaan is uitgebarsten. Er blijft rook en as uit de krater komen.';
      }
    }
    lava.forEach(function (p) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += .42 * dt; p.l -= .006 * dt; });
    lava = lava.filter(function (p) { return p.l > 0 && p.y < surfY(Math.max(0, Math.min(2000, p.x))) + 6; });
    lava.forEach(function (p) { ctx.fillStyle = p.c; ctx.beginPath(); ctx.arc(X(p.x), Y(p.y), p.r * SC, 0, 6.283); ctx.fill(); });
    // Rook en as: dik tijdens de uitbarsting, daarna rustig zolang het spel duurt
    var er = erupt && now - erupt.t0 >= 1200;
    if ((er || smoking) && now - lastSmoke > (er ? 45 : 150)) {
      lastSmoke = now;
      smoke.push({ x: CR[0] + (Math.random() * 40 - 20), y: CR[1] - 6, vx: .5 + Math.random() * 1.1, vy: -(er ? 3.4 : 1.9) - Math.random() * 1.2, r: 13 + Math.random() * 10, g: .2 + Math.random() * .18, c: Math.random() < .5 ? '#262427' : '#4b4649' });
    }
    smoke.forEach(function (p) { p.x += p.vx * dt; p.y += p.vy * dt; p.r += p.g * dt; });
    smoke = smoke.filter(function (p) { return p.y + p.r > -170 && p.x - p.r < 2020; });
    if (smoke.length) {
      ctx.globalAlpha = .78;
      smoke.forEach(function (p) { ctx.fillStyle = p.c; ctx.beginPath(); ctx.arc(X(p.x), Y(p.y), p.r * SC, 0, 6.283); ctx.fill(); });
      ctx.globalAlpha = 1;
    }
    // Vuurwerk (in schermpixels, niet in kaartcoördinaten)
    if (fwT !== null) {
      var fe = now - fwT;
      if (fe < 4200 && now - lastFw > 380) { lastFw = now; burst(); }
      fwP.forEach(function (p) {
        p.x += p.vx * dt; p.y += p.vy * dt; p.vy += .045 * dt; p.vx *= .99; p.l -= .012 * dt;
        ctx.globalAlpha = Math.max(0, p.l); ctx.fillStyle = p.c; ctx.beginPath(); ctx.arc(p.x, p.y, 2.6, 0, 6.283); ctx.fill();
      });
      fwP = fwP.filter(function (p) { return p.l > 0; });
      ctx.globalAlpha = 1;
      if (fe >= 4200 && !fwP.length) fwT = null;
    }
    requestAnimationFrame(loop);
  }
  function mkLava(k) {
    var a = -Math.PI / 2 + (Math.random() - .5) * 1.25, v = (9 + Math.random() * 13) * k;
    return { x: CR[0] + (Math.random() * 30 - 15), y: CR[1], vx: Math.cos(a) * v, vy: Math.sin(a) * v, r: 3 + Math.random() * 5, l: 1, c: ['#ff5a1a', '#ffb01a', '#ffd23f', '#c8330f'][Math.floor(Math.random() * 4)] };
  }
  var cols = ['#ffd23f', '#ff5a1a', '#fff', '#5d9fc4', '#7bd36b', '#ff7ab6'];
  function burst() {
    var x = fw * (.15 + Math.random() * .7), y = fh * (.12 + Math.random() * .4), col = cols[Math.floor(Math.random() * cols.length)];
    pop();
    for (var i = 0; i < 46; i++) { var a = Math.random() * 6.283, v = 1.5 + Math.random() * 3.2; fwP.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, l: 1, c: col }); }
  }
  function fireworks() { fwT = performance.now(); lastFw = 0; }

  // Klik op de magmabel: camera naar magmabel + krater, magma stijgt op, uitbarsting (samen 5 s)
  $('chamber').addEventListener('click', function () {
    if (busy || erupt) return;
    busy = true; $('go').disabled = true;
    $('msg').innerHTML = 'Het magma stijgt op door de vulkaanpijp…';
    var d = ovm ? 0 : 800;
    if (!ovm) animCam([1650, 500, 1700], d);
    erupt = { t0: performance.now() + d, bang: false, smoke: true };
    boom(d / 1000);
  });

  // ---------- Spel ----------
  var here = 'korst', throws = 0, busy = false, trail = ['korst'];
  var vis = { korst: true }, done = false, cheat = false;
  function nVis() { return Object.keys(vis).length; }
  function place(k) { var p = S[k].p; tok.setAttribute('transform', 'translate(' + p[0] + ',' + p[1] + ')'); }
  function fmt(x) { return x[1] === 12 ? x[0] + ' of hoger' : (x[0] + ' of ' + x[1]); }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  function refresh() {
    $('cnt').textContent = 'Worpen: ' + throws + (cheat ? ' · cheat actief' : '');
    each('.gesteente-rt', function (p) {
      p.classList.remove('opt', 'act');
      if (T[here].some(function (o) { return o.r === p.dataset.r; })) p.classList.add('opt');
    });
    $('chips').innerHTML = Object.keys(S).map(function (k) {
      return '<span class="gesteente-chip' + (vis[k] ? ' v' : '') + (k === here ? ' h' : '') + '">' + (vis[k] ? '✓ ' : '') + SH[k] + '</span>';
    }).join('');
    $('need').hidden = done;
    $('need').innerHTML = done ? '' : '<b>Wat moet je gooien?</b><ul>' +
      T[here].map(function (o) { return '<li><b>' + fmt(o.s) + '</b> → ' + R[o.r].n + ', naar ' + S[o.to].n + '</li>'; }).join('') +
      '</ul><small>Iets anders? Dan blijf je staan.</small>';
  }

  function setStart(k) {
    here = k; throws = 0; trail = [k]; vis = {}; vis[k] = true; done = false; cheat = false;
    // Nieuw spel: de rook stopt (ook als er nog een uitbarsting bezig is)
    smoking = false; smoke = []; if (erupt) erupt.smoke = false;
    hidePop(); $('go').disabled = false; $('st').value = k;
    place(k);
    if (!ovm) camTo(k, 900);
    refresh();
    $('msg').textContent = 'Je start bij ' + S[k].n + '. Gooi de dobbelstenen.';
  }

  // De pion reist over de route; een opheffing heeft twee delen (rechts uit beeld, links weer in beeld)
  function travel(o) {
    var segs = [].slice.call(document.querySelectorAll('.gesteente-rt.base[data-r="' + o.r + '"]'));
    each('.gesteente-rt.dash[data-r="' + o.r + '"]', function (p) { p.classList.add('act'); });
    var i = 0;
    camAnim++;
    function run() {
      var path = segs[i], L = path.getTotalLength(), dur = segs.length > 1 ? 2200 : 3200, t0 = performance.now();
      (function f(n) {
        var t = Math.min(1, (n - t0) / dur), e = ease(t), p = path.getPointAtLength(e * L);
        tok.setAttribute('transform', 'translate(' + p.x + ',' + p.y + ')');
        if (!ovm) setCam([p.x, p.y, Math.max(800, CV[o.from][2] * (1 - e) + CV[o.to][2] * e) + 350 * Math.sin(Math.PI * t)]);
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

  // ---------- Pop-up over het spelscherm ----------
  function showPop(html) { $('card').innerHTML = html; $('pop').hidden = false; }
  function hidePop() { $('pop').hidden = true; }

  function finish() {
    done = true; refresh();
    if (!ovm) camTo(here, 500);
    fanfare(); fireworks();
    $('msg').innerHTML = 'Je bent langs alle 7 plekken geweest!';
    var q = qual();
    setTimeout(function () {
      showPop('<b>Klaar!</b> Je doorliep de complete gesteentecyclus in <b>' + throws + ' worpen</b>.<br>' +
        (q ? 'Je staat in de top 10!<br><input id="gesteente-nm" maxlength="20" placeholder="Jouw naam" aria-label="Jouw naam"><button class="btn" id="gesteente-sv" type="button">Opslaan in ranglijst</button>'
           : (cheat ? 'Je gebruikte de cheat, dus je komt niet in de ranglijst.<br>' : 'Helaas, de top 10 is sneller. Probeer het nog eens!<br>')) +
        '<button class="btn ghost" id="gesteente-again" type="button">Opnieuw spelen</button><div id="gesteente-lbin"></div>');
      if (q) $('sv').addEventListener('click', save);
      $('again').addEventListener('click', function () { setStart(here); });
    }, 1600);
  }

  // ---------- Ranglijst: top 10 per apparaat ----------
  var KEY = 'cranenklas-gesteentecyclus-top10';
  function loadLb() {
    try { var x = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(x) ? x : []; } catch (e) { return []; }
  }
  var LB = loadLb();
  function qual() { return !cheat && (LB.length < 10 || throws < LB[LB.length - 1].t); }
  function lbHtml() {
    return '<b>Ranglijst</b> (top 10 op dit apparaat, minste worpen bovenaan)' + (LB.length
      ? '<table><tr><th>#</th><th>Naam</th><th>Worpen</th><th>Datum</th><th>Route</th></tr>' + LB.map(function (r, i) {
          return '<tr><td>' + (i + 1) + '</td><td>' + esc(r.n) + '</td><td>' + esc(r.t) + '</td><td>' + esc(r.d) + '</td><td><details><summary>Bekijk</summary>' +
            (r.r || []).map(function (k) { return esc(SH[k] || k); }).join(' → ') + '</details></td></tr>';
        }).join('') + '</table>'
      : '<p>Nog geen scores op dit apparaat.</p>');
  }
  function save() {
    var nm = ($('nm').value || '').trim() || 'Anoniem';
    LB.push({ n: nm, t: throws, d: new Date().toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' }), r: trail.slice() });
    LB.sort(function (a, b) { return a.t - b.t; });
    LB = LB.slice(0, 10);
    try { localStorage.setItem(KEY, JSON.stringify(LB)); } catch (e) {}
    $('sv').disabled = true; $('sv').textContent = 'Opgeslagen ✓';
    $('lbin').innerHTML = '<br>' + lbHtml();
  }
  $('lbb').addEventListener('click', function () {
    if (!$('pop').hidden && !done) { hidePop(); return; }
    if (done) return;
    showPop(lbHtml() + '<br><button class="btn ghost" id="gesteente-cls" type="button">Sluiten</button>');
    $('cls').addEventListener('click', hidePop);
  });

  // ---------- Gooien ----------
  $('go').addEventListener('click', function () {
    if (busy) return;
    busy = true; $('go').disabled = true; throws++; refresh();
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
        $('msg').innerHTML = 'Je gooide <b>' + s + '</b> (' + a + '+' + b + '). <b>' + R[o.r].n + '</b>! Je reist naar ' + S[o.to].n + '.';
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
      o.from = here; cheat = true; busy = true; $('go').disabled = true; refresh();
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
    if (erupt) return;
    ovm = !ovm;
    $('ov').textContent = ovm ? 'Camera volgen' : 'Overzicht';
    animCam(home(), 900);
  });
  Object.keys(S).forEach(function (k) {
    var o = document.createElement('option'); o.value = k; o.textContent = SH[k]; $('st').appendChild(o);
  });
  $('st').addEventListener('change', function (e) { if (!busy) setStart(e.target.value); else e.target.value = trail[0]; });

  // Camera opnieuw uitrekenen als het venster van grootte verandert (ook bij het in- en uitklappen van de sidebar)
  function fit() { measure(); setCam(busy ? camS : home()); }
  if (window.ResizeObserver) new ResizeObserver(fit).observe(frame); else window.addEventListener('resize', fit);

  measure(); setCam(CV.korst); setStart('korst'); requestAnimationFrame(loop);

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
