/* Title screen: the sky follows the visitor's local time.
 *
 * Dawn, day, dusk and night are blended from the clock (re-checked once a minute):
 *   - the five sky bands (CSS variables --tod-1..5 on .sky, consumed by css/features.css)
 *   - a square Minecraft sun and moon that cross the sky behind the mountains
 *   - stars that fade in with the dark, a night tint over the world, and the character dims a little
 *   - two standing torches either side of the Play sign that are lit from dusk to dawn
 * body[data-tod] is "dawn" | "day" | "dusk" | "night" (js/advancements.js reads it for Night Owl).
 *
 * Preview any hour with ?time=22 (or ?time=5:30). Previews never earn the Night Owl advancement.
 * Everything here is set once per minute; the only animation is the CSS star twinkle and torch
 * flicker, which prefers-reduced-motion turns off (the scene is then simply still).
 */
(function () {
  'use strict';

  var sky = document.querySelector('.title-body .sky');
  if (!sky) return;
  var body = document.body;

  /* palettes: five sky bands top -> bottom, night tint (0-.4), star and torch strength (0-1) */
  var NIGHT = { c: ['#050918', '#0a1230', '#101a42', '#172352', '#1f2e66'], tint: 0.36, stars: 1, torch: 1 };
  var DAWN  = { c: ['#2d3270', '#74508f', '#dc7d8c', '#f6aa7a', '#ffd49c'], tint: 0.1, stars: 0.12, torch: 0.65 };
  var DAY   = { c: ['#4f9bff', '#5fa6ff', '#78b6ff', '#94c6ff', '#b4d8ff'], tint: 0, stars: 0, torch: 0 };
  var DUSK  = { c: ['#2b2c68', '#6d4188', '#c85a7a', '#f08c5c', '#ffba6c'], tint: 0.12, stars: 0.18, torch: 0.75 };
  var KEYS = [
    [0, NIGHT], [4.5, NIGHT], [6.25, DAWN], [8, DAY], [16.5, DAY], [18.25, DUSK], [20, NIGHT], [24, NIGHT]
  ];

  function rgb(h) { return [parseInt(h.substr(1, 2), 16), parseInt(h.substr(3, 2), 16), parseInt(h.substr(5, 2), 16)]; }
  function mixc(a, b, t) {
    var A = rgb(a), B = rgb(b);
    return 'rgb(' + [0, 1, 2].map(function (i) { return Math.round(A[i] + (B[i] - A[i]) * t); }).join(',') + ')';
  }
  function mixn(a, b, t) { return a + (b - a) * t; }
  function sample(h) {
    for (var i = 0; i < KEYS.length - 1; i++) {
      var a = KEYS[i], b = KEYS[i + 1];
      if (h >= a[0] && h <= b[0]) {
        var t = (h - a[0]) / (b[0] - a[0] || 1);
        t = t * t * (3 - 2 * t);
        return {
          c: a[1].c.map(function (c, k) { return mixc(c, b[1].c[k], t); }),
          tint: mixn(a[1].tint, b[1].tint, t), stars: mixn(a[1].stars, b[1].stars, t), torch: mixn(a[1].torch, b[1].torch, t)
        };
      }
    }
    return sample(0);
  }

  function now() {
    var m = /[?&]time=(\d{1,2})(?::(\d{2}))?/.exec(location.search);
    if (m && +m[1] < 24) return +m[1] + (m[2] ? Math.min(59, +m[2]) / 60 : 0);
    var d = new Date();
    return d.getHours() + d.getMinutes() / 60;
  }
  function phase(h) { return (h < 5 || h >= 20) ? 'night' : h < 7.5 ? 'dawn' : h < 17 ? 'day' : 'dusk'; }

  /* ---------------------------------------------------------- build the extra scenery once */
  function el(cls, parent, before) {
    var n = document.createElement('div');
    n.className = cls;
    n.setAttribute('aria-hidden', 'true');
    if (before) parent.insertBefore(n, parent.firstChild); else parent.appendChild(n);
    return n;
  }
  var stars = el('tod-stars', sky, true);
  var moon = el('tod-orb tod-moon', sky, true);
  var sun = el('tod-orb tod-sun', sky, true);
  var tint = el('tod-tint', sky, false);

  var rng = 12345;                                        // a fixed sprinkle, so the sky looks the same every visit
  function rand() { rng = (rng * 1664525 + 1013904223) % 4294967296; return rng / 4294967296; }
  var frag = document.createDocumentFragment();
  for (var i = 0; i < 46; i++) {
    var s = document.createElement('i');
    s.className = 's' + (1 + Math.floor(rand() * 3));
    s.style.left = (rand() * 98 + 1).toFixed(1) + '%';
    s.style.top = (rand() * 100).toFixed(1) + '%';
    s.style.animationDelay = (-rand() * 4).toFixed(1) + 's';
    frag.appendChild(s);
  }
  stars.appendChild(frag);

  var torches = el('tod-torches', body, false);
  ['l', 'r'].forEach(function (side) { var t = el('tod-torch ' + side, torches, false); t.appendChild(document.createElement('b')); });

  /* ---------------------------------------------------------- apply the time */
  function orb(node, t, up) {                              // t 0..1 across the sky; behind the mountains near the horizon
    if (!up) { node.style.opacity = '0'; return; }
    var x = 9 + 82 * t, y = 62 - 46 * Math.sin(Math.PI * t);
    node.style.setProperty('--ox', x.toFixed(1));
    node.style.setProperty('--oy', y.toFixed(1));
    node.style.opacity = '1';
  }
  function apply() {
    var h = now(), p = sample(h);
    p.c.forEach(function (c, k) { sky.style.setProperty('--tod-' + (k + 1), c); });
    sky.style.setProperty('--tod-tint', p.tint.toFixed(3));
    sky.style.setProperty('--tod-stars', p.stars.toFixed(3));
    sky.style.setProperty('--tod-night', Math.min(1, p.tint / 0.36).toFixed(3));
    document.documentElement.style.setProperty('--tod-bright', (1 - p.tint * 0.75).toFixed(3));
    var lit = p.torch > 0.3;
    torches.classList.toggle('lit', lit);
    torches.style.setProperty('--lit', lit ? Math.min(1, p.torch).toFixed(2) : '0');

    var st = (h - 6) / 12;                                 // sun: 6:00 -> 18:00
    orb(sun, Math.max(0, Math.min(1, st)), st > -0.03 && st < 1.03);
    var mh = (h - 18 + 24) % 24, mt = mh / 12;             // moon: 18:00 -> 6:00
    orb(moon, Math.max(0, Math.min(1, mt)), mt <= 1.03);

    body.setAttribute('data-tod', phase(h));
  }
  apply();
  setInterval(function () { if (!document.hidden) apply(); }, 60000);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) apply(); });

  window.MCDayNight = { hour: now, phase: function () { return phase(now()); } };
})();
