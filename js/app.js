(function () {
  'use strict';

  var GM = window.GM;

  var state = {
    text: 'Welcome to GradientCraft\nEvery block, a rainbow',
    start: '#ff5f6d',
    end: '#ffc371',
    styles: {
      bold: false,
      italic: false,
      underline: false,
      strikethrough: false,
      obfuscated: false
    },
    tab: 'vanilla'
  };

  var outputs = { vanilla: '', ampersand: '', minimessage: '' };

  var $ = function (id) { return document.getElementById(id); };
  var els = {};

  function hint(message) {
    els.colorHint.textContent = message;
    els.colorHint.classList.toggle('hidden', !message);
  }

  function setColor(which, hex, syncField) {
    state[which] = hex.toLowerCase();
    var picker = els[which + 'Picker'];
    var field = els[which + 'Hex'];
    picker.value = state[which];
    if (syncField !== false) field.value = hex.toUpperCase();
    field.closest('.color-field').classList.remove('invalid');
    hint('');
    update();
  }

  function wireColor(which) {
    var picker = els[which + 'Picker'];
    var field = els[which + 'Hex'];

    picker.addEventListener('input', function () {
      setColor(which, picker.value);
    });

    field.addEventListener('input', function () {
      var parsed = GM.parseColor(field.value);
      var wrap = field.closest('.color-field');
      if (parsed) {
        wrap.classList.remove('invalid');
        hint('');
        state[which] = GM.toHex(parsed);
        picker.value = state[which];
        update();
      } else {
        wrap.classList.add('invalid');
        hint('Invalid color — use #RRGGBB, RRGGBB, rgb(255, 0, 0) or 255, 0, 0');
      }
    });

    field.addEventListener('blur', function () {
      if (!GM.parseColor(field.value)) {
        field.value = state[which].toUpperCase();
        field.closest('.color-field').classList.remove('invalid');
        hint('');
      }
    });
  }

  function lengthState(n) {
    if (n <= 45) return 'ok';
    if (n <= 59) return 'warn';
    return 'bad';
  }

  function updateCounters(split) {
    var counts = split.lines.map(function (line) { return Array.from(line).length; });
    [0, 1].forEach(function (i) {
      var chip = els['lenLine' + (i + 1)];
      var n = counts[i] || 0;
      chip.textContent = 'Line ' + (i + 1) + ' · ' + n + '/59';
      chip.setAttribute('data-state', lengthState(n));
    });
    els.lineWarn.classList.toggle('hidden', !split.truncated);
  }

  function setOutput(key, text, panelId) {
    outputs[key] = text;
    var box = els[panelId];
    box.textContent = text || 'Type your MOTD above — the formatted string appears here.';
    box.classList.toggle('empty', !text);
  }

  function currentOutput() {
    return outputs[state.tab] || '';
  }

  function updateCopyState() {
    els.copyBtn.disabled = !currentOutput();
  }

  function selectTab(tab) {
    state.tab = tab;
    Array.prototype.forEach.call(document.querySelectorAll('.tab'), function (btn) {
      btn.setAttribute('aria-selected', btn.dataset.tab === tab ? 'true' : 'false');
    });
    Array.prototype.forEach.call(document.querySelectorAll('.tab-panel'), function (panel) {
      panel.classList.toggle('hidden', panel.dataset.panel !== tab);
    });
    Array.prototype.forEach.call(document.querySelectorAll('.tab-sub'), function (sub) {
      sub.classList.toggle('hidden', sub.dataset.sub !== tab);
    });
    updateCopyState();
  }

  function update() {
    var startRGB = GM.parseColor(state.start);
    var endRGB = GM.parseColor(state.end);
    var split = GM.splitLines(state.text);
    var lines = GM.buildLines(state.text, startRGB, endRGB);

    GM.preview.render(lines, state.styles);

    setOutput('vanilla', GM.toVanilla(lines, state.styles), 'outVanilla');
    setOutput('ampersand', GM.toAmpersand(lines, state.styles), 'outAmpersand');
    setOutput('minimessage', GM.toMiniMessage(lines, state.styles, state.start, state.end), 'outMiniMessage');

    updateCounters(split);
    updateCopyState();
  }

  function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.top = '-1000px';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(ta);
  }

  var copyResetTimer = null;

  function copyCurrent() {
    var text = currentOutput();
    if (!text) return;

    var done = function () {
      els.copyBtn.classList.add('copied');
      els.copyLabel.textContent = 'Copied! ✔';
      if (copyResetTimer) clearTimeout(copyResetTimer);
      copyResetTimer = setTimeout(function () {
        els.copyBtn.classList.remove('copied');
        els.copyLabel.textContent = 'Copy';
      }, 1800);
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, function () {
        fallbackCopy(text);
        done();
      });
    } else {
      fallbackCopy(text);
      done();
    }
  }

  function wireIconUpload() {
    els.mcIconBtn.addEventListener('click', function () {
      els.iconUpload.click();
    });

    els.iconUpload.addEventListener('change', function () {
      var file = els.iconUpload.files && els.iconUpload.files[0];
      if (!file) return;
      if (!/^image\//.test(file.type)) {
        hint('Server icon must be an image file (vanilla wants a 64×64 PNG).');
        return;
      }
      var reader = new FileReader();
      reader.onload = function (e) {
        var img = new Image();
        img.onload = function () {
          var canvas = document.createElement('canvas');
          canvas.width = 64;
          canvas.height = 64;
          var ctx = canvas.getContext('2d');
          ctx.imageSmoothingEnabled = false;
          var side = Math.min(img.width, img.height);
          ctx.drawImage(
            img,
            (img.width - side) / 2, (img.height - side) / 2, side, side,
            0, 0, 64, 64
          );
          GM.preview.setIcon(canvas.toDataURL('image/png'));
          hint('');
          GM.preview.reping();
        };
        img.onerror = function () {
          hint('That file could not be read as an image.');
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
      els.iconUpload.value = '';
    });
  }

  function init() {
    ['motdInput', 'startPicker', 'endPicker', 'startHex', 'endHex', 'swapColors',
      'styleToggles', 'copyBtn', 'copyLabel', 'colorHint',
      'lenLine1', 'lenLine2', 'lineWarn', 'iconUpload', 'mcIconBtn',
      'outVanilla', 'outAmpersand', 'outMiniMessage']
      .forEach(function (id) { els[id] = $(id); });

    GM.preview.init();

    els.motdInput.value = state.text;
    els.motdInput.addEventListener('input', function () {
      state.text = els.motdInput.value;
      update();
    });

    wireColor('start');
    wireColor('end');

    els.swapColors.addEventListener('click', function () {
      var s = state.start;
      setColor('start', state.end);
      setColor('end', s);
      update();
    });

    els.styleToggles.addEventListener('click', function (e) {
      var btn = e.target.closest('.style-btn');
      if (!btn) return;
      var key = btn.dataset.style;
      state.styles[key] = !state.styles[key];
      btn.setAttribute('aria-pressed', state.styles[key] ? 'true' : 'false');
      update();
    });

    Array.prototype.forEach.call(document.querySelectorAll('.tab'), function (btn) {
      btn.addEventListener('click', function () { selectTab(btn.dataset.tab); });
    });

    els.copyBtn.addEventListener('click', copyCurrent);

    wireIconUpload();
    selectTab('vanilla');
    update();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();