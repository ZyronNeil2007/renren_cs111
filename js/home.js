/* Title screen + chapter hub behaviour */
(function () {
  'use strict';

  // Rotating splash text (title screen)
  var splash = document.querySelector('.splash');
  if (splash) {
    var lines = [
      'Made with love!', 'Also try Memories!', 'Now with 8 chapters!',
      'Creeper? Aw man!', 'Mine your memories!', '100% pixel perfect!',
      'Press Enter!', 'Diamonds not included!'
    ];
    splash.textContent = lines[Math.floor(Math.random() * lines.length)];
  }

  // Keyboard: Enter starts, 1-8 jump to a chapter
  document.addEventListener('keydown', function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    var play = document.querySelector('.play');
    if (e.key === 'Enter' && play && document.activeElement === document.body) {
      play.click();
      return;
    }
    if (/^[1-8]$/.test(e.key)) {
      var cards = document.querySelectorAll('.block');
      if (cards[Number(e.key) - 1]) cards[Number(e.key) - 1].click();
    }
  });

  // Subtle 3D tilt on the chapter blocks
  document.querySelectorAll('.block').forEach(function (card) {
    card.addEventListener('pointermove', function (e) {
      if (e.pointerType === 'touch') return;
      var r = card.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width - 0.5;
      var py = (e.clientY - r.top) / r.height - 0.5;
      card.style.setProperty('--ry', (px * 14).toFixed(1) + 'deg');
      card.style.setProperty('--rx', (-py * 14).toFixed(1) + 'deg');
    });
    card.addEventListener('pointerleave', function () {
      card.style.setProperty('--ry', '0deg');
      card.style.setProperty('--rx', '0deg');
    });
  });
})();
