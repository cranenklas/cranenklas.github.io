// ===========================================================
// Cranenklas aardrijkskunde — tool "Lagen van de aarde"
// Startscherm: kwartdoorsnede met drie hoofdlagen (korst, mantel,
// kern). Een klik op een startknop (of laag) zoomt in en splitst die
// hoofdlaag in deellagen; een klik op een subknop (of deellaag) zoomt
// naar die laag en toont de uitleg in een tekstvak. Regelt ook de sidebar.
// ===========================================================
(function () {
  var sv = document.getElementById('sv');
  var box = document.getElementById('box');
  var back = document.getElementById('reset');
  var mains = [].slice.call(document.querySelectorAll('#col .main'));
  var subs = [].slice.call(document.querySelectorAll('#col .sub'));
  var rings = {}, paths = {};
  document.querySelectorAll('.ring').forEach(function (g) {
    rings[g.dataset.id] = g;
    paths[g.dataset.id] = g.querySelector('path');
    g.addEventListener('animationend', function () { g.classList.remove('pulse'); });
  });

  // Let op: de getallen in L, GV en V zijn zo doorgerekend dat het tekstvak
  // de gekozen laag nooit bedekt. Niet zomaar aanpassen.
  // L: per laag de stralen [buiten, binnen] samengevoegd (o) en gesplitst (d),
  //    en de kleur samengevoegd (co) en gesplitst (cd).
  var L = {
    korst:   { g: 'korst',  o: [580, 574], d: [580, 574], co: '#5a4636', cd: '#5a4636' },
    litho:   { g: 'korst',  o: [574, 534], d: [568, 534], co: '#5a4636', cd: '#ff0000' },
    astheno: { g: 'mantel', o: [528, 489], d: [528, 492], co: '#ff7f00', cd: '#ff3c00' },
    mantel:  { g: 'mantel', o: [489, 206], d: [486, 206], co: '#ff7f00', cd: '#ff7f00' },
    buiten:  { g: 'kern',   o: [200, 73],  d: [200, 76],  co: '#ffb800', cd: '#ffb800' },
    binnen:  { g: 'kern',   o: [73, 0],    d: [70, 0],    co: '#ffb800', cd: '#fff700' }
  };
  var GOF = { korst: 'korst', litho: 'korst', astheno: 'mantel', mantel: 'mantel', buiten: 'kern', binnen: 'kern' };
  var MEMBERS = { korst: ['korst', 'litho'], mantel: ['astheno', 'mantel'], kern: ['buiten', 'binnen'] };
  // GV: zoom (viewBox x, y, grootte) per hoofdlaag; V: zoom per deellaag + plek van het tekstvak
  var GV = { korst: [100, -15, 300], mantel: [60, -15, 400], kern: [-10, 272, 340] };
  var V = { over: [-10, -15, 630], korst: [240, 5, 260, 'tr'], litho: [40, 35, 280, 'br'], astheno: [100, -15, 260, 'tr'], mantel: [90, -15, 400, 'tr'], buiten: [-10, 272, 340, 'tr'], binnen: [-10, 272, 340, 'tr'] };
  var D = {
    korst: { t: 'Continentale- en oceanische korst', x: ['De buitenste laag van de aarde bestaat uit continentale- en oceanische korst.', 'Continentale korst (gemiddeld 35 km dik) bestaat vooral uit graniet. Graniet is harder (sterker) dan basalt. Oceanische korst (gemiddeld 7 km dik) bestaat uit basaltgesteente.'] },
    litho: { t: 'Lithosfeer', x: ['De lithosfeer is een harde (en breekbare) laag die drijft op de vloeibare laag eronder. Deze laag is gemiddeld 60 tot 150 km dik.'] },
    astheno: { t: 'Asthenosfeer', x: ['Dit is het bovenste en meest vloeibare gedeelte van de mantel. Door radioactief verval ontstaat hitte die gesteente doet smelten in hotspots. Deze hotspots zorgen voor processen waardoor aardbevingen en vulkanen ontstaan en de constante druk die wordt uitgeoefend op de aardkorstplaten.'] },
    mantel: { t: '(Beneden)mantel', x: ['Dit is de grootste laag van de aarde. Ongeveer 80% van het volume van de aarde bestaat uit de mantel. Deze laag is heter dan de asthenosfeer, maar door de gigantische druk vaster.'] },
    buiten: { t: 'Buitenkern', x: ['De buitenste laag van de kern bestaat uit vloeibaar ijzer en stroomt om de binnenkern heen. Hierdoor ontstaat het magnetisch veld om de aarde.'] },
    binnen: { t: 'Binnenkern', x: ['De binnenste laag van de aarde is een vaste bal van vooral ijzer en wat nikkel. De binnenkern blijft vast ondanks de extreme hitte door de enorme druk.'] }
  };

  // S: hoe ver elke hoofdlaag gesplitst is (0 = samen, 1 = gesplitst)
  var S = { korst: 0, mantel: 0, kern: 0 };
  var cur = V.over.slice(0, 3), raf = 0, timer = 0, grp = null;

  function lerp(a, b, t) { return a + (b - a) * t; }
  function hex(c) { return [1, 3, 5].map(function (i) { return parseInt(c.substr(i, 2), 16); }); }
  function mix(a, b, t) {
    var x = hex(a), y = hex(b);
    return 'rgb(' + x.map(function (v, i) { return Math.round(v + (y[i] - v) * t); }).join(',') + ')';
  }
  // Pad van een kwartring met buitenstraal R en binnenstraal r (middelpunt linksonder, 0,600)
  function pd(R, r) {
    return r > 0
      ? 'M0 ' + (600 - R) + 'A' + R + ' ' + R + ' 0 0 1 ' + R + ' 600L' + r + ' 600A' + r + ' ' + r + ' 0 0 0 0 ' + (600 - r) + 'Z'
      : 'M0 ' + (600 - R) + 'A' + R + ' ' + R + ' 0 0 1 ' + R + ' 600L0 600Z';
  }

  function render() {
    Object.keys(L).forEach(function (k) {
      var l = L[k], s = S[l.g], p = paths[k], c = mix(l.co, l.cd, s);
      p.setAttribute('d', pd(lerp(l.o[0], l.d[0], s), lerp(l.o[1], l.d[1], s)));
      p.setAttribute('fill', c);
      p.setAttribute('stroke', c);
      p.setAttribute('stroke-width', (1.2 * (1 - s)).toFixed(2));
    });
  }

  // Vloeiend zoomen naar viewBox v en tegelijk splitsen/samenvoegen naar st
  function go(v, st) {
    cancelAnimationFrame(raf);
    var a = cur.slice(), sa = Object.assign({}, S), t0 = performance.now(), dur = 900;
    function f(n) {
      var k = Math.min(1, (n - t0) / dur), e = k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      cur = a.map(function (x, i) { return x + (v[i] - x) * e; });
      sv.setAttribute('viewBox', cur[0] + ' ' + cur[1] + ' ' + cur[2] + ' ' + cur[2]);
      for (var g in S) S[g] = sa[g] + (st[g] - sa[g]) * e;
      render();
      if (k < 1) raf = requestAnimationFrame(f);
    }
    raf = requestAnimationFrame(f);
  }

  function pulse(ids) {
    ids.forEach(function (id) {
      var g = rings[id];
      g.classList.remove('pulse');
      void g.getBoundingClientRect();
      g.classList.add('pulse');
    });
  }
  function split(g) { return { korst: g === 'korst' ? 1 : 0, mantel: g === 'mantel' ? 1 : 0, kern: g === 'kern' ? 1 : 0 }; }

  // Startknop gekozen: inzoomen op de hoofdlaag en die splitsen
  function openGroup(g) {
    grp = g; clearTimeout(timer); box.classList.remove('on');
    mains.forEach(function (b) { var own = b.dataset.g === g; b.classList.toggle('gone', !own); b.classList.toggle('title', own); });
    subs.forEach(function (b) { b.classList.toggle('gone', GOF[b.dataset.id] !== g); b.classList.remove('active'); });
    back.classList.remove('gone');
    Object.keys(rings).forEach(function (k) { rings[k].classList.toggle('dim', GOF[k] !== g); });
    go(GV[g], split(g));
  }

  // Subknop gekozen: zoomen naar de deellaag, daarna het tekstvak tonen
  function openSub(id) {
    var g = GOF[id];
    if (grp !== g) { openGroup(g); return; }
    clearTimeout(timer); box.classList.remove('on');
    subs.forEach(function (b) { b.classList.toggle('active', b.dataset.id === id); });
    Object.keys(rings).forEach(function (k) { rings[k].classList.toggle('dim', k !== id); });
    go(V[id], split(g));
    timer = setTimeout(function () {
      var d = D[id];
      box.innerHTML = '<h3>' + d.t + '</h3>' + d.x.map(function (p) { return '<p>' + p + '</p>'; }).join('');
      box.className = 'lagen-box ' + V[id][3] + ' on';
    }, 750);
  }

  // Knop "Terug" onder de knoppen: alles terug naar het startscherm
  function reset() {
    grp = null; clearTimeout(timer); box.classList.remove('on');
    mains.forEach(function (b) { b.classList.remove('gone', 'title'); });
    subs.forEach(function (b) { b.classList.add('gone'); b.classList.remove('active'); });
    back.classList.add('gone');
    Object.keys(rings).forEach(function (k) { rings[k].classList.remove('dim'); });
    go(V.over, split(null));
  }

  mains.forEach(function (b) {
    b.addEventListener('click', function () { openGroup(b.dataset.g); });
    ['mouseenter', 'focus'].forEach(function (ev) {
      b.addEventListener(ev, function () { if (grp === null) pulse(MEMBERS[b.dataset.g]); });
    });
  });
  subs.forEach(function (b) {
    b.addEventListener('click', function () { openSub(b.dataset.id); });
    ['mouseenter', 'focus'].forEach(function (ev) {
      b.addEventListener(ev, function () { pulse([b.dataset.id]); });
    });
  });
  Object.keys(rings).forEach(function (k) {
    rings[k].addEventListener('click', function () { if (grp === null) openGroup(GOF[k]); else openSub(k); });
    rings[k].addEventListener('mouseenter', function () { if (grp === null) pulse(MEMBERS[GOF[k]]); else pulse([k]); });
  });
  back.addEventListener('click', reset);

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
