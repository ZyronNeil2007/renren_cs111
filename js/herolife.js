/* Title-screen character: a little life of his own.
 *
 *  Idle life      After a few seconds with no input Mark looks around, yawns, sits down and falls
 *                 asleep with floating Zs. Any key, tap, click or real mouse movement wakes him.
 *  The page       Hovering (or tabbing to) the Play World sign makes him turn and look at it.
 *                 Pressing Play sends him running to the sign for a jump as the teleport starts.
 *  Mining         Click or tap the dirt (or press E) and he walks up, swings at the block and breaks
 *                 it: crack stages, particles, a floating "+1 Dirt". The loot goes into the same
 *                 "lc:mine" inventory the Mine a Block game on the Plains page shows.
 *
 * Built on window.MCHero (js/hero.js) and window.MCHeadTrack (js/headtrack.js); it only drives
 * hooks they expose and CSS classes, so removing this file leaves the old behaviour untouched.
 *
 * prefers-reduced-motion: no looking around, yawning, running or particles. Sitting/sleeping are
 * instant pose changes with static Zs, and mining just shows the crack stages, the hole and the loot text.
 * Everything animates with transform / opacity; one frame hook, no timers while he is busy.
 */
(function () {
  'use strict';

  var H = window.MCHero;
  var sky = document.querySelector('.sky');
  if (!H || !sky) return;
  var ground = sky.querySelector('.ground');
  var play = document.querySelector('.play');
  var hero = H.el;

  var mqReduce = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  function reduce() { return !!(mqReduce && mqReduce.matches); }
  function HT() { return window.MCHeadTrack; }
  function amb(yaw, pitch) { var t = HT(); if (t) t.ambient(yaw, pitch); }
  function el(cls, html) { var n = document.createElement('div'); n.className = cls; if (html) n.innerHTML = html; return n; }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }

  var sitting = false, sleeping = false, mining = false, lookSign = false, entering = false;

  function applyYaw() {                                   // the body yaw to hold while standing still
    var d = H.state().dir;
    H.yawOverride = sitting ? d * 65 : mining ? d * 72 : lookSign ? d * 55 : null;
  }

  /* ============================================================ idle life */
  var T_LOOK = 6000, T_YAWN = 12500, T_SIT = 16000, T_SLEEP = 21000;     // ms without input
  var lastInput = performance.now(), stage = 0, timers = [], snore = 0;

  var zzz = el('hc-zzz', '<i>Z</i><i>Z</i><i>Z</i>');
  zzz.setAttribute('aria-hidden', 'true');
  hero.appendChild(zzz);

  function later(fn, ms) { timers.push(setTimeout(fn, ms)); }
  function clearTimers() { timers.forEach(clearTimeout); timers = []; clearInterval(snore); }

  function lookAround() {
    if (reduce()) return;
    amb(-42, 3);
    later(function () { amb(42, -2); }, 1400);
    later(function () { amb(-16, 16); }, 2800);
    later(function () { amb(null); }, 4000);
  }
  function yawn() {
    if (reduce()) return;
    hero.classList.add('yawning');
    H.say('*yaaawn*'); H.emit('yawn');
    amb(0, 22);
    later(function () { hero.classList.remove('yawning'); amb(null); }, 1700);
  }
  function sit() {
    sitting = true;
    hero.classList.add('sitting');
    H.extraDrop = 50;
    applyYaw();
    H.say('Time for a break...');
  }
  function sleep() {
    sleeping = true;
    hero.classList.add('sleeping');
    amb(0, -34);
    H.emit('sleep'); H.emit('snore');
    snore = setInterval(function () { H.emit('snore'); }, 3200);
  }
  function standUp() {
    var was = sleeping;
    sitting = sleeping = false;
    hero.classList.remove('sitting', 'sleeping', 'yawning');
    H.extraDrop = 0;
    applyYaw();
    if (was) { H.say(pick(['Huh? I\'m up!', 'Five more minutes...', 'I wasn\'t sleeping!'])); H.emit('wake'); }
  }
  function resetIdle() {
    stage = 0;
    clearTimers();
    amb(null);
    if (sitting) standUp();
    hero.classList.remove('yawning');
  }
  /* cancelMine: the input was a walk / jump / crouch, which interrupts digging */
  function poke(cancelMine) {
    lastInput = performance.now();
    if (stage) resetIdle();
    if (cancelMine && mining) cancelMining();
  }

  var px0 = -1e4, py0 = -1e4;
  document.addEventListener('keydown', function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    var k = e.key.toLowerCase();
    poke(k !== 'e' && k !== 'shift' && k !== 'tab');
  });
  document.addEventListener('pointerdown', function (e) {
    poke(!!(e.target.closest && e.target.closest('.hc-pad')));
  });
  document.addEventListener('touchstart', function () { poke(false); }, { passive: true });
  document.addEventListener('pointermove', function (e) {               // jitter does not count, a real move does
    if (e.pointerType === 'touch') return;
    var dx = e.clientX - px0, dy = e.clientY - py0;
    if (dx * dx + dy * dy > 900) { px0 = e.clientX; py0 = e.clientY; poke(false); }
  }, { passive: true });
  document.addEventListener('visibilitychange', function () { lastInput = performance.now(); if (stage) resetIdle(); });

  function tickIdle(now) {
    var st = H.state();
    if (st.moving || st.y > 0 || st.crouching || mining || entering || document.hidden) {
      lastInput = now;
      if (stage) resetIdle();
      return;
    }
    var idle = now - lastInput;
    if (stage < 1 && idle > T_LOOK) { stage = 1; lookAround(); }
    else if (stage < 2 && idle > T_YAWN) { stage = 2; yawn(); }
    else if (stage < 3 && idle > T_SIT) { stage = 3; sit(); }
    else if (stage < 4 && idle > T_SLEEP) { stage = 4; sleep(); }
  }

  /* ============================================================ the Play sign */
  var lastSay = -1e9;
  function signLook(on) {
    if (entering) return;
    if (!on) {
      lookSign = false; applyYaw();
      var t0 = HT(); if (t0) t0.lookAt(null);
      return;
    }
    var r = play.getBoundingClientRect(), cx = r.left + r.width / 2, st = H.state();
    if (!st.moving && st.y === 0 && !mining) { H.face(cx > st.x + st.W / 2 ? 1 : -1); lookSign = true; applyYaw(); }
    var t = HT(); if (t) t.lookAt(cx, r.top + r.height / 2);
    var now = performance.now();
    if (now - lastSay > 14000 && !sitting) { lastSay = now; H.say(pick(['Ooh, Play World!', 'Is that the sign?', 'Ready when you are!'])); }
  }
  if (play) {
    play.addEventListener('pointerenter', function (e) { if (e.pointerType !== 'touch') signLook(true); });
    play.addEventListener('focus', function () { signLook(true); });
    play.addEventListener('pointerleave', function () { signLook(false); });
    play.addEventListener('blur', function () { signLook(false); });

    // Pressing Play: run to the sign and jump while the teleport overlay starts.
    // (capture phase, so it runs before js/transition.js takes the click over)
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a.play');
      if (!a || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (entering) return;
      entering = true;
      setTimeout(function () { entering = false; }, 1600);          // Escape can cancel the trip
      cancelMining(); poke(false);
      lookSign = false; applyYaw();
      var t = HT(); if (t) t.lookAt(null);
      H.say(pick(['Let\'s go!', 'Adventure time!', 'Here I come!']));
      H.emit('enter');
      if (reduce()) return;
      var r = a.getBoundingClientRect(), st = H.state(), tx = r.left + r.width / 2 - st.W / 2;
      if (Math.abs(tx - st.x) < 28 * st.S) H.jump();
      else H.dash(tx, function () { H.jump(); });
    }, true);
  }

  /* ============================================================ mining */
  var CELL = 64, REACH = 85;                                          // block size; how far from a block he stands
  var ORES = [
    { id: 'dirt', name: 'Dirt', w: 60, cols: ['#8a5c33', '#7b4f2a', '#6a4424', '#5d9b3a'] },
    { id: 'stone', name: 'Stone', w: 25, cols: ['#8b8b8b', '#6e6e6e', '#a0a0a0'] },
    { id: 'iron', name: 'Iron', w: 9, cols: ['#d8af93', '#b78d70', '#8b8b8b'] },
    { id: 'gold', name: 'Gold', w: 5, cols: ['#f2c230', '#c99a14', '#ffe27a'] },
    { id: 'diamond', name: 'Diamond', w: 1, cols: ['#35d6c3', '#1fa595', '#9ff5ea'] }
  ];
  var layer = el('mine-layer');
  layer.setAttribute('aria-hidden', 'true');
  document.body.appendChild(layer);
  var holes = [], tok = 0, mineCol = -1, crack = null;

  function groundTop() { return ground ? ground.getBoundingClientRect().top : window.innerHeight * 0.76; }
  function place(node, col) {
    node.style.left = col * CELL + 'px'; node.style.top = groundTop() + 'px';
  }

  function cancelMining() {
    tok++;
    if (!mining) return;
    mining = false; mineCol = -1;
    hero.classList.remove('mining', 'fr', 'fl');
    applyYaw();
    if (crack) { var c = crack; crack = null; c.classList.add('fade'); setTimeout(function () { c.remove(); }, 500); }
  }

  function startMining(col, d) {
    cancelMining();
    if (holes.some(function (h) { return h.col === col; })) { H.say('Already dug that one!'); return; }
    var myTok = tok;
    poke(false);
    mining = true; mineCol = col;
    H.face(d);
    hero.classList.remove('fr', 'fl'); hero.classList.add(d > 0 ? 'fr' : 'fl');
    applyYaw();
    crack = el('mine-crack'); place(crack, col); layer.appendChild(crack);
    var hits = 0, HITS = 3;
    function swing() {
      if (myTok !== tok) return;
      hits++;
      hero.classList.remove('mining'); void hero.offsetWidth; hero.classList.add('mining');
      H.emit('hit');
      crack.setAttribute('data-s', String(hits));
      if (hits >= HITS) setTimeout(function () { if (myTok === tok) finish(col); }, 330);
      else setTimeout(swing, 430);
    }
    swing();
  }

  function roll() {
    var r = Math.random() * 100;
    for (var i = 0; i < ORES.length; i++) { r -= ORES[i].w; if (r <= 0) return ORES[i]; }
    return ORES[0];
  }
  function addLoot(id) {                                              // same inventory the Mine a Block game shows
    try {
      var inv = JSON.parse(localStorage.getItem('lc:mine')) || {};
      inv[id] = (inv[id] || 0) + 1;
      localStorage.setItem('lc:mine', JSON.stringify(inv));
      window.dispatchEvent(new CustomEvent('mc:store', { detail: { key: 'mine' } }));
    } catch (e) {}
  }

  function burst(cx, cy, ore) {
    if (reduce() || !layer.animate) return;
    var n = innerWidth <= 700 ? 8 : 14;
    for (var i = 0; i < n; i++) {
      var p = el('mine-bit'), s = Math.round(rnd(6, 11));
      p.style.width = p.style.height = s + 'px';
      p.style.background = pick(ore.cols);
      p.style.left = cx - s / 2 + 'px'; p.style.top = cy - s / 2 + 'px';
      layer.appendChild(p);
      var dx = rnd(-70, 70), up = rnd(40, 95), fall = rnd(30, 70);
      var a = p.animate([
        { transform: 'translate(0,0) rotate(0)', opacity: 1 },
        { transform: 'translate(' + dx * 0.55 + 'px,' + -up + 'px) rotate(' + rnd(-90, 90) + 'deg)', opacity: 1, offset: 0.4 },
        { transform: 'translate(' + dx + 'px,' + fall + 'px) rotate(' + rnd(-200, 200) + 'deg)', opacity: 0 }
      ], { duration: Math.round(rnd(520, 820)), easing: 'cubic-bezier(.3,.6,.6,1)', fill: 'forwards' });
      a.onfinish = (function (n) { return function () { n.remove(); }; })(p);
    }
  }

  function flyToHero(cx, cy, ore) {                                   // the dropped item hops into his hands
    if (reduce() || !layer.animate) return;
    var st = H.state(), hx = st.x + st.W / 2, hy = cy + 40 - 50 * st.S;
    var it = el('mine-item'); it.style.background = ore.cols[0];
    it.style.left = cx - 7 + 'px'; it.style.top = cy - 7 + 'px';
    layer.appendChild(it);
    var a = it.animate([
      { transform: 'translate(0,0) scale(1)', opacity: 1 },
      { transform: 'translate(0,-26px) scale(1)', opacity: 1, offset: 0.35 },
      { transform: 'translate(' + (hx - cx) + 'px,' + (hy - cy) + 'px) scale(.6)', opacity: 0.2 }
    ], { duration: 650, easing: 'ease-in', fill: 'forwards' });
    a.onfinish = function () { it.remove(); H.emit('pop', { v: 0.8 }); };
  }

  function popText(cx, cy, ore) {
    var t = el('mine-pop', '+1 ' + ore.name);
    t.style.left = cx + 'px'; t.style.top = cy - 24 + 'px';
    t.style.color = ore.cols[0] === '#8a5c33' ? '#e9c79a' : ore.cols[0];
    layer.appendChild(t);
    if (reduce() || !t.animate) { setTimeout(function () { t.remove(); }, 1100); return; }
    var a = t.animate([{ transform: 'translate(-50%,0)', opacity: 1 }, { transform: 'translate(-50%,-46px)', opacity: 0 }],
                      { duration: 1100, easing: 'ease-out', fill: 'forwards' });
    a.onfinish = function () { t.remove(); };
  }

  function finish(col) {
    mining = false; mineCol = -1;
    hero.classList.remove('mining', 'fr', 'fl');
    applyYaw();
    var c = crack; crack = null; if (c) c.remove();
    var ore = roll();
    var hole = el('mine-hole'); place(hole, col); layer.appendChild(hole);
    holes.push({ col: col, node: hole });
    if (holes.length > 4) { var old = holes.shift(); old.node.remove(); }
    setTimeout(function () {
      hole.classList.add('fill');
      setTimeout(function () { hole.remove(); holes = holes.filter(function (h) { return h.node !== hole; }); }, 600);
    }, 7000);
    var cx = col * CELL + CELL / 2, cy = groundTop() + 14;
    burst(cx, cy, ORES[0]);
    if (ore.id !== 'dirt') burst(cx, cy, ore);
    popText(cx, cy, ore);
    flyToHero(cx, cy, ore);
    addLoot(ore.id);
    H.emit('break', { ore: ore.id });
    if (ore.id === 'diamond') H.say('DIAMONDS!');
    else if (ore.id === 'gold' || ore.id === 'iron') H.say('Nice, ' + ore.name.toLowerCase() + '!');
  }

  function mineColumn(col) {
    var st = H.state(), S = st.S, cx = st.x + st.W / 2, bc = col * CELL + CELL / 2;
    var gap = Math.abs(bc - cx), vw = window.innerWidth;
    if (col < 0 || bc > vw) return;
    if (st.y > 0) return;
    if (gap >= 55 * S && gap <= 118 * S) { startMining(col, bc > cx ? 1 : -1); return; }
    var d = bc >= cx ? 1 : -1, stand = REACH * S;
    var sx = bc - d * stand;                                         // approach from the side he is already on
    if (sx < st.W / 2 || sx > vw - st.W / 2) { d = -d; sx = bc - d * stand; }
    sx = Math.max(st.W / 2, Math.min(vw - st.W / 2, sx));
    cancelMining();
    var myTok = tok;
    H.walkTo(sx - st.W / 2, function () { if (myTok === tok) startMining(col, d); });
  }

  H.onGroundClick = function (e, top) {
    if (e.clientY < top + 20) return false;                          // the grass line still means "walk here"
    mineColumn(Math.floor(e.clientX / CELL));
    return true;
  };

  document.addEventListener('keydown', function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey || e.repeat || e.key.toLowerCase() !== 'e') return;
    if (document.activeElement !== document.body && document.activeElement !== hero) return;
    var st = H.state();
    mineColumn(Math.floor((st.x + st.W / 2 + st.dir * REACH * st.S) / CELL));
  });

  window.addEventListener('resize', function () {                     // holes are positioned in page pixels
    holes.forEach(function (h) { h.node.remove(); }); holes = [];
    cancelMining();
  });

  H.onFrame = tickIdle;
})();
