/*
 * colour.sh: one colour in four notations, plus what it scores against a
 * background.
 *
 * The contrast half is the reason this exists: the site's own palette has to
 * clear WCAG AA in both themes, and checking that used to mean leaving the
 * site. Defaults are this page's own text and background.
 */
(function () {
  const input = document.getElementById('colourInput');
  if (!input) return;

  const against = document.getElementById('colourAgainst');
  const swatch = document.getElementById('colourSwatch');
  const againstSwatch = document.getElementById('againstSwatch');
  const rowsEl = document.getElementById('colourRows');
  const ratioEl = document.getElementById('colourRatio');
  const badgesEl = document.getElementById('colourBadges');
  const preview = document.getElementById('colourPreview');

  // ---- parsing ----

  function clamp(n, min, max) {
    return Math.min(max, Math.max(min, n));
  }

  function fromHsl(h, s, l) {
    h = ((h % 360) + 360) % 360;
    s = clamp(s, 0, 100) / 100;
    l = clamp(l, 0, 100) / 100;
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;
    const seg = Math.floor(h / 60) % 6;
    const [r, g, b] = [
      [c, x, 0], [x, c, 0], [0, c, x], [0, x, c], [x, 0, c], [c, 0, x],
    ][seg];
    return [
      Math.round((r + m) * 255),
      Math.round((g + m) * 255),
      Math.round((b + m) * 255),
    ];
  }

  function parse(raw) {
    const text = raw.trim().toLowerCase();
    if (!text) return null;

    const hex = text.replace(/^#/, '');
    if (/^[0-9a-f]{3}$/.test(hex)) {
      return [0, 1, 2].map((i) => parseInt(hex[i] + hex[i], 16));
    }
    if (/^[0-9a-f]{6}$/.test(hex)) {
      return [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
    }

    const numbers = text.match(/-?\d*\.?\d+/g);
    if (!numbers || numbers.length < 3) return null;
    const [a, b, c] = numbers.slice(0, 3).map(Number);

    if (text.startsWith('hsl')) return fromHsl(a, b, c);
    if (text.startsWith('rgb')) {
      return [a, b, c].map((n) => clamp(Math.round(n), 0, 255));
    }
    return null;
  }

  // ---- conversions ----

  function toHex(rgb) {
    return '#' + rgb.map((n) => n.toString(16).padStart(2, '0')).join('');
  }

  function toHsl(rgb) {
    const [r, g, b] = rgb.map((n) => n / 255);
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const d = max - min;
    const l = (max + min) / 2;
    let h = 0;
    if (d) {
      if (max === r) h = ((g - b) / d) % 6;
      else if (max === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h *= 60;
      if (h < 0) h += 360;
    }
    const s = d ? d / (1 - Math.abs(2 * l - 1)) : 0;
    return `hsl(${Math.round(h)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
  }

  // sRGB is gamma encoded; every perceptual calculation below needs it undone
  // first.
  function linear(channel) {
    const c = channel / 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  }

  // Björn Ottosson's OKLab, then the polar form. Perceptually even, which is
  // why it is worth carrying alongside hsl rather than instead of it.
  function toOklch(rgb) {
    const [r, g, b] = rgb.map(linear);
    const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
    const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
    const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);

    const L = 0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s;
    const A = 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s;
    const B = 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s;

    const chroma = Math.sqrt(A * A + B * B);
    let hue = (Math.atan2(B, A) * 180) / Math.PI;
    if (hue < 0) hue += 360;
    const h = chroma < 0.0001 ? 0 : hue;
    return `oklch(${(L * 100).toFixed(1)}% ${chroma.toFixed(3)} ${h.toFixed(1)})`;
  }

  function luminance(rgb) {
    const [r, g, b] = rgb.map(linear);
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  function contrast(a, b) {
    const la = luminance(a);
    const lb = luminance(b);
    const light = Math.max(la, lb);
    const dark = Math.min(la, lb);
    return (light + 0.05) / (dark + 0.05);
  }

  // ---- rendering ----

  const ROWS = [
    { key: 'hex', get: toHex },
    { key: 'rgb', get: (rgb) => `rgb(${rgb.join(', ')})` },
    { key: 'hsl', get: toHsl },
    { key: 'oklch', get: toOklch },
  ];

  // Large text is 18.66px bold or 24px and up; everything else is normal.
  const LEVELS = [
    { label: 'AA normal', min: 4.5 },
    { label: 'AA large', min: 3 },
    { label: 'AAA normal', min: 7 },
    { label: 'AAA large', min: 4.5 },
  ];

  const cells = new Map();
  let copyTimer;

  function copy(btn) {
    const text = btn.dataset.value || '';
    if (!text || !navigator.clipboard) return;
    navigator.clipboard.writeText(text).then(() => {
      clearTimeout(copyTimer);
      btn.classList.add('is-copied');
      copyTimer = setTimeout(() => btn.classList.remove('is-copied'), 900);
    }, () => {});
  }

  function buildRows() {
    const frag = document.createDocumentFragment();
    for (const row of ROWS) {
      const wrap = document.createElement('div');
      wrap.className = 'tool__row';

      const dt = document.createElement('dt');
      dt.textContent = row.key;

      const dd = document.createElement('dd');
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'tool__value';
      btn.title = 'Copy';
      btn.addEventListener('click', () => copy(btn));
      dd.appendChild(btn);

      wrap.append(dt, dd);
      frag.appendChild(wrap);
      cells.set(row.key, btn);
    }
    rowsEl.appendChild(frag);
  }

  function buildBadges() {
    for (const level of LEVELS) {
      const span = document.createElement('span');
      span.className = 'tool__badge';
      span.textContent = level.label;
      badgesEl.appendChild(span);
      level.el = span;
    }
  }

  function update() {
    const colour = parse(input.value);
    const backdrop = parse(against.value);

    input.classList.toggle('is-invalid', !colour);
    against.classList.toggle('is-invalid', !backdrop);

    if (colour) {
      for (const row of ROWS) {
        const value = row.get(colour);
        const btn = cells.get(row.key);
        btn.dataset.value = value;
        btn.textContent = value;
      }
      swatch.style.background = toHex(colour);
    } else {
      for (const row of ROWS) {
        const btn = cells.get(row.key);
        btn.dataset.value = '';
        btn.textContent = '—';
      }
      swatch.style.background = 'transparent';
    }

    againstSwatch.style.background = backdrop ? toHex(backdrop) : 'transparent';

    if (!colour || !backdrop) {
      ratioEl.textContent = '—';
      preview.removeAttribute('style');
      LEVELS.forEach((level) => {
        level.el.classList.remove('is-pass', 'is-fail');
      });
      return;
    }

    const ratio = contrast(colour, backdrop);
    ratioEl.textContent = ratio.toFixed(2) + ':1';
    preview.style.color = toHex(colour);
    preview.style.background = toHex(backdrop);

    LEVELS.forEach((level) => {
      const pass = ratio >= level.min;
      level.el.classList.toggle('is-pass', pass);
      level.el.classList.toggle('is-fail', !pass);
    });
  }

  buildRows();
  buildBadges();
  [input, against].forEach((el) => el.addEventListener('input', update));
  update();
})();
