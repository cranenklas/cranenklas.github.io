// ===========================================================
// Cranenklas aardrijkskunde — algemeen script voor uitlegpagina's
// De inhoud staat in een apart databestand dat eerder wordt geladen
// en window.UITLEG vult (zie bv. js/de-gesteentecyclus-uitleg.js).
// Elk element met data-k (in de tekening of een knop rechts) opent
// het onderdeel met die sleutel in het uitlegvak (#uitleg-info) en
// wordt op alle plekken tegelijk gemarkeerd. Verder: reeksen met
// keuzeknoppen, fotovakken en de sidebar.
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

  // Fotovak: leeg vak zolang er geen foto is, anders de foto met maker en licentie
  function photo(v) {
    var h = '<figure>';
    if (v.foto) {
      var cr = [v.maker, v.licentie].filter(Boolean).join(' · ');
      h += '<img class="uitleg-ph" src="' + attr(D.fotoMap + v.foto) + '" alt="' + attr(v.naam) + '" loading="lazy">';
      h += '<figcaption><b>' + v.naam + '</b><small>' + v.kenmerk + '</small>';
      if (cr) h += '<small class="cr">' + (v.bron ? '<a href="' + attr(v.bron) + '" target="_blank" rel="noopener">' + cr + '</a>' : cr) + '</small>';
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
    if (d.voorbeelden) h += '<div class="uitleg-photos">' + d.voorbeelden.map(photo).join('') + '</div>';
    if (d.reeksen) {
      h += '<div class="uitleg-series"><h3>' + d.reeksTitel + '</h3><p>' + d.reeksIntro + '</p><div class="uitleg-chips">';
      d.reeksen.forEach(function (s, i) { h += '<button class="btn ghost uitleg-chip" type="button" data-s="' + i + '" aria-pressed="false">' + s.knop + '</button>'; });
      h += '</div><div id="uitleg-series"></div></div>';
    }
    box.innerHTML = h;
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
