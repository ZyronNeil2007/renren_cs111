/* Page-specific behaviour: food images, movie picker, song player, jokes */
(function () {
  'use strict';

  // ---------- Food: hide broken dish thumbnails ----------
  document.querySelectorAll('.dish summary img').forEach(function (img) {
    img.addEventListener('error', function () { img.style.visibility = 'hidden'; });
  });

  // ---------- Movies ----------
  var posterBtns = document.querySelectorAll('.poster-btn');
  if (posterBtns.length) {
    posterBtns.forEach(function (btn) {
      var img = btn.querySelector('img');
      var miss = function () { btn.classList.add('is-missing'); };
      img.addEventListener('error', miss);
      if (img.complete && img.naturalWidth === 0) miss();

      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-movie');
        posterBtns.forEach(function (b) {
          b.setAttribute('aria-pressed', String(b === btn));
        });
        document.querySelectorAll('.movie-detail').forEach(function (d) {
          d.hidden = d.id !== id;
          var v = d.querySelector('video');
          if (v && d.hidden) v.pause();
        });
      });
    });

    // Clip slots: if the video file is missing, show a note instead
    document.querySelectorAll('.clip').forEach(function (clip) {
      var v = clip.querySelector('video');
      var s = clip.querySelector('source');
      var flag = function () { clip.classList.add('no-clip'); };
      s.addEventListener('error', flag);
      v.addEventListener('error', flag);
      window.addEventListener('load', function () {
        if (v.networkState === 3) flag();   // NETWORK_NO_SOURCE
      });
    });
  }

  // ---------- Song player ----------
  var audio = document.getElementById('audio');
  if (audio) {
    var player = document.getElementById('player');
    var btns = Array.prototype.slice.call(document.querySelectorAll('.track'));
    var playBtn = document.getElementById('play');
    var seek = document.getElementById('seek');
    var timeEl = document.getElementById('time');
    var title = document.getElementById('now-title');
    var msg = document.getElementById('audio-msg');
    var cur = -1;

    var fmt = function (s) {
      if (!isFinite(s)) return '0:00';
      var m = Math.floor(s / 60), r = Math.floor(s % 60);
      return m + ':' + (r < 10 ? '0' : '') + r;
    };

    function load(i, autoplay) {
      cur = (i + btns.length) % btns.length;
      msg.hidden = true;
      btns.forEach(function (b, k) { b.setAttribute('aria-current', String(k === cur)); });
      title.textContent = btns[cur].getAttribute('data-title');
      audio.src = btns[cur].getAttribute('data-src');
      seek.value = 0;
      if (autoplay) audio.play().catch(function () {});
    }

    btns.forEach(function (b, i) { b.addEventListener('click', function () { load(i, true); }); });
    playBtn.addEventListener('click', function () {
      if (cur === -1) { load(0, true); return; }
      if (audio.paused) audio.play().catch(function () {}); else audio.pause();
    });
    document.getElementById('prev').addEventListener('click', function () { load(cur === -1 ? 0 : cur - 1, true); });
    document.getElementById('next').addEventListener('click', function () { load(cur + 1, true); });

    audio.addEventListener('play', function () { player.classList.add('playing'); playBtn.innerHTML = '&#10074;&#10074; Pause'; });
    audio.addEventListener('pause', function () { player.classList.remove('playing'); playBtn.innerHTML = '&#9654; Play'; });
    audio.addEventListener('ended', function () { load(cur + 1, true); });
    audio.addEventListener('error', function () { if (cur !== -1) msg.hidden = false; });
    audio.addEventListener('timeupdate', function () {
      if (audio.duration) seek.value = (audio.currentTime / audio.duration) * 100;
      timeEl.textContent = fmt(audio.currentTime) + ' / ' + fmt(audio.duration);
    });
    seek.addEventListener('input', function () {
      if (audio.duration) audio.currentTime = (seek.value / 100) * audio.duration;
    });

    // "Why I love this song" text file (works when served over http)
    var why = document.getElementById('why-text');
    if (why && window.fetch) {
      fetch('../img/My%20Song/why_i_choose_this_music.txt')
        .then(function (r) { return r.ok ? r.text() : Promise.reject(); })
        .then(function (t) { if (t.trim()) why.textContent = t.trim(); })
        .catch(function () {});
    }
  }

  // ---------- Jokes ----------
  document.querySelectorAll('.joke').forEach(function (joke) {
    var btn = joke.querySelector('.reveal-btn');
    btn.addEventListener('click', function () {
      var shown = joke.classList.toggle('shown');
      btn.textContent = shown ? 'Hide punchline' : 'Reveal punchline';
    });
  });
})();
