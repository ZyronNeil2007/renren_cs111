/* Head tracking for the title-screen character.
 *
 * The character is the CSS 3D model built by js/hero.js (skin texture cut from
 * skins/mark.png). hero.js exposes window.MCHero; this file only turns its head part
 * (.mc-head) about the neck. The body, limbs, skin and name tag are never touched.
 *
 *  Desktop: the head eases toward the mouse while it is inside the character's
 *           "awareness zone" (an ellipse around the head) and eases back to
 *           looking forward when the mouse leaves the zone or the window.
 *  Touch:   a tap or drag inside the zone makes the head look at the finger; it eases
 *           back shortly after the finger lifts. Listeners are passive and never call
 *           preventDefault(), so scrolling, links and the on-screen pad behave as before.
 *
 * Performance: pointer events only store the latest position. A requestAnimationFrame
 * loop runs while the head is still easing (or the character is moving) and stops as
 * soon as it has settled, so nothing runs while the pointer is still.
 * prefers-reduced-motion: reduce disables tracking; the head just stays forward.
 */
(function () {
  'use strict';

  var C = window.MCHero;
  if (!C || !C.head || !C.el) return;
  var head = C.head;

  /* ---- tuning (degrees / milliseconds) ---- */
  var YAW_SCREEN = 65;        // head direction in screen space at the edge of the zone
  var YAW_REL = 50;           // most the head may turn away from the body
  var PITCH_UP = 24;          // look up
  var PITCH_DOWN = 18;        // look down
  var TAU_FOLLOW = 85;        // smoothing time constant while following
  var TAU_RETURN = 150;       // ... and while returning to forward
  var TOUCH_HOLD = 450;       // keep looking this long after a finger lifts
  var EPS = 0.12;             // settled when closer than this (degrees)

  var mq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  var enabled = !(mq && mq.matches);

  var px = 0, py = 0;         // last pointer position (viewport px)
  var tracking = false;       // is the visitor currently being looked at?
  var touchId = null;         // pointer id of the finger being followed
  var holdTimer = 0;
  var yaw = 0, pitch = 0;     // current head rotation, relative to the body
  var raf = 0, lastTs = 0, lastStr = '';
  var baseBottom = 0;         // viewport y of the character's layout bottom (see measure)
  var ambient = null;         // {yaw, pitch} held by js/herolife.js (looking around, dozing off): beats the mouse
  var focus = null;           // {x, y} viewport point the head is told to look at (the Play sign): beats the mouse

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  /* The character is positioned with transform: translate(x, -y) scale(S) about its
   * bottom-left corner, so its layout bottom = rect.bottom + y. Measured on init, resize and
   * touch-down only, so mouse movement never forces a layout. */
  function measure() {
    var r = C.el.getBoundingClientRect();
    baseBottom = r.bottom + C.state().y;
  }

  /* Where the head should point right now: {yaw, pitch} relative to the body. */
  function aim() {
    if (!enabled) return null;
    if (ambient) return ambient;
    if (!focus && !tracking) return null;
    var s = C.state();
    var hx = s.x + 40 * s.S;                         // head centre (the head box is 8x8 texels at 5px)
    var hy = baseBottom - s.y - (140 - (s.drop || 0)) * s.S;       // the head sits lower while crouching
    var rx = Math.max(240, Math.min(520, window.innerWidth * 0.45));
    var ry = Math.max(220, Math.min(420, window.innerHeight * 0.55));
    var dx = (focus ? focus.x : px) - hx, dy = (focus ? focus.y : py) - hy;
    var n = Math.sqrt((dx / rx) * (dx / rx) + (dy / ry) * (dy / ry));
    var w = 1;
    if (!focus) {                                    // the mouse only counts inside the zone
      if (n >= 1) return null;                       // outside the zone
      w = n <= 0.75 ? 1 : (1 - n) / 0.25;            // fade out over the outer quarter
      w = w * w * (3 - 2 * w);
    }
    var nx = clamp(dx / rx, -1, 1), ny = clamp(dy / ry, -1, 1);
    // aim in screen space, then express it relative to the body so the body's own
    // 3/4 (idle) or side (walking) orientation is respected and the neck limit applies
    var local = clamp(nx * YAW_SCREEN - s.ry, -YAW_REL, YAW_REL);
    var p = ny < 0 ? -ny * PITCH_UP : -ny * PITCH_DOWN;   // CSS rotateX(+) tips the face up
    return { yaw: local * w, pitch: p * w };
  }

  function apply() {
    var a = Math.round(yaw * 10) / 10, b = Math.round(pitch * 10) / 10;
    var str = (a === 0 && b === 0) ? '' : 'rotateY(' + a + 'deg) rotateX(' + b + 'deg)';
    if (str !== lastStr) { head.style.transform = str; lastStr = str; }
  }

  function tick(ts) {
    raf = 0;
    var dt = Math.min(64, ts - lastTs); lastTs = ts;
    var t = aim();
    var ty = t ? t.yaw : 0, tp = t ? t.pitch : 0;
    var k = 1 - Math.exp(-dt / (t ? TAU_FOLLOW : TAU_RETURN));
    yaw += (ty - yaw) * k;
    pitch += (tp - pitch) * k;
    if (Math.abs(ty - yaw) < EPS && Math.abs(tp - pitch) < EPS) {   // settled: snap, stop looping
      yaw = ty; pitch = tp; apply();
      return;
    }
    apply();
    raf = requestAnimationFrame(tick);
  }
  function kick() {
    if (raf || !enabled) return;
    lastTs = performance.now();
    raf = requestAnimationFrame(tick);
  }

  function engage() { clearTimeout(holdTimer); tracking = true; kick(); }
  function release(delay) {
    clearTimeout(holdTimer);
    if (delay) holdTimer = setTimeout(function () { tracking = false; kick(); }, delay);
    else { tracking = false; kick(); }
  }
  function reset() {                                  // snap back to forward and stop
    clearTimeout(holdTimer); tracking = false; touchId = null; ambient = null; focus = null;
    if (raf) { cancelAnimationFrame(raf); raf = 0; }
    yaw = pitch = 0; apply();
  }

  /* ---- mouse / pen: pointer events ---- */
  var lastTouchAt = -1e9;
  function onPointerMove(e) {
    if (!enabled || e.pointerType === 'touch') return;
    px = e.clientX; py = e.clientY;
    engage();
  }
  var opts = { passive: true };
  document.addEventListener('pointermove', onPointerMove, opts);
  document.documentElement.addEventListener('pointerleave', function (e) { if (e.pointerType !== 'touch') release(0); }, opts);
  document.addEventListener('mouseout', function (e) {                       // left the window
    if (!e.relatedTarget && performance.now() - lastTouchAt > 1000) release(0);
  }, opts);
  window.addEventListener('blur', function () { release(0); });
  document.addEventListener('visibilitychange', function () { if (document.hidden) reset(); });

  /* ---- touch: Touch Events (not pointer events) ----
   * Browsers fire pointercancel as soon as a drag could become a pan/zoom, which would end
   * the tracking after a few pixels. Touch events keep arriving for the whole drag, and the
   * passive listeners below leave scrolling, taps and links entirely to the browser. */
  function find(list, id) {
    for (var i = 0; i < list.length; i++) if (list[i].identifier === id) return list[i];
    return null;
  }
  document.addEventListener('touchstart', function (e) {
    lastTouchAt = performance.now();
    if (!enabled || touchId !== null) return;
    if (e.target.closest && e.target.closest('.hc-pad')) return;   // the walk/jump buttons are not "looking"
    var t = e.changedTouches[0];
    touchId = t.identifier; px = t.clientX; py = t.clientY;
    measure(); engage();
  }, opts);
  document.addEventListener('touchmove', function (e) {
    lastTouchAt = performance.now();
    if (touchId === null) return;
    var t = find(e.touches, touchId);
    if (!t) return;
    px = t.clientX; py = t.clientY;
    engage();
  }, opts);
  function touchDone(e) {
    lastTouchAt = performance.now();
    if (touchId === null || !find(e.changedTouches, touchId)) return;
    touchId = null; release(TOUCH_HOLD);
  }
  document.addEventListener('touchend', touchDone, opts);
  document.addEventListener('touchcancel', touchDone, opts);

  /* ---- keep in step with the character and the layout ---- */
  C.onChange = function () { if (tracking || focus) kick(); };  // walking / jumping / turning changes where to look

  /* Small handle for js/herolife.js. Both calls take null to let go. */
  window.MCHeadTrack = {
    ambient: function (yaw, pitch) { ambient = yaw == null ? null : { yaw: yaw, pitch: pitch || 0 }; kick(); },
    lookAt: function (x, y) { focus = x == null ? null : { x: x, y: y }; kick(); }
  };
  window.addEventListener('resize', measure);
  window.addEventListener('orientationchange', measure);
  measure();

  /* ---- reduced motion ---- */
  function onMotionPref() {
    enabled = !(mq && mq.matches);
    if (!enabled) reset();
  }
  if (mq) {
    if (mq.addEventListener) mq.addEventListener('change', onMotionPref);
    else if (mq.addListener) mq.addListener(onMotionPref);
  }
})();
