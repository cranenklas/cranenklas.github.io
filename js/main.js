// ===========================================================
// Cranenklas aardrijkskunde — gedrag van de pagina
// Regelt het wisselen tussen de landingspagina en de pagina
// "Educatieve tools", en de hover-animaties van 2 seconden.
// ===========================================================
(function () {
  var body = document.body;
  var track = document.getElementById('track');
  var panelTools = document.getElementById('panelTools');
  var panelHome = document.getElementById('panelHome');

  // Wisselt tussen de twee pagina's door de klasse "is-tools" te (de)activeren.
  // "inert" zorgt dat de verborgen pagina niet per ongeluk bediend kan worden
  // (bv. met toetsenbord of schermlezer) terwijl hij buiten beeld staat.
  function setView(tools) {
    body.classList.toggle('is-tools', tools);
    panelTools.inert = !tools;
    panelHome.inert = tools;
    var target = tools ? document.getElementById('back') : document.getElementById('plankTools');
    setTimeout(function () { try { target.focus({ preventScroll: true }); } catch (e) {} }, 1000);
  }
  function showTools() { setView(true); }
  function showHome() { setView(false); }

  // Klik op de plank "Educatieve tools" of op de knop in de navigatiebalk
  var plank = document.getElementById('plankTools');
  plank.addEventListener('click', showTools);
  plank.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); showTools(); } });
  document.getElementById('navTools').addEventListener('click', showTools);
  document.getElementById('back').addEventListener('click', showHome);
  document.getElementById('logo').addEventListener('click', showHome);

  // Links die voorlopig nog niets doen (Over mij, Contact) blijven inactief
  document.querySelectorAll('[data-stub]').forEach(function (a) {
    a.addEventListener('click', function (e) { e.preventDefault(); });
  });

  // Hover-animaties van 2 seconden; lopen altijd helemaal uit, ook als de muis
  // eerder al weggaat van de lijst.
  function bindPulse(listId, targetId, cls) {
    var list = document.getElementById(listId);
    var target = document.getElementById(targetId);
    function start() {
      if (target.classList.contains(cls)) return;
      target.classList.add(cls);
    }
    target.addEventListener('animationend', function () { target.classList.remove(cls); });
    list.addEventListener('mouseenter', start);
    list.addEventListener('focusin', start);
  }
  bindPulse('grpAtm', 'atm', 'run-atm');
  bindPulse('grpEarth', 'earth', 'run-earth');

  // Als de pagina wordt geopend met #tools in de link (bv. via de knop
  // "Educatieve tools" vanaf een toolpagina), toon die pagina meteen,
  // zonder de schuifanimatie.
  if (window.location.hash === '#tools') {
    track.classList.add('no-anim');
    body.classList.add('is-tools');
    panelTools.inert = false;
    panelHome.inert = true;
    track.getBoundingClientRect();
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { track.classList.remove('no-anim'); });
    });
  }
})();
