(function () {
  // ---- Draggable + resizable windows ----
  let topZ = 10;
  const MIN_W = 300;
  const MIN_H = 220;

  function floatPanel(panel) {
    if (panel.classList.contains('is-floating')) return;
    const rect = panel.getBoundingClientRect();
    panel.style.width = rect.width + 'px';
    panel.style.height = rect.height + 'px';
    panel.style.left = rect.left + 'px';
    panel.style.top = rect.top + 'px';
    panel.classList.add('is-floating');
  }

  function bringToFront(panel) {
    panel.style.zIndex = String(++topZ);
  }

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Past a bound the window keeps following, but less the further it goes, so
  // the edge reads as soft resistance rather than a wall.
  function rubberband(value, min, max, dimension) {
    const c = 0.55;
    const band = (over) => (over * dimension * c) / (dimension + c * over);
    if (value < min) return min - band(min - value);
    if (value > max) return max + band(value - max);
    return value;
  }

  // Critically damped spring (no overshoot), one per axis so X and Y settle
  // independently. Starts from the live position and the pointer's velocity,
  // so there is no seam between letting go and the window moving home.
  const SPRING_RESPONSE = 0.4;
  function settle(panel, to, velocity) {
    const omega = (2 * Math.PI) / SPRING_RESPONSE;
    const axes = [
      { prop: 'left', x: parseFloat(panel.style.left), v: velocity.x, t: to.left },
      { prop: 'top', x: parseFloat(panel.style.top), v: velocity.y, t: to.top },
    ];
    let last = performance.now();

    function step(now) {
      const dt = Math.min((now - last) / 1000, 1 / 30);
      last = now;
      let moving = false;
      axes.forEach((a) => {
        const accel = -omega * omega * (a.x - a.t) - 2 * omega * a.v;
        a.v += accel * dt;
        a.x += a.v * dt;
        if (Math.abs(a.x - a.t) < 0.5 && Math.abs(a.v) < 10) {
          a.x = a.t;
          a.v = 0;
        } else {
          moving = true;
        }
        panel.style[a.prop] = a.x + 'px';
      });
      panel._settleRaf = moving ? requestAnimationFrame(step) : null;
    }

    panel._settleRaf = requestAnimationFrame(step);
  }

  function makeDraggable(panel) {
    const handle = panel.querySelector('.console__bar');
    if (!handle) return;

    handle.addEventListener('pointerdown', (e) => {
      if (e.button !== undefined && e.button !== 0) return;
      // Window controls live in the bar. Capturing the pointer here would
      // swallow their click, so leave them alone.
      if (e.target.closest('button, a')) return;

      // Grabbing a window that is still springing back catches it mid-flight.
      cancelAnimationFrame(panel._settleRaf);
      panel._settleRaf = null;

      const rect = panel.getBoundingClientRect();
      const offsetX = e.clientX - rect.left;
      const offsetY = e.clientY - rect.top;

      floatPanel(panel);
      bringToFront(panel);
      document.body.classList.add('is-interacting');
      handle.classList.add('is-dragging');
      panel.classList.add('is-lifted');
      handle.setPointerCapture(e.pointerId);

      const panelRect = panel.getBoundingClientRect();
      const minVisible = 60;
      const bounds = {
        minLeft: minVisible - panelRect.width,
        maxLeft: window.innerWidth - minVisible,
        minTop: 0,
        maxTop: window.innerHeight - minVisible,
      };
      const history = [{ x: e.clientX, y: e.clientY, t: e.timeStamp }];

      function onMove(ev) {
        history.push({ x: ev.clientX, y: ev.clientY, t: ev.timeStamp });
        if (history.length > 5) history.shift();

        const left = rubberband(ev.clientX - offsetX, bounds.minLeft, bounds.maxLeft, window.innerWidth);
        const top = rubberband(ev.clientY - offsetY, bounds.minTop, bounds.maxTop, window.innerHeight);
        panel.style.left = left + 'px';
        panel.style.top = top + 'px';
      }

      function onUp(ev) {
        handle.classList.remove('is-dragging');
        panel.classList.remove('is-lifted');
        document.body.classList.remove('is-interacting');
        if (handle.hasPointerCapture(ev.pointerId)) handle.releasePointerCapture(ev.pointerId);
        handle.removeEventListener('pointermove', onMove);
        handle.removeEventListener('pointerup', onUp);
        handle.removeEventListener('pointercancel', onUp);

        const left = parseFloat(panel.style.left);
        const top = parseFloat(panel.style.top);
        const home = {
          left: Math.min(Math.max(left, bounds.minLeft), bounds.maxLeft),
          top: Math.min(Math.max(top, bounds.minTop), bounds.maxTop),
        };
        if (home.left === left && home.top === top) return;

        if (prefersReducedMotion) {
          panel.style.left = home.left + 'px';
          panel.style.top = home.top + 'px';
          return;
        }

        const first = history[0];
        const lastSample = history[history.length - 1];
        const dt = (lastSample.t - first.t) / 1000;
        const velocity = dt > 0
          ? { x: (lastSample.x - first.x) / dt, y: (lastSample.y - first.y) / dt }
          : { x: 0, y: 0 };
        settle(panel, home, velocity);
      }

      handle.addEventListener('pointermove', onMove);
      handle.addEventListener('pointerup', onUp);
      handle.addEventListener('pointercancel', onUp);
    });
  }

  function makeResizable(panel) {
    const directions = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'];

    directions.forEach((dir) => {
      const handle = document.createElement('div');
      handle.className = `resize-handle resize-handle--${dir}`;
      panel.appendChild(handle);

      handle.addEventListener('pointerdown', (e) => {
        if (e.button !== undefined && e.button !== 0) return;
        e.stopPropagation();

        floatPanel(panel);
        bringToFront(panel);
        document.body.classList.add('is-interacting');
        handle.setPointerCapture(e.pointerId);

        const startRect = panel.getBoundingClientRect();
        const startX = e.clientX;
        const startY = e.clientY;
        const maxW = window.innerWidth * 0.92;
        const maxH = window.innerHeight * 0.9;

        function onMove(ev) {
          const dx = ev.clientX - startX;
          const dy = ev.clientY - startY;

          let newWidth = startRect.width;
          let newHeight = startRect.height;

          if (dir.includes('e')) newWidth = startRect.width + dx;
          if (dir.includes('w')) newWidth = startRect.width - dx;
          if (dir.includes('s')) newHeight = startRect.height + dy;
          if (dir.includes('n')) newHeight = startRect.height - dy;

          newWidth = Math.max(MIN_W, Math.min(newWidth, maxW));
          newHeight = Math.max(MIN_H, Math.min(newHeight, maxH));

          let newLeft = startRect.left;
          let newTop = startRect.top;
          if (dir.includes('w')) newLeft = startRect.left + (startRect.width - newWidth);
          if (dir.includes('n')) newTop = startRect.top + (startRect.height - newHeight);

          panel.style.width = newWidth + 'px';
          panel.style.height = newHeight + 'px';
          panel.style.left = newLeft + 'px';
          panel.style.top = newTop + 'px';
        }

        function onUp(ev) {
          document.body.classList.remove('is-interacting');
          handle.releasePointerCapture(ev.pointerId);
          handle.removeEventListener('pointermove', onMove);
          handle.removeEventListener('pointerup', onUp);
        }

        handle.addEventListener('pointermove', onMove);
        handle.addEventListener('pointerup', onUp);
      });
    });
  }

  // [data-static] panels are decorative, so they stay put.
  document.querySelectorAll('.console:not([data-static])').forEach((panel) => {
    makeDraggable(panel);
    makeResizable(panel);
  });

  // Shared so the games desktop can raise windows through the same z-index
  // counter this file uses for dragging, instead of running a rival one.
  window.WindowChrome = { floatPanel, bringToFront };

  // ---- Taskbar (tap-to-toggle for touch; CSS handles hover on desktop) ----
  const taskbar = document.getElementById('taskbar');
  const taskbarHandle = document.getElementById('taskbarHandle');

  if (taskbar && taskbarHandle) {
    taskbarHandle.addEventListener('click', () => {
      const isOpen = taskbar.classList.toggle('is-open');
      taskbarHandle.setAttribute('aria-expanded', String(isOpen));
    });

    document.addEventListener('click', (e) => {
      if (!taskbar.contains(e.target)) {
        taskbar.classList.remove('is-open');
        taskbarHandle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // ---- Live visitor presence (Supabase Realtime) ----
  const SUPABASE_URL = 'https://haeqrrxqwksfuawyhwtv.supabase.co';
  const SUPABASE_ANON_KEY = 'sb_publishable_s7W8VMkmepZZ62M-msXHSg_QDRzajCI';

  let presenceCount = null;
  const presenceSubscribers = [];

  function notifyPresence() {
    presenceSubscribers.forEach((fn) => fn(presenceCount));
  }

  function onPresence(fn) {
    presenceSubscribers.push(fn);
    fn(presenceCount);
  }

  (function initPresence() {
    if (!window.supabase || typeof window.supabase.createClient !== 'function') {
      presenceCount = 'unavailable';
      notifyPresence();
      return;
    }
    const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const sessionKey = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : String(Math.random()).slice(2);
    const channel = client.channel('site-presence', {
      config: { presence: { key: sessionKey } },
    });

    channel.on('presence', { event: 'sync' }, () => {
      presenceCount = Object.keys(channel.presenceState()).length;
      notifyPresence();
    });

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        channel.track({ online_at: Date.now() });
      }
    });
  })();

  // ---- Hero terminal: live visitor count (home page only) ----
  const heroTerminal = document.getElementById('heroTerminal');
  if (heroTerminal) {
    function describePresence(count) {
      if (count === 'unavailable') return 'live count unavailable';
      if (count === null) return 'counting…';
      return count === 1 ? ' person here right now' : ' people here right now';
    }

    heroTerminal.textContent = '';

    const clockLine = document.createElement('div');
    clockLine.className = 'hero-terminal__clock';
    heroTerminal.appendChild(clockLine);

    function updateClock() {
      const now = new Date();
      const time = now.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        timeZoneName: 'short',
      });
      clockLine.textContent = time;
    }
    updateClock();
    setInterval(updateClock, 1000);

    const line = document.createElement('div');
    line.className = 'hero-terminal__live';
    const dot = document.createElement('span');
    dot.className = 'hero-terminal__live-dot';
    const label = document.createElement('span');
    const countEl = document.createElement('span');
    countEl.className = 'hero-terminal__count';
    const words = document.createElement('span');
    label.append(countEl, words);
    line.appendChild(dot);
    line.appendChild(label);
    heroTerminal.appendChild(line);

    // The number rolls in the direction it moved: up when someone arrives,
    // down when someone leaves. The first real count just appears.
    let shown = null;
    function showCount(count) {
      words.textContent = describePresence(count);
      const isNumber = typeof count === 'number';
      const next = isNumber ? String(count) : '';

      if (!isNumber || typeof shown !== 'number' || count === shown || prefersReducedMotion) {
        countEl.replaceChildren();
        if (next) {
          const span = document.createElement('span');
          span.textContent = next;
          countEl.appendChild(span);
        }
        shown = count;
        return;
      }

      const dir = count > shown ? 1 : -1;
      const outgoing = countEl.lastElementChild;
      const incoming = document.createElement('span');
      incoming.textContent = next;
      countEl.appendChild(incoming);
      shown = count;

      const css = getComputedStyle(document.documentElement);
      const accent = css.getPropertyValue('--accent').trim();
      const text = css.getPropertyValue('--text').trim();
      const timing = { duration: 420, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', fill: 'both' };
      incoming.animate([
        { transform: `translateY(${dir * 100}%)`, opacity: 0, color: accent },
        { transform: 'none', opacity: 1, color: accent, offset: 0.6 },
        { transform: 'none', opacity: 1, color: text },
      ], { ...timing, duration: 900 }).finished.then((a) => a.cancel(), () => {});
      if (outgoing) {
        outgoing.animate([
          { transform: 'none', opacity: 1 },
          { transform: `translateY(${dir * -100}%)`, opacity: 0 },
        ], { ...timing, duration: 260, easing: 'cubic-bezier(0.5, 0, 0.75, 0)' })
          .finished.then(() => outgoing.remove(), () => outgoing.remove());
      }
    }
    onPresence(showCount);

    const cursor = document.createElement('span');
    cursor.className = 'hero-terminal__cursor';
    heroTerminal.appendChild(cursor);
  }
})();
