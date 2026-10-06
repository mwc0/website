/*
 * The readout half of a tool window: rows of label and value where the value
 * itself is the copy button, plus the announcement that says a copy landed.
 *
 * epoch and colour both answer in exactly this shape, so the markup, the
 * copy behaviour, and the wording live here once instead of twice. base
 * borrows only the announcer, for its encoded output.
 */
(function () {
  let region = null;
  let regionTimer;

  // One polite region for the whole page. Blanking it before the write is what
  // makes a repeat of the same message announce again — copying the same value
  // twice is otherwise silent, because the text never changed.
  function announce(text) {
    if (!region) {
      region = document.createElement('p');
      region.className = 'visually-hidden';
      region.setAttribute('role', 'status');
      document.body.appendChild(region);
    }
    region.textContent = '';
    clearTimeout(regionTimer);
    regionTimer = setTimeout(() => { region.textContent = text; }, 60);
  }

  let copyTimer;

  function copy(btn, key) {
    const text = btn.dataset.value || '';
    if (!text || !navigator.clipboard) return;
    navigator.clipboard.writeText(text).then(() => {
      clearTimeout(copyTimer);
      // The row flashes accent for anyone watching it happen; the announcement
      // is that same confirmation for anyone who isn't.
      btn.classList.add('is-copied');
      announce('copied ' + key);
      copyTimer = setTimeout(() => btn.classList.remove('is-copied'), 900);
    }, () => {});
  }

  // The visible text is the bare value, which names nothing on its own, so the
  // button borrows its row's label to say what pressing it would do.
  function write(btn, key, value, filled) {
    btn.dataset.value = filled ? value : '';
    btn.textContent = filled ? value : '—';
    btn.disabled = !filled;
    btn.title = filled ? 'Copy ' + key : '';
    btn.setAttribute('aria-label', filled ? 'copy ' + key + ', ' + value : key + ', no value');
  }

  // Fills listEl with one row per key and returns a handle for writing into it.
  function rows(listEl, keys) {
    const cells = new Map();
    const frag = document.createDocumentFragment();

    for (const key of keys) {
      const wrap = document.createElement('div');
      wrap.className = 'tool__row';

      const dt = document.createElement('dt');
      dt.textContent = key;

      const dd = document.createElement('dd');
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'tool__value';
      btn.addEventListener('click', () => copy(btn, key));
      write(btn, key, '', false);
      dd.appendChild(btn);

      wrap.append(dt, dd);
      frag.appendChild(wrap);
      cells.set(key, btn);
    }

    listEl.appendChild(frag);

    const blank = (key) => write(cells.get(key), key, '', false);

    return {
      set(key, value) { write(cells.get(key), key, value, true); },
      unset: blank,
      clear() { cells.forEach((btn, key) => blank(key)); },
    };
  }

  // The red border and aria-invalid are the same fact stated twice, once for
  // each kind of reader. Setting them together is what stops one of them
  // shipping without the other.
  function invalid(el, bad) {
    el.classList.toggle('is-invalid', bad);
    if (bad) el.setAttribute('aria-invalid', 'true');
    else el.removeAttribute('aria-invalid');
  }

  window.Readout = { rows, announce, invalid };
})();
