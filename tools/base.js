/*
 * base: number bases and the two text encodings worth having to hand.
 *
 * The four number fields are one value in four notations rather than a
 * from/to pair, so editing any of them rewrites the other three and there is
 * nothing to point in a direction first.
 */
(function () {
  const fields = Array.from(document.querySelectorAll('[data-radix]'));
  if (!fields.length) return;

  const textIn = document.getElementById('baseText');
  const out = document.getElementById('baseOut');
  const pills = Array.from(document.querySelectorAll('[data-op]'));
  const noteEl = document.getElementById('baseNumberNote');

  // ---- number bases ----

  const DIGITS = {
    2: /^[01]+$/,
    8: /^[0-7]+$/,
    10: /^\d+$/,
    16: /^[0-9a-f]+$/i,
  };

  const NAMES = { 2: 'binary', 8: 'octal', 10: 'decimal', 16: 'hexadecimal' };
  const ALLOWED = { 2: '0 and 1', 8: '0 to 7', 10: '0 to 9', 16: '0 to 9 and a to f' };

  function writeOthers(source, value) {
    for (const field of fields) {
      if (field === source) continue;
      const radix = Number(field.dataset.radix);
      field.value = value.toString(radix).toUpperCase();
      Readout.invalid(field, false);
    }
  }

  function blankOthers(source) {
    for (const field of fields) {
      if (field === source) continue;
      field.value = '';
    }
  }

  // Three fields emptying themselves is the loudest thing that happens here,
  // and on its own it doesn't say why. The note does.
  function refuse(field, reason) {
    Readout.invalid(field, true);
    noteEl.textContent = reason;
    blankOthers(field);
  }

  function accept(field) {
    Readout.invalid(field, false);
    noteEl.textContent = '';
  }

  function readNumber(field) {
    const radix = Number(field.dataset.radix);
    const text = field.value.trim().replace(/^0[bxo]/i, '');

    if (!text) {
      accept(field);
      blankOthers(field);
      return;
    }

    if (!DIGITS[radix].test(text)) {
      refuse(field, NAMES[radix] + ' takes ' + ALLOWED[radix] + ' only');
      return;
    }

    const value = parseInt(text, radix);
    // Past 2^53 the other bases would be rounded rather than converted, and a
    // wrong answer that looks right is worse than refusing.
    if (!Number.isSafeInteger(value)) {
      refuse(field, 'too large to convert exactly — the limit is ' + Number.MAX_SAFE_INTEGER + ' in decimal');
      return;
    }

    accept(field);
    writeOthers(field, value);
  }

  fields.forEach((field) => {
    field.addEventListener('input', () => readNumber(field));
  });

  // ---- text encodings ----

  // btoa only takes latin-1, so anything outside it goes through UTF-8 first.
  function toBase64(text) {
    const bytes = new TextEncoder().encode(text);
    let binary = '';
    for (const byte of bytes) binary += String.fromCharCode(byte);
    return btoa(binary);
  }

  function fromBase64(text) {
    const binary = atob(text.trim());
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }

  const OPS = {
    b64enc: toBase64,
    b64dec: fromBase64,
    urlenc: encodeURIComponent,
    urldec: decodeURIComponent,
  };

  let op = 'b64enc';
  let sayTimer;

  // The output carries aria-live="off", because a live <output> re-reads the
  // whole string on every keystroke. Waiting for a pause turns thirteen
  // announcements of a growing base64 string into one of the finished answer.
  function say() {
    clearTimeout(sayTimer);
    const text = out.textContent;
    if (!text) return;
    sayTimer = setTimeout(() => Readout.announce(text), 700);
  }

  function runText() {
    const text = textIn.value;
    if (!text) {
      out.textContent = '';
      out.classList.remove('is-invalid');
      return;
    }
    try {
      out.textContent = OPS[op](text);
      out.classList.remove('is-invalid');
    } catch (e) {
      // Decoding is the only direction that can fail: a malformed escape or
      // base64 that was never base64.
      out.textContent = 'not valid ' + (op === 'b64dec' ? 'base64' : 'percent-encoding');
      out.classList.add('is-invalid');
    }
  }

  pills.forEach((pill) => {
    pill.addEventListener('click', () => {
      op = pill.dataset.op;
      pills.forEach((p) => {
        const on = p === pill;
        p.classList.toggle('is-active', on);
        p.setAttribute('aria-pressed', String(on));
      });
      runText();
      say();
    });
  });

  // say() hangs off the events rather than off runText, so the value the
  // window opens with isn't read out at nobody in particular.
  textIn.addEventListener('input', () => { runText(); say(); });

  readNumber(document.getElementById('baseDec'));
  runText();
})();
