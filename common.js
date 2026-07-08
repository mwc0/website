(function () {
  const root = document.documentElement;
  let targetX = 50, targetY = 40;
  let currentX = 50, currentY = 40;
  let rafId = null;

  function setFromEvent(clientX, clientY) {
    targetX = (clientX / window.innerWidth) * 100;
    targetY = (clientY / window.innerHeight) * 100;
    if (!rafId) rafId = requestAnimationFrame(tick);
  }

  function tick() {
    // ease toward the target so the grid drifts rather than snapping
    currentX += (targetX - currentX) * 0.08;
    currentY += (targetY - currentY) * 0.08;
    root.style.setProperty('--grid-x', currentX.toFixed(2) + '%');
    root.style.setProperty('--grid-y', currentY.toFixed(2) + '%');

    if (Math.abs(targetX - currentX) > 0.05 || Math.abs(targetY - currentY) > 0.05) {
      rafId = requestAnimationFrame(tick);
    } else {
      rafId = null;
    }
  }

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!prefersReducedMotion) {
    window.addEventListener('mousemove', (e) => setFromEvent(e.clientX, e.clientY));
    window.addEventListener('touchmove', (e) => {
      if (e.touches && e.touches[0]) {
        setFromEvent(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });
  }

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

  function makeDraggable(panel) {
    const handle = panel.querySelector('.console__bar');
    if (!handle) return;

    handle.addEventListener('pointerdown', (e) => {
      if (e.button !== undefined && e.button !== 0) return;

      const rect = panel.getBoundingClientRect();
      const offsetX = e.clientX - rect.left;
      const offsetY = e.clientY - rect.top;

      floatPanel(panel);
      bringToFront(panel);
      document.body.classList.add('is-interacting');
      handle.classList.add('is-dragging');
      handle.setPointerCapture(e.pointerId);

      const panelRect = panel.getBoundingClientRect();

      function onMove(ev) {
        const minVisible = 60;
        let left = ev.clientX - offsetX;
        let top = ev.clientY - offsetY;
        left = Math.min(Math.max(left, minVisible - panelRect.width), window.innerWidth - minVisible);
        top = Math.min(Math.max(top, 0), window.innerHeight - minVisible);
        panel.style.left = left + 'px';
        panel.style.top = top + 'px';
      }

      function onUp(ev) {
        handle.classList.remove('is-dragging');
        document.body.classList.remove('is-interacting');
        handle.releasePointerCapture(ev.pointerId);
        handle.removeEventListener('pointermove', onMove);
        handle.removeEventListener('pointerup', onUp);
      }

      handle.addEventListener('pointermove', onMove);
      handle.addEventListener('pointerup', onUp);
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

  document.querySelectorAll('.console').forEach((panel) => {
    makeDraggable(panel);
    makeResizable(panel);
  });

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
})();
