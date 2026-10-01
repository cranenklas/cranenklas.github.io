// ===========================================================
// Cranenklas aardrijkskunde — tool "Verdeling van water"
// Vult de beker in 4 seconden, laat daarna de vraag verschijnen,
// controleert het antwoord op de slider en regelt de sidebar.
// ===========================================================
(function () {
  var BOTTOM = 370, H = 318;   // beker: 0% = onderkant, 100% = waterlijn, iets onder de rand (y = 52)
  var cup = document.getElementById('cup');
  var dark = document.getElementById('dark');
  var quiz = document.getElementById('quiz');
  var slider = document.getElementById('slider');
  var valueEl = document.getElementById('value');
  var check = document.getElementById('check');
  var feedback = document.getElementById('feedback');
  var explain = document.getElementById('explain');
  var fresh = document.getElementById('fresh');
  var tool = document.querySelector('.tool');
  var stage = document.getElementById('stage');
  var bar = document.getElementById('bar');
  var barWrap = document.getElementById('barWrap');
  var zoomTimers = [];
  var ANSWER = 97.5;
  var done = false, timer = null;

  // Schaalverdeling in procenten (0%, 10%, ... 100%) langs de beker
  var ns = 'http://www.w3.org/2000/svg';
  var ticks = document.getElementById('ticks');
  for (var p = 0; p <= 100; p += 10) {
    var y = BOTTOM - (p / 100) * H;
    var l = document.createElementNS(ns, 'line');
    l.setAttribute('class', 'tick'); l.setAttribute('x1', 252); l.setAttribute('x2', 290); l.setAttribute('y1', y); l.setAttribute('y2', y);
    ticks.appendChild(l);
    var t = document.createElementNS(ns, 'text');
    t.setAttribute('class', 'tick-label'); t.setAttribute('x', 316); t.setAttribute('y', y + 5);
    t.textContent = p + '%';
    ticks.appendChild(t);
  }

  // Slider: stappen van 1% tot 95%, daarna stappen van 0,5%
  function toValue(i) { return i <= 95 ? i : 95 + (i - 95) * 0.5; }
  function fmt(v) { return String(v).replace('.', ',') + '%'; }
  function pos(v) { var i = v <= 95 ? v : 95 + (v - 95) * 2; return i / 105; }

  var scale = document.getElementById('scale');
  [0, 50, 95, 100].forEach(function (v) {
    var s = document.createElement('span');
    s.textContent = v + '%';
    s.style.left = 'calc(14px + (100% - 28px) * ' + pos(v) + ')';
    scale.appendChild(s);
  });

  function update() {
    var v = toValue(+slider.value);
    valueEl.textContent = fmt(v);
    slider.setAttribute('aria-valuetext', String(v).replace('.', ',') + ' procent');
    dark.style.transform = 'scaleY(' + (v / 100) + ')';
  }
  slider.addEventListener('input', function () {
    update();
    if (!done) { feedback.hidden = true; }
  });

  // Controle van het antwoord; bij fout schudt de beker opnieuw
  check.addEventListener('click', function () {
    var v = toValue(+slider.value);
    feedback.hidden = false;
    if (v === ANSWER) {
      done = true;
      slider.disabled = true; check.disabled = true;
      feedback.innerHTML = '<span class="fb good"><span class="ic" aria-hidden="true">✓</span> Goed! Het is ' + fmt(ANSWER) + '</span>';
      explain.hidden = false;
      quiz.classList.add('solved');
    } else {
      var hint = v > ANSWER ? 'Het is minder zout water dan je denkt.' : 'Het is meer zout water dan je denkt.';
      feedback.innerHTML = '<span class="fb bad"><span class="ic" aria-hidden="true">✗</span> Nog niet goed<span class="hint">' + hint + '</span></span>';
      // getBoundingClientRect() herstart de animatie; offsetWidth werkt niet op een SVG
      cup.classList.remove('shake'); cup.getBoundingClientRect(); cup.classList.add('shake');
    }
  });
  // ---- Balk met delen: niveau 1 = liggende balk (zoet water), niveau 2 = staande balk (oppervlakte- en atmosferisch water) ----
  var PARTS1 = [
    { naam: 'gletsjers', p: 68.7, c: 'var(--ice)', g: 1 },
    { naam: 'grondwater', p: 30.1, c: 'var(--sandy)', g: 1 },
    { naam: 'permafrost', p: 0.8, c: 'var(--perma)', g: 4 },
    { naam: 'oppervlakte- en atmosferisch water', p: 0.4, c: 'var(--water-light)', g: 6 }
  ];
  var PARTS2 = [
    { naam: 'meren', p: 67.4, c: 'var(--c-lake)', g: 1 },
    { naam: 'bodemvocht', p: 12.2, c: 'var(--c-soil)', g: 1 },
    { naam: 'atmosfeer', p: 9.5, c: 'var(--c-air)', g: 1 },
    { naam: 'drasland', p: 8.5, c: 'var(--c-marsh)', g: 1 },
    { naam: 'rivieren', p: 1.6, c: 'var(--c-river)', g: 3 },
    { naam: 'planten en dieren', p: 0.8, c: 'var(--c-life)', g: 5 }
  ];
  var vbar = document.getElementById('vbar'), vbarWrap = document.getElementById('vbarWrap');
  var segs = [], callouts = [], vsegs = [], vcallouts = [], level = 0, busy = false, stripH = 12;
  var nextBtn = document.getElementById('next');
  var verder2 = document.getElementById('verder2');
  var EASE = 'cubic-bezier(.6,0,.25,1)';

  function build(parts, container, wrap, arrS, arrC, vert) {
    var acc = 0;
    container.innerHTML = '';
    wrap.querySelectorAll('.callout').forEach(function (c) { c.remove(); });
    arrS.length = 0; arrC.length = 0;
    parts.forEach(function (d, i) {
      var seg = document.createElement('div');
      seg.className = vert ? 'vseg' : 'seg';
      seg.style.flexBasis = d.p + '%';
      seg.style.setProperty('--i', i); seg.style.setProperty('--c', d.c); seg.style.setProperty(vert ? '--gy' : '--gx', d.g);
      seg.addEventListener('animationend', function () { seg.classList.remove('pulse'); });
      container.appendChild(seg); arrS.push(seg);
      var co = document.createElement('div');
      var rechts = !vert && (i >= parts.length - 2) && d.p < 2;
      co.className = 'callout' + (vert ? ' v' : '') + (rechts ? ' right' : '');
      co.textContent = fmt(d.p) + ' ' + d.naam;
      if (vert) co.style.top = (acc + d.p / 2) + '%';
      else if (!rechts) co.style.left = (acc + d.p / 2) + '%';
      co.addEventListener('animationend', function () { co.classList.remove('on'); });
      wrap.appendChild(co); arrC.push(co);
      acc += d.p;
    });
    container.setAttribute('aria-label', 'Balk: ' + parts.map(function (d) { return fmt(d.p) + ' ' + d.naam; }).join(', '));
  }

  // Legenda (lijst onder elkaar, eerst het percentage): een klik laat het bijbehorende deel 1,5 seconde uitvergroot zien
  function buildList(list, parts, arrS, arrC) {
    list.innerHTML = '';
    parts.forEach(function (d, i) {
      var li = document.createElement('li');
      var btn = document.createElement('button');
      btn.type = 'button'; btn.className = 'li-btn';
      btn.innerHTML = '<span class="sw" style="--c:' + d.c + '"></span><span><b>' + fmt(d.p) + '</b> ' + d.naam + '</span>';
      btn.addEventListener('click', function () {
        var seg = arrS[i], co = arrC[i];
        if (!seg || seg.classList.contains('pulse')) return;
        seg.classList.add('pulse'); co.classList.add('on');
      });
      li.appendChild(btn); list.appendChild(li);
    });
  }
  function buildAll() {
    build(PARTS1, bar, barWrap, segs, callouts, false);
    build(PARTS2, vbar, vbarWrap, vsegs, vcallouts, true);
  }
  buildAll();
  buildList(document.getElementById('listA'), PARTS1, segs, callouts);
  buildList(document.getElementById('listB'), PARTS2, vsegs, vcallouts);

  function later(fn, ms) { zoomTimers.push(setTimeout(fn, ms)); }
  function calloutsOff() { callouts.concat(vcallouts).forEach(function (c) { c.classList.remove('on'); }); segs.concat(vsegs).forEach(function (s) { s.classList.remove('pulse'); }); }
  // Verplaatsing + schaal die element a precies over de rechthoek r1 legt
  function overlay(a, r1) {
    var r2 = a.getBoundingClientRect();
    return 'translate(' + ((r1.left + r1.width / 2) - (r2.left + r2.width / 2)) + 'px,' + ((r1.top + r1.height / 2) - (r2.top + r2.height / 2)) + 'px) scale(' + (r1.width / r2.width) + ',' + (r1.height / r2.height) + ')';
  }

  // Verder (in de quiz): inzoomen op het zoete water, daarna de balk met vier delen en de legenda
  nextBtn.addEventListener('click', function () { this.disabled = true; zoomIn(); });
  function zoomIn() {
    busy = true;
    tool.classList.add('zoomed', 'zooming');
    var fr = fresh.getBoundingClientRect(), wr = barWrap.getBoundingClientRect(), cr = cup.getBoundingClientRect();
    var S = wr.width / fr.width;
    var cx = fr.left + fr.width / 2, cy = fr.top + fr.height / 2;
    var tx = wr.left + wr.width / 2, ty = wr.top + wr.height / 2;
    stripH = Math.max(fr.height * S, 8);
    cup.style.transformOrigin = (cx - cr.left) + 'px ' + (cy - cr.top) + 'px';
    bar.style.setProperty('--bh', stripH + 'px');
    cup.getBoundingClientRect();
    cup.style.transform = 'translate(' + (tx - cx) + 'px,' + (ty - cy) + 'px) scale(' + S + ')';
    later(function () { stage.classList.add('show'); stage.removeAttribute('aria-hidden'); cup.classList.add('faded'); }, 2700);
    later(function () { bar.style.setProperty('--bh', '72px'); }, 3000);
    later(function () { stage.classList.add('split'); }, 4000);
    later(function () { stage.classList.add('legend-on'); busy = false; }, 5400);
  }

  // Terug (scherm 1 -> quiz): alles in omgekeerde volgorde
  document.getElementById('back1').addEventListener('click', function () {
    if (busy || level !== 0) return;
    busy = true; calloutsOff();
    stage.classList.remove('legend-on');
    later(function () { stage.classList.remove('split'); }, 500);
    later(function () { bar.style.setProperty('--bh', stripH + 'px'); }, 1200);
    later(function () {
      stage.classList.remove('show'); stage.setAttribute('aria-hidden', 'true');
      cup.classList.remove('faded'); cup.style.transform = '';
    }, 2100);
    later(function () { tool.classList.remove('zoomed', 'zooming'); nextBtn.disabled = false; busy = false; }, 4900);
  });

  // Verder (scherm 1 -> 2): inzoomen op de 0,4% van de balk; die wordt een staande balk die in zes delen wordt verdeeld
  verder2.addEventListener('click', function () {
    if (busy || level !== 0) return;
    busy = true; calloutsOff();
    callouts[3].classList.add('on');
    later(function () {
      var r1 = segs[3].getBoundingClientRect();
      vbar.style.transition = 'none'; vbar.style.transform = '';
      var tf = overlay(vbar, r1);
      vbar.style.transform = tf;
      stage.classList.add('l2', 'out');
      vbar.getBoundingClientRect();
      vbar.style.transition = 'transform 1.5s ' + EASE;
      vbar.style.transform = '';
    }, 900);
    later(function () { vbar.style.transition = ''; vbar.classList.add('framed'); }, 2450);
    later(function () { stage.classList.add('l2t'); }, 2550);
    later(function () { stage.classList.add('split2'); }, 3150);
    later(function () { stage.classList.add('l2l'); level = 1; busy = false; }, 4550);
  });

  // Terug (scherm 2 -> 1): de animatie omgedraaid
  document.getElementById('back2').addEventListener('click', function () {
    if (busy || level !== 1) return;
    busy = true; calloutsOff();
    stage.classList.remove('l2l');
    later(function () { stage.classList.remove('l2t', 'split2'); vbar.classList.remove('framed'); }, 500);
    later(function () {
      vbar.style.transition = 'transform 1.5s ' + EASE;
      vbar.style.transform = overlay(vbar, segs[3].getBoundingClientRect());
      stage.classList.remove('out');
    }, 1300);
    later(function () {
      stage.classList.remove('l2');
      vbar.style.transition = 'none'; vbar.style.transform = ''; vbar.getBoundingClientRect(); vbar.style.transition = '';
      level = 0; busy = false;
    }, 2900);
  });

  function resetZoom() {
    zoomTimers.forEach(clearTimeout); zoomTimers = [];
    cup.style.transition = 'none'; cup.style.transform = ''; cup.style.transformOrigin = '';
    cup.classList.remove('faded');
    cup.getBoundingClientRect();
    cup.style.transition = '';
    tool.classList.remove('zoomed', 'zooming');
    stage.classList.remove('show', 'split', 'legend-on', 'out', 'l2', 'l2t', 'split2', 'l2l'); stage.setAttribute('aria-hidden', 'true');
    vbar.style.transition = ''; vbar.style.transform = ''; vbar.classList.remove('framed');
    level = 0; busy = false;
    buildAll();
    bar.style.setProperty('--bh', '12px');
  }

  // Vullen van de beker: 4 seconden, daarna de vraag tonen
  function showQuiz() { quiz.classList.add('show'); quiz.removeAttribute('aria-hidden'); update(); }
  function start() {
    clearTimeout(timer);
    timer = setTimeout(function () {
      cup.classList.add('filling');
      timer = setTimeout(showQuiz, 4100);
    }, 400);
  }
  function reset() {
    clearTimeout(timer);
    resetZoom();
    cup.classList.remove('filling', 'shake');
    quiz.classList.remove('show', 'solved'); quiz.setAttribute('aria-hidden', 'true');
    dark.style.transform = 'scaleY(0)';
    slider.disabled = false; check.disabled = false; slider.value = 50; done = false;
    feedback.hidden = true; explain.hidden = true;
    nextBtn.disabled = false;
    valueEl.textContent = '50%';
    cup.getBoundingClientRect();
    start();
  }
  cup.addEventListener('animationend', function () { cup.classList.remove('shake'); });
  document.querySelectorAll('.js-replay').forEach(function (b) { b.addEventListener('click', reset); });

  // Sidebar in- en uitklappen
  var layout = document.querySelector('.layout');
  var toggle = document.getElementById('toggle');
  toggle.addEventListener('click', function () {
    var collapsed = layout.classList.toggle('collapsed');
    toggle.setAttribute('aria-expanded', String(!collapsed));
    toggle.setAttribute('aria-label', collapsed ? 'Sidebar uitklappen' : 'Sidebar inklappen');
    document.getElementById('sideList').hidden = collapsed;
  });

  // Links die voorlopig nog niets doen (Over mij, Contact, Kringloop van water)
  document.querySelectorAll('[data-stub]').forEach(function (a) {
    a.addEventListener('click', function (e) { e.preventDefault(); });
  });

  start();
})();
