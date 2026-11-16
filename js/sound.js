/* Life Craft sound effects.
 *
 * Tiny Web Audio synth (no sound files). OFF by default: the visitor opts in with the speaker
 * button (top bar on the chapter pages, top-right on the title screen). The choice is kept in
 * localStorage under "lc:sfx".
 *
 *   window.MCSound = { play(name, volume), enabled(), set(on), toggle() }
 *
 * Other scripts never call this directly. They announce what happened with
 *   window.dispatchEvent(new CustomEvent('mc:event', { detail: { type: 'step' } }))
 * and this file (and js/advancements.js) listen. Page-wide button clicks and the portal whoosh for
 * chapter links are handled here too; mini-games keep their own little beeps (and their own
 * Sound toggle) and are left alone.
 *
 * The karaoke track: any <audio> that is playing silences every effect here, and this file
 * never touches an <audio> element, so the song is never interrupted, ducked or restarted.
 */
(function () {
  'use strict';

  var KEY = 'lc:sfx';
  var AC = window.AudioContext || window.webkitAudioContext;
  var on = false;
  try { on = JSON.parse(localStorage.getItem(KEY)) === true; } catch (e) {}

  var ctx = null, master = null, noiseBuf = null, last = {};

  function ensure() {
    if (!AC) return null;
    if (!ctx) {
      try { ctx = new AC(); } catch (e) { return null; }
      master = ctx.createGain(); master.gain.value = 0.6; master.connect(ctx.destination);
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      var d = noiseBuf.getChannelData(0);
      for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    if (ctx.state === 'suspended') { try { ctx.resume(); } catch (e) {} }
    return ctx;
  }

  /* A pitched blip: oscillator sweeping f0 -> f1 with a fast attack and an exponential decay. */
  function tone(type, f0, f1, dur, vol, delay) {
    var t = ctx.currentTime + (delay || 0);
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + dur + 0.03);
  }
  /* A burst of filtered noise: footsteps, block hits, whooshes. */
  function noise(dur, vol, kind, f0, f1, q, delay) {
    var t = ctx.currentTime + (delay || 0);
    var s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noiseBuf;
    f.type = kind; f.Q.value = q || 0.7;
    f.frequency.setValueAtTime(f0, t);
    if (f1 !== f0) f.frequency.exponentialRampToValueAtTime(Math.max(40, f1), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(master);
    s.start(t, Math.random() * 0.8); s.stop(t + dur + 0.03);
  }
  function rnd(a, b) { return a + Math.random() * (b - a); }

  var SFX = {
    click: function (v) { tone('square', 700, 520, 0.05, 0.035 * v); noise(0.025, 0.05 * v, 'highpass', 3500, 3500, 0.7); },
    step: function (v) {                                   // soft grass footfall, a little different every time
      var f = rnd(380, 640);
      noise(0.085, 0.2 * v, 'lowpass', f * 1.7, f * 0.55, 0.8);
      tone('sine', rnd(85, 120), 55, 0.07, 0.07 * v);
    },
    jump: function (v) { tone('square', 240, 430, 0.12, 0.035 * v); noise(0.05, 0.05 * v, 'lowpass', 900, 500, 0.7); },
    land: function (v) { noise(0.1, 0.22 * v, 'lowpass', 600, 180, 0.8); tone('sine', 120, 50, 0.11, 0.12 * v); },
    hit: function (v) { noise(0.07, 0.26 * v, 'bandpass', rnd(700, 1000), 520, 1.1); tone('square', rnd(140, 170), 100, 0.07, 0.05 * v); },
    break: function (v) {
      noise(0.22, 0.3 * v, 'lowpass', 2400, 260, 0.7);
      noise(0.08, 0.16 * v, 'highpass', 2600, 2600, 0.8, 0.04);
      noise(0.07, 0.12 * v, 'highpass', 2200, 2200, 0.8, 0.12);
      tone('square', 210, 70, 0.2, 0.045 * v);
    },
    yawn: function (v) { tone('sine', 340, 170, 0.75, 0.05 * v); tone('triangle', 510, 255, 0.75, 0.02 * v); },
    snore: function (v) { tone('triangle', 150, 105, 0.5, 0.045 * v); noise(0.45, 0.025 * v, 'lowpass', 300, 200, 0.7); },
    wake: function (v) { tone('square', 480, 720, 0.09, 0.035 * v); tone('square', 720, 960, 0.09, 0.03 * v, 0.08); },
    advance: function (v) {                                // the toast jingle: a bright rising arpeggio
      [523, 659, 784, 1047].forEach(function (f, i) { tone('triangle', f, f, 0.2, 0.06 * v, i * 0.09); });
      tone('sine', 2093, 2093, 0.35, 0.025 * v, 0.3);
    },
    portal: function (v) { noise(0.55, 0.16 * v, 'bandpass', 260, 2600, 1.4); tone('sine', 180, 720, 0.5, 0.05 * v); },
    pop: function (v) { tone('sine', 500, 900, 0.08, 0.05 * v); },
    on: function (v) { tone('square', 520, 520, 0.07, 0.04 * v); tone('square', 780, 780, 0.1, 0.04 * v, 0.07); }
  };
  var GAP = { step: 90, click: 40, hit: 60 };            // minimum ms between repeats of the same sound

  function karaokeBusy() {                               // never talk over the song
    var a = document.getElementsByTagName('audio');
    for (var i = 0; i < a.length; i++) if (!a[i].paused && !a[i].ended) return true;
    return false;
  }

  function play(name, vol) {
    if (!on || !SFX[name] || document.hidden || karaokeBusy()) return;
    var now = performance.now();
    if (now - (last[name] || -1e9) < (GAP[name] || 25)) return;
    last[name] = now;
    if (!ensure()) return;
    try { SFX[name](vol == null ? 1 : vol); } catch (e) {}
  }

  /* ---------------------------------------------------------- the toggle */
  var btn = null;
  function icon() {                                       // pixel speaker; waves when on, a red cross when off
    var cone = 'M1 6h3v4H1zM4 5h1v6H4zM5 4h1v8H5zM6 3h1v10H6z';
    var d = '';
    if (on) d = 'M9 6h1v4H9zM11 4h1v8h-1zM13 2h1v12h-1z';
    else for (var i = 0; i < 6; i++) d += 'M' + (9 + i) + ' ' + (5 + i) + 'h1v1h-1zM' + (9 + i) + ' ' + (10 - i) + 'h1v1h-1z';
    return '<svg viewBox="0 0 16 16" width="22" height="22" shape-rendering="crispEdges" aria-hidden="true" focusable="false">' +
           '<path fill="currentColor" d="' + cone + '"/><path fill="' + (on ? 'currentColor' : '#ff6b6b') + '" d="' + d + '"/></svg>';
  }
  function paint() {
    if (!btn) return;
    btn.innerHTML = icon();
    btn.setAttribute('aria-pressed', String(on));
    var label = on ? 'Sound effects on. Press to turn off' : 'Sound effects off. Press to turn on';
    btn.setAttribute('aria-label', label);
    btn.title = label;
    btn.classList.toggle('is-on', on);
  }
  function set(v) {
    on = !!v;
    try { localStorage.setItem(KEY, JSON.stringify(on)); } catch (e) {}
    paint();
    if (on) { ensure(); play('on'); }
    window.dispatchEvent(new CustomEvent('mc:event', { detail: { type: 'sound', on: on } }));
  }
  function build() {
    if (btn || !document.body) return;
    btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'mc-btn sfx-toggle';
    btn.addEventListener('click', function (e) { e.stopPropagation(); set(!on); });
    var bar = document.querySelector('.topbar');
    if (bar) bar.appendChild(btn); else document.body.appendChild(btn);
    paint();
  }

  /* ---------------------------------------------------------- wiring */
  window.addEventListener('mc:event', function (e) {
    var d = e.detail || {};
    var name = ({ step: 'step', jump: 'jump', land: 'land', hit: 'hit', 'break': 'break', yawn: 'yawn',
                  snore: 'snore', wake: 'wake', advancement: 'advance', pop: 'pop' })[d.type];
    if (name) play(name, d.v);
  });

  // Page-wide click sound. Mini-games already beep for their own buttons, the character makes
  // its own noises, and chapter links get the portal whoosh instead.
  document.addEventListener('click', function (e) {
    if (!on || !e.isTrusted) return;
    var t = e.target.closest && e.target.closest('a, button, [role="button"], .block');
    if (!t || t === btn || t.closest('.game, .hero-char, .hc-pad, .lightbox')) return;
    play(t.hasAttribute('data-morph') ? 'portal' : 'click');
  }, true);

  document.addEventListener('visibilitychange', function () {
    if (ctx && document.hidden && ctx.state === 'running') { try { ctx.suspend(); } catch (e) {} }
  });

  window.MCSound = { play: play, enabled: function () { return on; }, set: set, toggle: function () { set(!on); } };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build);
  else build();
})();
