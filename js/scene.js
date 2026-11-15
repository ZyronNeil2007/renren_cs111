/* Shared scene system: parallax, capped atmosphere particles, pause logic,
 * and the "look toward a biome" preview on the Plains page.
 * Markup:  <div class="scene" aria-hidden="true"> ...layers... </div>   (see css/scene.css)
 * Everything animates with transform / opacity only. */
(function () {
  'use strict';

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var small = function () { return window.innerWidth <= 700; };
  var rand = function (a, b) { return a + Math.random() * (b - a); };
  var pick = function (r) { return Math.round(rand(r[0], r[1])); };

  // base URL of the art folder, derived from this script's location (works from / and /pages/)
  var me = document.currentScript || document.querySelector('script[src*="scene.js"]');
  var ART = new URL('../img/biomes/', me.src).href;

  // sprite sizes in cells (1 cell = 2px at natural size)
  var DIM = { petal: [3, 3], leaf: [4, 4], bubble: [5, 5], glow: [5, 5], spore: [3, 3], pollen: [2, 2], dust: [3, 2],
              endspark: [3, 3], ember: [3, 3], ash: [2, 2], spore2: [3, 3], cloud: [11, 4], fish: [8, 4], flame: [5, 6], mush: [5, 5] };

  // [sprite, count, mode, options]   (total is capped: ~30 desktop, 12 small screens)
  var FX = {
    plains:   [['cloud', 3, 'swim', { m: [7, 11], top: [4, 30], dur: [110, 170] }], ['pollen', 9, 'drift', { m: [3, 5], dur: [18, 32] }]],
    cherry:   [['petal', 22, 'fall', { m: [3, 5], dur: [9, 16], dx: [-14, 14] }]],
    lush:     [['glow', 9, 'pulse', { m: [3, 5], top: [8, 62] }], ['spore', 9, 'rise', { m: [2, 4], dur: [22, 36], dx: [-6, 6] }]],
    jungle:   [['leaf', 14, 'fall', { m: [3, 5], dur: [10, 18], dx: [-16, 10] }]],
    ocean:    [['bubble', 14, 'rise', { m: [2, 4], dur: [12, 24], dx: [-4, 4] }], ['fish', 4, 'swim', { m: [4, 6], top: [22, 62], dur: [36, 60], dy: [-4, 4] }]],
    badlands: [['dust', 14, 'drift', { m: [3, 5], dur: [9, 16], dy: [-3, 8] }]],
    end:      [['endspark', 18, 'rise', { m: [2, 4], dur: [26, 50], dx: [-5, 5] }]],
    soul:     [['ember', 8, 'rise', { m: [2, 4], dur: [18, 32], dx: [-6, 6] }], ['ash', 10, 'fall', { m: [2, 4], dur: [18, 30], dx: [-10, 4] }], ['flame', 5, 'flicker', { m: [4, 6] }]],
    mushroom: [['spore2', 12, 'rise', { m: [2, 4], dur: [26, 44], dx: [-8, 8] }], ['mush', 4, 'bounce', { m: [4, 6] }]]
  };

  var scene = document.querySelector('.scene');
  var sky = document.querySelector('.sky');         // title screen keeps its own sky container
  var body = document.body;
  var biome = body.getAttribute('data-biome');

  /* ---------------------------------------------------------- particles */
  function buildFx() {
    var host = scene && scene.querySelector('.layer-fx');
    var cfg = FX[biome];
    if (!host || !cfg || reduce) return;
    var cap = small() ? 12 : 30, total = 0;
    cfg.forEach(function (c) { total += c[1]; });
    var k = Math.min(1, cap / total);
    var frag = document.createDocumentFragment();
    cfg.forEach(function (c) {
      var n = Math.max(1, Math.round(c[1] * k)), sprite = c[0], mode = c[2], o = c[3] || {};
      if (total * k > cap && n > 1) n--;
      for (var i = 0; i < n; i++) {
        var el = document.createElement('i');
        var m = rand(o.m[0], o.m[1]), d = DIM[sprite];
        el.className = 'fx fx-' + mode;
        el.style.width = Math.round(d[0] * m) + 'px';
        el.style.height = Math.round(d[1] * m) + 'px';
        el.style.backgroundImage = 'url(' + ART + 'fx_' + sprite + '.svg)';
        el.style.left = rand(2, 96).toFixed(1) + '%';
        var dur = o.dur ? rand(o.dur[0], o.dur[1]) : 4;
        el.style.setProperty('--dur', dur.toFixed(1) + 's');
        el.style.setProperty('--delay', (-rand(0, dur)).toFixed(1) + 's');   // desync: scene starts already alive
        if (o.dx) el.style.setProperty('--dx', pick(o.dx) + 'vw');
        if (o.dy) el.style.setProperty('--dy', pick(o.dy) + 'vh');
        if (mode === 'drift') el.style.top = rand(12, 78).toFixed(0) + '%', el.style.left = '0';
        if (mode === 'swim') el.style.top = (o.top ? rand(o.top[0], o.top[1]) : 40).toFixed(0) + '%', el.style.left = '0';
        if (mode === 'pulse') el.style.top = (o.top ? rand(o.top[0], o.top[1]) : 40).toFixed(0) + '%';
        if (mode === 'flicker' || mode === 'bounce') {
          el.style.top = 'auto';
          el.style.bottom = 'calc(88px * var(--sc))';
        }
        frag.appendChild(el);
      }
    });
    host.appendChild(frag);
  }

  /* ---------------------------------------------------------- parallax */
  var layers = Array.prototype.slice.call(document.querySelectorAll('.layer[data-speed]'));
  var tx = 0, cx = 0, raf = 0, paused = false;
  function limit() { return window.innerWidth * 0.09; }
  function scrollNorm() {
    var h = document.documentElement.scrollHeight - window.innerHeight;
    return h > 0 ? window.scrollY / h : 0;
  }
  function apply() {
    var L = limit(), s = scrollNorm();
    layers.forEach(function (el) {
      var sp = parseFloat(el.getAttribute('data-speed')) || 0;
      var dx = (-cx * 34 - s * 110) * sp;
      dx = Math.max(-L, Math.min(L, dx));
      el.style.transform = 'translate3d(' + dx.toFixed(1) + 'px,0,0)';
    });
  }
  function tick() {
    raf = 0;
    if (paused) return;
    cx += (tx - cx) * 0.1;
    apply();
    if (Math.abs(tx - cx) > 0.002) raf = requestAnimationFrame(tick);
  }
  function kick() { if (!raf && !paused) raf = requestAnimationFrame(tick); }
  if (layers.length && !reduce) {
    window.addEventListener('scroll', function () { if (!raf && !paused) raf = requestAnimationFrame(function () { raf = 0; apply(); }); }, { passive: true });
    if (!small() && window.matchMedia('(pointer: fine)').matches) {
      window.addEventListener('pointermove', function (e) { tx = (e.clientX / window.innerWidth) * 2 - 1; kick(); }, { passive: true });
    }
    window.addEventListener('resize', apply);
    apply();
  }

  /* ---------------------------------------------------------- pause logic */
  function setPaused(p) {
    paused = p;
    [scene, sky].forEach(function (n) { if (n) n.classList.toggle('is-paused', p); });
    if (!p) kick();
  }
  document.addEventListener('visibilitychange', function () { setPaused(document.hidden); });

  // pause ambient motion while a mini-game is on screen, so games keep full frame rate
  var games = document.querySelectorAll('.game');
  if (games.length && 'IntersectionObserver' in window) {
    var visible = new Set();
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { e.isIntersecting ? visible.add(e.target) : visible.delete(e.target); });
      body.classList.toggle('game-active', visible.size > 0);
    }, { threshold: 0.15 });
    games.forEach(function (g) { io.observe(g); });
  }

  /* ---------------------------------------------------------- Plains: look toward a biome */
  var pv = document.getElementById('pv');
  if (pv) {
    var label = document.getElementById('pv-label');
    var home = { cls: 'dio-plains', text: 'Plains — choose a path' };
    var show = function (cls, text) { pv.className = 'pv diorama ' + cls; label.textContent = text; };
    document.querySelectorAll('.block[data-biome]').forEach(function (b) {
      var on = function () { show('dio-' + b.getAttribute('data-biome'), 'Looking toward ' + b.getAttribute('data-world')); };
      var off = function () { show(home.cls, home.text); };
      b.addEventListener('pointerenter', on); b.addEventListener('focus', on);
      b.addEventListener('pointerleave', off); b.addEventListener('blur', off);
    });
  }

  buildFx();
})();
