/*
 * Games desktop: icons open each game in a draggable window.
 *
 * Every game lives on this one page, so all three key handlers are bound to
 * window at once. Games ask hasFocus(id) before acting on a keystroke, which
 * is what stops an arrow key driving the snake and the runner at the same
 * time. Windows also get desktop:open / :close / :focus / :blur events so a
 * game can size itself when shown and pause itself when it loses focus.
 */
window.Desktop = (function () {
  const root = document.querySelector('[data-desktop]');
  if (!root) return null;

  const chrome = window.WindowChrome;
  const entries = new Map();
  let focused = null;
  let cascade = 0;

  document.querySelectorAll('[data-window]').forEach((el) => {
    entries.set(el.dataset.window, { el: el, open: false });
  });

  function emit(el, type) {
    el.dispatchEvent(new CustomEvent(type));
  }

  function isNarrow() {
    return window.innerWidth < 720;
  }

  function place(el) {
    const width = Number(el.dataset.width) || 460;

    if (isNarrow()) {
      const w = Math.min(window.innerWidth - 24, width);
      el.style.width = w + 'px';
      el.style.left = Math.round((window.innerWidth - w) / 2) + 'px';
      el.style.top = '16px';
      return;
    }

    // Cascade so stacked windows stay individually visible and grabbable.
    const step = 52 * (cascade % 4);
    cascade += 1;
    const maxLeft = Math.max(24, window.innerWidth - width - 96);
    el.style.width = width + 'px';
    el.style.left = Math.min(maxLeft, Math.round(window.innerWidth * 0.22) + step) + 'px';
    el.style.top = (56 + step) + 'px';
  }

  function topmostOpen(exceptId) {
    let bestId = null;
    let bestZ = -Infinity;
    entries.forEach((entry, id) => {
      if (!entry.open || id === exceptId) return;
      const z = Number(entry.el.style.zIndex) || 0;
      if (z >= bestZ) {
        bestZ = z;
        bestId = id;
      }
    });
    return bestId;
  }

  function focus(id) {
    const entry = entries.get(id);
    if (!entry || !entry.open || focused === id) return;

    if (focused) {
      const prev = entries.get(focused);
      if (prev) {
        prev.el.classList.remove('is-focused');
        emit(prev.el, 'desktop:blur');
      }
    }

    focused = id;
    entry.el.classList.add('is-focused');
    if (chrome) chrome.bringToFront(entry.el);
    emit(entry.el, 'desktop:focus');
  }

  function open(id) {
    const entry = entries.get(id);
    if (!entry) return;

    if (!entry.open) {
      entry.el.hidden = false;
      // Float it up front so common.js drags it without re-measuring, and so
      // it sits on the desktop rather than in the document flow.
      entry.el.classList.add('is-floating');
      place(entry.el);
      entry.open = true;
      const icon = document.querySelector('[data-open="' + id + '"]');
      if (icon) icon.classList.add('is-open');
      emit(entry.el, 'desktop:open');
    }

    focus(id);
  }

  function close(id) {
    const entry = entries.get(id);
    if (!entry || !entry.open) return;

    entry.open = false;
    entry.el.hidden = true;
    entry.el.classList.remove('is-focused');
    const icon = document.querySelector('[data-open="' + id + '"]');
    if (icon) icon.classList.remove('is-open');
    emit(entry.el, 'desktop:close');

    if (focused === id) {
      focused = null;
      const next = topmostOpen(id);
      if (next) focus(next);
    }
  }

  function hasFocus(id) {
    return focused === id;
  }

  function isOpen(id) {
    const entry = entries.get(id);
    return Boolean(entry && entry.open);
  }

  document.querySelectorAll('[data-open]').forEach((icon) => {
    icon.addEventListener('click', () => open(icon.dataset.open));
  });

  document.querySelectorAll('[data-close]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      close(btn.dataset.close);
    });
  });

  entries.forEach((entry, id) => {
    entry.el.addEventListener('pointerdown', () => focus(id));
  });

  // Clicking bare desktop drops focus, so keys stop reaching the last game.
  root.addEventListener('pointerdown', (e) => {
    if (e.target.closest('[data-window]')) return;
    if (!focused) return;
    const prev = entries.get(focused);
    if (prev) {
      prev.el.classList.remove('is-focused');
      emit(prev.el, 'desktop:blur');
    }
    focused = null;
  });

  const wanted = new URLSearchParams(location.search).get('open');
  if (wanted && entries.has(wanted)) open(wanted);

  return { open: open, close: close, focus: focus, hasFocus: hasFocus, isOpen: isOpen };
})();
