// ===========================================================
// Cranenklas aardrijkskunde — algemeen script voor uitlegpagina's
// De inhoud staat in een apart databestand dat eerder wordt geladen
// en window.UITLEG vult (zie bv. js/de-gesteentecyclus-uitleg.js).
// Elk element met data-k (in de tekening of een knop rechts) opent
// het onderdeel met die sleutel in het uitlegvak (#uitleg-info) en
// wordt op alle plekken tegelijk gemarkeerd. Verder: reeksen met
// keuzeknoppen, fotovakken met vergroten (lightbox) en de sidebar.
// ===========================================================
(function () {
  var D = window.UITLEG;
  var box = document.getElementById('uitleg-info');
  var items = [].slice.call(document.querySelectorAll('[data-k]'));
  var cur = null;
  var ARR = '<div class="uitleg-arr" aria-hidden="true">→</div>';

  // Alleen voor teksten die in een attribuut komen (bestandsnaam, link)
  function attr(s) { return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;'); }

  function step(v, first) {
    return '<div class="uitleg-step' + (first ? ' first' : '') + '"><b>' + v[0] + '</b>' + v[1] + (v[2] ? '<small>' + v[2] + '</small>' : '') + '</div>';
  }

  function alt(v) { return 'Foto van ' + v.naam.toLowerCase(); }
  // Regel "maker · licentie", als link naar de bron als die er is
  function credit(v) {
    var cr = [v.maker, v.licentie].filter(Boolean).join(' · ');
    return cr && v.bron ? '<a href="' + attr(v.bron) + '" target="_blank" rel="noopener">' + cr + '</a>' : cr;
  }

  // Fotovak: leeg vak zolang er geen foto is, anders een knop met de foto
  // (vergroten, zie lbOpen) en daaronder maker en licentie. n = plek in de
  // rij foto's van dit onderdeel.
  function photo(v, n) {
    var h = '<figure>';
    if (v.foto) {
      var cr = credit(v);
      h += '<button class="uitleg-zoom" type="button" data-p="' + n + '" aria-label="Vergroot ' + attr(alt(v).charAt(0).toLowerCase() + alt(v).slice(1)) + '">';
      h += '<img class="uitleg-ph" src="' + attr(D.fotoMap + v.foto) + '" alt="' + attr(alt(v)) + '" loading="lazy">';
      h += '<span class="uitleg-lens" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="10" cy="10" r="6"/><path d="M15 15l6 6M10 7v6M7 10h6"/></svg></span></button>';
      h += '<figcaption><b>' + v.naam + '</b><small>' + v.kenmerk + '</small>';
      if (cr) h += '<small class="cr">' + cr + '</small>';
    } else {
      h += '<div class="uitleg-ph">foto</div><figcaption><b>' + v.naam + '</b><small>' + v.kenmerk + '</small>';
    }
    return h + '</figcaption></figure>';
  }

  function series(i) {
    var s = D.onderdelen[cur].reeksen[i];
    box.querySelectorAll('[data-s]').forEach(function (b) {
      var on = b.getAttribute('data-s') === String(i);
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', String(on));
    });
    var h = '<p>' + s.tekst + '</p><div class="uitleg-steps">';
    if (s.splitsing) {
      h += step(s.stappen[0], true) + ARR + '<div class="uitleg-fork">' + s.stappen.slice(1).map(function (v) { return step(v); }).join('') + '</div>';
    } else {
      s.stappen.forEach(function (v, j) { if (j > 0) h += ARR; h += step(v, j === 0); });
    }
    h += '</div>';
    if (s.schaal) h += '<div class="uitleg-grad"><span>' + s.schaal[0] + '</span><i></i><span>' + s.schaal[1] + '</span></div>';
    document.getElementById('uitleg-series').innerHTML = h;
  }

  function pick(k, scroll) {
    var d = D.onderdelen[k];
    if (!d) return;
    cur = k;
    items.forEach(function (e) {
      var on = e.getAttribute('data-k') === k;
      e.classList.toggle('on', on);
      e.setAttribute('aria-pressed', String(on));
    });
    var h = '<div class="uitleg-kind">' + d.soort + '</div><h2>' + d.titel + '</h2><p>' + d.tekst + '</p>';
    // Alleen voorbeelden met een foto zijn klikbaar en tellen mee bij het bladeren
    var fotos = (d.voorbeelden || []).filter(function (v) { return v.foto; });
    if (d.voorbeelden) h += '<div class="uitleg-photos">' + d.voorbeelden.map(function (v) { return photo(v, fotos.indexOf(v)); }).join('') + '</div>';
    if (d.reeksen) {
      h += '<div class="uitleg-series"><h3>' + d.reeksTitel + '</h3><p>' + d.reeksIntro + '</p><div class="uitleg-chips">';
      d.reeksen.forEach(function (s, i) { h += '<button class="btn ghost uitleg-chip" type="button" data-s="' + i + '" aria-pressed="false">' + s.knop + '</button>'; });
      h += '</div><div id="uitleg-series"></div></div>';
    }
    box.innerHTML = h;
    box.querySelectorAll('[data-p]').forEach(function (b) {
      b.addEventListener('click', function () { lbOpen(fotos, parseInt(b.getAttribute('data-p'), 10), b); });
    });
    if (d.reeksen) {
      box.querySelectorAll('[data-s]').forEach(function (b) {
        b.addEventListener('click', function () { series(parseInt(b.getAttribute('data-s'), 10)); });
      });
      series(0);
    }
    if (scroll) {
      var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      box.scrollIntoView({ block: 'nearest', behavior: still ? 'auto' : 'smooth' });
    }
  }

  // ---------- Foto vergroten (lightbox) ----------
  // Eén venster voor de hele pagina, pas gemaakt bij de eerste klik. De grote
  // foto gebruikt hetzelfde bestand als het kleine plaatje (geen tweede download).
  // Sluiten: kruisje, klik naast de foto of Esc; bladeren met de pijlen (knoppen
  // en toetsen), rond. Tab blijft binnen het venster; de pagina erachter is
  // inert en scrolt niet.
  var lb = null, lbList = [], lbI = 0, lbOpener = null;
  function lbBuild() {
    lb = document.createElement('div');
    lb.className = 'uitleg-lb';
    lb.hidden = true;
    lb.setAttribute('role', 'dialog');
    lb.setAttribute('aria-modal', 'true');
    lb.setAttribute('aria-label', 'Vergrote foto');
    lb.innerHTML = '<button class="uitleg-lb-x" type="button" aria-label="Sluiten">×</button>' +
      '<button class="uitleg-lb-pijl prev" type="button" aria-label="Vorige foto">‹</button>' +
      '<figure><img alt=""><figcaption></figcaption></figure>' +
      '<button class="uitleg-lb-pijl next" type="button" aria-label="Volgende foto">›</button>';
    document.body.appendChild(lb);
    lb.addEventListener('click', function (e) { if (e.target === lb || e.target.tagName === 'FIGURE') lbClose(); });
    lb.querySelector('.uitleg-lb-x').addEventListener('click', lbClose);
    lb.querySelector('.prev').addEventListener('click', function () { lbShow(lbI - 1); });
    lb.querySelector('.next').addEventListener('click', function () { lbShow(lbI + 1); });
    document.addEventListener('keydown', function (e) {
      if (lb.hidden) return;
      if (e.key === 'Escape') { e.preventDefault(); lbClose(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); lbShow(lbI - 1); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); lbShow(lbI + 1); }
      else if (e.key === 'Tab') {
        var f = lb.querySelectorAll('button:not([hidden]), a[href]'), a = f[0], z = f[f.length - 1];
        if (!lb.contains(document.activeElement)) { e.preventDefault(); a.focus(); }
        else if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
        else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
      }
    });
  }
  function lbShow(i) {
    var n = lbList.length;
    lbI = (i + n) % n;
    var v = lbList[lbI], img = lb.querySelector('img'), cr = credit(v);
    img.src = D.fotoMap + v.foto;
    img.alt = alt(v);
    lb.querySelector('figcaption').innerHTML = '<b>' + v.naam + '</b>' + v.kenmerk + (cr ? '<br>' + cr : '') + '<span class="uitleg-lb-count">' + (lbI + 1) + ' van ' + n + '</span>';
    lb.querySelectorAll('.uitleg-lb-pijl').forEach(function (b) { b.hidden = n < 2; });
  }
  function lbOpen(list, i, opener) {
    if (!lb) lbBuild();
    lbList = list; lbOpener = opener;
    lbShow(i);
    lb.hidden = false;
    [].forEach.call(document.body.children, function (el) { if (el !== lb) el.inert = true; });
    document.body.style.overflow = 'hidden';
    lb.querySelector('.uitleg-lb-x').focus();
  }
  function lbClose() {
    lb.hidden = true;
    [].forEach.call(document.body.children, function (el) { el.inert = false; });
    document.body.style.overflow = '';
    if (lbOpener) lbOpener.focus();
  }

  // Klik, Enter of spatie (knoppen rechts doen Enter en spatie zelf al)
  items.forEach(function (e) {
    e.addEventListener('click', function () { pick(e.getAttribute('data-k'), true); });
    if (e.tagName === 'BUTTON') return;
    e.addEventListener('keydown', function (ev) {
      if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); pick(e.getAttribute('data-k'), true); }
    });
  });
  pick(D.start, false);

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
