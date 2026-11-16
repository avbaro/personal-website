/* Alex Baró — personal site v4 */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ───────────── Theme (system default, remembered choice) ───────────── */

  var THEME_KEY = 'alexbaro-theme';
  var systemDark = window.matchMedia('(prefers-color-scheme: dark)');
  var toggle = document.querySelector('.theme-toggle');

  function savedTheme() {
    try {
      var v = localStorage.getItem(THEME_KEY);
      return v === 'dark' || v === 'light' ? v : null;
    } catch (e) { return null; }
  }

  function currentTheme() {
    return savedTheme() || (systemDark.matches ? 'dark' : 'light');
  }

  function applyTheme() {
    var theme = currentTheme();
    root.setAttribute('data-theme', theme);
    if (toggle) {
      var next = theme === 'dark' ? 'light' : 'dark';
      toggle.querySelector('.next').textContent = next;
      toggle.setAttribute('aria-label', 'Switch to ' + next + ' mode');
    }
  }

  if (toggle) {
    toggle.addEventListener('click', function () {
      var next = currentTheme() === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem(THEME_KEY, next); } catch (e) {}
      applyTheme();
    });
  }

  if (systemDark.addEventListener) {
    systemDark.addEventListener('change', function () { if (!savedTheme()) applyTheme(); });
  }
  applyTheme();

  /* ───────────── Binary background ("alex baro" in 8-bit ASCII) ───────────── */

  var BYTES = 'alex baro '.split('').map(function (ch) {
    return ch.charCodeAt(0).toString(2).padStart(8, '0');
  });

  /* A row used to be a fixed 28 byte-groups regardless of viewport width,
     which comfortably overflowed a normal window (clipped by overflow:hidden)
     but fell short on a wide monitor, leaving bare background past where the
     fixed-length row ran out. Measure the actual per-token width at the
     current font-size/letter-spacing and generate just enough tokens to
     cover the element's current width, so it still fills edge-to-edge on
     any screen - and regenerate on resize so docking into a wider display
     without a reload doesn't leave the same gap. */
  function measureTokenWidth(el) {
    var probe = document.createElement('div');
    probe.className = el.className;
    probe.style.cssText = 'position:absolute;visibility:hidden;inset:auto;white-space:nowrap;';
    probe.textContent = BYTES[0];
    document.body.appendChild(probe);
    var one = probe.offsetWidth;
    probe.textContent = BYTES[0] + ' ' + BYTES[0];
    var two = probe.offsetWidth;
    document.body.removeChild(probe);
    return (two - one) || 70;
  }

  function fillBinary(el, rows) {
    var tokenWidth = measureTokenWidth(el);
    var needed = Math.ceil((el.clientWidth || window.innerWidth) / tokenWidth) + 8;
    el.textContent = '';
    var frag = document.createDocumentFragment();
    var rowTokens = [];
    var rowEls = [];
    for (var i = 0; i < rows; i++) {
      var parts = [];
      for (var j = 0; j < needed; j++) parts.push(BYTES[(i * 3 + j) % BYTES.length]);
      var line = document.createElement('div');
      line.textContent = parts.join(' ');
      frag.appendChild(line);
      rowTokens.push(parts);
      rowEls.push(line);
    }
    el.appendChild(frag);
    el._rowTokens = rowTokens;
    el._rowEls = rowEls;
  }

  var binaryEls = [].slice.call(document.querySelectorAll('[data-binary]'));
  function fillAllBinary() {
    binaryEls.forEach(function (el) {
      fillBinary(el, parseInt(el.getAttribute('data-binary'), 10) || 90);
    });
  }
  fillAllBinary();

  var binaryResizeTimer = null;
  window.addEventListener('resize', function () {
    clearTimeout(binaryResizeTimer);
    binaryResizeTimer = setTimeout(fillAllBinary, 200);
  });

  /* Occasional bit-flicker: a random digit in the binary field flips
     0<->1 for a brief moment then reverts, like a bit actually toggling
     in memory. Operates on the stored token arrays (not full re-render)
     so each flicker only touches one row's text. Paused for
     reduced-motion visitors and while the tab is hidden. */
  function scheduleFlicker() {
    var delay = 350 + Math.random() * 650;
    setTimeout(flickerBit, delay);
  }

  function flickerBit() {
    if (!reduceMotion && !document.hidden && binaryEls.length) {
      var el = binaryEls[Math.floor(Math.random() * binaryEls.length)];
      var rows = el._rowTokens;
      if (rows && rows.length) {
        var ri = Math.floor(Math.random() * rows.length);
        var tokens = rows[ri];
        var rowEl = el._rowEls[ri];
        if (tokens && tokens.length && rowEl) {
          (function () {
            var ti = Math.floor(Math.random() * tokens.length);
            var original = tokens[ti];
            var bi = Math.floor(Math.random() * original.length);
            var flipped = original.substr(0, bi) + (original[bi] === '0' ? '1' : '0') + original.substr(bi + 1);
            tokens[ti] = flipped;
            rowEl.textContent = tokens.join(' ');
            setTimeout(function () {
              if (tokens[ti] === flipped) {
                tokens[ti] = original;
                rowEl.textContent = tokens.join(' ');
              }
            }, 180 + Math.random() * 220);
          })();
        }
      }
    }
    scheduleFlicker();
  }

  if (!reduceMotion) scheduleFlicker();

  /* ───────────── Hero aurora drifts on its own ─────────────
     Each blob wanders around its home spot along a few layered,
     slow sine waves with random phases, so the path never visibly
     repeats. Moves with transform only (cheap with the big blur),
     pauses when the hero is off-screen, and stays put for
     reduced-motion visitors. */

  var hero = document.querySelector('.hero');
  var glow = document.querySelector('.binary--glow');
  var blobs = [
    { el: document.querySelector('.aurora--a'), home: { x: 65, y: 40 },   range: { x: 18, y: 16 } },
    { el: document.querySelector('.aurora--b'), home: { x: 54.5, y: 72 }, range: { x: 22, y: 12 } }
  ];

  function waves() {
    // three sines per axis, periods 28–75s, random phase
    var w = [];
    for (var i = 0; i < 3; i++) {
      w.push({ f: (2 * Math.PI) / (28 + Math.random() * 47), p: Math.random() * 2 * Math.PI, a: [0.55, 0.3, 0.15][i] });
    }
    return w;
  }
  function sample(w, t) {
    var v = 0;
    for (var i = 0; i < w.length; i++) v += w[i].a * Math.sin(w[i].f * t + w[i].p);
    return v; // roughly -1..1
  }

  if (hero && blobs[0].el && blobs[1].el && !reduceMotion) {
    blobs.forEach(function (b) {
      b.wx = waves(); b.wy = waves();
      b.el.style.transition = 'none';
      b.el.style.willChange = 'transform';
    });

    var visible = true, frame = 0, t0 = performance.now();

    function tick(now) {
      if (!visible) return;
      var t = (now - t0) / 1000;
      var W = hero.offsetWidth, H = hero.offsetHeight;
      blobs.forEach(function (b, i) {
        var x = sample(b.wx, t) * b.range.x;   // % of hero
        var y = sample(b.wy, t) * b.range.y;
        b.el.style.transform = 'translate(-50%, -50%) translate(' + (x * W / 100).toFixed(1) + 'px, ' + (y * H / 100).toFixed(1) + 'px)';
        if (i === 0 && glow && frame % 4 === 0) {
          glow.style.setProperty('--mx', (b.home.x + x).toFixed(2) + '%');
          glow.style.setProperty('--my', (b.home.y + y).toFixed(2) + '%');
        }
      });
      frame++;
      requestAnimationFrame(tick);
    }

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        var was = visible;
        visible = entries[0].isIntersecting;
        if (visible && !was) requestAnimationFrame(tick);
      }).observe(hero);
    }
    requestAnimationFrame(tick);
  }

  /* ───────────── Live spec labels ───────────── */

  function watchSize(target, label) {
    if (!target || !label || typeof ResizeObserver === 'undefined') return;
    new ResizeObserver(function (entries) {
      var r = entries[0].contentRect;
      label.textContent = Math.round(r.width) + ' × ' + Math.round(r.height) + ' px';
    }).observe(target);
  }

  watchSize(document.querySelector('.wordmark svg'), document.querySelector('[data-dims="wordmark"]'));
  watchSize(document.querySelector('.photo-box'), document.querySelector('[data-dims="portrait"]'));

  var about = document.querySelector('.about');
  var aboutStats = document.querySelector('[data-stats="about"]');
  if (about && aboutStats && typeof ResizeObserver !== 'undefined') {
    var measureAbout = function () {
      var text = (about.textContent || '').trim();
      var words = text ? text.split(/\s+/).length : 0;
      var cs = getComputedStyle(about);
      var lh = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.6;
      var lines = Math.max(1, Math.round(about.offsetHeight / lh));
      aboutStats.textContent = words + ' words · ' + lines + (lines === 1 ? ' line' : ' lines');
    };
    new ResizeObserver(measureAbout).observe(about);
  }

  /* ───────────── Scroll-driven blobs by the footer ───────────── */

  var lower = document.querySelector('.lower');
  var sA = document.querySelector('.scroll-blob--a');
  var sB = document.querySelector('.scroll-blob--b');
  var sRaf = 0;

  function onScroll() {
    if (sRaf) return;
    sRaf = requestAnimationFrame(function () {
      sRaf = 0;
      var r = lower.getBoundingClientRect();
      var vh = window.innerHeight || 800;
      var p = Math.max(0, Math.min(1, (vh - r.top) / (r.height + vh)));
      var w = lower.offsetWidth || 1280;
      sA.style.transform = 'translate3d(' + Math.round((-0.08 + p * 0.18) * w) + 'px, 0, 0)';
      sB.style.transform = 'translate3d(' + Math.round((0.86 + p * 0.18) * w) + 'px, 0, 0)';
    });
  }

  if (lower && sA && sB) {
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    onScroll();
  }

  /* ───────────── Smooth in-page jumps (contact shortcut) ─────────────
     Custom easing instead of the browser default so the landing feels
     gentler, and we compute + clamp the target ourselves so it can
     never try to scroll past the end of the page. */

  document.querySelectorAll('a[href^="#"]:not([href="#"])').forEach(function (link) {
    link.addEventListener('click', function (e) {
      var target = document.getElementById(link.getAttribute('href').slice(1));
      if (!target) return;
      e.preventDefault();
      if (reduceMotion) { target.scrollIntoView(); return; }
      var startY = window.pageYOffset;
      var maxY = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      var targetY = Math.min(Math.round(target.getBoundingClientRect().top + startY), maxY);
      var duration = 700;
      var t0 = null;
      function ease(p) { return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2; } // ease-in-out cubic
      function step(now) {
        if (t0 === null) t0 = now;
        var p = Math.min((now - t0) / duration, 1);
        window.scrollTo(0, Math.round(startY + (targetY - startY) * ease(p)));
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);

      // Terminal-style flash on the contact box once the scroll lands
      if (link.classList.contains('contact-jump') && !reduceMotion) {
        var box = target.querySelector('.spec-box');
        if (box) {
          box.classList.remove('flash');
          void box.offsetWidth; // restart the animation if it's already mid-flash
          setTimeout(function () { box.classList.add('flash'); }, duration);
          box.addEventListener('animationend', function () { box.classList.remove('flash'); }, { once: true });
        }
      }

      if (history.pushState) history.pushState(null, '', link.getAttribute('href'));
    });
  });

  /* ───────────── Coffee status (Pacific time) ───────────── */

  var status = document.querySelector('.status');
  var statusText = document.querySelector('.status-text');

  function laHour() {
    try {
      return parseInt(new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Los_Angeles', hour: 'numeric', hourCycle: 'h23'
      }).format(new Date()), 10);
    } catch (e) { return new Date().getHours(); }
  }

  function updateStatus() {
    var h = laHour();
    var on = h >= 7 && h < 18;   // caffeinated 7 AM – 6 PM PT
    status.setAttribute('data-state', on ? 'on' : 'off');
    statusText.textContent = on ? 'caffeinated' : 'decaffeinated';
  }

  if (status && statusText) {
    updateStatus();
    setInterval(updateStatus, 60000);
  }
})();
