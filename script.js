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

  const items = Array.from(document.querySelectorAll('.checklist__item'));
  const headline = document.getElementById('headline');
  const subline = document.getElementById('subline');
  const rerunBtn = document.getElementById('rerun');

  const hostEl = document.getElementById('host');
  const pathEl = document.getElementById('path');
  const timeEl = document.getElementById('time');
  const viewportEl = document.getElementById('viewport');

  function fillMeta() {
    hostEl.textContent = window.location.host || 'local file';
    pathEl.textContent = window.location.pathname || '/';
    timeEl.textContent = new Date().toLocaleString();
    viewportEl.textContent = window.innerWidth + ' × ' + window.innerHeight;
  }

  let timers = [];

  function clearTimers() {
    timers.forEach(clearTimeout);
    timers = [];
  }

  function reset() {
    items.forEach((item) => item.classList.remove('is-done'));
    headline.textContent = 'standing by';
    headline.classList.remove('is-live');
    subline.textContent = 'Waiting on the checks above…';
  }

  function runChecks() {
    clearTimers();
    reset();

    items.forEach((item) => {
      const delay = Number(item.dataset.delay || 0);
      const t = setTimeout(() => {
        item.classList.add('is-done');
      }, delay);
      timers.push(t);
    });

    const lastDelay = Math.max(...items.map((i) => Number(i.dataset.delay || 0)));
    const finish = setTimeout(() => {
      headline.textContent = 'site is live';
      headline.classList.add('is-live');
      subline.textContent = 'All checks passed. GitHub Pages is serving this file correctly.';
    }, lastDelay + 500);
    timers.push(finish);
  }

  rerunBtn.addEventListener('click', () => {
    fillMeta();
    runChecks();
  });

  window.addEventListener('resize', () => {
    viewportEl.textContent = window.innerWidth + ' × ' + window.innerHeight;
  });

  fillMeta();
  runChecks();

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

  function formatNumber(n) {
    if (!isFinite(n)) return '—';
    const abs = Math.abs(n);
    const digits = abs >= 100 ? 2 : abs >= 1 ? 4 : 6;
    return Number(n.toFixed(digits)).toString();
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

    const source = currentCategory === 'currency'
      ? (liveRates ? 'live rates' : 'offline estimate')
      : 'instant';
    note.textContent = `1 ${from} \u2248 ${result === null ? '?' : formatNumber(convertOne(currentCategory, from, to))} ${to} (${source})`;
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

  async function loadLiveRates() {
    try {
      const res = await fetch('https://api.frankfurter.app/latest?from=USD');
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
})();
