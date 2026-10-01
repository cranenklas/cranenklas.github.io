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
  var more = document.getElementById('more');
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
  document.getElementById('next').addEventListener('click', function () {
    more.hidden = false;
    quiz.classList.add('read');
    this.disabled = true;
  });

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
    cup.classList.remove('filling', 'shake');
    quiz.classList.remove('show', 'solved', 'read'); quiz.setAttribute('aria-hidden', 'true');
    dark.style.transform = 'scaleY(0)';
    slider.disabled = false; check.disabled = false; slider.value = 50; done = false;
    feedback.hidden = true; explain.hidden = true; more.hidden = true;
    document.getElementById('next').disabled = false;
    valueEl.textContent = '50%';
    cup.getBoundingClientRect();
    start();
  }
  cup.addEventListener('animationend', function () { cup.classList.remove('shake'); });
  document.getElementById('replay').addEventListener('click', reset);

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
