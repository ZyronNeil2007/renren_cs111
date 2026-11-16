/* Life Craft advancements.
 *
 * Minecraft-style "Advancement made!" toasts, plus a list on the Plains (welcome) page.
 *
 * Where progress comes from:
 *   - what the pages already keep: the mini-game scores/loot in localStorage ("lc:memory",
 *     "lc:simon", "lc:torches", "lc:hearts", "lc:quiz", "lc:beat", "lc:ttt", "lc:mine"). They are only
 *     read, never changed, so a visitor who has already played gets credit straight away;
 *   - "mc:event" announcements from the title-screen character (crouch, jump, sleep, break a block)
 *     and from js/sound.js (sound turned on);
 *   - which chapters have been opened, and whether the visit was at night.
 * Its own bookkeeping is one key, "lc:adv": { done: {id: time}, seen: {page: 1}, n: {counter: count} }.
 *
 * Toasts are announced politely to screen readers, slide in/out with transform only (a plain
 * fade under prefers-reduced-motion), and never block clicks. js/sound.js plays the jingle when a
 * toast is shown (and stays silent if sound is off or the karaoke track is playing).
 */
(function () {
  'use strict';

  var KEY = 'lc:adv';
  var CHAPTERS = ['childhood_memories', 'family_relatives', 'my_friends', 'me_and_my_love',
                  'my_favorite_food', 'my_favorite_movie', 'my_song', 'joke_time'];

  /* ---------------------------------------------------------- storage */
  function read(k, d) {
    try { var v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; }
  }
  var adv = read(KEY, null);
  if (!adv || typeof adv !== 'object') adv = {};
  adv.done = adv.done || {}; adv.seen = adv.seen || {}; adv.n = adv.n || {};
  function save() { try { localStorage.setItem(KEY, JSON.stringify(adv)); } catch (e) {} }

  /* ---------------------------------------------------------- the list
   * test(): optional, true once the existing saved state shows it is done.
   * prog(): optional, [have, total] for the progress bar.
   * icon: a .px-* class (css/style.css and css/features.css); c: icon colour. */
  function lcn(k) { var v = read('lc:' + k, 0); return typeof v === 'number' ? v : 0; }
  function inv() { var m = read('lc:mine', {}) || {}; return m; }
  function sum(o) { var t = 0; for (var k in o) if (typeof o[k] === 'number') t += o[k]; return t; }
  function seenChapters() { return CHAPTERS.filter(function (c) { return adv.seen[c]; }).length; }

  var GAMES = [
    { id: 'g_memory',  icon: 'px-bear',    c: '#f0a8c8', name: 'Photographic Memory', desc: 'Finish a round of Memory Match',       test: function () { return read('lc:memory', null) != null; } },
    { id: 'g_simon',   icon: 'px-house',   c: '#9fd35a', name: 'Echo Chamber',        desc: 'Play Family Echo',                      test: function () { return lcn('simon') > 0; } },
    { id: 'g_torches', icon: 'px-friends', c: '#ffb347', name: 'Light It Up',         desc: 'Grab some torches in Torch Grab',       test: function () { return lcn('torches') > 0; } },
    { id: 'g_hearts',  icon: 'px-heart',   c: '#ff5b5b', name: 'Heart Collector',     desc: 'Catch hearts in Catch the Hearts',      test: function () { return lcn('hearts') > 0; } },
    { id: 'g_cook',    icon: 'px-meat',    c: '#e0864a', name: 'Master Chef',         desc: 'Cook a dish in Cook It Right',          test: function () { return lcn('cook') > 0; } },
    { id: 'g_quiz',    icon: 'px-film',    c: '#b58cff', name: 'Movie Buff',          desc: 'Finish a round of the Movie Quiz',      test: function () { return read('lc:quiz', null) != null; } },
    { id: 'g_beat',    icon: 'px-mic',     c: '#6fc3ff', name: 'In the Groove',       desc: 'Score in Beat Tapper',                  test: function () { return lcn('beat') > 0; } },
    { id: 'g_ttt',     icon: 'px-laugh',   c: '#ff8f6b', name: 'Creeper? Aw Man',     desc: 'Finish a game of Tic-Tac-Toe',          test: function () { var r = read('lc:ttt', null); return !!r && (r.w || 0) + (r.d || 0) + (r.l || 0) > 0; } },
    { id: 'g_mine',    icon: 'px-block',   c: '#c9c9c9', name: 'Stone Age',           desc: 'Mine a block, on the title screen or in Mine a Block', test: function () { return sum(inv()) > 0; } }
  ];
  function gamesDone() { return GAMES.filter(function (g) { return adv.done[g.id]; }).length; }

  var LIST = [
    { id: 'welcome',  icon: 'px-house',  c: '#ffd24d', name: 'Welcome to Life Craft', desc: 'Open the world' },
    { id: 'spawn',    icon: 'px-block',  c: '#7ed957', name: 'Spawn Point',           desc: 'Arrive in the Plains', test: function () { return !!adv.seen.welcome; } },
    { id: 'explorer', icon: 'px-star',   c: '#ffd24d', name: 'Adventuring Time',      desc: 'Visit all 8 chapters', test: function () { return seenChapters() >= 8; }, prog: function () { return [seenChapters(), 8]; } },
    { id: 'sneak',    icon: 'px-boot',   c: '#c9a36a', name: 'Sneaking Around',       desc: 'Crouch with the down arrow' },
    { id: 'hop',      icon: 'px-spring', c: '#8fe3ff', name: 'Bunny Hop',             desc: 'Jump 10 times', test: function () { return (adv.n.jump || 0) >= 10; }, prog: function () { return [Math.min(10, adv.n.jump || 0), 10]; } },
    { id: 'nap',      icon: 'px-zzz',    c: '#bfc8ff', name: 'Sleeping on the Job',   desc: 'Let Mark doze off on the title screen' }
  ].concat(GAMES).concat([
    { id: 'diamond',  icon: 'px-gem',    c: '#35d6c3', name: 'Diamonds!',             desc: 'Mine a diamond, on the title screen or in Mine a Block', test: function () { return (inv().diamond || 0) > 0; } },
    { id: 'creeper',  icon: 'px-creeper', c: '#55ff55', name: 'Creeper Slayer',       desc: 'Beat the creeper at Tic-Tac-Toe', test: function () { var r = read('lc:ttt', null); return !!r && (r.w || 0) > 0; } },
    { id: 'perfect',  icon: 'px-star',   c: '#ffff55', name: 'Perfect Score',         desc: 'Get every Movie Quiz question right', test: function () { return read('lc:quiz', null) === 8; } },
    { id: 'allgames', icon: 'px-star',   c: '#ffaa00', name: 'Completionist',         desc: 'Finish all 9 mini-games', test: function () { return gamesDone() >= 9; }, prog: function () { return [gamesDone(), 9]; } },
    { id: 'night',    icon: 'px-moon',   c: '#bfc8ff', name: 'Night Owl',             desc: 'Visit the title screen at night' },
    { id: 'karaoke',  icon: 'px-disc',   c: '#ff6bd6', name: 'Karaoke Night',         desc: 'Play a song on My Song' },
    { id: 'sound',    icon: 'px-note',   c: '#7fe07f', name: 'Turn It Up',            desc: 'Switch the sound effects on' },
    { id: 'master',   icon: 'px-star',   c: '#ffd24d', name: 'Memories Complete',     desc: 'Earn every other advancement' }
  ]);
  var BY = {};
  LIST.forEach(function (a) { BY[a.id] = a; });
  function doneCount() { return LIST.filter(function (a) { return adv.done[a.id]; }).length; }

  /* ---------------------------------------------------------- toasts */
  var host = null, queue = [], showing = false, ready = false;
  function ensureHost() {
    if (host || !document.body) return host;
    host = document.createElement('div');
    host.className = 'adv-toasts';
    host.setAttribute('role', 'status');
    host.setAttribute('aria-live', 'polite');
    document.body.appendChild(host);
    return host;
  }
  function icon(a) {
    return '<span class="adv-icon" style="--ic:' + a.c + '"><i class="px ' + a.icon + '"></i></span>';
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function next() {
    if (showing || !queue.length || !ready || document.hidden) return;
    var job = queue.shift();
    showing = true;
    ensureHost();
    var t = document.createElement('div');
    t.className = 'adv-toast';
    t.innerHTML = icon(job) + '<span class="adv-text"><b class="adv-head">' +
      esc(job.head || 'Advancement made!') + '</b><span class="adv-name">' + esc(job.name) + '</span></span>';
    host.appendChild(t);
    void t.offsetWidth;                               // let the start position paint, then slide in
    t.classList.add('show');
    try { window.dispatchEvent(new CustomEvent('mc:event', { detail: { type: 'advancement', id: job.id } })); } catch (e) {}
    setTimeout(function () {
      t.classList.remove('show');
      setTimeout(function () { t.remove(); showing = false; next(); }, 450);
    }, 4600);
  }
  function toast(a) {
    // never stack a long run of toasts (first visit after earlier progress): 3, then one summary
    var waiting = queue.filter(function (q) { return !q.head; }).length;
    if (waiting >= 3) {
      var s = queue.filter(function (q) { return q.summary; })[0];
      var where = document.getElementById('adv-grid') ? 'listed below' : 'see the Plains page';
      if (s) { s.extra++; s.name = '+' + s.extra + ' more, ' + where; }
      else queue.push({ id: 'more', summary: true, extra: 1, head: 'Advancements made!', icon: 'px-star', c: '#ffd24d', name: '+1 more, ' + where });
    } else queue.push(a);
    next();
  }

  /* ---------------------------------------------------------- unlocking */
  function unlock(id) {
    var a = BY[id];
    if (!a || adv.done[id]) return false;
    adv.done[id] = Date.now();
    save();
    toast(a);
    renderPanel();
    if (id !== 'master' && doneCount() >= LIST.length - 1) unlock('master');
    return true;
  }

  function sweep() {                                   // what the saved state already proves
    LIST.forEach(function (a) { if (a.test && !adv.done[a.id]) { try { if (a.test()) unlock(a.id); } catch (e) {} } });
  }

  /* ---------------------------------------------------------- the list on the Plains page */
  var grid = null, countEl = null;
  function renderPanel() {
    if (!grid) return;
    var n = doneCount();
    if (countEl) countEl.textContent = n + ' / ' + LIST.length;
    LIST.forEach(function (a) {
      var li = grid.querySelector('[data-id="' + a.id + '"]');
      if (!li) return;
      var ok = !!adv.done[a.id];
      li.classList.toggle('is-done', ok);
      li.classList.toggle('is-locked', !ok);
      li.querySelector('.adv-state').textContent = ok ? 'Done' : 'Locked';
      if (a.prog) {
        var p = a.prog(), pct = Math.round(100 * Math.min(p[0], p[1]) / p[1]);
        li.querySelector('.adv-bar i').style.width = (ok ? 100 : pct) + '%';
        li.querySelector('.adv-count').textContent = (ok ? p[1] : p[0]) + ' / ' + p[1];
      }
    });
  }
  function buildPanel() {
    grid = document.getElementById('adv-grid');
    countEl = document.getElementById('adv-count');
    if (!grid) return;
    grid.innerHTML = '';
    LIST.forEach(function (a) {
      var li = document.createElement('li');
      li.className = 'adv-card is-locked';
      li.setAttribute('data-id', a.id);
      li.innerHTML = icon(a) + '<span class="adv-text"><b class="adv-name">' + esc(a.name) + '</b>' +
        '<span class="adv-desc">' + esc(a.desc) + '</span>' +
        (a.prog ? '<span class="adv-bar" aria-hidden="true"><i></i></span><small class="adv-count"></small>' : '') +
        '<span class="adv-state">Locked</span></span>';
      grid.appendChild(li);
    });
    renderPanel();
  }

  /* ---------------------------------------------------------- what is happening right now */
  function pageId() {
    var f = location.pathname.split('/').pop().replace(/\.html?$/, '');
    return f || 'index';
  }
  window.addEventListener('mc:event', function (e) {
    var d = e.detail || {};
    switch (d.type) {
      case 'crouch': unlock('sneak'); break;
      case 'sleep': unlock('nap'); break;
      case 'jump':
        adv.n.jump = (adv.n.jump || 0) + 1;
        if (adv.n.jump <= 10) { save(); if (adv.n.jump >= 10) unlock('hop'); renderPanel(); }
        break;
      case 'break':
        adv.n.blocks = (adv.n.blocks || 0) + 1; save(); sweep(); break;   // the loot was written first
      case 'sound': if (d.on) unlock('sound'); break;
    }
  });
  window.addEventListener('mc:store', function () { sweep(); });   // a mini-game just saved a score
  // media events do not bubble, so listen while capturing
  document.addEventListener('play', function (e) {
    if (e.target && e.target.tagName === 'AUDIO') unlock('karaoke');
  }, true);

  function boot() {
    var id = pageId();
    adv.seen[id] = 1;
    unlock('welcome');
    sweep();
    var tod = document.body && document.body.getAttribute('data-tod');
    if (id === 'index' && tod === 'night' && !/[?&]time=/.test(location.search)) unlock('night');
    save();
    buildPanel();
    // let the page (and the teleport arrival overlay) settle before the first toast
    setTimeout(function () { ready = true; next(); }, 1100);
  }
  document.addEventListener('visibilitychange', function () { if (!document.hidden) next(); });

  window.MCAdv = {
    list: function () { return LIST.map(function (a) { return { id: a.id, name: a.name, desc: a.desc, done: !!adv.done[a.id] }; }); },
    unlock: unlock,
    reset: function () { adv = { done: {}, seen: {}, n: {} }; save(); renderPanel(); }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
