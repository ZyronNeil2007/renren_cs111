/* Title screen: an original blocky adventurer you can control.
 * Arrow keys / A D = walk, Space or Up = jump, click the ground = walk there,
 * click the character = wave + say something.
 */
(function () {
  'use strict';

  var sky = document.querySelector('.sky');
  if (!sky || !document.querySelector('.title-body')) return;

  var wrap = document.createElement('div');
  wrap.className = 'hc-wrap';
  wrap.innerHTML =
    '<div class="hero-char" id="hero" role="button" tabindex="0" aria-label="Pixel Pal: click to say hi">' +
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

  var hero = wrap.querySelector('#hero');
  var body = wrap.querySelector('.hc-body');
  var bubble = wrap.querySelector('.hc-bubble');

  var W = 72;
  var x = Math.max(24, window.innerWidth * 0.12);
  var y = 0, vy = 0, dir = 1;
  var target = null, keys = {}, bubbleTimer = 0, waveTimer = 0, hops = 0;

  var lines = [
    'Hi there!', 'Welcome to my world!', 'Press Play to begin!',
    'Watch me jump!', 'Nice day for mining.', 'Creeper? Aw man!',
    'I love this place.', 'Try the arrow keys!'
  ];

  function say(t) {
    bubble.textContent = t;
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
    say(lines[Math.floor(Math.random() * lines.length)]);
  }

  hero.addEventListener('click', function (e) { e.stopPropagation(); talk(); });
  hero.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); talk(); }
  });

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

  // Click the ground to walk there
  document.addEventListener('click', function (e) {
    if (e.target.closest && e.target.closest('a, button, .hero-char')) return;
    var g = sky.querySelector('.ground');
    var top = g ? g.getBoundingClientRect().top : window.innerHeight * 0.76;
    if (e.clientY >= top - 40) target = Math.max(0, Math.min(window.innerWidth - W, e.clientX - W / 2));
  });

  var last = performance.now();
  function frame(now) {
    var dt = Math.min(2, (now - last) / 16.67); last = now;
    var move = 0;
    if (keys.left) move = -1;
    else if (keys.right) move = 1;
    else if (target !== null) {
      var d = target - x;
      if (Math.abs(d) < 4) target = null; else move = d > 0 ? 1 : -1;
    }
    var speed = 4.2 * dt;
    if (move) { x += move * speed; dir = move; }
    x = Math.max(0, Math.min(window.innerWidth - W, x));

    if (y > 0 || vy > 0) {
      y += vy * dt; vy -= 0.9 * dt;
      if (y <= 0) { y = 0; vy = 0; }
    }

    hero.style.transform = 'translate(' + x.toFixed(1) + 'px,' + (-y).toFixed(1) + 'px)';
    body.style.transform = 'scaleX(' + dir + ')';
    hero.classList.toggle('walking', !!move && y === 0);
    bubble.style.transform = 'translateX(-50%)';
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // Greeting after the page settles
  setTimeout(function () { wave(); say('Hi! Use the arrow keys!'); }, 700);

  // Hint under the "Press Enter" text
  var hint = document.querySelector('.hint');
  if (hint) {
    var h2 = document.createElement('p');
    h2.className = 'hint';
    h2.textContent = '← → move · Space jump · click the ground or my buddy below!';
    hint.insertAdjacentElement('afterend', h2);
  }
})();
