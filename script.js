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

  // ---- Converter ----
  const UNITS = {
    length: {
      label: 'length',
      base: 'm',
      units: {
        mm: 0.001, cm: 0.01, m: 1, km: 1000,
        in: 0.0254, ft: 0.3048, yd: 0.9144, mi: 1609.344,
      },
      example: { from: 'm', to: 'ft' },
    },
    weight: {
      label: 'weight',
      base: 'kg',
      units: {
        mg: 0.000001, g: 0.001, kg: 1, t: 1000,
        oz: 0.0283495, lb: 0.453592,
      },
      example: { from: 'kg', to: 'lb' },
    },
    temperature: {
      label: 'temperature',
      units: { C: 'C', F: 'F', K: 'K' },
      example: { from: 'C', to: 'F' },
    },
    currency: {
      label: 'currency',
      units: { USD: 'USD', EUR: 'EUR', GBP: 'GBP', JPY: 'JPY', CAD: 'CAD', AUD: 'AUD' },
      example: { from: 'USD', to: 'EUR' },
    },
  };

  // Fallback currency rates (approximate, used only if the live fetch fails)
  const FALLBACK_RATES_USD = { USD: 1, EUR: 0.92, GBP: 0.79, JPY: 156, CAD: 1.37, AUD: 1.52 };

  let currentCategory = 'length';
  let liveRates = null; // populated from network if available

  const tabs = Array.from(document.querySelectorAll('.converter__tab'));
  const fromValue = document.getElementById('fromValue');
  const toValue = document.getElementById('toValue');
  const fromUnit = document.getElementById('fromUnit');
  const toUnit = document.getElementById('toUnit');
  const swapBtn = document.getElementById('swapUnits');
  const note = document.getElementById('converterNote');

  function populateUnits(category) {
    const config = UNITS[category];
    const keys = Object.keys(config.units);
    fromUnit.innerHTML = keys.map((k) => `<option value="${k}">${k}</option>`).join('');
    toUnit.innerHTML = keys.map((k) => `<option value="${k}">${k}</option>`).join('');
    fromUnit.value = config.example.from;
    toUnit.value = config.example.to;
  }

  function convertLengthOrWeight(category, value, from, to) {
    const { units } = UNITS[category];
    const meters = value * units[from];
    return meters / units[to];
  }

  function convertTemperature(value, from, to) {
    if (from === to) return value;
    let celsius;
    if (from === 'C') celsius = value;
    else if (from === 'F') celsius = (value - 32) * (5 / 9);
    else celsius = value - 273.15;

    if (to === 'C') return celsius;
    if (to === 'F') return celsius * (9 / 5) + 32;
    return celsius + 273.15;
  }

  function convertCurrency(value, from, to) {
    const rates = liveRates || FALLBACK_RATES_USD;
    if (!rates[from] || !rates[to]) return null;
    const usd = value / rates[from];
    return usd * rates[to];
  }

  function formatDecimal(n) {
    if (!isFinite(n)) return '—';
    const abs = Math.abs(n);
    const digits = abs >= 100 ? 2 : abs >= 1 ? 4 : 6;
    return Number(n.toFixed(digits)).toString();
  }

  function formatStandard(n) {
    if (!isFinite(n)) return '—';
    if (n === 0) return '0 × 10^0';
    const sign = n < 0 ? '-' : '';
    const abs = Math.abs(n);
    let exponent = Math.floor(Math.log10(abs));
    let mantissa = abs / Math.pow(10, exponent);
    mantissa = Number(mantissa.toFixed(4));
    if (mantissa >= 10) {
      mantissa = Number((mantissa / 10).toFixed(4));
      exponent += 1;
    }
    return `${sign}${mantissa} × 10^${exponent}`;
  }

  let numberFormat = 'decimal';

  function formatNumber(n) {
    return numberFormat === 'standard' ? formatStandard(n) : formatDecimal(n);
  }

  function runConversion() {
    const value = parseFloat(fromValue.value);
    const from = fromUnit.value;
    const to = toUnit.value;

    if (isNaN(value)) {
      toValue.value = '';
      return;
    }

    let result;
    if (currentCategory === 'temperature') {
      result = convertTemperature(value, from, to);
    } else if (currentCategory === 'currency') {
      result = convertCurrency(value, from, to);
    } else {
      result = convertLengthOrWeight(currentCategory, value, from, to);
    }

    toValue.value = result === null ? 'unavailable' : formatNumber(result);

    const oneUnit = result === null ? '?' : formatNumber(convertOne(currentCategory, from, to));
    if (currentCategory === 'currency') {
      const source = liveRates ? 'live rates' : 'offline estimate';
      note.textContent = `1 ${from} \u2248 ${oneUnit} ${to} (${source})`;
    } else {
      note.textContent = `1 ${from} \u2248 ${oneUnit} ${to}`;
    }
  }

  function convertOne(category, from, to) {
    if (category === 'temperature') return convertTemperature(1, from, to);
    if (category === 'currency') return convertCurrency(1, from, to);
    return convertLengthOrWeight(category, 1, from, to);
  }

  function setCategory(category) {
    currentCategory = category;
    tabs.forEach((tab) => tab.classList.toggle('is-active', tab.dataset.category === category));
    populateUnits(category);
    fromValue.value = 1;
    runConversion();
  }

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => setCategory(tab.dataset.category));
  });

  [fromValue, fromUnit, toUnit].forEach((el) => {
    el.addEventListener('input', runConversion);
    el.addEventListener('change', runConversion);
  });

  swapBtn.addEventListener('click', () => {
    const f = fromUnit.value;
    fromUnit.value = toUnit.value;
    toUnit.value = f;
    runConversion();
  });

  const formatButtons = Array.from(document.querySelectorAll('.converter__format-btn'));
  formatButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      numberFormat = btn.dataset.format;
      formatButtons.forEach((b) => b.classList.toggle('is-active', b === btn));
      runConversion();
    });
  });

  async function loadLiveRates() {
    try {
      const res = await fetch('https://api.frankfurter.dev/v1/latest?base=USD');
      if (!res.ok) throw new Error('bad response');
      const data = await res.json();
      liveRates = { USD: 1, ...data.rates };
      if (currentCategory === 'currency') runConversion();
    } catch (err) {
      // network unavailable or blocked — silently keep using fallback rates
      liveRates = null;
    }
  }

  populateUnits(currentCategory);
  runConversion();
  loadLiveRates();

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
})();
