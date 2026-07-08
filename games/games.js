(function () {
  const canvas = document.getElementById('snakeCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const COLS = 20;
  const ROWS = 20;
  const CELL = canvas.width / COLS;

  const scoreEl = document.getElementById('snakeScore');
  const bestEl = document.getElementById('snakeBest');
  const overlay = document.getElementById('snakeOverlay');
  const overlayTitle = document.getElementById('snakeOverlayTitle');
  const overlaySub = document.getElementById('snakeOverlaySub');

  const START_SPEED = 130; // ms per tick
  const MIN_SPEED = 70;

  let snake, dir, nextDir, food, score, best, alive, paused, started, speed, timer;

  function cssVar(name, fallback) {
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v || fallback;
  }

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
      // storage unavailable — ignore
    }
  }

  function resetState() {
    snake = [
      { x: 9, y: 10 },
      { x: 8, y: 10 },
      { x: 7, y: 10 },
    ];
    dir = { x: 1, y: 0 };
    nextDir = { x: 1, y: 0 };
    score = 0;
    speed = START_SPEED;
    alive = true;
    paused = false;
    scoreEl.textContent = '0';
    placeFood();
  }

  function placeFood() {
    let pos;
    do {
      pos = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) };
    } while (snake.some((s) => s.x === pos.x && s.y === pos.y));
    food = pos;
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

  function draw() {
    ctx.fillStyle = '#0e2129';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = 'rgba(61, 47, 122, 0.35)';
    ctx.lineWidth = 1;
    for (let i = 1; i < COLS; i++) {
      ctx.beginPath();
      ctx.moveTo(i * CELL, 0);
      ctx.lineTo(i * CELL, canvas.height);
      ctx.stroke();
    }
    for (let j = 1; j < ROWS; j++) {
      ctx.beginPath();
      ctx.moveTo(0, j * CELL);
      ctx.lineTo(canvas.width, j * CELL);
      ctx.stroke();
    }

    ctx.fillStyle = cssVar('--coral', '#ef6e64');
    roundRect(food.x * CELL + 3, food.y * CELL + 3, CELL - 6, CELL - 6, 4);

    snake.forEach((seg, idx) => {
      ctx.fillStyle = idx === 0 ? cssVar('--mint', '#7c9dfc') : 'rgba(124, 157, 252, 0.65)';
      roundRect(seg.x * CELL + 1, seg.y * CELL + 1, CELL - 2, CELL - 2, 3);
    });
  }

  function gameOver() {
    alive = false;
    if (timer) clearTimeout(timer);
    overlayTitle.textContent = 'game over';
    overlaySub.textContent = `score: ${score} — press an arrow key or wasd to try again`;
    overlay.classList.remove('is-hidden');
  }

  function tick() {
    if (!alive) return;
    if (paused) {
      timer = setTimeout(tick, speed);
      return;
    }

    dir = nextDir;
    const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

    const hitWall = head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS;
    const hitSelf = snake.some((s) => s.x === head.x && s.y === head.y);

    if (hitWall || hitSelf) {
      gameOver();
      return;
    }

    snake.unshift(head);

    if (head.x === food.x && head.y === food.y) {
      score += 1;
      scoreEl.textContent = String(score);
      if (score > best) {
        best = score;
        bestEl.textContent = String(best);
        saveBest(best);
      }
      speed = Math.max(MIN_SPEED, speed - 2);
      placeFood();
    } else {
      snake.pop();
    }

    draw();
    timer = setTimeout(tick, speed);
  }

  function startGame(initialDir) {
    if (timer) clearTimeout(timer);
    resetState();
    if (initialDir) {
      dir = initialDir;
      nextDir = initialDir;
    }
    started = true;
    overlay.classList.add('is-hidden');
    draw();
    timer = setTimeout(tick, speed);
  }

  function togglePause() {
    if (!started || !alive) return;
    paused = !paused;
    overlayTitle.textContent = paused ? 'paused' : '';
    overlaySub.textContent = paused ? 'press space to resume' : '';
    overlay.classList.toggle('is-hidden', !paused);
  }

  const KEY_DIRS = {
    ArrowUp: { x: 0, y: -1 },
    w: { x: 0, y: -1 },
    W: { x: 0, y: -1 },
    ArrowDown: { x: 0, y: 1 },
    s: { x: 0, y: 1 },
    S: { x: 0, y: 1 },
    ArrowLeft: { x: -1, y: 0 },
    a: { x: -1, y: 0 },
    A: { x: -1, y: 0 },
    ArrowRight: { x: 1, y: 0 },
    d: { x: 1, y: 0 },
    D: { x: 1, y: 0 },
  };

  const CONTROL_KEYS = new Set([
    'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
    'w', 'W', 's', 'S', 'a', 'A', 'd', 'D', ' ',
  ]);

  window.addEventListener('keydown', (e) => {
    if (!CONTROL_KEYS.has(e.key)) return;
    e.preventDefault();

    if (e.key === ' ') {
      if (!started || !alive) {
        startGame();
      } else {
        togglePause();
      }
      return;
    }

    const newDir = KEY_DIRS[e.key];
    if (!newDir) return;

    if (!started || !alive) {
      startGame(newDir);
      return;
    }

    if (paused) return;

    // ignore reversal into the snake's own body
    if (newDir.x === -dir.x && newDir.y === -dir.y) return;
    nextDir = newDir;
  });

  overlay.addEventListener('click', () => {
    if (!started || !alive) startGame();
    else if (paused) togglePause();
  });

  // basic touch-swipe support for mobile
  let touchStartX = null;
  let touchStartY = null;

  canvas.addEventListener('touchstart', (e) => {
    const t = e.touches[0];
    touchStartX = t.clientX;
    touchStartY = t.clientY;
  }, { passive: true });

  canvas.addEventListener('touchend', (e) => {
    if (touchStartX === null) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStartX;
    const dy = t.clientY - touchStartY;
    touchStartX = null;

    if (!started || !alive) {
      startGame();
      return;
    }
    if (paused) return;

    if (Math.abs(dx) < 20 && Math.abs(dy) < 20) return; // treat as tap, ignore

    const newDir = Math.abs(dx) > Math.abs(dy)
      ? { x: dx > 0 ? 1 : -1, y: 0 }
      : { x: 0, y: dy > 0 ? 1 : -1 };

    if (newDir.x === -dir.x && newDir.y === -dir.y) return;
    nextDir = newDir;
  }, { passive: true });

  // initial paint before first game starts
  best = loadBest();
  bestEl.textContent = String(best);
  started = false;
  resetState();
  draw();
})();
