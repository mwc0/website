(function () {
  const canvas = document.getElementById('snakeCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');

  const COLS = 20;
  const ROWS = 20;
  const LOGICAL = 400;
  const CELL = LOGICAL / COLS;

  const scoreEl = document.getElementById('snakeScore');
  const bestEl = document.getElementById('snakeBest');
  const overlay = document.getElementById('snakeOverlay');
  const overlayTitle = document.getElementById('snakeOverlayTitle');
  const overlaySub = document.getElementById('snakeOverlaySub');

  const boardList = document.getElementById('leaderboardList');
  const boardStatus = document.getElementById('leaderboardStatus');
  const boardScope = document.getElementById('leaderboardScope');
  const entryForm = document.getElementById('scoreEntry');
  const entryInput = document.getElementById('scoreInitials');
  const entryError = document.getElementById('scoreEntryError');
  const entrySkip = document.getElementById('scoreSkip');
  const entrySubmit = document.getElementById('scoreSubmit');

  const START_SPEED = 135; // ms per logic tick
  const MIN_SPEED = 68;
  const SPEED_STEP = 3;
  const MAX_QUEUE = 3; // buffered direction inputs, so quick taps aren't dropped
  const DEATH_MS = 420; // death animation before the overlay appears
  const RESTART_LOCKOUT_MS = 450; // stops a stray keypress restarting instantly

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let snake, dir, food, score, best, alive, paused, started, speed, timer;
  let dirQueue = [];
  let prevRender = []; // snake positions at the start of the current tick, for interpolation
  let lastTickTime = 0;
  let tickInterval = 0; // 0 == not moving yet, render statically
  let renderRaf = null;
  let lastFrame = 0;
  let deadAt = 0;
  let deathT = 0; // 0..1 progress of the death animation
  let overlayShown = true;
  let beatBest = false;
  let particles = [];
  let popups = [];
  let boardRows = [];
  let entryOpen = false;

  // ---- palette, read once from the stylesheet so the game tracks the theme ----

  function cssVar(name, fallback) {
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v || fallback;
  }

  function hexToRgb(hex, fallback) {
    let h = String(hex).replace('#', '').trim();
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    if (!/^[0-9a-f]{6}$/i.test(h)) return fallback;
    return [
      parseInt(h.slice(0, 2), 16),
      parseInt(h.slice(2, 4), 16),
      parseInt(h.slice(4, 6), 16),
    ];
  }

  const palette = {};

  function readPalette() {
    palette.board = cssVar('--bg-well', '#0d0f0d');
    palette.accent = cssVar('--accent', '#4bcf8a');
    palette.accentRgb = hexToRgb(palette.accent, [75, 207, 138]);
    palette.food = cssVar('--warn', '#e2c14c');
    palette.foodRgb = hexToRgb(palette.food, [226, 193, 76]);
    palette.danger = cssVar('--danger', '#ff6b5e');
    palette.dangerRgb = hexToRgb(palette.danger, [255, 107, 94]);
  }

  function rgba(rgb, a) {
    return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${a})`;
  }

  // ---- canvas sizing: render at device resolution so the board stays crisp ----

  function setupCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(LOGICAL * dpr);
    canvas.height = Math.round(LOGICAL * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  window.addEventListener('resize', setupCanvas);

  // ---- persistence ----

  function loadBest() {
    try {
      return parseInt(localStorage.getItem('snake-best-score') || '0', 10) || 0;
    } catch (e) {
      return 0;
    }
  }

  function saveBest(value) {
    try {
      localStorage.setItem('snake-best-score', String(value));
    } catch (e) {
      // storage unavailable, ignore
    }
  }

  function bump(el) {
    if (!el || reduceMotion) return;
    el.classList.remove('is-bump');
    void el.offsetWidth; // restart the animation
    el.classList.add('is-bump');
  }

  // ---- state ----

  function resetState() {
    snake = [
      { x: 9, y: 10 },
      { x: 8, y: 10 },
      { x: 7, y: 10 },
    ];
    dir = { x: 1, y: 0 };
    dirQueue = [];
    prevRender = snake.map((s) => ({ x: s.x, y: s.y }));
    tickInterval = 0;
    score = 0;
    speed = START_SPEED;
    alive = true;
    paused = false;
    deathT = 0;
    beatBest = false;
    particles = [];
    popups = [];
    scoreEl.textContent = '0';
    placeFood();
  }

  function placeFood() {
    const free = [];
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        if (!snake.some((s) => s.x === x && s.y === y)) free.push({ x, y });
      }
    }
    if (!free.length) return; // board full, player has won as hard as possible
    food = free[Math.floor(Math.random() * free.length)];
  }

  // ---- effects ----

  function spawnBurst(cx, cy, rgb, count) {
    if (reduceMotion) return;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const speedPx = 40 + Math.random() * 90;
      particles.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speedPx,
        vy: Math.sin(angle) * speedPx,
        life: 0,
        ttl: 0.4 + Math.random() * 0.3,
        rgb,
      });
    }
  }

  function spawnPopup(cx, cy, text) {
    if (reduceMotion) return;
    popups.push({ x: cx, y: cy, text, life: 0, ttl: 0.75 });
  }

  function updateEffects(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life += dt;
      if (p.life >= p.ttl) {
        particles.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.92;
      p.vy *= 0.92;
    }

    for (let i = popups.length - 1; i >= 0; i--) {
      const p = popups[i];
      p.life += dt;
      if (p.life >= p.ttl) popups.splice(i, 1);
    }

    if (!alive && deathT < 1) {
      deathT = Math.min(1, deathT + dt / (DEATH_MS / 1000));
      if (deathT >= 1 && !overlayShown) showGameOver();
    }
  }

  // ---- drawing ----

  function drawBoard() {
    ctx.fillStyle = palette.board;
    ctx.fillRect(0, 0, LOGICAL, LOGICAL);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.032)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 1; i < COLS; i++) {
      ctx.moveTo(Math.round(i * CELL) + 0.5, 0);
      ctx.lineTo(Math.round(i * CELL) + 0.5, LOGICAL);
    }
    for (let j = 1; j < ROWS; j++) {
      ctx.moveTo(0, Math.round(j * CELL) + 0.5);
      ctx.lineTo(LOGICAL, Math.round(j * CELL) + 0.5);
    }
    ctx.stroke();
  }

  function drawFood(now) {
    if (!food) return;
    const pulse = reduceMotion ? 1 : 1 + Math.sin(now / 300) * 0.09;
    const size = CELL * 0.54 * pulse;
    const cx = food.x * CELL + CELL / 2;
    const cy = food.y * CELL + CELL / 2;

    if (!reduceMotion) {
      ctx.shadowColor = rgba(palette.foodRgb, 0.9);
      ctx.shadowBlur = 14;
    }
    ctx.fillStyle = palette.food;
    roundRect(cx - size / 2, cy - size / 2, size, size, size * 0.32);
    ctx.shadowBlur = 0;
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    ctx.fill();
  }

  // Interpolated centre points, head first.
  function snakePoints(alpha) {
    return snake.map((seg, idx) => {
      const prev = idx < prevRender.length ? prevRender[idx] : seg;
      const x = prev.x + (seg.x - prev.x) * alpha;
      const y = prev.y + (seg.y - prev.y) * alpha;
      return { x: x * CELL + CELL / 2, y: y * CELL + CELL / 2 };
    });
  }

  function drawSnake(pts, now) {
    const n = pts.length;
    const dying = !alive;
    const rgb = dying ? palette.dangerRgb : palette.accentRgb;
    const fade = dying ? 1 - deathT * 0.75 : 1;
    const idle = started || reduceMotion ? 1 : 1 + Math.sin(now / 520) * 0.04;

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Body drawn tail first so the head sits on top, with a taper and a fade
    // toward the tail so the snake reads as one ribbon rather than tiles.
    for (let i = n - 1; i > 0; i--) {
      const t = i / Math.max(1, n - 1);
      const a = pts[i];
      const b = pts[i - 1];
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.lineWidth = CELL * (0.56 + (1 - t) * 0.26) * idle;
      ctx.strokeStyle = rgba(rgb, (1 - t * 0.5) * fade);
      ctx.stroke();
    }

    const head = pts[0];
    const headR = CELL * 0.42 * idle;

    if (!reduceMotion) {
      ctx.shadowColor = rgba(rgb, 0.85);
      ctx.shadowBlur = dying ? 6 : 16;
    }
    ctx.fillStyle = rgba(rgb, fade);
    ctx.beginPath();
    ctx.arc(head.x, head.y, headR, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // eyes, facing the direction of travel
    const fx = dir.x;
    const fy = dir.y;
    const px = -dir.y;
    const py = dir.x;
    const eyeR = Math.max(1.4, CELL * 0.085);
    ctx.fillStyle = palette.board;
    for (const side of [1, -1]) {
      const ex = head.x + fx * CELL * 0.14 + px * side * CELL * 0.17;
      const ey = head.y + fy * CELL * 0.14 + py * side * CELL * 0.17;
      ctx.beginPath();
      ctx.arc(ex, ey, eyeR, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawEffects() {
    for (const p of particles) {
      const k = 1 - p.life / p.ttl;
      ctx.fillStyle = rgba(p.rgb, k * 0.85);
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2.4 * k + 0.6, 0, Math.PI * 2);
      ctx.fill();
    }

    if (popups.length) {
      ctx.font = '600 13px "IBM Plex Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (const p of popups) {
        const k = p.life / p.ttl;
        ctx.fillStyle = rgba(palette.accentRgb, 1 - k);
        ctx.fillText(p.text, p.x, p.y - k * 22);
      }
    }
  }

  function drawFrame(alpha, now) {
    drawBoard();
    drawFood(now);
    drawSnake(snakePoints(alpha), now);
    drawEffects();
  }

  function renderLoop(now) {
    const dt = lastFrame ? Math.min(0.05, (now - lastFrame) / 1000) : 0;
    lastFrame = now;

    updateEffects(dt);

    const moving = alive && !paused && tickInterval > 0;
    const alpha = moving
      ? Math.min(1, Math.max(0, (now - lastTickTime) / tickInterval))
      : 1;

    drawFrame(alpha, now);
    renderRaf = requestAnimationFrame(renderLoop);
  }

  // ---- leaderboard ----

  const GAME_ID = 'snake';
  const INITIALS_KEY = 'snake-initials';
  const board = window.Leaderboard;

  function rememberInitials(name) {
    try {
      localStorage.setItem(INITIALS_KEY, name);
    } catch (e) {
      // storage unavailable, ignore
    }
  }

  function recallInitials() {
    try {
      return localStorage.getItem(INITIALS_KEY) || '';
    } catch (e) {
      return '';
    }
  }

  function renderBoard(highlight) {
    boardList.innerHTML = '';

    if (!boardRows.length) {
      boardStatus.textContent = 'no scores yet, be the first';
      return;
    }

    boardStatus.textContent = '';
    let marked = false;

    boardRows.forEach((row, i) => {
      const li = document.createElement('li');
      li.className = 'leaderboard__row';

      if (!marked && highlight && row.name === highlight.name && row.score === highlight.score) {
        li.classList.add('is-you');
        marked = true;
      }

      const rank = document.createElement('span');
      rank.className = 'leaderboard__rank';
      rank.textContent = String(i + 1).padStart(2, '0');

      const name = document.createElement('span');
      name.className = 'leaderboard__name';
      name.textContent = row.name;

      const value = document.createElement('span');
      value.className = 'leaderboard__score';
      value.textContent = String(row.score);

      li.append(rank, name, value);
      boardList.appendChild(li);
    });
  }

  async function loadBoard(highlight) {
    try {
      boardRows = await board.top(GAME_ID);
      renderBoard(highlight);
    } catch (err) {
      boardRows = [];
      boardList.innerHTML = '';
      boardStatus.textContent = err.message || 'leaderboard unavailable';
    }
  }

  function qualifies(value) {
    if (value <= 0) return false;
    if (boardRows.length < board.LIMIT) return true;
    return value > boardRows[boardRows.length - 1].score;
  }

  function openEntry() {
    entryOpen = true;
    entryError.textContent = '';
    entryInput.value = recallInitials();
    entryForm.hidden = false;
    overlay.classList.add('has-entry');
    entryInput.focus();
    entryInput.select();
  }

  function closeEntry() {
    entryOpen = false;
    entryForm.hidden = true;
    overlay.classList.remove('has-entry');
    overlaySub.textContent = 'press any direction key to play again';
  }

  entryInput.addEventListener('input', () => {
    const cleaned = board.normalizeName(entryInput.value);
    if (cleaned !== entryInput.value) entryInput.value = cleaned;
    entryError.textContent = '';
  });

  entryForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = board.normalizeName(entryInput.value);
    const problem = board.validateName(name);
    if (problem) {
      entryError.textContent = problem;
      entryInput.focus();
      return;
    }

    entrySubmit.disabled = true;
    entrySubmit.textContent = 'sending';
    try {
      const row = await board.submit(GAME_ID, name, score);
      rememberInitials(name);
      closeEntry();
      await loadBoard(row);
    } catch (err) {
      entryError.textContent = err.message || 'could not submit';
    } finally {
      entrySubmit.disabled = false;
      entrySubmit.textContent = 'submit';
    }
  });

  entrySkip.addEventListener('click', () => {
    closeEntry();
  });

  // ---- game flow ----

  function showGameOver() {
    overlayShown = true;
    overlayTitle.textContent = 'game over';

    const madeTheCut = qualifies(score);
    overlaySub.textContent = madeTheCut
      ? `score: ${score}. you made the top ${board.LIMIT}`
      : (beatBest
        ? `new best: ${score}. press any direction key to play again`
        : `score: ${score}. press any direction key to play again`);

    overlay.classList.remove('is-hidden');
    if (madeTheCut) openEntry();

    // The qualify check above uses the cached board so the form appears
    // instantly. Refresh afterwards so the standings shown are current.
    loadBoard();
  }

  function gameOver() {
    alive = false;
    deadAt = performance.now();
    deathT = 0;
    overlayShown = false;
    if (timer) clearTimeout(timer);

    const head = snake[0];
    spawnBurst(head.x * CELL + CELL / 2, head.y * CELL + CELL / 2, palette.dangerRgb, 14);

    if (reduceMotion) {
      deathT = 1;
      showGameOver();
    }
  }

  // Pulls the next buffered direction, skipping any that would reverse
  // straight into the snake's own neck.
  function consumeQueuedDir() {
    while (dirQueue.length) {
      const next = dirQueue.shift();
      if (next.x === -dir.x && next.y === -dir.y) continue;
      return next;
    }
    return dir;
  }

  function queueDir(newDir) {
    const last = dirQueue.length ? dirQueue[dirQueue.length - 1] : dir;
    if (newDir.x === last.x && newDir.y === last.y) return; // already heading there
    if (newDir.x === -last.x && newDir.y === -last.y) return; // would reverse, ignore
    if (dirQueue.length >= MAX_QUEUE) dirQueue.shift();
    dirQueue.push(newDir);
  }

  function tick() {
    if (!alive) return;
    if (paused) {
      timer = setTimeout(tick, speed);
      return;
    }

    // snapshot positions before mutating so the renderer can ease from here
    prevRender = snake.map((s) => ({ x: s.x, y: s.y }));

    dir = consumeQueuedDir();
    const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

    const hitWall = head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS;
    // The tail vacates its cell on this same tick, so chasing it is legal.
    const willGrow = food && head.x === food.x && head.y === food.y;
    const solid = willGrow ? snake : snake.slice(0, -1);
    const hitSelf = solid.some((s) => s.x === head.x && s.y === head.y);

    if (hitWall || hitSelf) {
      gameOver();
      return;
    }

    snake.unshift(head);

    if (willGrow) {
      score += 1;
      scoreEl.textContent = String(score);
      bump(scoreEl);
      spawnBurst(food.x * CELL + CELL / 2, food.y * CELL + CELL / 2, palette.foodRgb, 10);
      spawnPopup(food.x * CELL + CELL / 2, food.y * CELL + CELL / 2, '+1');
      if (score > best) {
        best = score;
        beatBest = true;
        bestEl.textContent = String(best);
        bump(bestEl);
        saveBest(best);
      }
      speed = Math.max(MIN_SPEED, speed - SPEED_STEP);
      placeFood();
    } else {
      snake.pop();
    }

    lastTickTime = performance.now();
    tickInterval = speed;
    timer = setTimeout(tick, speed);
  }

  function startGame(initialDir) {
    if (timer) clearTimeout(timer);
    resetState();
    // Ignore a starting direction that would reverse into the snake's own body.
    if (initialDir && !(initialDir.x === -dir.x && initialDir.y === -dir.y)) {
      dir = initialDir;
    }
    started = true;
    overlayShown = false;
    if (entryOpen) closeEntry();
    overlayTitle.textContent = '';
    overlaySub.textContent = '';
    overlay.classList.add('is-hidden');
    lastTickTime = performance.now();
    tickInterval = speed;
    timer = setTimeout(tick, speed);
  }

  function setPaused(next) {
    if (!started || !alive) return;
    paused = next;
    overlayTitle.textContent = paused ? 'paused' : '';
    overlaySub.textContent = paused ? 'press space to resume' : '';
    overlay.classList.toggle('is-hidden', !paused);
    if (!paused) {
      lastTickTime = performance.now();
    }
  }

  function togglePause() {
    setPaused(!paused);
  }

  function canRestart() {
    return performance.now() - deadAt > RESTART_LOCKOUT_MS;
  }

  function requestStart(initialDir) {
    if (started && !alive && !canRestart()) return;
    startGame(initialDir);
  }

  // ---- input ----

  const KEY_DIRS = {
    ArrowUp: { x: 0, y: -1 },
    ArrowDown: { x: 0, y: 1 },
    ArrowLeft: { x: -1, y: 0 },
    ArrowRight: { x: 1, y: 0 },
    w: { x: 0, y: -1 },
    s: { x: 0, y: 1 },
    a: { x: -1, y: 0 },
    d: { x: 1, y: 0 },
  };

  const PAUSE_KEYS = new Set([' ', 'p', 'Escape']);

  window.addEventListener('keydown', (e) => {
    // On the desktop every game listens at once, so only act when focused.
    if (window.Desktop && !window.Desktop.hasFocus('snake')) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    // Never steal keystrokes from the initials field.
    if (e.target && e.target.closest && e.target.closest('input, textarea, select')) return;
    // While the score form is open, keys must not restart and discard it.
    if (entryOpen) return;

    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;

    if (PAUSE_KEYS.has(key)) {
      e.preventDefault();
      if (!started || !alive) requestStart();
      else togglePause();
      return;
    }

    if (key === 'r') {
      e.preventDefault();
      requestStart();
      return;
    }

    const newDir = KEY_DIRS[key];
    if (!newDir) return;
    e.preventDefault();

    if (!started || !alive) {
      requestStart(newDir);
      return;
    }

    if (paused) {
      setPaused(false);
      return;
    }

    queueDir(newDir);
  });

  overlay.addEventListener('click', (e) => {
    if (entryOpen) return; // the overlay is hosting the score form
    if (e.target.closest('.score-entry')) return;
    if (!started || !alive) requestStart();
    else if (paused) setPaused(false);
  });

  // Pause rather than let the snake run on while the tab is hidden.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && started && alive && !paused) setPaused(true);
  });

  // ---- touch: swipe registers mid-drag so it feels immediate ----

  const SWIPE_THRESHOLD = 22;
  let touchX = null;
  let touchY = null;
  let touchMoved = false;

  canvas.addEventListener('touchstart', (e) => {
    const t = e.touches[0];
    touchX = t.clientX;
    touchY = t.clientY;
    touchMoved = false;
  }, { passive: true });

  canvas.addEventListener('touchmove', (e) => {
    if (touchX === null || !started || !alive || paused) return;
    const t = e.touches[0];
    const dx = t.clientX - touchX;
    const dy = t.clientY - touchY;
    if (Math.abs(dx) < SWIPE_THRESHOLD && Math.abs(dy) < SWIPE_THRESHOLD) return;

    queueDir(Math.abs(dx) > Math.abs(dy)
      ? { x: dx > 0 ? 1 : -1, y: 0 }
      : { x: 0, y: dy > 0 ? 1 : -1 });

    // anchor to the current point so a single drag can chain turns
    touchX = t.clientX;
    touchY = t.clientY;
    touchMoved = true;
  }, { passive: true });

  canvas.addEventListener('touchend', () => {
    const wasTap = touchX !== null && !touchMoved;
    touchX = null;
    if (!wasTap) return;

    if (!started || !alive) requestStart();
    else togglePause();
  }, { passive: true });

  // ---- init ----

  readPalette();
  setupCanvas();
  best = loadBest();
  bestEl.textContent = String(best);
  started = false;
  overlayShown = true;
  resetState();
  boardScope.textContent = board.isRemote() ? 'global' : 'this browser';
  loadBoard();

  // On the desktop the render loop only runs while the window is open, and the
  // game pauses when the window loses focus so it cannot die off screen.
  const hostWindow = document.querySelector('[data-window="snake"]');

  if (hostWindow) {
    hostWindow.addEventListener('desktop:open', () => {
      if (renderRaf === null) {
        lastFrame = 0;
        renderRaf = requestAnimationFrame(renderLoop);
      }
    });

    hostWindow.addEventListener('desktop:close', () => {
      if (renderRaf !== null) {
        cancelAnimationFrame(renderRaf);
        renderRaf = null;
      }
      if (started && alive && !paused) setPaused(true);
    });

    hostWindow.addEventListener('desktop:blur', () => {
      if (started && alive && !paused && !entryOpen) setPaused(true);
    });
  } else {
    renderRaf = requestAnimationFrame(renderLoop);
  }
})();
