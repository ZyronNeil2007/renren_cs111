/* Photo gallery helpers: missing-image placeholders + lightbox viewer */
(function () {
  'use strict';

  var figures = Array.prototype.slice.call(document.querySelectorAll('.photo'));
  if (!figures.length) return;

  // ----- Placeholder when a photo file is not found -----
  function markMissing(fig, img) {
    if (fig.classList.contains('is-missing')) return;
    fig.classList.add('is-missing');
    var name = decodeURIComponent((img.getAttribute('src') || '').split('/').pop());
    var ph = fig.querySelector('.ph');
    if (ph) ph.innerHTML = 'Add photo<br>' + name.replace(/</g, '&lt;');
  }
  figures.forEach(function (fig) {
    var img = fig.querySelector('img');
    if (!img) return;
    img.addEventListener('error', function () { markMissing(fig, img); });
    if (img.complete && img.naturalWidth === 0) markMissing(fig, img);
  });

  // ----- Lightbox -----
  var lb = document.createElement('div');
  lb.className = 'lb';
  lb.setAttribute('role', 'dialog');
  lb.setAttribute('aria-modal', 'true');
  lb.innerHTML =
    '<img alt="">' +
    '<div class="lb-cap"></div>' +
    '<div class="lb-bar">' +
      '<button class="mc-btn" data-act="prev">&#9664; Prev</button>' +
      '<button class="mc-btn" data-act="close">Close</button>' +
      '<button class="mc-btn" data-act="next">Next &#9654;</button>' +
    '</div>';
  document.body.appendChild(lb);

  var big = lb.querySelector('img');
  var cap = lb.querySelector('.lb-cap');
  var idx = 0;

  function show(i) {
    var usable = figures.filter(function (f) { return !f.classList.contains('is-missing'); });
    if (!usable.length) return;
    idx = (i + usable.length) % usable.length;
    var fig = usable[idx];
    var img = fig.querySelector('img');
    big.src = img.src;
    big.alt = img.alt;
    var fc = fig.querySelector('figcaption');
    cap.textContent = fc ? fc.textContent : '';
    lb.classList.add('open');
    lb._usable = usable;
  }
  function close() { lb.classList.remove('open'); }

  figures.forEach(function (fig) {
    var frame = fig.querySelector('.frame');
    if (!frame) return;
    frame.addEventListener('click', function () {
      if (fig.classList.contains('is-missing')) return;
      var usable = figures.filter(function (f) { return !f.classList.contains('is-missing'); });
      show(usable.indexOf(fig));
    });
  });

  lb.addEventListener('click', function (e) {
    var act = e.target.getAttribute && e.target.getAttribute('data-act');
    if (act === 'prev') show(idx - 1);
    else if (act === 'next') show(idx + 1);
    else if (act === 'close' || e.target === lb) close();
  });

  document.addEventListener('keydown', function (e) {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowLeft') show(idx - 1);
    else if (e.key === 'ArrowRight') show(idx + 1);
  });
})();
