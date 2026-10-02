(function (global) {
  'use strict';

  var GM = (global.GM = global.GM || {});

  var MAX_LINES = 2;

  var STYLE_CODES = [
    { key: 'bold', code: 'l', mm: 'bold' },
    { key: 'italic', code: 'o', mm: 'italic' },
    { key: 'underline', code: 'n', mm: 'underlined' },
    { key: 'strikethrough', code: 'm', mm: 'strikethrough' },
    { key: 'obfuscated', code: 'k', mm: 'obfuscated' }
  ];

  function splitLines(text) {
    var lines = String(text == null ? '' : text).split('\n');
    return {
      lines: lines.slice(0, MAX_LINES),
      truncated: lines.length > MAX_LINES
    };
  }

  function colorAt(i, n, start, end) {
    var t = n <= 1 ? 0 : i / (n - 1);
    return GM.toHex(GM.lerpColor(start, end, t));
  }

  function buildLines(text, start, end) {
    var split = splitLines(text);
    return split.lines.map(function (line) {
      var chars = Array.from(line);
      return chars.map(function (ch, i) {
        return { ch: ch, hex: colorAt(i, chars.length, start, end) };
      });
    });
  }

  function hasText(lines) {
    return lines.some(function (line) { return line.length > 0; });
  }

  function legacyStyles(styles, makeCode) {
    return STYLE_CODES
      .filter(function (s) { return styles && styles[s.key]; })
      .map(function (s) { return makeCode(s.code); })
      .join('');
  }

  function toVanilla(lines, styles) {
    if (!hasText(lines)) return '';
    var stylePart = legacyStyles(styles, function (c) { return '\\u00A7' + c; });
    return lines.map(function (line) {
      return line.map(function (cell) {
        var color = '\\u00A7x' + cell.hex.slice(1).split('')
          .map(function (d) { return '\\u00A7' + d; }).join('');
        var ch = cell.ch === '\\' ? '\\\\' : cell.ch;
        return color + stylePart + ch;
      }).join('');
    }).join('\\n');
  }

  function toAmpersand(lines, styles) {
    if (!hasText(lines)) return '';
    var stylePart = legacyStyles(styles, function (c) { return '&' + c; });
    return lines.map(function (line) {
      return line.map(function (cell) {
        var ch = cell.ch === '\\' ? '\\\\' : cell.ch;
        return '&#' + cell.hex.slice(1) + stylePart + ch;
      }).join('');
    }).join('\\n');
  }

  function toMiniMessage(lines, styles, startHex, endHex) {
    if (!hasText(lines)) return '';
    var open = '';
    var close = '';
    STYLE_CODES.forEach(function (s) {
      if (styles && styles[s.key]) {
        open += '<' + s.mm + '>';
        close = '</' + s.mm + '>' + close;
      }
    });
    return lines.map(function (line) {
      var text = line.map(function (cell) {
        return cell.ch === '<' ? '\\<' : cell.ch;
      }).join('');
      return open + '<gradient:' + startHex + ':' + endHex + '>' + text + '</gradient>' + close;
    }).join('\n');
  }

  GM.MAX_LINES = MAX_LINES;
  GM.STYLE_CODES = STYLE_CODES;
  GM.splitLines = splitLines;
  GM.colorAt = colorAt;
  GM.buildLines = buildLines;
  GM.toVanilla = toVanilla;
  GM.toAmpersand = toAmpersand;
  GM.toMiniMessage = toMiniMessage;
})(window);