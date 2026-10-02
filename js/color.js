(function (global) {
  'use strict';

  var GM = (global.GM = global.GM || {});

  function clamp(n, min, max) {
    return Math.min(max, Math.max(min, n));
  }

  function pad2(n) {
    return clamp(Math.round(n), 0, 255).toString(16).padStart(2, '0');
  }

  function make(r, g, b) {
    r = Number(r); g = Number(g); b = Number(b);
    if (![r, g, b].every(function (v) { return v >= 0 && v <= 255; })) return null;
    return { r: r, g: g, b: b };
  }

  function parseColor(raw) {
    if (raw == null) return null;
    var s = String(raw).trim();
    if (!s) return null;

    var fn = s.match(/^rgba?\(\s*(\d{1,3})\D+(\d{1,3})\D+(\d{1,3})/i);
    if (fn) return make(fn[1], fn[2], fn[3]);

    s = s.replace(/^#/, '');

    if (/^[0-9a-fA-F]{3}$/.test(s)) {
      return make(
        parseInt(s[0] + s[0], 16),
        parseInt(s[1] + s[1], 16),
        parseInt(s[2] + s[2], 16)
      );
    }
    if (/^[0-9a-fA-F]{6}$/.test(s)) {
      return make(
        parseInt(s.slice(0, 2), 16),
        parseInt(s.slice(2, 4), 16),
        parseInt(s.slice(4, 6), 16)
      );
    }
    var csv = s.match(/^(\d{1,3})\s*[, ]\s*(\d{1,3})\s*[, ]\s*(\d{1,3})$/);
    if (csv) return make(csv[1], csv[2], csv[3]);

    return null;
  }

  function toHex(c) {
    return '#' + pad2(c.r) + pad2(c.g) + pad2(c.b);
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function lerpColor(c1, c2, t) {
    t = clamp(t, 0, 1);
    return {
      r: lerp(c1.r, c2.r, t),
      g: lerp(c1.g, c2.g, t),
      b: lerp(c1.b, c2.b, t)
    };
  }

  function shadowOf(hex) {
    var c = parseColor(hex) || { r: 255, g: 255, b: 255 };
    return toHex({ r: c.r * 0.25, g: c.g * 0.25, b: c.b * 0.25 });
  }

  GM.clamp = clamp;
  GM.parseColor = parseColor;
  GM.toHex = toHex;
  GM.lerp = lerp;
  GM.lerpColor = lerpColor;
  GM.shadowOf = shadowOf;
})(window);