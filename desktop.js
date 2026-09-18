/*
 * Desktop: icons open each game or tool in a draggable window. Shared by the
 * games and tools pages, which are the same surface with different contents.
 *
 * Everything on a desktop lives on one page, so all the key handlers are
 * bound to window at once. Games ask hasFocus(id) before acting on a
 * keystroke, which is what stops an arrow key driving the snake and the
 * runner at the same time. Windows also get desktop:open / :close / :focus /
 * :blur events so a game can size itself when shown and pause itself when it
 * loses focus.
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

  function headerTop() {
    return chrome && chrome.headerHeight ? chrome.headerHeight() : 0;
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
      // Below the icon row, never over it: covering the icons would leave
      // no way to open another game or toggle this one shut.
      const icons = document.querySelector('.desktop__icons');
      const below = icons ? icons.getBoundingClientRect().bottom : headerTop();
      const top = Math.round(below + 12);
      el.style.top = top + 'px';
      // ...and short enough to end on screen; the window scrolls inside.
      el.style.maxHeight = (window.innerHeight - top - 12) + 'px';
      return;
    }

    // Cascade so stacked windows stay individually visible and grabbable.
    const step = 52 * (cascade % 4);
    cascade += 1;
    const maxLeft = Math.max(24, window.innerWidth - width - 96);
    el.style.width = width + 'px';
    el.style.left = Math.min(maxLeft, Math.round(window.innerWidth * 0.22) + step) + 'px';
    el.style.top = (headerTop() + 20 + step) + 'px';
  }

  // A window keeps whatever geometry the user gave it, but must not come back
  // somewhere unreachable if the viewport shrank while it was closed.
  function clampIntoView(el) {
    const rect = el.getBoundingClientRect();
    const grabbable = 80;
    const left = Math.min(
      Math.max(parseFloat(el.style.left) || rect.left, grabbable - rect.width),
      window.innerWidth - grabbable
    );
    const top = Math.min(
      Math.max(parseFloat(el.style.top) || rect.top, headerTop()),
      window.innerHeight - grabbable
    );
    el.style.left = left + 'px';
    el.style.top = top + 'px';
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

  // Point the scale animation at the icon, so a window visibly comes out of
  // (and goes back into) the thing that opened it.
  function anchorToIcon(entry, id) {
    const icon = document.querySelector('[data-open="' + id + '"]');
    if (!icon) return;
    const r = icon.getBoundingClientRect();
    const left = parseFloat(entry.el.style.left) || 0;
    const top = parseFloat(entry.el.style.top) || 0;
    entry.el.style.transformOrigin =
      (r.left + r.width / 2 - left) + 'px ' + (r.top + r.height / 2 - top) + 'px';
  }

  const CLOSE_MS = 260; // a touch longer than the .is-away transition

  function open(id) {
    const entry = entries.get(id);
    if (!entry) return;

    if (!entry.open) {
      // Reopened mid-close: cancel the hide and let the transition reverse
      // from wherever it has got to.
      const midClose = !entry.el.hidden;
      clearTimeout(entry.hideTimer);
      entry.el.hidden = false;
      // Float it up front so common.js drags it without re-measuring, and so
      // it sits on the desktop rather than in the document flow.
      entry.el.classList.add('is-floating');

      // Only lay a window out the first time. Closing just hides it, so any
      // drag or resize is still on the element and should be honoured.
      if (entry.placed) {
        clampIntoView(entry.el);
      } else {
        place(entry.el);
        entry.placed = true;
      }

      anchorToIcon(entry, id);
      if (!midClose) {
        entry.el.classList.add('is-away');
        void entry.el.offsetWidth; // commit the away state so the entry animates
      }
      entry.el.classList.remove('is-away');

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
    anchorToIcon(entry, id);
    entry.el.classList.add('is-away');
    entry.hideTimer = setTimeout(() => {
      entry.el.hidden = true;
    }, CLOSE_MS);
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
    icon.addEventListener('click', () => {
      const id = icon.dataset.open;
      if (!isOpen(id)) {
        open(id);
      } else if (hasFocus(id)) {
        close(id);
      } else {
        // Open but buried: raise it rather than closing something the click
        // was probably trying to get back to.
        focus(id);
      }
    });
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
    // Icons are handled on click, and this fires first: blurring here would
    // hide the focus state their toggle depends on.
    if (e.target.closest('[data-window], [data-open]')) return;
    if (!focused) return;
    const prev = entries.get(focused);
    if (prev) {
      prev.el.classList.remove('is-focused');
      emit(prev.el, 'desktop:blur');
    }
    focused = null;
  });

  // Arriving from a game link on the home page, the icon flies into its slot
  // in a cross-page view transition. Open the window once it has landed, so it
  // visibly grows out of the icon rather than racing it.
  const wanted = new URLSearchParams(location.search).get('open');
  if (wanted && entries.has(wanted)) {
    let opened = false;
    const openWanted = () => {
      if (opened) return;
      opened = true;
      open(wanted);
    };

    const afterArrival = (transition) => {
      if (transition) transition.finished.then(openWanted, openWanted);
      else openWanted();
    };

    // index.html records the reveal in <head>; it may or may not have
    // happened yet by the time this runs.
    if (window.desktopArrival !== undefined) {
      afterArrival(window.desktopArrival);
    } else if ('onpagereveal' in window) {
      window.addEventListener('pagereveal', (e) => afterArrival(e.viewTransition), { once: true });
      setTimeout(openWanted, 1500); // never strand the window if the event is missed
    } else {
      openWanted();
    }
  }

  return { open: open, close: close, focus: focus, hasFocus: hasFocus, isOpen: isOpen };
})();
