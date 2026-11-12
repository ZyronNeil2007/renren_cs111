/* Title screen: an original blocky adventurer you can control.
 *
 * Keyboard: arrow keys / A D = walk, Space or Up / W = jump.
 * Touch:    on-screen buttons (hold left/right to walk, tap/hold jump).
 * Pointer:  tap/click the ground to walk there, tap the character to wave.
 *
 * Mobile notes: the character scales down on short screens, the speech bubble
 * is kept inside the viewport, DOM writes are skipped when nothing changed,
 * and the loop stops while the tab is hidden.
 */
(function () {
  'use strict';

  var sky = document.querySelector('.sky');
  if (!sky || !document.querySelector('.title-body')) return;

  var wrap = document.createElement('div');
  wrap.className = 'hc-wrap';
  wrap.innerHTML =
    '<div class="hero-char" id="hero" role="button" tabindex="0" aria-label="Pixel Pal: tap to say hi">' +
      '<div class="hc-bubble" role="status" aria-live="polite"></div>' +
      '<div class="hc-body">' +
        '<div class="hc-arm back"></div><div class="hc-leg back"></div>' +
        '<div class="hc-torso"></div>' +
        '<div class="hc-head"><i class="hc-eye l"></i><i class="hc-eye r"></i><i class="hc-mouth"></i></div>' +
        '<div class="hc-leg front"></div><div class="hc-arm front"></div>' +
      '</div>' +
      '<div class="hc-shadow"></div>' +
    '</div>';
  document.body.appendChild(wrap);

  /* On-screen controls (shown by CSS on touch devices). */
  var pad = document.createElement('div');
  pad.className = 'hc-pad';
  pad.innerHTML =
    '<div class="grp">' +
      '<button type="button" class="mc-btn" data-k="left" aria-label="Walk left">&#9664;</button>' +
      '<button type="button" class="mc-btn" data-k="right" aria-label="Walk right">&#9654;</button>' +
    '</div>' +
    '<div class="grp">' +
      '<button type="button" class="mc-btn" data-k="jump" aria-label="Jump">&#9650;</button>' +
    '</div>';
  document.body.appendChild(pad);

  var hero = wrap.querySelector('#hero');
  var body = wrap.querySelector('.hc-body');
  var bubble = wrap.querySelector('.hc-bubble');

  var BASE_W = 72;
  var S = 1;                 // character scale (smaller on short screens)
  var W = BASE_W;            // character width in screen px
  var vw = window.innerWidth;
  var x = Math.max(24, vw * 0.12);
  var y = 0, vy = 0, dir = 1;
  var target = null, keys = {}, bubbleTimer = 0, waveTimer = 0, hops = 0;
  var bubbleW = 0, lastT = '', lastDir = 0, lastWalk = null, lastBx = null;

  var lines = [
    'Hi there!', 'Welcome to my world!', 'Press Play to begin!',
    'Watch me jump!', 'Nice day for mining.', 'Creeper? Aw man!',
    'I love this place.', 'Try the arrow keys!'
  ];
  var touchLines = lines.slice(0, 7).concat(['Use the buttons below!']);
  var coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;

  /* ---------------------------------------------------------- layout */
  function layout() {
    vw = window.innerWidth;
    var h = window.innerHeight;
    S = h < 500 ? 0.7 : h < 700 ? 0.85 : 1;
    W = Math.round(BASE_W * S);
    hero.style.setProperty('--hs', S);
    lastT = '';                                       // force a redraw
  }
  window.addEventListener('resize', layout);
  window.addEventListener('orientationchange', layout);
  layout();

  /* ---------------------------------------------------------- actions */
  function say(t) {
    bubble.textContent = t;
    bubbleW = bubble.offsetWidth;                     // measured once, used to keep it on screen
    bubble.classList.add('show');
    clearTimeout(bubbleTimer);
    bubbleTimer = setTimeout(function () { bubble.classList.remove('show'); }, 2200);
  }
  function wave() {
    hero.classList.add('waving');
    clearTimeout(waveTimer);
    waveTimer = setTimeout(function () { hero.classList.remove('waving'); }, 1200);
  }
  function jump() {
    if (y === 0) { vy = 15; hops++; if (hops === 5) { say('Whee! Boing!'); hops = 0; } }
  }
  function talk() {
    wave();
    var pool = coarse ? touchLines : lines;
    say(pool[Math.floor(Math.random() * pool.length)]);
  }

  hero.addEventListener('click', function (e) { e.stopPropagation(); talk(); });
  hero.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); talk(); }
  });

  /* ---------------------------------------------------------- keyboard */
  document.addEventListener('keydown', function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    var k = e.key.toLowerCase();
    if (k === 'arrowleft' || k === 'a') { keys.left = true; target = null; e.preventDefault(); }
    else if (k === 'arrowright' || k === 'd') { keys.right = true; target = null; e.preventDefault(); }
    else if (k === 'arrowup' || k === 'w' || (k === ' ' && document.activeElement === document.body)) { jump(); e.preventDefault(); }
  });
  document.addEventListener('keyup', function (e) {
    var k = e.key.toLowerCase();
    if (k === 'arrowleft' || k === 'a') keys.left = false;
    if (k === 'arrowright' || k === 'd') keys.right = false;
  });

  /* ---------------------------------------------------------- touch pad
   * Pointer events give hold-to-walk and multi-touch (walk + jump together). */
  Array.prototype.forEach.call(pad.querySelectorAll('button'), function (btn) {
    var k = btn.getAttribute('data-k');
    function down(e) {
      e.preventDefault();
      try { btn.setPointerCapture(e.pointerId); } catch (err) {}
      keys[k] = true; target = null;
      btn.classList.add('on');
      if (k === 'jump') jump();
      if (navigator.vibrate) { try { navigator.vibrate(8); } catch (err) {} }
    }
    function up() { keys[k] = false; btn.classList.remove('on'); }
    btn.addEventListener('pointerdown', down);
    btn.addEventListener('pointerup', up);
    btn.addEventListener('pointercancel', up);
    btn.addEventListener('lostpointercapture', up);
    btn.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    // Keyboard / assistive-tech activation (no pointer events): take a small step or hop.
    btn.addEventListener('click', function (e) {
      if (e.detail !== 0) return;
      if (k === 'jump') jump();
      else target = Math.max(0, Math.min(vw - W, x + (k === 'left' ? -90 : 90)));
    });
  });

  /* ---------------------------------------------------------- tap the ground */
  document.addEventListener('click', function (e) {
    if (e.target.closest && e.target.closest('a, button, .hero-char')) return;
    var g = sky.querySelector('.ground');
    var top = g ? g.getBoundingClientRect().top : window.innerHeight * 0.76;
    if (e.clientY >= top - 40) target = Math.max(0, Math.min(vw - W, e.clientX - W / 2));
  });

  /* ---------------------------------------------------------- main loop */
  var last = performance.now(), raf = 0;
  function frame(now) {
    var dt = Math.min(2, (now - last) / 16.67); last = now;
    var move = 0;
    if (keys.left) move = -1;
    else if (keys.right) move = 1;
    else if (target !== null) {
      var d = target - x;
      if (Math.abs(d) < 4) target = null; else move = d > 0 ? 1 : -1;
    }
    if (keys.jump) jump();                            // hold the jump button to keep hopping

    if (move) { x += move * 4.2 * dt * S; dir = move; }
    x = Math.max(0, Math.min(vw - W, x));

    if (y > 0 || vy > 0) {
      y += vy * dt; vy -= 0.9 * dt;
      if (y <= 0) { y = 0; vy = 0; }
    }

    var t = 'translate(' + x.toFixed(1) + 'px,' + (-y).toFixed(1) + 'px) scale(' + S + ')';
    if (t !== lastT) { hero.style.transform = t; lastT = t; }
    if (dir !== lastDir) { body.style.transform = 'scaleX(' + dir + ')'; lastDir = dir; }
    var walking = !!move && y === 0;
    if (walking !== lastWalk) { hero.classList.toggle('walking', walking); lastWalk = walking; }

    // keep the speech bubble fully on screen (shift in character-local units)
    if (bubbleW && bubble.classList.contains('show')) {
      var cx = x + (BASE_W / 2) * S, half = bubbleW / 2, shift = 0;
      if (cx - half < 8) shift = 8 - (cx - half);
      else if (cx + half > vw - 8) shift = (vw - 8) - (cx + half);
      var bx = Math.round(shift / S);
      if (bx !== lastBx) { bubble.style.setProperty('--bx', bx + 'px'); lastBx = bx; }
    }
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { cancelAnimationFrame(raf); keys = {}; }
    else { last = performance.now(); raf = requestAnimationFrame(frame); }
  });

  // Greeting after the page settles
  setTimeout(function () { wave(); say(coarse ? 'Hi! Use the buttons!' : 'Hi! Use the arrow keys!'); }, 700);

  // Control hints under "Press Enter to start" (CSS shows the right one per device)
  var hint = document.querySelector('.hint');
  if (hint) {
    var h2 = document.createElement('p');
    h2.className = 'hint';
    h2.innerHTML =
      '<span class="hint-kb">← → move · Space jump · click the ground or my buddy below!</span>' +
      '<span class="hint-touch">Tap the ground or tap me!</span>';
    hint.insertAdjacentElement('afterend', h2);
  }
})();
