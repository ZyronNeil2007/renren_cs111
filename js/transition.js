/* Minecraft "block morph" page transition.
 *
 * Out:  the clicked block grows from its own rectangle into a full-screen block
 *       of the same texture (animated with clip-path, so it stays smooth), then
 *       the browser navigates.
 * In:   the next page starts covered by a grid of that block's colours which
 *       "breaks away" piece by piece to reveal the page.
 *
 * Usage: any <a data-morph href="..."> with --c / --c2 colour variables
 *        (inline style or CSS) gets the transition automatically.
 * Respects prefers-reduced-motion (navigates instantly).
 */
(function () {
  'use strict';

  var KEY = 'mc-morph';
  var MORPH_MS = 480;   // block -> full screen
  var HOLD_MS = 120;    // "Loading terrain" beat before navigating

  var reduce = function () {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  };
  var checker = function (c, c2) {
    return 'conic-gradient(' + c + ' 25%, ' + c2 + ' 0 50%, ' + c + ' 0 75%, ' + c2 + ' 0) 0 0 / 32px 32px';
  };
  var inset = function (t, r, b, l) {
    return 'inset(' + t + 'px ' + r + 'px ' + b + 'px ' + l + 'px)';
  };

  var busy = false;

  function go(el, url) {
    if (busy) return;
    busy = true;

    var cs = getComputedStyle(el);
    var c = cs.getPropertyValue('--c').trim() || '#5d9b3a';
    var c2 = cs.getPropertyValue('--c2').trim() || '#4a7f2d';
    try { sessionStorage.setItem(KEY, JSON.stringify({ c: c, c2: c2 })); } catch (e) {}

    if (reduce() || !Element.prototype.animate) { location.href = url; return; }

    var r = el.getBoundingClientRect();
    var vw = document.documentElement.clientWidth;
    var vh = window.innerHeight;
    var B = 4;   // black border thickness, matches the pixel-art borders

    var from = inset(r.top, vw - r.right, vh - r.bottom, r.left);
    var fromIn = inset(r.top + B, vw - r.right + B, vh - r.bottom + B, r.left + B);
    var to = inset(0, 0, 0, 0);

    var m = document.createElement('div');
    m.className = 'morph';
    m.setAttribute('aria-hidden', 'true');
    m.innerHTML =
      '<div class="morph-edge"></div>' +
      '<div class="morph-fill"><span class="morph-label">Loading terrain&hellip;</span></div>';
    var edge = m.querySelector('.morph-edge');
    var fill = m.querySelector('.morph-fill');
    fill.style.background = checker(c, c2);
    edge.style.clipPath = from;
    fill.style.clipPath = fromIn;
    document.body.appendChild(m);
    el.classList.add('is-morphing');

    var opts = { duration: MORPH_MS, easing: 'cubic-bezier(.65, 0, .25, 1)', fill: 'forwards' };
    edge.animate([{ clipPath: from }, { clipPath: to }], opts);
    var anim = fill.animate([{ clipPath: fromIn }, { clipPath: to }], opts);

    anim.onfinish = function () {
      m.classList.add('is-full');
      setTimeout(function () { location.href = url; }, HOLD_MS);
    };
  }

  function reveal() {
    var data = null;
    try {
      data = JSON.parse(sessionStorage.getItem(KEY));
      sessionStorage.removeItem(KEY);
    } catch (e) {}
    if (!data || reduce()) return;

    var size = 64;
    var cols = Math.ceil(innerWidth / size);
    var rows = Math.ceil(innerHeight / size);
    var ov = document.createElement('div');
    ov.className = 'reveal';
    ov.setAttribute('aria-hidden', 'true');
    ov.style.gridTemplateColumns = 'repeat(' + cols + ', 1fr)';
    ov.style.gridTemplateRows = 'repeat(' + rows + ', 1fr)';

    var frag = document.createDocumentFragment();
    for (var y = 0; y < rows; y++) {
      for (var x = 0; x < cols; x++) {
        var cell = document.createElement('i');
        cell.style.background = (x + y) % 2 ? data.c : data.c2;
        cell.style.animationDelay = (Math.random() * 300 + 60) + 'ms';
        frag.appendChild(cell);
      }
    }
    ov.appendChild(frag);
    document.documentElement.appendChild(ov);
    setTimeout(function () { ov.remove(); }, 900);
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[data-morph]');
    if (!a || e.defaultPrevented || e.button !== 0) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    go(a, a.href);
  });

  // Back/forward cache: clear any leftover overlay.
  window.addEventListener('pageshow', function (e) {
    if (!e.persisted) return;
    busy = false;
    document.querySelectorAll('.morph, .reveal').forEach(function (n) { n.remove(); });
    document.querySelectorAll('.is-morphing').forEach(function (n) { n.classList.remove('is-morphing'); });
  });

  window.MCTransition = { go: go };
  reveal();
})();
