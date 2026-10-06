/*
 * epoch: unix timestamps in both directions.
 *
 * With the field empty the window follows the clock, so opening it answers
 * "what is the time right now" without typing anything. Type an epoch or a
 * date and it freezes on that instant instead.
 */
(function () {
  const input = document.getElementById('epochInput');
  if (!input) return;

  const rowsEl = document.getElementById('epochRows');
  const noteEl = document.getElementById('epochNote');
  const liveEl = document.getElementById('epochLive');
  const nowBtn = document.getElementById('epochNow');

  // Anything past this many digits is milliseconds, not seconds. 10 digits of
  // seconds runs to the year 2286, so the split is unambiguous in practice.
  const SECONDS_MAX_DIGITS = 11;

  const ROWS = [
    { key: 'unix', get: (d) => String(Math.floor(d.getTime() / 1000)) },
    { key: 'unix ms', get: (d) => String(d.getTime()) },
    { key: 'iso 8601', get: (d) => d.toISOString() },
    { key: 'utc', get: (d) => d.toUTCString() },
    { key: 'local', get: (d) => d.toLocaleString() },
    { key: 'relative', get: (d) => relative(d) },
  ];

  const UNITS = [
    ['year', 31536000],
    ['month', 2592000],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
    ['second', 1],
  ];

  function relative(date) {
    const seconds = Math.round((date.getTime() - Date.now()) / 1000);
    const abs = Math.abs(seconds);
    if (abs < 5) return 'just now';
    for (const [name, size] of UNITS) {
      if (abs < size) continue;
      const n = Math.floor(abs / size);
      const plural = n === 1 ? name : name + 's';
      return seconds < 0 ? `${n} ${plural} ago` : `in ${n} ${plural}`;
    }
    return 'just now';
  }

  // Bare digits are an epoch; anything else is handed to Date, which covers
  // ISO 8601 and the formats browsers agree on. Returns null if neither read
  // produces a real instant.
  function parse(raw) {
    const text = raw.trim();
    let date;
    if (/^-?\d+$/.test(text)) {
      const digits = text.replace('-', '').length;
      const n = Number(text);
      date = new Date(digits >= SECONDS_MAX_DIGITS ? n : n * 1000);
    } else {
      date = new Date(text);
    }
    return isNaN(date.getTime()) ? null : date;
  }

  const rows = Readout.rows(rowsEl, ROWS.map((row) => row.key));

  function render(date) {
    for (const row of ROWS) {
      // toISOString throws outside the range Date can represent, and one
      // unrepresentable row shouldn't take the other five with it.
      try {
        rows.set(row.key, row.get(date));
      } catch (e) {
        rows.unset(row.key);
      }
    }
  }

  function tracking() {
    return input.value.trim() === '';
  }

  function update() {
    const live = tracking();
    liveEl.hidden = !live;

    if (live) {
      Readout.invalid(input, false);
      noteEl.textContent = 'reading the clock every second';
      render(new Date());
      return;
    }

    const date = parse(input.value);
    Readout.invalid(input, !date);

    if (!date) {
      noteEl.textContent = 'not a timestamp or a date — try 1700000000 or 2023-11-14';
      rows.clear();
      return;
    }

    noteEl.textContent = 'frozen on the value above';
    render(date);
  }

  input.addEventListener('input', update);

  nowBtn.addEventListener('click', () => {
    input.value = '';
    update();
    input.focus();
  });

  update();

  // Only tick while the window is actually open; a closed window has nothing
  // on screen to keep current.
  const host = document.querySelector('[data-window="epoch"]');
  let timer = null;

  function start() {
    if (timer === null) timer = setInterval(() => { if (tracking()) update(); }, 1000);
  }

  function stop() {
    clearInterval(timer);
    timer = null;
  }

  if (host) {
    host.addEventListener('desktop:open', start);
    host.addEventListener('desktop:close', stop);
  } else {
    start();
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else if (!host || !host.hidden) { update(); start(); }
  });
})();
