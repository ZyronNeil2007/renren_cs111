/* Life Craft mini-games.
 *
 * One game per page. Each page contains
 *   <section class="panel game" data-game="NAME"> ... <div class="game-ui"></div> </section>
 * and this file builds the game inside .game-ui using the "MINI GAMES" styles
 * in css/style.css.
 *
 *   memory  - childhood_memories   simon   - family_relatives
 *   torches - my_friends           hearts  - me_and_my_love
 *   cook    - my_favorite_food     quiz    - my_favorite_movie
 *   beat    - my_song              ttt     - joke_time
 *   mine    - welcome
 *
 * Best scores are kept in localStorage (wrapped in try/catch, so private
 * windows still work). Sounds are tiny Web Audio blips with an On/Off toggle.
 */
(function () {
  'use strict';

  /* ---------------------------------------------------------- helpers */
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }
  function rnd(n) { return Math.floor(Math.random() * n); }
  function pick(a) { return a[rnd(a.length)]; }
  function shuffle(a) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = rnd(i + 1), t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function reduceMotion() {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }
  var store = {
    get: function (k, d) {
      try { var v = localStorage.getItem('lc:' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; }
    },
    set: function (k, v) { try { localStorage.setItem('lc:' + k, JSON.stringify(v)); } catch (e) {} }
  };

  /* Resolve with the subset of srcs that actually load. */
  function loadImages(srcs) {
    return Promise.all(srcs.map(function (s) {
      return new Promise(function (res) {
        var im = new Image();
        var t = setTimeout(function () { res(null); }, 5000);
        im.onload = function () { clearTimeout(t); res(s); };
        im.onerror = function () { clearTimeout(t); res(null); };
        im.src = s;
      });
    })).then(function (r) { return r.filter(Boolean); });
  }

  /* ---------------------------------------------------------- sound */
  var ac = null;
  var muted = store.get('muted', false);
  function beep(freq, dur, type) {
    if (muted) return;
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)();
      if (ac.state === 'suspended') ac.resume();
      var d = dur || 0.18, o = ac.createOscillator(), g = ac.createGain();
      o.type = type || 'square';
      o.frequency.value = freq;
      g.gain.setValueAtTime(0.07, ac.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + d);
      o.connect(g); g.connect(ac.destination);
      o.start(); o.stop(ac.currentTime + d + 0.02);
    } catch (e) {}
  }

  /* ---------------------------------------------------------- shared game frame
   * stats: [[key, label, initial], ...]  ->  chips; buttons are added after. */
  function frame(root, stats) {
    var host = $('.game-ui', root) || root;
    host.innerHTML = '';
    var row = el('div', 'game-row');
    var refs = {};
    stats.forEach(function (s) {
      var chip = el('span', 'game-stat');
      chip.appendChild(document.createTextNode(s[1] + ' '));
      var b = el('b');
      b.textContent = s[2];
      chip.appendChild(b);
      refs[s[0]] = b;
      row.appendChild(chip);
    });
    var area = el('div', 'game-area');
    var status = el('p', 'game-status');
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    host.appendChild(row);
    host.appendChild(area);
    host.appendChild(status);
    return {
      row: row,
      area: area,
      set: function (k, v) { if (refs[k]) refs[k].textContent = v; },
      say: function (t) { status.textContent = t; },
      button: function (label, fn) {
        var b = el('button', 'mc-btn', label);
        b.type = 'button';
        b.addEventListener('click', fn);
        row.appendChild(b);
        return b;
      },
      sound: function () {
        var b = el('button', 'mc-btn');
        b.type = 'button';
        var paint = function () {
          b.textContent = 'Sound: ' + (muted ? 'Off' : 'On');
          b.setAttribute('aria-pressed', String(!muted));
        };
        b.addEventListener('click', function () { muted = !muted; store.set('muted', muted); paint(); });
        paint();
        row.appendChild(b);
        return b;
      }
    };
  }

  var games = {};

  /* ======================================================== 1. MEMORY MATCH */
  games.memory = function (root) {
    var PAIRS = 6;
    var ICONS = ['bear', 'heart', 'house', 'friends', 'meat', 'film'];
    var best = store.get('memory', null);
    var cache = null, gen = 0;
    var ui = frame(root, [['moves', 'Moves', 0], ['pairs', 'Pairs', '0/' + PAIRS], ['best', 'Best', best == null ? '-' : best]]);
    ui.button('Shuffle', start);

    function photoSrcs() { return $$('.photo img').map(function (i) { return i.currentSrc || i.src; }); }

    function start() {
      var tok = ++gen;
      ui.area.innerHTML = '';
      ui.set('moves', 0); ui.set('pairs', '0/' + PAIRS);
      ui.say('Loading photos...');
      var p = cache ? Promise.resolve(cache) : loadImages(photoSrcs()).then(function (r) { cache = r; return r; });
      p.then(function (imgs) { if (tok === gen) build(imgs); });
    }

    function build(imgs) {
      var items = imgs.slice(0, PAIRS).map(function (s) { return { key: s, img: s }; });
      for (var i = 0; items.length < PAIRS; i++) items.push({ key: 'icon-' + ICONS[i], icon: ICONS[i] });
      var deck = shuffle(items.concat(items));
      var board = el('div', 'mem-board');
      var first = null, lock = false, moves = 0, found = 0;

      function label(b, n, up) {
        b.setAttribute('aria-label', 'Card ' + (n + 1) + (up ? (b._it.icon ? ', ' + b._it.icon + ' icon' : ', photo') : ', face down'));
      }

      deck.forEach(function (it, n) {
        var b = el('button', 'mem-card');
        b.type = 'button';
        b._it = it; b._n = n; b.dataset.key = it.key;
        var front = el('span', 'mem-front', '<i class="px px-creeper"></i>');
        var back = el('span', 'mem-back');
        front.setAttribute('aria-hidden', 'true'); back.setAttribute('aria-hidden', 'true');
        if (it.img) { var im = el('img'); im.alt = ''; im.src = it.img; back.appendChild(im); }
        else back.innerHTML = '<i class="px px-' + it.icon + '"></i>';
        b.appendChild(front); b.appendChild(back);
        label(b, n, false);

        b.addEventListener('click', function () {
          if (lock || b.classList.contains('up')) return;
          b.classList.add('up'); label(b, n, true);
          beep(440, 0.06);
          if (!first) { first = b; return; }
          moves++; ui.set('moves', moves);
          var a = first; first = null;
          if (a.dataset.key === b.dataset.key) {
            a.classList.add('done'); b.classList.add('done');
            found++; ui.set('pairs', found + '/' + PAIRS);
            beep(660, 0.12);
            if (found === PAIRS) {
              if (best == null || moves < best) { best = moves; store.set('memory', best); ui.set('best', best); }
              ui.say('You found every memory in ' + moves + ' moves!');
            } else ui.say('Match!');
          } else {
            lock = true; ui.say('Not a match.');
            setTimeout(function () {
              a.classList.remove('up'); b.classList.remove('up');
              label(a, a._n, false); label(b, b._n, false);
              lock = false;
            }, 800);
          }
        });
        board.appendChild(b);
      });
      ui.area.appendChild(board);
      ui.say(imgs.length < 2 ? 'Tip: add photos to this chapter and they become the cards. Using icons for now.' : 'Flip two cards to find a pair.');
    }
    start();
  };

  /* ======================================================== 2. FAMILY ECHO (Simon) */
  games.simon = function (root) {
    var COLORS = [['Green', '#5d9b3a', 262], ['Red', '#c62828', 330], ['Blue', '#2f56c6', 392], ['Yellow', '#f2c230', 523]];
    var best = store.get('simon', 0);
    var seq = [], pos = 0, accept = false, round = 0, timers = [];
    var ui = frame(root, [['round', 'Round', 0], ['best', 'Best', best]]);
    var startBtn = ui.button('Start', start);
    ui.sound();
    var wrap = el('div', 'simon');
    ui.area.appendChild(wrap);
    var pads = COLORS.map(function (c, i) {
      var b = el('button', 'pad', (i + 1) + ' ' + c[0]);
      b.type = 'button';
      b.style.setProperty('--pc', c[1]);
      b.setAttribute('aria-label', c[0] + ' pad, key ' + (i + 1));
      b.setAttribute('aria-disabled', 'true');
      b.addEventListener('click', function () { press(i); });
      wrap.appendChild(b);
      return b;
    });
    root.addEventListener('keydown', function (e) {
      var n = '1234'.indexOf(e.key);
      if (n > -1 && e.key.length === 1) press(n);
    });

    function clear() { timers.forEach(clearTimeout); timers = []; }
    function allow(on) {
      accept = on;
      pads.forEach(function (p) { p.setAttribute('aria-disabled', on ? 'false' : 'true'); });
    }
    function light(i, ms) {
      pads[i].classList.add('lit');
      beep(COLORS[i][2], 0.25, 'triangle');
      timers.push(setTimeout(function () { pads[i].classList.remove('lit'); }, ms));
    }
    function next() {
      seq.push(rnd(4)); pos = 0; allow(false);
      ui.say('Watch the pattern...');
      var gap = Math.max(300, 580 - round * 18);
      seq.forEach(function (c, i) { timers.push(setTimeout(function () { light(c, gap * 0.6); }, 700 + i * gap)); });
      timers.push(setTimeout(function () {
        allow(true);
        ui.say('Your turn! Repeat ' + seq.length + ' step' + (seq.length > 1 ? 's' : '') + '.');
      }, 700 + seq.length * gap));
    }
    function start() {
      clear(); seq = []; round = 0; ui.set('round', 0);
      startBtn.textContent = 'Restart';
      next();
    }
    function press(i) {
      if (!accept) return;
      light(i, 220);
      if (i !== seq[pos]) {
        allow(false); beep(110, 0.4, 'sawtooth');
        ui.say('Oops, wrong pad! You reached round ' + round + '. Press Restart to try again.');
        return;
      }
      pos++;
      if (pos === seq.length) {
        round++; ui.set('round', round); allow(false);
        if (round > best) { best = round; store.set('simon', best); ui.set('best', best); }
        ui.say('Nice! Next round...');
        timers.push(setTimeout(next, 800));
      }
    }
    ui.say('Press Start. Watch the pads light up, then repeat the pattern (keys 1-4 work too).');
  };

  /* ======================================================== 3. TORCH GRAB */
  games.torches = function (root) {
    var DUR = 30;
    var best = store.get('torches', 0);
    var score = 0, t = DUR, running = false, timers = [], tick = null;
    var ui = frame(root, [['score', 'Score', 0], ['time', 'Time', DUR], ['best', 'Best', best]]);
    var startBtn = ui.button('Start', play);
    ui.sound();
    var grid = el('div', 'torch-grid');
    ui.area.appendChild(grid);
    var holes = [];
    for (var n = 0; n < 9; n++) (function (i) {
      var b = el('button', 'hole');
      b.type = 'button';
      var h = { b: b, lit: false, tok: 0 };
      paint(h, i);
      b.addEventListener('click', function () { grab(i); });
      holes.push(h); grid.appendChild(b);
    })(n);

    function paint(h, i) {
      h.b.classList.toggle('lit', h.lit);
      h.b.setAttribute('aria-label', 'Torch spot ' + (i + 1) + (h.lit ? ', lit! click to grab' : ', dark'));
    }
    function clearAll() { timers.forEach(clearTimeout); timers = []; clearInterval(tick); }
    function setLit(i, on) { holes[i].lit = on; holes[i].tok++; paint(holes[i], i); }
    function spawn() {
      if (!running) return;
      var free = [];
      holes.forEach(function (h, i) { if (!h.lit) free.push(i); });
      if (free.length) {
        var i = pick(free);
        setLit(i, true);
        var tok = holes[i].tok;
        timers.push(setTimeout(function () { if (holes[i].tok === tok) setLit(i, false); }, Math.max(520, 1100 - (DUR - t) * 18)));
      }
      timers.push(setTimeout(spawn, Math.max(300, 800 - (DUR - t) * 14)));
    }
    function grab(i) {
      if (!running) return;
      if (!holes[i].lit) { ui.say('Too early! Wait for a lit torch.'); return; }
      score++; ui.set('score', score); ui.say('');
      beep(520 + (score % 6) * 70, 0.08);
      setLit(i, false);
    }
    function end() {
      running = false; clearAll();
      holes.forEach(function (h, i) { setLit(i, false); });
      if (score > best) { best = score; store.set('torches', best); ui.set('best', best); }
      ui.say('Time! You grabbed ' + score + ' torch' + (score === 1 ? '' : 'es') + '.');
      startBtn.textContent = 'Play again';
    }
    function play() {
      clearAll();
      holes.forEach(function (h, i) { setLit(i, false); });
      score = 0; t = DUR; running = true;
      ui.set('score', 0); ui.set('time', t); ui.say('Go! Grab the lit torches.');
      tick = setInterval(function () { t--; ui.set('time', t); if (t <= 0) end(); }, 1000);
      spawn();
    }
    ui.say('Press Start. Torches light up around the camp. Click each one before it burns out!');
  };

  /* ======================================================== 4. CATCH THE HEARTS */
  games.hearts = function (root) {
    var DUR = 30;
    var best = store.get('hearts', 0);
    var score = 0, lives = 3, t = DUR, running = false, timers = [], tick = null;
    var ui = frame(root, [['score', 'Hearts', 0], ['lives', 'Lives', 3], ['time', 'Time', DUR], ['best', 'Best', best]]);
    var startBtn = ui.button('Start', play);
    ui.sound();
    var field = el('div', 'fall-area');
    field.setAttribute('role', 'group');
    field.setAttribute('aria-label', 'Falling hearts play area');
    ui.area.appendChild(field);

    function clearAll() { timers.forEach(clearTimeout); timers = []; clearInterval(tick); }
    function spawn() {
      if (!running) return;
      var bad = Math.random() < 0.2;
      var f = el('button', 'faller' + (bad ? ' bomb' : ''), '<i class="px px-' + (bad ? 'creeper' : 'heart') + '"></i>');
      f.type = 'button';
      f.setAttribute('aria-label', bad ? 'Creeper, do not click' : 'Heart, click to catch');
      var w = field.clientWidth || 300;
      var dur = Math.max(1.7, 3.5 - (DUR - t) * 0.05 - Math.random() * 0.6);
      var life = dur * 1000;
      f.style.left = Math.round(Math.random() * Math.max(10, w - 52)) + 'px';
      if (reduceMotion()) {                          // no falling animation: pop up in place
        f.style.top = Math.round(20 + Math.random() * Math.max(10, (field.clientHeight || 320) - 100)) + 'px';
        life = 1600;
      } else f.style.animationDuration = dur + 's';
      f.addEventListener('click', function () {
        if (!running || !f.parentNode) return;
        f.remove();
        if (bad) {
          lives--; ui.set('lives', lives); beep(110, 0.3, 'sawtooth');
          ui.say('Ssss! A creeper! -1 life');
          if (lives <= 0) end();
        } else {
          score++; ui.set('score', score); beep(660, 0.08); ui.say('');
        }
      });
      field.appendChild(f);
      timers.push(setTimeout(function () { if (f.parentNode) f.remove(); }, life + 80));
      timers.push(setTimeout(spawn, Math.max(320, 820 - (DUR - t) * 12)));
    }
    function end() {
      running = false; clearAll(); field.innerHTML = '';
      if (score > best) { best = score; store.set('hearts', best); ui.set('best', best); }
      ui.say(lives <= 0 ? 'Out of lives! You caught ' + score + ' hearts.' : 'Time! You caught ' + score + ' hearts.');
      startBtn.textContent = 'Play again';
    }
    function play() {
      clearAll(); field.innerHTML = '';
      score = 0; lives = 3; t = DUR; running = true;
      ui.set('score', 0); ui.set('lives', 3); ui.set('time', t);
      ui.say('Go! Catch the hearts, dodge the creepers.');
      tick = setInterval(function () { t--; ui.set('time', t); if (t <= 0) end(); }, 1000);
      spawn();
    }
    ui.say('Press Start. Click hearts to collect them. Clicking a creeper costs a life!');
  };

  /* ======================================================== 5. COOK IT RIGHT */
  games.cook = function (root) {
    var dishes = $$('.dish').map(function (d) {
      return {
        name: $('h2', d).textContent.trim(),
        steps: $$('ol li', d).map(function (li) { return li.textContent.replace(/\s+/g, ' ').trim(); })
      };
    }).filter(function (d) { return d.steps.length > 1; });
    if (!dishes.length) return;

    var cur = 0, next = 0, miss = 0;
    var ui = frame(root, [['step', 'Step', '0/0'], ['miss', 'Mistakes', 0]]);
    ui.button('Shuffle steps', start);
    var picker = el('div', 'game-row');
    var picks = dishes.map(function (d, i) {
      var b = el('button', 'mc-btn');
      b.type = 'button'; b.textContent = d.name;
      b.addEventListener('click', function () { cur = i; start(); });
      picker.appendChild(b);
      return b;
    });
    var cols = el('div', 'cook-cols');
    var left = el('div', '', '<h3 class="game-h3">Steps (shuffled)</h3>');
    var right = el('div', '', '<h3 class="game-h3">Your recipe</h3>');
    var opts = el('div', 'cook-opts');
    var done = el('ol', 'cook-done');
    left.appendChild(opts); right.appendChild(done);
    cols.appendChild(left); cols.appendChild(right);
    ui.area.appendChild(picker); ui.area.appendChild(cols);

    function start() {
      var d = dishes[cur], n = d.steps.length;
      next = 0; miss = 0;
      opts.innerHTML = ''; done.innerHTML = '';
      ui.set('step', '0/' + n); ui.set('miss', 0);
      picks.forEach(function (b, i) { b.setAttribute('aria-pressed', String(i === cur)); });
      shuffle(d.steps.map(function (s, i) { return { s: s, i: i }; })).forEach(function (st) {
        var b = el('button', 'step-btn');
        b.type = 'button'; b.textContent = st.s;
        b.addEventListener('click', function () {
          if (b.disabled) return;
          if (st.i === next) {
            next++; b.disabled = true;
            var li = el('li'); li.textContent = st.s; done.appendChild(li);
            ui.set('step', next + '/' + n); beep(520, 0.07);
            if (next === n) {
              ui.say(miss === 0 ? 'Perfect! ' + d.name + ' is served with zero mistakes.'
                : d.name + ' is ready! ' + miss + ' mistake' + (miss > 1 ? 's' : '') + ' along the way.');
              beep(780, 0.25);
            } else ui.say('Correct!');
          } else {
            miss++; ui.set('miss', miss); beep(110, 0.15, 'sawtooth');
            ui.say('Not yet! What comes before that?');
            b.classList.remove('shake'); void b.offsetWidth; b.classList.add('shake');
            setTimeout(function () { b.classList.remove('shake'); }, 400);
          }
        });
        opts.appendChild(b);
      });
      ui.say('Click the steps in the right order, starting from step 1.');
    }
    start();
  };

  /* ======================================================== 6. MOVIE QUIZ */
  games.quiz = function (root) {
    var BANK = [
      { q: 'Who plays Guy in Free Guy?', a: 'Ryan Reynolds', o: ['Chris Hemsworth', 'Dwayne Johnson', 'Joe Keery'] },
      { q: 'What is the video game world in Free Guy called?', a: 'Free City', o: ['Jumanji', 'Sakaar', 'Far Far Away'] },
      { q: 'Who plays Dr. Smolder Bravestone in Jumanji: Welcome to the Jungle?', a: 'Dwayne Johnson', o: ['Kevin Hart', 'Jack Black', 'Ryan Reynolds'] },
      { q: 'Who plays Professor Shelly Oberon in Jumanji: Welcome to the Jungle?', a: 'Jack Black', o: ['Kevin Hart', 'Nick Jonas', 'Dwayne Johnson'] },
      { q: 'Which character does Antonio Banderas voice in Shrek 2?', a: 'Puss in Boots', o: ['Donkey', 'Prince Charming', 'King Harold'] },
      { q: 'Who voices Donkey in Shrek 2?', a: 'Eddie Murphy', o: ['Mike Myers', 'Antonio Banderas', 'John Cleese'] },
      { q: 'What is the kingdom called in Shrek 2?', a: 'Far Far Away', o: ['Free City', 'Asgard', 'Sakaar'] },
      { q: 'What kind of pet is Monchi in The Mitchells vs. the Machines?', a: 'A pug', o: ['A corgi', 'A cat', 'A parrot'] },
      { q: 'Who voices PAL in The Mitchells vs. the Machines?', a: 'Olivia Colman', o: ['Maya Rudolph', 'Abbi Jacobson', 'Cate Blanchett'] },
      { q: 'Which planet is Thor stranded on in Thor: Ragnarok?', a: 'Sakaar', o: ['Asgard', 'Jumanji', 'Free City'] },
      { q: 'Who plays Hela in Thor: Ragnarok?', a: 'Cate Blanchett', o: ['Tessa Thompson', 'Olivia Colman', 'Julie Andrews'] },
      { q: 'Who directed Thor: Ragnarok?', a: 'Taika Waititi', o: ['Shawn Levy', 'Jake Kasdan', 'Mike Rianda'] }
    ];
    var ROUND = 8;
    var best = store.get('quiz', null);
    var order, i, score;
    var ui = frame(root, [['q', 'Question', '1/' + ROUND], ['score', 'Score', 0], ['best', 'Best', best == null ? '-' : best + '/' + ROUND]]);
    ui.button('New round', start);
    var box = el('div', 'quiz');
    ui.area.appendChild(box);

    function start() {
      order = shuffle(BANK).slice(0, ROUND); i = 0; score = 0;
      ui.set('score', 0); ask();
    }
    function ask() {
      var q = order[i];
      ui.set('q', (i + 1) + '/' + ROUND);
      box.innerHTML = ''; ui.say('');
      var p = el('p', 'q'); p.textContent = q.q; box.appendChild(p);
      shuffle([q.a].concat(q.o)).forEach(function (t) {
        var b = el('button', 'opt');
        b.type = 'button'; b.textContent = t;
        b.addEventListener('click', function () { answer(b, t === q.a, q); });
        box.appendChild(b);
      });
    }
    function answer(btn, ok, q) {
      $$('.opt', box).forEach(function (b) {
        b.disabled = true;
        if (b.textContent === q.a) { b.classList.add('good'); b.textContent += '  ✓ correct'; }
      });
      if (ok) { score++; beep(660, 0.12); } else { btn.classList.add('bad'); btn.textContent += '  ✗ wrong'; beep(110, 0.25, 'sawtooth'); }
      ui.set('score', score);
      ui.say(ok ? 'Correct!' : 'Not quite. The answer is ' + q.a + '.');
      var last = i === ROUND - 1;
      var nb = el('button', 'mc-btn', last ? 'See result' : 'Next question');
      nb.type = 'button';
      nb.addEventListener('click', function () { if (last) finish(); else { i++; ask(); } });
      box.appendChild(nb);
      nb.focus();
    }
    function finish() {
      if (best == null || score > best) { best = score; store.set('quiz', best); ui.set('best', best + '/' + ROUND); }
      var rank = score === ROUND ? 'Movie master!' : score >= ROUND * 0.7 ? 'Great watching!' : score >= ROUND * 0.4 ? 'Not bad, grab more popcorn.' : 'Time for a movie night!';
      box.innerHTML = '';
      var p = el('p', 'q'); p.textContent = 'You scored ' + score + ' / ' + ROUND + '. ' + rank; box.appendChild(p);
      ui.say('');
    }
    start();
  };

  /* ======================================================== 7. BEAT TAPPER */
  games.beat = function (root) {
    var best = store.get('beat', 0);
    var score = 0, combo = 0, lives = 3, running = false, p = 0, dir = 1, v = 0.7, last = 0, raf = 0;
    var ui = frame(root, [['score', 'Score', 0], ['combo', 'Combo', 0], ['lives', 'Lives', 3], ['best', 'Best', best]]);
    var startBtn = ui.button('Start', play);
    ui.sound();
    var bar = el('div', 'beat-bar');
    bar.setAttribute('role', 'img');
    bar.setAttribute('aria-label', 'Beat meter. Tap when the yellow marker is inside the green zone.');
    var zone = el('div', 'beat-zone'), marker = el('div', 'beat-marker');
    bar.appendChild(zone); bar.appendChild(marker);
    var tap = el('button', 'mc-btn big beat-tap', 'TAP!');
    tap.type = 'button';
    tap.addEventListener('click', tapNow);
    ui.area.appendChild(bar); ui.area.appendChild(tap);

    function place() { marker.style.left = (p * ((bar.clientWidth || 300) - 8)) + 'px'; }
    function inZone() {
      var W = bar.clientWidth || 300, c = (p * (W - 8) + 4) / W;
      return c >= 0.43 && c <= 0.57;
    }
    function flash(cls) {
      bar.classList.add(cls);
      setTimeout(function () { bar.classList.remove(cls); }, 240);
    }
    function loop(ts) {
      if (!running) return;
      var dt = Math.min(0.05, (ts - (last || ts)) / 1000); last = ts;
      p += dir * v * dt;
      if (p >= 1) { p = 1; dir = -1; } else if (p <= 0) { p = 0; dir = 1; }
      place();
      raf = requestAnimationFrame(loop);
    }
    function tapNow() {
      if (!running) { ui.say('Press Start first.'); return; }
      if (inZone()) {
        combo++; score += 10 + Math.min(combo, 10) * 2;
        v = Math.min(2.2, v + 0.04);
        flash('good'); beep(440 + combo * 25, 0.09);
        ui.say(combo >= 3 ? 'Combo x' + combo + '!' : 'Nice!');
      } else {
        lives--; combo = 0;
        flash('bad'); beep(110, 0.25, 'sawtooth');
        ui.say('Miss! Wait for the green zone.');
        if (lives <= 0) end();
      }
      ui.set('score', score); ui.set('combo', combo); ui.set('lives', lives);
    }
    function end() {
      running = false; cancelAnimationFrame(raf);
      if (score > best) { best = score; store.set('beat', best); ui.set('best', best); }
      ui.say('Game over! You scored ' + score + '. Press Play again to beat it.');
      startBtn.textContent = 'Play again';
    }
    function play() {
      cancelAnimationFrame(raf);
      score = 0; combo = 0; lives = 3; v = 0.7; p = 0; dir = 1; last = 0; running = true;
      ui.set('score', 0); ui.set('combo', 0); ui.set('lives', 3);
      ui.say('Tap when the yellow marker is inside the green zone. It speeds up with every hit!');
      place(); tap.focus();
      raf = requestAnimationFrame(loop);
    }
    place();
    ui.say('Press Start, then tap (or press Space) when the yellow marker is in the green zone.');
  };

  /* ======================================================== 8. TIC-TAC-TOE vs CREEPER */
  games.ttt = function (root) {
    var LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
    var rec = store.get('ttt', { w: 0, d: 0, l: 0 });
    var s = [], over = false, busy = false, winLine = null;
    var ui = frame(root, [['w', 'Wins', rec.w], ['d', 'Draws', rec.d], ['l', 'Losses', rec.l]]);
    ui.button('New game', reset);
    var board = el('div', 'ttt');
    var bonus = el('p', 'game-sub');
    bonus.style.marginTop = '16px';
    ui.area.appendChild(board); ui.area.appendChild(bonus);
    var cells = [];
    for (var n = 0; n < 9; n++) (function (i) {
      var b = el('button', 'cell');
      b.type = 'button';
      b.addEventListener('click', function () { human(i); });
      cells.push(b); board.appendChild(b);
    })(n);

    function paint() {
      cells.forEach(function (b, i) {
        b.textContent = s[i];
        b.className = 'cell' + (s[i] ? ' ' + s[i].toLowerCase() : '') + (winLine && winLine.indexOf(i) > -1 ? ' win' : '');
        b.disabled = !!s[i] || over;
        b.setAttribute('aria-label', 'Row ' + (Math.floor(i / 3) + 1) + ', column ' + (i % 3 + 1) + ', ' + (s[i] || 'empty'));
      });
    }
    function result() {
      for (var k = 0; k < LINES.length; k++) {
        var L = LINES[k];
        if (s[L[0]] && s[L[0]] === s[L[1]] && s[L[1]] === s[L[2]]) return { w: s[L[0]], line: L };
      }
      return s.every(Boolean) ? { w: 'draw' } : null;
    }
    function findWin(who) {
      for (var k = 0; k < LINES.length; k++) {
        var L = LINES[k], mine = 0, hole = -1;
        L.forEach(function (c) { if (s[c] === who) mine++; else if (!s[c]) hole = c; });
        if (mine === 2 && hole > -1) return hole;
      }
      return -1;
    }
    function cpuMove() {
      var empty = [];
      s.forEach(function (v, i) { if (!v) empty.push(i); });
      if (Math.random() < 0.25) return pick(empty);               // sometimes it slips, so you can win
      var m = findWin('O'); if (m > -1) return m;
      m = findWin('X'); if (m > -1) return m;
      if (!s[4]) return 4;
      var corners = [0, 2, 6, 8].filter(function (c) { return !s[c]; });
      return corners.length ? pick(corners) : pick(empty);
    }
    function finish(r) {
      over = true; busy = false;
      winLine = r.line || null;
      if (r.w === 'X') {
        rec.w++; beep(780, 0.3);
        var js = $$('.joke');
        if (js.length) {
          var j = pick(js);
          bonus.textContent = 'Winner’s bonus joke: ' + $('.q', j).textContent.trim() + ' ' + $('.a', j).textContent.trim();
        }
        ui.say('You win! The creeper is defeated.');
      } else if (r.w === 'O') { rec.l++; beep(110, 0.4, 'sawtooth'); ui.say('Ssss... the creeper wins this one.'); }
      else { rec.d++; ui.say('It’s a draw.'); }
      store.set('ttt', rec);
      ui.set('w', rec.w); ui.set('d', rec.d); ui.set('l', rec.l);
      paint();
    }
    function human(i) {
      if (over || busy || s[i]) return;
      s[i] = 'X'; beep(520, 0.06); paint();
      var r = result();
      if (r) { finish(r); return; }
      busy = true; ui.say('Creeper is thinking...');
      setTimeout(function () {
        if (over) return;
        s[cpuMove()] = 'O'; busy = false; beep(330, 0.06);
        var r2 = result();
        if (r2) finish(r2); else { ui.say('Your turn.'); paint(); }
      }, 380);
    }
    function reset() {
      s = ['', '', '', '', '', '', '', '', '']; over = false; busy = false; winLine = null;
      bonus.textContent = ''; paint();
      ui.say('You are X and you go first. Beat the creeper (O) to unlock a bonus joke!');
    }
    reset();
  };

  /* ======================================================== 9. MINE A BLOCK (hub) */
  games.mine = function (root) {
    var ORES = [
      { id: 'dirt', name: 'Dirt', w: 50, hits: 3, c: '#8a5c33', c2: '#7b4f2a' },
      { id: 'stone', name: 'Stone', w: 30, hits: 5, c: '#8b8b8b', c2: '#6e6e6e' },
      { id: 'iron', name: 'Iron', w: 12, hits: 7, c: '#d8af93', c2: '#b78d70' },
      { id: 'gold', name: 'Gold', w: 6, hits: 9, c: '#f2c230', c2: '#c99a14' },
      { id: 'diamond', name: 'Diamond', w: 2, hits: 12, c: '#35d6c3', c2: '#1fa595' }
    ];
    var inv = store.get('mine', {}) || {};
    var ui = frame(root, ORES.map(function (o) { return [o.id, o.name, inv[o.id] || 0]; }));
    ui.button('Reset loot', function () {
      inv = {}; store.set('mine', inv);
      ORES.forEach(function (o) { ui.set(o.id, 0); });
      ui.say('Loot cleared. Time to mine again!');
    });
    ui.sound();

    var row = el('div', 'game-row');
    var block = el('button', 'mine-block');
    block.type = 'button';
    var side = el('div', 'mine-side');
    var info = el('p');
    var bar = el('div', 'mine-bar');
    var fill = el('i');
    bar.appendChild(fill); side.appendChild(info); side.appendChild(bar);
    row.appendChild(block); row.appendChild(side);
    ui.area.appendChild(row);

    var ore, hits;
    function roll() {
      var r = Math.random() * 100;
      for (var k = 0; k < ORES.length; k++) { r -= ORES[k].w; if (r <= 0) return ORES[k]; }
      return ORES[0];
    }
    function show() {
      block.style.background = 'conic-gradient(' + ore.c + ' 25%, ' + ore.c2 + ' 0 50%, ' + ore.c + ' 0 75%, ' + ore.c2 + ' 0) 0 0 / 64px 64px';
      block.textContent = ore.name.toUpperCase();
      fill.style.width = (hits / ore.hits * 100) + '%';
      info.textContent = 'Mining ' + ore.name + ': ' + hits + ' / ' + ore.hits + ' hits';
      block.setAttribute('aria-label', 'Mine ' + ore.name + ', ' + (ore.hits - hits) + ' hits left');
    }
    function fresh() { ore = roll(); hits = 0; show(); }
    block.addEventListener('click', function () {
      hits++;
      block.classList.remove('hit'); void block.offsetWidth; block.classList.add('hit');
      beep(170 + hits * 35, 0.07);
      if (hits >= ore.hits) {
        inv[ore.id] = (inv[ore.id] || 0) + 1;
        store.set('mine', inv); ui.set(ore.id, inv[ore.id]);
        beep(ore.id === 'diamond' ? 880 : 330, 0.22);
        ui.say('You mined ' + ore.name + '!' + (ore.id === 'diamond' ? ' Diamonds!' : ''));
        fresh();
      } else show();
    });
    fresh();
    ui.say('Click the block until it breaks. Rarer ores take more hits!');
  };

  /* ---------------------------------------------------------- boot */
  function init() {
    $$('[data-game]').forEach(function (root) {
      var fn = games[root.getAttribute('data-game')];
      if (!fn) return;
      try { fn(root); } catch (e) { if (window.console) console.error('Game failed:', root.getAttribute('data-game'), e); }
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
