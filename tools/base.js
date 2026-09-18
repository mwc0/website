/*
 * base.sh: number bases and the two text encodings worth having to hand.
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

  // ---- number bases ----

  const DIGITS = {
    2: /^[01]+$/,
    8: /^[0-7]+$/,
    10: /^\d+$/,
    16: /^[0-9a-f]+$/i,
  };

  function writeOthers(source, value) {
    for (const field of fields) {
      if (field === source) continue;
      const radix = Number(field.dataset.radix);
      field.value = value.toString(radix).toUpperCase();
      field.classList.remove('is-invalid');
    }
  }

  function blankOthers(source) {
    for (const field of fields) {
      if (field === source) continue;
      field.value = '';
    }
  }

  function readNumber(field) {
    const radix = Number(field.dataset.radix);
    const text = field.value.trim().replace(/^0[bxo]/i, '');

    if (!text) {
      field.classList.remove('is-invalid');
      blankOthers(field);
      return;
    }

    if (!DIGITS[radix].test(text)) {
      field.classList.add('is-invalid');
      blankOthers(field);
      return;
    }

    const value = parseInt(text, radix);
    // Past 2^53 the other bases would be rounded rather than converted, and a
    // wrong answer that looks right is worse than refusing.
    if (!Number.isSafeInteger(value)) {
      field.classList.add('is-invalid');
      blankOthers(field);
      return;
    }

    field.classList.remove('is-invalid');
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
      pills.forEach((p) => p.classList.toggle('is-active', p === pill));
      runText();
    });
  });

  textIn.addEventListener('input', runText);

  readNumber(document.getElementById('baseDec'));
  runText();
})();
