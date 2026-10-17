// ===========================================================
// Cranenklas aardrijkskunde — versleepbare lijn tussen invoer en voorbeeld
// Gedeeld door de woordzoeker en de kruiswoordpuzzel. Standaard krijgt het
// voorbeeld 35% van de ruimte rechts van het menu (minimaal 440 px) en de
// invoer de rest (minimaal 340 px); dat rekent mee met de venstergrootte en
// het in- en uitklappen van het menu. Slepen (muis en touch), de pijltjes
// links en rechts (30 px), Home en dubbelklik (terug naar de standaard).
// Een gesleepte breedte wordt per tool bewaard in localStorage en gaat voor.
// De breedte van de invoer staat in de CSS-variabele --inw op main.
// Gebruik: PaneSplitter({ main, splitter, panel, storeKey }) geeft { apply }.
// ===========================================================
window.PaneSplitter = function (o) {
  'use strict';
  var main = o.main, splitter = o.splitter, panel = o.panel, STORE_W = o.storeKey;
  var PV_SHARE = 0.35, PV_MIN = 440, IN_MIN = 340, SPLIT_W = 14;
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
    splitter.setPointerCapture(e.pointerId); splitter.classList.add('on'); document.body.classList.add('pane-drag');
  });
  splitter.addEventListener('pointermove', function (e) {
    if (!splitter.hasPointerCapture(e.pointerId)) return;
    setWanted(e.clientX - panel.getBoundingClientRect().left, false);
  });
  function endDrag(e) {
    if (splitter.hasPointerCapture && splitter.hasPointerCapture(e.pointerId)) splitter.releasePointerCapture(e.pointerId);
    splitter.classList.remove('on'); document.body.classList.remove('pane-drag'); if (wanted !== null) setWanted(wanted, true);
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
  return { apply: applyIn };
};
