(function (global) {
  'use strict';

  var GM = (global.GM = global.GM || {});

  var SCRAMBLE_GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*?';

  var scrambleTimer = null;
  var scrambledSpans = [];

  function el(id) { return document.getElementById(id); }

  function canvasURL(size, draw) {
    var c = document.createElement('canvas');
    c.width = size;
    c.height = size;
    var ctx = c.getContext('2d');
    draw(ctx, size);
    return c.toDataURL('image/png');
  }

  function dirtURL() {
    var palette = [124, 110, 98, 90, 80, 70]
      .map(function (base) { return [base, base * 0.76, base * 0.6]; })
      .map(function (rgb) {
        return rgb.map(function (v) { return Math.round(v * 0.42); });
      });
    return canvasURL(16, function (ctx) {
      for (var y = 0; y < 16; y++) {
        for (var x = 0; x < 16; x++) {
          var p = palette[(Math.random() * palette.length) | 0];
          ctx.fillStyle = 'rgb(' + p[0] + ',' + p[1] + ',' + p[2] + ')';
          ctx.fillRect(x, y, 1, 1);
        }
      }
    });
  }

  function defaultIconURL() {
    return canvasURL(16, function (ctx) {
      for (var by = 0; by < 4; by++) {
        for (var bx = 0; bx < 4; bx++) {
          var base = 90 + ((Math.random() * 70) | 0);
          for (var y = 0; y < 4; y++) {
            for (var x = 0; x < 4; x++) {
              var v = Math.max(30, Math.min(210, base + ((Math.random() * 34) | 0) - 17));
              ctx.fillStyle = 'rgb(' + v + ',' + v + ',' + v + ')';
              ctx.fillRect(bx * 4 + x, by * 4 + y, 1, 1);
            }
          }
        }
      }
    });
  }

  function creeperIconURL() {
    var greens = ['#6abf5b', '#5eb451', '#54a849', '#4c9c42', '#77c966', '#459039'];
    var face = '#13210f';
    return canvasURL(16, function (ctx) {
      var x, y;
      for (y = 0; y < 16; y++) {
        for (x = 0; x < 16; x++) {
          ctx.fillStyle = greens[(Math.random() * greens.length) | 0];
          ctx.fillRect(x, y, 1, 1);
        }
      }
      ctx.fillStyle = face;
      ctx.fillRect(3, 5, 4, 4);
      ctx.fillRect(9, 5, 4, 4);
      ctx.fillRect(6, 9, 4, 5);
      ctx.fillRect(4, 12, 2, 2);
      ctx.fillRect(10, 12, 2, 2);
    });
  }

  function setPing(strength, quality) {
    var ping = el('mcPing');
    if (!ping) return;
    ping.setAttribute('data-quality', quality);
    var bars = ping.querySelectorAll('.mc-bar');
    for (var i = 0; i < bars.length; i++) {
      bars[i].classList.toggle('filled', i < strength);
    }
  }

  function qualityFor(strength) {
    if (strength >= 4) return 'good';
    if (strength === 3) return 'mid';
    return 'bad';
  }

  function reping() {
    var ticks = 0;
    var maxTicks = 7;
    if (reping._timer) clearInterval(reping._timer);
    reping._timer = setInterval(function () {
      ticks++;
      if (ticks >= maxTicks) {
        clearInterval(reping._timer);
        reping._timer = null;
        var final = [5, 5, 5, 4, 4, 4, 3, 2][(Math.random() * 8) | 0];
        setPing(final, qualityFor(final));
        return;
      }
      var rand = 1 + ((Math.random() * 5) | 0);
      setPing(rand, qualityFor(rand));
    }, 80);
  }

  function stopScramble() {
    if (scrambleTimer) {
      clearInterval(scrambleTimer);
      scrambleTimer = null;
    }
    scrambledSpans.forEach(function (s) {
      s.textContent = s.dataset.orig || s.textContent;
    });
    scrambledSpans = [];
  }

  function startScramble(spans) {
    stopScramble();
    if (!spans.length) return;
    scrambledSpans = spans;
    scrambleTimer = setInterval(function () {
      for (var i = 0; i < spans.length; i++) {
        spans[i].textContent = SCRAMBLE_GLYPHS[(Math.random() * SCRAMBLE_GLYPHS.length) | 0];
      }
    }, 110);
  }

  var STYLE_CLASSES = {
    bold: 'mc-bold',
    italic: 'mc-italic',
    underline: 'mc-underline',
    strikethrough: 'mc-strikethrough'
  };

  function render(lines, styles) {
    var root = el('mcMotd');
    if (!root) return;
    stopScramble();
    root.textContent = '';

    var obfSpans = [];

    lines.forEach(function (line) {
      var div = document.createElement('div');
      div.className = 'mc-line';
      Object.keys(STYLE_CLASSES).forEach(function (key) {
        if (styles[key]) div.classList.add(STYLE_CLASSES[key]);
      });

      line.forEach(function (cell) {
        var span = document.createElement('span');
        span.className = 'mc-char';
        span.style.color = cell.hex;
        span.style.textShadow = '1.5px 1.5px 0 ' + GM.shadowOf(cell.hex);
        span.textContent = cell.ch;
        div.appendChild(span);
        if (styles.obfuscated && cell.ch !== ' ') {
          span.dataset.orig = cell.ch;
          obfSpans.push(span);
        }
      });

      root.appendChild(div);
    });

    if (styles.obfuscated) startScramble(obfSpans);
  }

  function setIcon(dataURL) {
    var img = el('mcIcon');
    if (img) img.src = dataURL;
  }

  function init() {
    var screen = el('mcScreen');
    if (screen) screen.style.backgroundImage = 'url(' + dirtURL() + ')';

    setIcon(creeperIconURL());
    var fallback = el('mcDefaultIcon');
    if (fallback) fallback.src = defaultIconURL();

    setPing(5, 'good');
    var muted = document.querySelector('.mc-row-muted .mc-ping');
    if (muted) {
      var bars = muted.querySelectorAll('.mc-bar');
      for (var i = 0; i < bars.length; i++) bars[i].classList.toggle('filled', i < 3);
      muted.setAttribute('data-quality', 'mid');
    }

    var refresh = el('mcRefresh');
    if (refresh) refresh.addEventListener('click', reping);
  }

  GM.preview = {
    init: init,
    render: render,
    setIcon: setIcon,
    reping: reping,
    creeperIconURL: creeperIconURL
  };
})(window);