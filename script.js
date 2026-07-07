(function () {
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
})();
