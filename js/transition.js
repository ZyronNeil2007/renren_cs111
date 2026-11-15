/* Per-biome "teleport" page transitions.
 *
 * Out:  a full-screen overlay styled for the DESTINATION biome plays for 520-800 ms
 *       (a wash that moves with transform/opacity + a handful of sprite particles),
 *       then the browser navigates.
 * In:   the next page starts under the same overlay and it clears away in ~500-650 ms.
 *
 * Non-blocking: the overlay is pointer-events:none, the page underneath stays alive, and the
 * keyboard shortcuts still work during it (1-8 re-target the pending destination, Escape
 * cancels). Nothing here touches <audio>, so a playing karaoke track keeps going until the
 * browser actually swaps pages. prefers-reduced-motion gets a ~160 ms plain fade.
 *
 * Usage: <a data-morph data-biome="cherry" data-world="the Cherry Grove" href="..."> .
 * Animation lives in css/style.css (TELEPORT TRANSITIONS); this file only builds the DOM.
 */
(function () {
  'use strict';

  var KEY = 'mc-tp';
  var me = document.currentScript || document.querySelector('script[src*="transition.js"]');
  var ART = new URL('../img/biomes/', me.src).href;

  // out-phase length (ms) per destination, and the in-phase length on arrival
  var OUT = { title: 560, plains: 520, cherry: 640, lush: 700, jungle: 640, ocean: 700, badlands: 560, end: 800, soul: 660, mushroom: 620 };
  var IN = { title: 520, plains: 500, cherry: 600, lush: 640, jungle: 600, ocean: 640, badlands: 520, end: 640, soul: 600, mushroom: 580 };
  var QUICK = 160;

  // [sprite, [w,h] in cells, mode, [min,max] pixel multiplier, particle count]
  var FX = {
    title:    [['cloud', [11, 4], 'sweep', [5, 8], 6]],
    plains:   [['pollen', [2, 2], 'rise', [4, 7], 16]],
    cherry:   [['petal', [3, 3], 'fall', [4, 7], 24]],
    lush:     [['glow', [5, 5], 'pop', [3, 6], 16], ['spore', [3, 3], 'rise', [3, 5], 6]],
    jungle:   [['leaf', [4, 4], 'fall', [4, 7], 22]],
    ocean:    [['bubble', [5, 5], 'rise', [3, 6], 22]],
    badlands: [['dust', [3, 2], 'sweep', [4, 7], 22]],
    end:      [['endspark', [3, 3], 'conv', [3, 6], 24]],
    soul:     [['flame', [5, 6], 'rise', [4, 6], 12], ['ember', [3, 3], 'rise', [3, 5], 10]],
    mushroom: [['mush', [5, 5], 'pop', [4, 6], 8], ['spore2', [3, 3], 'rise', [3, 5], 14]]
  };
  var LABEL = { title: 'the Overworld', plains: 'the Plains' };

  var reduce = function () {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  };
  var small = function () { return window.innerWidth <= 700; };
  var rand = function (a, b) { return a + Math.random() * (b - a); };
  var known = function (b) { return OUT.hasOwnProperty(b) ? b : 'plains'; };

  /* ------------------------------------------------------------ overlay */
  function build(biome, phase, dur, world) {
    var quick = reduce();
    var ov = document.createElement('div');
    ov.className = 'tp tp-' + biome + ' is-' + phase + (quick ? ' tp-quick' : '');
    ov.setAttribute('aria-hidden', 'true');
    ov.style.setProperty('--dur', (quick ? QUICK : dur) + 'ms');

    var wash = document.createElement('div');
    wash.className = 'tp-wash';
    ov.appendChild(wash);

    if (!quick) {
      var fx = document.createElement('div');
      fx.className = 'tp-fx';
      var k = small() ? 10 / 22 : 1;       // ~22 particles desktop, ~10 on small screens
      var frag = document.createDocumentFragment();
      FX[biome].forEach(function (c) {
        var n = Math.max(2, Math.round(c[4] * k));
        for (var i = 0; i < n; i++) {
          var el = document.createElement('i');
          var m = rand(c[3][0], c[3][1]);
          el.style.width = Math.round(c[1][0] * m) + 'px';
          el.style.height = Math.round(c[1][1] * m) + 'px';
          el.style.backgroundImage = 'url(' + ART + 'fx_' + c[0] + '.svg)';
          el.style.setProperty('--pm', 'tp-' + c[2]);
          // out: particles start a little late; in: they are already mid-flight
          var span = dur * 0.45;
          el.style.setProperty('--pl', (phase === 'out' ? rand(0, span) : -rand(0, span)).toFixed(0) + 'ms');
          el.style.setProperty('--pd', Math.round(dur * rand(.55, .85)) + 'ms');
          el.style.setProperty('--dx', Math.round(rand(-18, 18)) + 'vw');
          el.style.setProperty('--dy', Math.round(rand(-8, 14)) + 'vh');
          el.style.setProperty('--rot', Math.round(rand(-240, 240)) + 'deg');
          if (c[2] === 'fall' || c[2] === 'rise') el.style.left = rand(0, 98).toFixed(1) + '%';
          else if (c[2] === 'sweep') el.style.top = rand(6, 90).toFixed(1) + '%';
          else if (c[2] === 'pop') { el.style.left = rand(4, 94).toFixed(1) + '%'; el.style.top = rand(8, 88).toFixed(1) + '%'; }
          else if (c[2] === 'conv') {          // start on a ring around the centre, fly in
            var a = rand(0, 6.283), r = rand(34, 52);
            el.style.left = '50%'; el.style.top = '50%';
            el.style.setProperty('--sx', (Math.cos(a) * r).toFixed(1) + 'vw');
            el.style.setProperty('--sy', (Math.sin(a) * r * .8).toFixed(1) + 'vh');
          }
          frag.appendChild(el);
        }
      });
      fx.appendChild(frag);
      ov.appendChild(fx);
    }

    if (phase === 'out' && !quick && world) {
      var lab = document.createElement('div');
      lab.className = 'tp-label';
      var s = document.createElement('span');
      s.textContent = 'Travelling to ' + world + '…';
      lab.appendChild(s);
      ov.appendChild(lab);
    }
    return ov;
  }

  /* ------------------------------------------------------------ leaving */
  var busy = false, timer = 0, overlay = null, pendingUrl = '';

  function store(biome, world) {
    try { sessionStorage.setItem(KEY, JSON.stringify({ b: biome })); } catch (e) {}
  }

  function go(el, url) {
    var biome = known(el.getAttribute('data-biome'));
    var world = el.getAttribute('data-world') || LABEL[biome] || '';

    if (busy) {                      // keyboard shortcuts / extra clicks re-target, never block
      pendingUrl = url;
      store(biome, world);
      return;
    }
    busy = true;
    pendingUrl = url;
    store(biome, world);

    var quick = reduce();
    var dur = quick ? QUICK : OUT[biome];
    overlay = build(biome, 'out', dur, world);
    document.body.appendChild(overlay);

    // start fetching the destination while the animation plays (cheap, non-blocking)
    try {
      var pf = document.createElement('link');
      pf.rel = 'prefetch'; pf.href = url;
      document.head.appendChild(pf);
    } catch (e) {}

    timer = setTimeout(function () { location.href = pendingUrl; }, dur);
  }

  function cancel() {
    if (!busy) return;
    clearTimeout(timer);
    busy = false;
    try { sessionStorage.removeItem(KEY); } catch (e) {}
    var ov = overlay; overlay = null;
    if (ov) {
      ov.classList.remove('is-out'); ov.classList.add('is-cancel');
      setTimeout(function () { ov.remove(); }, 260);
    }
  }

  /* ------------------------------------------------------------ arriving */
  function arrive() {
    var data = null;
    try {
      data = JSON.parse(sessionStorage.getItem(KEY));
      sessionStorage.removeItem(KEY);
    } catch (e) {}
    if (!data || !data.b) return;
    var biome = known(data.b);
    var quick = reduce();
    var dur = quick ? QUICK : IN[biome];
    var ov = build(biome, 'in', dur, '');
    document.documentElement.appendChild(ov);     // before <body> exists: no flash of the new page
    setTimeout(function () { ov.remove(); }, dur + 60);
  }

  /* ------------------------------------------------------------ wiring */
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[data-morph]');
    if (!a || e.defaultPrevented || e.button !== 0) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    go(a, a.href);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && busy) cancel();
  });

  // Back/forward cache: drop any leftover overlay and allow travelling again.
  window.addEventListener('pageshow', function (e) {
    if (!e.persisted) return;
    clearTimeout(timer);
    busy = false; overlay = null;
    document.querySelectorAll('.tp').forEach(function (n) { n.remove(); });
  });

  window.MCTransition = { go: go, cancel: cancel };
  arrive();
})();
